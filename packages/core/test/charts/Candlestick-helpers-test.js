import {it} from "vitest";
import assert from "assert";
import {scaleLinear, scalePoint, scaleTime} from "d3-scale";
import {
  candleChange,
  candleDirection,
  candlePath,
  candleWidth,
  finiteValue,
  ohlcBarPath,
  ohlcExtent,
  periodSpacing,
  pixelCenter,
  readOhlc,
} from "../../src/charts/Candlestick/ohlc.ts";
import {
  accessorKey,
  aggregateFunctionFields,
  DEFAULT_AGGS,
  firstValue,
  isDefaultAgg,
  keyedAccessor,
  lastValue,
  maxValue,
  minValue,
  ohlcAccessors,
  rememberKey,
  sumValue,
  syncDefaultAggs,
} from "../../src/charts/Candlestick/aggregate.ts";
import {
  emitVolume,
  stripSize,
  VOLUME_DEFAULTS,
  volumeAccessor,
  volumeConfig,
  volumeEnabled,
  volumeScale,
  volumeStripRect,
} from "../../src/charts/Candlestick/volume.ts";
import {
  candlestickBuffer,
  padPeriods,
  widenDomain,
} from "../../src/charts/Candlestick/buffer.ts";
import {
  bandAxisDefaults,
  formatPeriod,
  PERIOD_UNITS,
  periodBoundaries,
  periodDate,
  periodLabel,
  periodTickFormat,
  periodTickSets,
  shownUnit,
  unitIndex,
} from "../../src/charts/Candlestick/periods.ts";
import {
  candleAriaLabel,
  candleTooltipRows,
  formatChange,
  formatPrice,
  volumeAriaLabel,
} from "../../src/charts/Candlestick/tooltip.ts";
import {
  CANDLESTICK_SHAPE,
  candleTexture,
  layoutCandles,
} from "../../src/charts/Candlestick/emit.ts";

const key = k => d => d[k];
const accessors = {
  open: key("open"),
  high: key("high"),
  low: key("low"),
  close: key("close"),
};
const row = (open, high, low, close) => ({open, high, low, close});

/** A stand-in for the chart, with just what the helpers read. */
function fakeViz({schema = {}, ...rest} = {}) {
  return {
    schema: {
      ...accessors,
      bodyWidth: 0.7,
      locale: "en-US",
      translate: s => s,
      variant: "candlestick",
      width: 800,
      ...schema,
    },
    _drawLabel: d => d.symbol,
    _filteredData: [],
    _margin: {top: 0, right: 0, bottom: 0, left: 0},
    _x: key("date"),
    _xConfig: {},
    _xKey: "date",
    _yConfig: {},
    ...rest,
  };
}

it("Candlestick finiteValue keeps finite numbers and numeric strings", () => {
  assert.strictEqual(finiteValue(3), 3);
  assert.strictEqual(finiteValue("2.5"), 2.5);
  [NaN, Infinity, null, undefined, "", "abc", true, false].forEach(v =>
    assert.strictEqual(finiteValue(v), undefined, `${v}`),
  );
});

it("Candlestick readOhlc fills a missing open, high, or low and stretches the range to the open and close", () => {
  assert.deepStrictEqual(readOhlc(row(10, 12, 9, 11), 0, accessors), {
    open: 10,
    high: 12,
    low: 9,
    close: 11,
  });
  assert.deepStrictEqual(readOhlc({close: 5}, 0, accessors), {
    open: 5,
    high: 5,
    low: 5,
    close: 5,
  });
  assert.deepStrictEqual(readOhlc({open: 4, close: 6}, 0, accessors), {
    open: 4,
    high: 6,
    low: 4,
    close: 6,
  });
  assert.deepStrictEqual(
    readOhlc(row(10, 9, 11, 12), 0, accessors),
    {open: 10, high: 12, low: 10, close: 12},
    "a high below the close or a low above the open is widened",
  );
  assert.strictEqual(readOhlc(row(10, 12, 9, null), 0, accessors), undefined);
  assert.strictEqual(readOhlc(row(10, 12, 9, "n/a"), 0, accessors), undefined);
});

it("Candlestick candleDirection reads a flat period as up", () => {
  assert.strictEqual(candleDirection(10, 11), "up");
  assert.strictEqual(candleDirection(10, 10), "up");
  assert.strictEqual(candleDirection(10, 9), "down");
});

it("Candlestick candleChange is the open-to-close change as a fraction of the open", () => {
  assert.strictEqual(candleChange(100, 105), 0.05);
  assert.strictEqual(candleChange(200, 150), -0.25);
  assert.strictEqual(
    candleChange(-10, -5),
    0.5,
    "relative to the open's magnitude",
  );
  assert.strictEqual(candleChange(0, 5), undefined);
  assert.strictEqual(candleChange(NaN, 5), undefined);
});

it("Candlestick ohlcExtent spans every finite row's low and high", () => {
  const rows = [
    row(10, 12, 9, 11),
    row(11, 15, 10, 14),
    {close: null},
    row(14, 14, 3, 5),
  ].map((d, i) => ({d, i}));
  assert.deepStrictEqual(ohlcExtent(rows, accessors), [3, 15]);
  assert.strictEqual(
    ohlcExtent([{d: {close: null}, i: 0}], accessors),
    undefined,
  );
  assert.strictEqual(ohlcExtent([], accessors), undefined);
});

it("Candlestick periodSpacing is the smallest gap between distinct positions", () => {
  assert.strictEqual(periodSpacing([30, 10, 20, 50, 20], 99), 10);
  assert.strictEqual(
    periodSpacing([5, 5], 40),
    40,
    "one distinct position falls back",
  );
  assert.strictEqual(periodSpacing([], 40), 40);
  assert.strictEqual(
    periodSpacing([0, NaN, 4], 40),
    4,
    "non-finite positions are skipped",
  );
});

it("Candlestick candleWidth fills a clamped share of the room, at least 1px", () => {
  assert.strictEqual(candleWidth(10, 0.7), 7);
  assert.strictEqual(candleWidth(10, 2), 10);
  assert.strictEqual(candleWidth(10, -1), 1);
  assert.strictEqual(candleWidth(1, 0.7), 1);
  assert.strictEqual(candleWidth(10, NaN), 7, "an unusable share uses 0.7");
});

it("Candlestick pixelCenter rounds to a pixel's center", () => {
  assert.strictEqual(pixelCenter(10), 10.5);
  assert.strictEqual(pixelCenter(10.4), 10.5);
  assert.strictEqual(pixelCenter(10.9), 10.5);
  assert.strictEqual(pixelCenter(11.1), 11.5);
});

it("Candlestick candlePath draws the wick around a closed body", () => {
  // Pixels: high 10, open 20, close 30, low 40 (a falling candle).
  assert.strictEqual(
    candlePath(50, 6, {open: 20, high: 10, low: 40, close: 30}),
    "M50,10V20M50,30V40M47,20H53V30H47Z",
  );
  // A rising candle (close above the open) draws the same box.
  assert.strictEqual(
    candlePath(50, 6, {open: 30, high: 10, low: 40, close: 20}),
    "M50,10V20M50,30V40M47,20H53V30H47Z",
  );
  // No wick past a body that reaches the high and low.
  assert.strictEqual(
    candlePath(5, 2, {open: 1, high: 1, low: 9, close: 9}),
    "M4,1H6V9H4Z",
  );
  // A flat period is a line.
  assert.strictEqual(
    candlePath(5, 2, {open: 4, high: 2, low: 6, close: 4}),
    "M5,2V4M5,4V6M4,4H6V4H4Z",
  );
});

it("Candlestick ohlcBarPath ticks the open left and the close right", () => {
  assert.strictEqual(
    ohlcBarPath(50, 6, {open: 20, high: 10, low: 40, close: 30}),
    "M50,10V40M47,20H50M50,30H53",
  );
});

it("Candlestick ohlcAccessors reads the chart's four accessors", () => {
  const viz = fakeViz();
  const out = ohlcAccessors(viz);
  assert.deepStrictEqual(Object.keys(out).sort(), [
    "close",
    "high",
    "low",
    "open",
  ]);
  assert.strictEqual(out.high(row(1, 2, 0, 1)), 2);
});

it("Candlestick firstValue/lastValue/maxValue/minValue read finite values in row order", () => {
  const rows = [{v: null}, {v: "3"}, {v: 7}, {v: 1}, {v: "x"}, {}];
  const value = d => d.v;
  assert.strictEqual(firstValue(rows, value), 3, "skips a missing first value");
  assert.strictEqual(lastValue(rows, value), 1, "skips trailing non-numbers");
  assert.strictEqual(maxValue(rows, value), 7);
  assert.strictEqual(minValue(rows, value), 1);
  for (const agg of [firstValue, lastValue, maxValue, minValue, sumValue]) {
    assert.strictEqual(
      agg([{v: null}, {}], value),
      undefined,
      "no finite value: undefined",
    );
  }
  assert.strictEqual(sumValue(rows, value), 11);
  assert.strictEqual(sumValue([{}], value), undefined);
  assert.deepStrictEqual(DEFAULT_AGGS, {
    open: firstValue,
    high: maxValue,
    low: minValue,
    close: lastValue,
    volume: sumValue,
  });
  assert.ok(isDefaultAgg(firstValue) && !isDefaultAgg(() => 0));
});

it("Candlestick keyedAccessor remembers string keys", () => {
  const fn = keyedAccessor("o");
  assert.strictEqual(fn({o: 4}), 4);
  assert.strictEqual(accessorKey(fn), "o");
  const custom = d => d.p.o;
  assert.strictEqual(keyedAccessor(custom), custom, "functions pass through");
  assert.strictEqual(accessorKey(custom), undefined);
  assert.strictEqual(keyedAccessor(5)(), 5, "other values become constants");
  assert.strictEqual(accessorKey("o"), undefined, "a non-function has no key");
  rememberKey(custom, "p");
  assert.strictEqual(accessorKey(custom), "p");
});

it("Candlestick syncDefaultAggs installs defaults on keys and keeps the user's entries", () => {
  const mine = () => 0;
  const aggs = {o: mine, stale: maxValue, other: mine};
  const fn = d => d.c;
  syncDefaultAggs(aggs, {
    open: keyedAccessor("o"),
    high: keyedAccessor("h"),
    low: keyedAccessor("l"),
    close: fn,
  });
  assert.strictEqual(aggs.o, mine, "a user's entry wins");
  assert.strictEqual(aggs.h, maxValue);
  assert.strictEqual(aggs.l, minValue);
  assert.ok(!("stale" in aggs), "a default on a key no field reads is dropped");
  assert.strictEqual(aggs.other, mine);
  assert.ok(!("c" in aggs), "a function accessor takes no key entry");
  const shared = {};
  syncDefaultAggs(shared, {
    open: keyedAccessor("p"),
    close: keyedAccessor("p"),
  });
  assert.strictEqual(shared.p, lastValue, "the later field wins a shared key");
});

it("Candlestick aggregateFunctionFields aggregates function accessors, by field-named aggs when set", () => {
  const rows = [
    {p: {o: 10, h: 12, l: 9, c: 11}},
    {p: {o: 11, h: 15, l: 10, c: 14}},
    {p: {o: 14, h: 14, l: 8, c: 9}},
  ];
  const accessors = {
    open: d => d.p.o,
    high: d => d.p.h,
    low: d => d.p.l,
    close: keyedAccessor("c"),
  };
  assert.deepStrictEqual(aggregateFunctionFields(rows, accessors, {}), {
    open: 10,
    high: 15,
    low: 8,
  });
  const mean = (a, c) => a.reduce((s, d) => s + c(d), 0) / a.length;
  assert.deepStrictEqual(
    aggregateFunctionFields(rows, accessors, {
      high: mean,
      low: minValue,
      open: lastValue,
    }),
    {open: 10, high: 41 / 3, low: 8},
    "a user's field-named entry wins; a default on that name is the field's own default",
  );
  assert.strictEqual(
    aggregateFunctionFields(rows, {open: keyedAccessor("o")}, {}),
    undefined,
    "no function accessor: nothing to aggregate",
  );
});

it("Candlestick volumeAccessor turns the strip off for empty values and keys strings", () => {
  for (const off of [undefined, null, false])
    assert.strictEqual(volumeAccessor(off), undefined);
  const fn = volumeAccessor("vol");
  assert.strictEqual(fn({vol: 3}), 3);
  assert.strictEqual(accessorKey(fn), "vol", "a key carries its aggs entry");
  const custom = d => d.v;
  assert.strictEqual(volumeAccessor(custom), custom);
  assert.ok(volumeEnabled({schema: {volume: custom}}));
  assert.ok(!volumeEnabled({schema: {volume: undefined}}));
});

it("Candlestick volumeConfig layers the chart's config over the defaults", () => {
  assert.deepStrictEqual(volumeConfig({schema: {}}), VOLUME_DEFAULTS);
  const config = volumeConfig({schema: {volumeConfig: {height: 0.3}}});
  assert.strictEqual(config.height, 0.3);
  assert.strictEqual(config.gap, VOLUME_DEFAULTS.gap);
});

it("Candlestick stripSize reads a share or pixels, capped at half the plot", () => {
  assert.deepStrictEqual(stripSize({height: 0.2, gap: 16}, 400), {
    height: 80,
    gap: 16,
  });
  assert.deepStrictEqual(
    stripSize({height: 60, gap: 4}, 400),
    {height: 60, gap: 4},
    "above 1 is pixels",
  );
  assert.deepStrictEqual(
    stripSize({height: 0.9, gap: 16}, 400),
    {height: 200, gap: 16},
    "at most half",
  );
  assert.deepStrictEqual(
    stripSize({height: -1, gap: -5}, 400),
    {height: 80, gap: 0},
    "bad values fall back",
  );
  assert.deepStrictEqual(
    stripSize({}, 0),
    {height: 0, gap: 0},
    "no room, no strip",
  );
});

it("Candlestick volumeScale spans zero to a nice top", () => {
  assert.deepStrictEqual(volumeScale(3.4e6), {
    domain: [0, 4e6],
    ticks: [0, 2e6, 4e6],
  });
  assert.deepStrictEqual(
    volumeScale(0).domain,
    [0, 1],
    "no volume: a unit domain",
  );
});

it("Candlestick volumeStripRect sits under the price range, and emitVolume draws nothing without it", () => {
  const viz = fakeViz({
    schema: {volume: key("volume"), volumeConfig: {gap: 10}},
  });
  const ctx = {
    viz,
    xRange: [40, 400],
    yRange: [0, 200],
    insetBottom: 60,
    x2Height: 0,
    events: [],
  };
  assert.deepStrictEqual(volumeStripRect(ctx), {
    top: 210,
    bottom: 260,
    left: 40,
    right: 400,
  });
  assert.strictEqual(volumeStripRect({...ctx, insetBottom: 0}), undefined);
  assert.deepStrictEqual(
    emitVolume(
      {...ctx, insetBottom: 0},
      new Map([[{}, {cx: 0, width: 1, interactionPoints: []}]]),
      {},
      "Candlestick",
      t => t,
    ),
    [],
  );
});

it("Candlestick widenDomain reaches the extent plus a pixel buffer", () => {
  const scale = scaleLinear().domain([20, 10]).range([0, 100]);
  const [lo, hi] = widenDomain([10, 20], [5, 25], scale, 10);
  // 10px on this scale is 1 unit.
  assert.ok(Math.abs(lo - 4) < 1e-9, `${lo}`);
  assert.ok(Math.abs(hi - 26) < 1e-9, `${hi}`);
  assert.deepStrictEqual(
    widenDomain([0, 100], [40, 60], scale, 0),
    [0, 100],
    "never narrows",
  );
  const noInvert = Object.assign(v => v, {});
  assert.deepStrictEqual(
    widenDomain([0, 1], [-1, 2], noInvert, 5),
    [-1, 2],
    "no invert: the bare extent",
  );
});

it("Candlestick padPeriods pads a category scale a full step and a time scale its smallest gap", () => {
  const point = scalePoint().domain(["a", "b", "c"]).range([0, 100]);
  padPeriods(point, []);
  assert.strictEqual(point.padding(), 1);
  const day = 864e5;
  const t0 = Date.UTC(2024, 0, 1);
  const time = scaleTime().domain([new Date(t0), new Date(t0 + 4 * day)]);
  padPeriods(time, [t0, t0 + day, t0 + 3 * day, t0 + 4 * day]);
  assert.deepStrictEqual(time.domain().map(Number), [t0 - day, t0 + 5 * day]);
  const lone = scaleTime().domain([new Date(t0), new Date(t0)]);
  padPeriods(lone, [t0]);
  assert.deepStrictEqual(
    lone.domain().map(Number),
    [t0, t0],
    "one period: unchanged",
  );
});

it("Candlestick candlestickBuffer widens y to the highs and lows and pads x", () => {
  const viz = fakeViz();
  const data = [row(10, 30, 5, 12), row(12, 14, 11, 13)].map((d, i) => ({
    data: d,
    i,
    x: i,
    y: d.close,
  }));
  const x = scalePoint().domain([0, 1]).range([0, 100]);
  const y = scaleLinear().domain([13, 12]).range([0, 100]);
  const [x2, y2] = candlestickBuffer.call(viz, {data, x, y});
  assert.strictEqual(x2, x);
  assert.strictEqual(x.padding(), 1);
  const [top, bottom] = y2.domain();
  assert.ok(top >= 30 && bottom <= 5, `${top}, ${bottom}`);
  const untouched = scaleLinear().domain([2, 1]);
  candlestickBuffer.call(viz, {data, x: scalePoint(), y: untouched, x2: true});
  assert.deepStrictEqual(
    untouched.domain(),
    [2, 1],
    "secondary axes are left alone",
  );
  const empty = scaleLinear().domain([2, 1]);
  candlestickBuffer.call(viz, {
    data: [{data: {close: null}, i: 0}],
    x: scalePoint(),
    y: empty,
  });
  assert.deepStrictEqual(
    empty.domain(),
    [2, 1],
    "rows without a close leave y alone",
  );
});

it("Candlestick periodDate parses strings and numbers into Dates", () => {
  const d = new Date(2024, 0, 2);
  assert.strictEqual(periodDate(d), d);
  assert.ok(periodDate("2024-01-02") instanceof Date);
  assert.strictEqual(+periodDate("01/02/2024"), +d);
  assert.strictEqual(+periodDate(+d), +d);
  assert.strictEqual(periodDate("not a date"), "not a date");
  assert.strictEqual(periodDate(null), null);
});

it("Candlestick formatPeriod shows the full date, and the time when it isn't midnight", () => {
  assert.strictEqual(formatPeriod(new Date(2024, 0, 2)), "Jan 2, 2024");
  assert.strictEqual(
    formatPeriod(new Date(2024, 0, 2, 14, 30)),
    "Jan 2, 2024 2:30 PM",
  );
});

it("Candlestick unitIndex groups dates by calendar unit", () => {
  assert.deepStrictEqual(PERIOD_UNITS, [
    "day",
    "week",
    "month",
    "quarter",
    "year",
  ]);
  const fri = new Date(2024, 0, 5),
    mon = new Date(2024, 0, 8),
    tue = new Date(2024, 0, 9);
  assert.notStrictEqual(unitIndex(fri, "week"), unitIndex(mon, "week"));
  assert.strictEqual(unitIndex(mon, "week"), unitIndex(tue, "week"));
  assert.notStrictEqual(unitIndex(mon, "day"), unitIndex(tue, "day"));
  assert.strictEqual(
    unitIndex(new Date(2024, 0, 31), "month"),
    unitIndex(new Date(2024, 0, 1), "month"),
  );
  assert.strictEqual(
    unitIndex(new Date(2024, 2, 31), "quarter"),
    unitIndex(new Date(2024, 0, 1), "quarter"),
  );
  assert.notStrictEqual(
    unitIndex(new Date(2024, 3, 1), "quarter"),
    unitIndex(new Date(2024, 2, 1), "quarter"),
  );
  assert.strictEqual(unitIndex(new Date(2024, 11, 31), "year"), 2024);
});

/** Weekdays from `start`, `n` of them. */
function weekdays(start, n) {
  const out = [];
  const d = new Date(start);
  while (out.length < n) {
    if (d.getDay() % 6) out.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

it("Candlestick periodBoundaries ticks the first period of each unit after the first", () => {
  const dates = weekdays(new Date(2024, 0, 15), 40);
  const months = periodBoundaries(dates, "month");
  assert.deepStrictEqual(
    months.map(d => d.getMonth()),
    [1, 2],
  );
  assert.ok(
    months.every(d => dates.includes(d)),
    "ticks are the periods' own dates",
  );
  assert.deepStrictEqual(
    months.map(d => d.getDate()),
    [1, 1],
  );
  assert.deepStrictEqual(
    periodBoundaries(dates.slice(0, 3), "month"),
    [],
    "one unit: no boundary",
  );
  assert.deepStrictEqual(periodBoundaries([], "month"), []);
});

it("Candlestick periodTickSets offers the first period plus each unit's boundaries, finest first", () => {
  const dates = weekdays(new Date(2023, 0, 2), 500);
  const sets = periodTickSets(dates, 1000);
  assert.ok(
    sets.every(list => list.every(d => dates.includes(d))),
    "ticks are the periods' own dates",
  );
  assert.strictEqual(
    sets[0][0],
    dates[0],
    "the finest list starts at the first period",
  );
  assert.strictEqual(sets[0].length, 500, "a tick per day");
  assert.deepStrictEqual(
    sets[1],
    sets[0].slice(1),
    "then the same without the first period",
  );
  for (let k = 1; k < sets.length; k++)
    assert.ok(
      sets[k].length <= sets[k - 1].length,
      "from the most ticks to the fewest",
    );
  const years = periodTickSets(dates, 2);
  assert.deepStrictEqual(
    years.map(list => list.map(d => d.getFullYear())),
    [[2023, 2024]],
    "room for two boundaries: the first period and the year start",
  );
  assert.deepStrictEqual(
    years[0].slice(1).map(d => d.getMonth()),
    [0],
  );
  const quarters = periodTickSets(dates, 10);
  assert.strictEqual(
    quarters[0].length,
    8,
    "the first period and the 7 quarter starts after it",
  );
  assert.ok(quarters[0].slice(1).every(d => d.getMonth() % 3 === 0));
  const decades = weekdays(new Date(1990, 0, 1), 260 * 30).filter(
    (d, i) => i % 5 === 0,
  );
  const thinned = periodTickSets(decades, 4);
  assert.ok(
    thinned.every(list => list.length <= 5),
    "no more than 4 boundaries",
  );
  assert.deepStrictEqual(
    thinned[0].slice(1).map(d => d.getFullYear()),
    [2000, 2010],
    "every 10th year",
  );
  assert.deepStrictEqual(
    thinned.at(-1).map(d => d.getFullYear()),
    [1990, 2000],
    "then every 20th",
  );
  const one = weekdays(new Date(2023, 0, 2), 3);
  assert.deepStrictEqual(
    periodTickSets(one, 0),
    [one, one.slice(1)],
    "room for none: the coarsest list left",
  );
  assert.deepStrictEqual(
    periodTickSets(one.slice(0, 1), 5),
    [[one[0]]],
    "one period: just it",
  );
  assert.deepStrictEqual(periodTickSets([], 5), []);
});

it("Candlestick periodLabel names years at year starts and months or days otherwise", () => {
  const jan = new Date(2024, 0, 2),
    feb = new Date(2024, 1, 1),
    mar = new Date(2024, 2, 1);
  assert.strictEqual(periodLabel(feb, undefined, "month"), "Feb 2024");
  assert.strictEqual(
    periodLabel(jan, undefined, "month"),
    "Jan 2024",
    "the first tick names its month and year",
  );
  assert.strictEqual(periodLabel(mar, feb, "month"), "Mar");
  assert.strictEqual(
    periodLabel(jan, new Date(2023, 11, 1), "quarter"),
    "2024",
  );
  assert.strictEqual(periodLabel(feb, undefined, "week"), "Feb 1, 2024");
  assert.strictEqual(periodLabel(new Date(2024, 1, 8), feb, "day"), "Feb 8");
  assert.strictEqual(
    periodLabel(jan, new Date(2023, 11, 29), "week"),
    "Jan 2, 2024",
  );
  assert.strictEqual(periodLabel(jan, new Date(2020, 0, 1), "year"), "2024");
  assert.strictEqual(periodLabel(feb, undefined, "year"), "2024");
});

it("Candlestick shownUnit reads the coarsest unit the shown ticks after the first open", () => {
  const dates = weekdays(new Date(2023, 0, 2), 300);
  const opens = (d, unit) => {
    const k = dates.indexOf(d);
    return k > 0 && unitIndex(dates[k], unit) !== unitIndex(dates[k - 1], unit);
  };
  const at = unit => [dates[0], ...periodBoundaries(dates, unit)];
  assert.strictEqual(shownUnit(at("year"), opens), "year");
  assert.strictEqual(shownUnit(at("quarter"), opens), "quarter");
  assert.strictEqual(shownUnit(at("month"), opens), "month");
  assert.strictEqual(shownUnit(at("week"), opens), "week");
  assert.strictEqual(shownUnit(dates, opens), "day");
  assert.strictEqual(
    shownUnit([dates[0]], opens),
    "year",
    "the first alone names its year",
  );
  assert.strictEqual(
    shownUnit(dates.slice(0, 1).concat(dates.slice(10, 12)), opens),
    "day",
  );
});

it("Candlestick periodTickFormat labels ticks for the unit and year boundaries the axis shows", () => {
  const dates = weekdays(new Date(2023, 0, 2), 300);
  const format = periodTickFormat(dates);
  const axis = shown => ({_shownLabels: shown});
  const quarters = [dates[0], ...periodBoundaries(dates, "quarter")];
  assert.deepStrictEqual(
    quarters.map(d => format.call(axis(quarters), d)),
    ["Jan 2023", "Apr", "Jul", "Oct", "2024"],
  );
  const months = periodBoundaries(dates, "month");
  assert.deepStrictEqual(
    months.slice(0, 2).map(d => format.call(axis(months), d)),
    ["Feb 2023", "Mar"],
    "without the first period, the first shown tick names its year",
  );
  const years = [dates[0], ...periodBoundaries(dates, "year")];
  assert.deepStrictEqual(
    years.map(d => format.call(axis(years), d)),
    ["2023", "2024"],
  );
  assert.strictEqual(
    format.call(axis([dates[0]]), dates[0]),
    "2023",
    "alone, the first period names its year",
  );
  const thinned = quarters.filter((_d, k) => k % 2 === 0);
  assert.deepStrictEqual(
    thinned.map(d => format.call(axis(thinned), d)),
    ["Jan 2023", "Jul", "2024"],
    "thinned ticks still name each new year",
  );
  const weeks = [dates[0], ...periodBoundaries(dates, "week")];
  assert.deepStrictEqual(
    weeks.slice(0, 3).map(d => format.call(axis(weeks), d)),
    ["Jan 2, 2023", "Jan 9", "Jan 16"],
  );
  assert.strictEqual(
    format(dates[3]),
    "Jan 5, 2023",
    "outside an axis, a period formats in full",
  );
  assert.strictEqual(format.call(axis(quarters), "x"), "x");
});

it("Candlestick bandAxisDefaults offers tick lists on the rows' calendar boundaries", () => {
  const dates = weekdays(new Date(2024, 0, 15), 60);
  const viz = fakeViz({
    _filteredData: dates.map(date => ({date})),
    _x: key("date"),
  });
  viz.schema.width = 600;
  const config = bandAxisDefaults(viz);
  assert.strictEqual(
    config.ticks,
    undefined,
    "the ticks follow the list the axis picks",
  );
  assert.deepStrictEqual(
    config.labels.map(list => list.length),
    [4, 3, 2],
    "months, with and without the first period, then the quarter",
  );
  assert.deepStrictEqual(
    config.labels[0].map(d => d.getMonth()),
    [0, 1, 2, 3],
    "the first period, then each month",
  );
  assert.deepStrictEqual(
    config.labels[1].map(d => d.getMonth()),
    [1, 2, 3],
    "then each month alone",
  );
  const shown = {_shownLabels: config.labels[0]};
  assert.deepStrictEqual(
    config.labels[0].map(d => config.tickFormat.call(shown, d)),
    ["Jan 2024", "Feb", "Mar", "Apr"],
  );
  assert.strictEqual(
    config.tickFormat(dates[3]),
    "Jan 18, 2024",
    "an untick'd period formats in full",
  );
  assert.strictEqual(config.tickFormat("x"), "x");
  const empty = bandAxisDefaults(fakeViz());
  assert.deepStrictEqual(empty.labels, []);
});

it("Candlestick formatPrice keeps two decimals at 1 and above, three digits below", () => {
  assert.strictEqual(formatPrice(129.1), "129.10");
  assert.strictEqual(formatPrice(1234.5), "1,234.50");
  assert.strictEqual(formatPrice(42), "42.00");
  assert.strictEqual(formatPrice(-3.456), "-3.46");
  assert.strictEqual(formatPrice(0.012345), "0.0123");
  assert.strictEqual(formatPrice(1234.5, "es-ES"), "1.234,50");
});

it("Candlestick formatChange signs a percentage", () => {
  assert.strictEqual(formatChange(0.0128), "+1.28%");
  assert.strictEqual(formatChange(-0.0145), "-1.45%");
  assert.strictEqual(formatChange(0), "0%");
});

it("Candlestick candleTooltipRows lists the period, open, high, low, close, and change", () => {
  const viz = fakeViz({schema: {translate: s => `[${s}]`}});
  const d = {symbol: "ACME", date: "2024-01-02", ...row(100, 104, 99.5, 103)};
  assert.deepStrictEqual(candleTooltipRows(viz, d, 0), [
    ["date", "Jan 2, 2024"],
    ["[Open]", "100.00"],
    ["[High]", "104.00"],
    ["[Low]", "99.50"],
    ["[Close]", "103.00"],
    ["[Change]", "+3%"],
  ]);
  assert.deepStrictEqual(candleTooltipRows(viz, {close: null}, 0), []);
  const zeroOpen = candleTooltipRows(
    viz,
    {date: "2024-01-02", ...row(0, 1, 0, 1)},
    0,
  );
  assert.ok(
    !zeroOpen.some(r => r[0] === "[Change]"),
    "no change from a zero open",
  );
  const formatted = fakeViz({
    _xConfig: {tickFormat: d => `T${d.getDate()}`, title: "Day"},
    _yConfig: {tickFormat: v => `$${v}`},
  });
  const rows = candleTooltipRows(formatted, d, 0);
  assert.deepStrictEqual(rows[0], ["Day", "T2"]);
  assert.deepStrictEqual(rows[1], ["Open", "$100"]);
});

it("Candlestick candleAriaLabel reads the label, period, and values", () => {
  const viz = fakeViz();
  const d = {symbol: "ACME", date: "2024-01-02", ...row(100, 104, 99.5, 103)};
  assert.strictEqual(
    candleAriaLabel(viz, d, 0),
    "ACME, Jan 2, 2024: Open 100.00, High 104.00, Low 99.50, Close 103.00, Change +3%.",
  );
});

it("Candlestick volumeAriaLabel reads the label, period, and volume", () => {
  const d = {
    symbol: "ACME",
    date: "2024-01-02",
    volume: 1234567,
    ...row(100, 104, 99.5, 103),
  };
  const viz = fakeViz({
    schema: {
      volume: key("volume"),
      translate: s => (s === "Volume" ? "Volumen" : s),
    },
  });
  assert.strictEqual(
    volumeAriaLabel(viz, d, 0),
    "ACME, Jan 2, 2024: Volumen 1.23M.",
  );
  assert.strictEqual(
    volumeAriaLabel(viz, {...d, volume: null}, 0),
    "ACME, Jan 2, 2024: Volumen.",
  );
  const formatted = fakeViz({
    schema: {volume: key("volume")},
    _xConfig: {tickFormat: v => `T${v.getDate()}`},
  });
  assert.strictEqual(
    volumeAriaLabel(formatted, d, 0),
    "ACME, T2: Volume 1.23M.",
  );
});

it("Candlestick layoutCandles centers each period and draws candles or OHLC bars", () => {
  const rows = [row(10, 12, 9, 11), row(11, 11.5, 8, 9), {close: null}].map(
    (data, i) => ({data, i, x: i, id: "a"}),
  );
  const x = v => v * 20 + 10;
  const y = v => 100 - v * 5;
  const viz = fakeViz();
  const layouts = layoutCandles(viz, rows, x, y, [0, 60]);
  assert.strictEqual(layouts.size, 2, "the row without a close is skipped");
  const [up, down] = [layouts.get(rows[0]), layouts.get(rows[1])];
  assert.strictEqual(up.direction, "up");
  assert.strictEqual(down.direction, "down");
  assert.strictEqual(up.cx, 10.5);
  assert.strictEqual(up.width, 14, "70% of the 20px gap");
  assert.deepStrictEqual(up.px, {
    open: 50.5,
    high: 40.5,
    low: 55.5,
    close: 45.5,
  });
  assert.strictEqual(up.d, candlePath(up.cx, up.width, up.px));
  viz.schema.variant = "ohlc";
  const bars = layoutCandles(viz, rows, x, y, [0, 60]);
  assert.strictEqual(
    bars.get(rows[0]).d,
    ohlcBarPath(10.5, 14, bars.get(rows[0]).px),
  );
  const lone = layoutCandles(fakeViz(), rows.slice(0, 1), x, y, [0, 600]);
  assert.strictEqual(
    lone.get(rows[0]).width,
    28,
    "a lone period gets 40px of room",
  );
  assert.strictEqual(CANDLESTICK_SHAPE, "Candlestick");
});

it("candleTexture draws a texture's lines a shade darker than the candle's fill", () => {
  assert.deepStrictEqual(candleTexture("lines", "#e03131"), {
    texture: "lines",
    stroke: "#9d2222",
  });
  assert.deepStrictEqual(
    candleTexture({texture: "circles", size: 8}, "#e03131"),
    {texture: "circles", size: 8, stroke: "#9d2222"},
  );
  assert.deepStrictEqual(
    candleTexture({texture: "lines", stroke: "#fff"}, "#e03131"),
    {texture: "lines", stroke: "#fff"},
    "a set stroke wins",
  );
  assert.strictEqual(
    candleTexture("lines", "none"),
    "lines",
    "an unfilled candle is left to textureKey (no texture)",
  );
  assert.strictEqual(candleTexture(false, "#e03131"), false);
  assert.strictEqual(candleTexture(undefined, "#e03131"), undefined);
});
