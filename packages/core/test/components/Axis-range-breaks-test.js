import {it} from "vitest";
import assert from "assert";
import {scaleLinear, scaleTime} from "d3-scale";
import {AxisBottom} from "../../index.ts";
import {
  applyAxisRangeBreaks,
  breakStyleOf,
  brokenTimeScale,
  dropHiddenRows,
  isBrokenTimeScale,
  plotRangeBreaks,
  plotTimeScale,
  rangeBreaksTimeAxis,
  timelineRangeBreaks,
  visibleTimeValues,
} from "../../internal.ts";
import {
  datesDays,
  rangeBreakOpenedDay,
} from "../../src/components/Axis/axisRangeBreaks.ts";
import {
  scaleTimeShift,
  scaleTimeStep,
} from "../../src/components/Axis/brokenTimeScale.ts";
import {axisScaleData} from "../../src/components/Axis/timeValues.ts";
import discreteBuffer from "../../src/charts/plotBuffers/discreteBuffer.ts";
import {padPeriods} from "../../src/charts/Candlestick/buffer.ts";
import {configWarnings} from "../../src/utils/configWarnings.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

/**
    A time Axis's `rangeBreaks` swap its scale for a broken time scale, keep
    hidden times out of its data, ticks and labels, and mark `bounds` gaps
    as axis breaks; a Plot drops hidden rows and pads its time scales in
    shown time.
*/

const DAY = 864e5;
// January 2024 starts on a Monday.
const jan = (d, h = 0, m = 0) => new Date(2024, 0, d, h, m);

/** Weekday dates from Jan 1 to Jan 19, 2024. */
const weekdays = () => {
  const out = [];
  for (let d = 1; d <= 19; d++) {
    const date = jan(d);
    if (date.getDay() % 6) out.push(date);
  }
  return out;
};

/** Measures a standalone time axis over `data` with `config`. */
function measure(data, config = {}) {
  const axis = new AxisBottom()
    .scale("time")
    .width(800)
    .height(100)
    .duration(0)
    .renderMode("compute")
    .select(null)
    .data(data)
    .domain([data[0], data[data.length - 1]])
    .config(config);
  axis.measure();
  return axis;
}

it("breakStyleOf reads a break config's glyph settings with defaults", () => {
  assert.deepStrictEqual(breakStyleOf(undefined), {
    angle: 30,
    gap: 5,
    size: 10,
    space: 36,
    mask: true,
    lines: true,
  });
  assert.strictEqual(breakStyleOf({space: 12}).space, 12);
  assert.strictEqual(breakStyleOf({mask: false}).mask, false);
});

it("a time axis with rangeBreaks draws on a broken time scale", () => {
  const axis = measure(weekdays(), {rangeBreaks: "weekends"});
  assert.ok(isBrokenTimeScale(axis._d3Scale));
  const fri = axis._getPosition(jan(5));
  const thu = axis._getPosition(jan(4));
  const mon = axis._getPosition(jan(8));
  assert.ok(Math.abs(mon - fri - (fri - thu)) < 1e-6, "Friday next to Monday");
  axis._visibleTicks.forEach(t =>
    assert.ok(new Date(t).getDay() % 6, `${new Date(t)} is a weekday`),
  );
  assert.strictEqual(axis._breaks.length, 0, "weekends draw no marker");
  // Other scales, or no rules, keep their scale.
  assert.ok(!isBrokenTimeScale(measure(weekdays())._d3Scale));
  const linear = new AxisBottom()
    .renderMode("compute")
    .select(null)
    .domain([0, 10])
    .config({rangeBreaks: "weekends"});
  linear.measure();
  assert.ok(!isBrokenTimeScale(linear._d3Scale));
});

it("applyAxisRangeBreaks records a marked gap as an axis break", () => {
  const data = [jan(1), jan(9), jan(20), jan(31)];
  const axis = measure(data, {
    rangeBreaks: {bounds: [jan(10), jan(20)]},
    breakConfig: {space: 30, mask: false},
  });
  assert.strictEqual(axis._breaks.length, 1);
  const [brk] = axis._breaks;
  assert.deepStrictEqual(
    [brk.start, brk.end, brk.baseline, brk.mask],
    [+jan(10), +jan(20), false, false],
  );
  assert.ok(Math.abs(brk.endPosition - brk.startPosition - 30) < 1e-6);
  // Called again on a plain time scale, it rebuilds the broken one.
  const fresh = new AxisBottom()
    .scale("time")
    .config({rangeBreaks: {bounds: [jan(10), jan(20)]}});
  fresh._d3Scale = scaleTime()
    .domain([jan(1), jan(31)])
    .range([0, 800]);
  fresh._breaks = [];
  applyAxisRangeBreaks(fresh);
  assert.ok(isBrokenTimeScale(fresh._d3Scale));
  assert.strictEqual(fresh._breaks.length, 1);
});

it("axisScaleData and visibleTimeValues leave hidden times out", () => {
  const axis = measure(
    weekdays()
      .concat([jan(13)])
      .sort((a, b) => a - b),
    {
      rangeBreaks: "weekends",
    },
  );
  assert.ok(!axisScaleData(axis).some(d => +d === +jan(13)));
  assert.deepStrictEqual(visibleTimeValues(axis, [+jan(5), +jan(6), +jan(8)]), [
    +jan(5),
    +jan(8),
  ]);
  const plain = measure(weekdays());
  assert.deepStrictEqual(visibleTimeValues(plain, [+jan(6)]), [+jan(6)]);
});

it("a user's ticks and labels inside hidden time are dropped", () => {
  const axis = measure(weekdays(), {
    rangeBreaks: "weekends",
    ticks: [jan(5), jan(6), jan(8)],
    labels: [jan(6), jan(8)],
  });
  assert.deepStrictEqual(axis._availableTicks.map(Number), [+jan(5), +jan(8)]);
  assert.deepStrictEqual(axis._shownLabels.map(Number), [+jan(8)]);
});

it("rangeBreakOpenedDay and datesDays label a tick that opens its day as the day", () => {
  const data = [];
  for (let d = 1; d <= 3; d++)
    for (let h = 9.5; h < 16; h += 0.5)
      data.push(jan(d, Math.floor(h), (h % 1) * 60));
  const axis = measure(data, {rangeBreaks: {hours: [16, 9.5]}});
  assert.deepStrictEqual(rangeBreakOpenedDay(axis, jan(2, 9, 30)), jan(2));
  assert.deepStrictEqual(rangeBreakOpenedDay(axis, +jan(2, 9, 30)), jan(2));
  assert.strictEqual(rangeBreakOpenedDay(axis, jan(2, 10)), undefined);
  assert.strictEqual(rangeBreakOpenedDay(axis, jan(2)), undefined);
  assert.strictEqual(
    rangeBreakOpenedDay(measure(data), jan(2, 9, 30)),
    undefined,
  );
  assert.deepStrictEqual(datesDays([jan(2, 10), jan(1, 9), jan(2, 15)]), [
    jan(1),
    jan(2),
  ]);
  const label = axis._labelFormat(+jan(2, 9, 30));
  assert.ok(
    /^Jan 2\b/.test(label) && !/:/.test(label),
    `labeled as its day (${label})`,
  );
  assert.ok(
    /:/.test(axis._labelFormat(+jan(2, 10, 30))),
    "a later tick keeps its time",
  );
});

it("scaleTimeStep and scaleTimeShift count shown time on a broken scale", () => {
  const broken = brokenTimeScale(["weekends"]).domain([jan(1), jan(19)]);
  const plain = scaleTime().domain([jan(1), jan(19)]);
  assert.strictEqual(scaleTimeStep(broken, jan(5), jan(8)), DAY);
  assert.strictEqual(scaleTimeStep(plain, jan(5), jan(8)), 3 * DAY);
  assert.deepStrictEqual(scaleTimeShift(broken, jan(8), -DAY / 2), jan(5, 12));
  assert.deepStrictEqual(scaleTimeShift(plain, jan(8), -DAY / 2), jan(7, 12));
});

it("discreteBuffer and padPeriods pad a broken time scale in shown time", () => {
  const rows = weekdays().map(x => ({x}));
  const broken = brokenTimeScale(["weekends"]).domain([jan(1), jan(19)]);
  discreteBuffer(broken, rows, "x");
  assert.deepStrictEqual(broken.domain(), [
    new Date(2023, 11, 29, 12),
    jan(19, 12),
  ]);
  const candles = brokenTimeScale(["weekends"]).domain([jan(1), jan(19)]);
  padPeriods(
    candles,
    rows.map(r => +r.x),
  );
  assert.deepStrictEqual(candles.domain(), [new Date(2023, 11, 29), jan(22)]);
});

it("plotRangeBreaks, plotTimeScale and dropHiddenRows read a Plot's time axes", () => {
  const viz = {
    _xTime: true,
    _yTime: false,
    _xConfig: {rangeBreaks: ["weekends", {nope: 1}], breakConfig: {space: 20}},
    _yConfig: {rangeBreaks: "weekends"},
    _x2Config: {scale: "time", rangeBreaks: "weekends"},
  };
  assert.deepStrictEqual(plotRangeBreaks(viz, "x"), ["weekends"]);
  assert.deepStrictEqual(plotRangeBreaks(viz, "y"), [], "not a time axis");
  assert.deepStrictEqual(
    plotRangeBreaks(viz, "x2"),
    ["weekends"],
    "a time scale config",
  );
  assert.deepStrictEqual(plotRangeBreaks(viz, "y2"), []);

  const x = plotTimeScale(
    viz,
    "x",
    scaleTime()
      .domain([jan(1), jan(19)])
      .range([0, 600]),
  );
  assert.ok(isBrokenTimeScale(x));
  assert.deepStrictEqual(x.domain(), [jan(1), jan(19)]);
  assert.deepStrictEqual(x.range(), [0, 600]);
  const y = scaleLinear();
  assert.strictEqual(plotTimeScale(viz, "y", y), y);

  const warnings = [];
  const warn = console.warn;
  console.warn = msg => warnings.push(msg);
  try {
    configWarnings(true);
    const rows = [jan(5), jan(6), jan(8), +jan(13), "Jan 14"].map(x => ({
      x,
      y: 1,
    }));
    const kept = dropHiddenRows(viz, rows);
    assert.deepStrictEqual(
      kept.map(r => r.x),
      [jan(5), jan(8), "Jan 14"],
    );
    dropHiddenRows(viz, rows);
    assert.deepStrictEqual(warnings, [
      "Some data falls inside xConfig.rangeBreaks and is not drawn.",
    ]);
    assert.deepStrictEqual(dropHiddenRows({_xConfig: {}}, rows), rows);
  } finally {
    console.warn = warn;
  }
});

it("rangeBreaksTimeAxis makes an axis with rules over dates a time axis", () => {
  const viz = {_xConfig: {rangeBreaks: "weekends"}, _yConfig: {}};
  assert.ok(rangeBreaksTimeAxis(viz, "x", jan(5)));
  assert.ok(rangeBreaksTimeAxis(viz, "x", "2024-01-05"));
  assert.ok(rangeBreaksTimeAxis(viz, "x", +jan(5)), "a timestamp");
  assert.ok(!rangeBreaksTimeAxis(viz, "x", 2024), "a short number");
  assert.ok(!rangeBreaksTimeAxis(viz, "x", "Apples"));
  assert.ok(!rangeBreaksTimeAxis(viz, "x", new Date(NaN)));
  assert.ok(!rangeBreaksTimeAxis(viz, "y", jan(5)), "no rules");
  assert.ok(
    !rangeBreaksTimeAxis({_xConfig: {rangeBreaks: [{nope: 1}]}}, "x", jan(5)),
  );
});

it("timelineRangeBreaks takes the rules of the axis that plots the chart's time", () => {
  const row = {date: jan(5), value: 3};
  const read = key => d => d[key];
  const viz = {
    _data: [row],
    schema: {time: read("date")},
    _x: read("date"),
    _y: read("value"),
    _xConfig: {rangeBreaks: ["weekends"]},
    _yConfig: {rangeBreaks: "weekends"},
  };
  assert.deepStrictEqual(timelineRangeBreaks(viz), ["weekends"]);
  assert.deepStrictEqual(
    timelineRangeBreaks({...viz, _xConfig: {}}),
    [],
    "the time axis has none",
  );
  assert.deepStrictEqual(
    timelineRangeBreaks({...viz, _x: read("value"), _y: read("date")}),
    ["weekends"],
    "a time y axis",
  );
  assert.deepStrictEqual(
    timelineRangeBreaks({...viz, schema: {}}),
    [],
    "no time",
  );
  assert.deepStrictEqual(
    timelineRangeBreaks({...viz, _data: []}),
    [],
    "no data",
  );
});
