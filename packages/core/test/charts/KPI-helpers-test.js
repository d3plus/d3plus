import {it} from "vitest";
import assert from "assert";
import {
  DELTA_GLYPHS,
  deltaMode,
  deltaText,
  deltaTone,
  goodDirection,
  kpiDelta,
} from "../../src/charts/KPI/delta.ts";
import {kpiPeriods, kpiSeries} from "../../src/charts/KPI/series.ts";
import {
  kpiGrid,
  MAX_VALUE_SIZE,
  MIN_SPARKLINE_HEIGHT,
  MIN_TEXT_SIZE,
  sparklinePoints,
  sparklineType,
  TILE_ASPECT,
  TILE_PADDING,
  tileContent,
} from "../../src/charts/KPI/tileLayout.ts";

const formats = {
  value: n => `${n}`,
  percent: share => `${Math.round(share * 1000) / 10}%`,
};

it("KPI: kpiDelta measures the change, its share, and its direction", () => {
  assert.deepStrictEqual(kpiDelta(110, 100), {
    absolute: 10,
    percent: 0.1,
    direction: "up",
  });
  const down = kpiDelta(-30, -20);
  assert.strictEqual(down.absolute, -10);
  assert.strictEqual(down.percent, -0.5, "shares read against the size");
  assert.strictEqual(down.direction, "down");
  assert.strictEqual(kpiDelta(5, 5).direction, "none");
  assert.ok(Number.isNaN(kpiDelta(5, 0).percent), "no share of zero");
  assert.strictEqual(kpiDelta(NaN, 3), undefined);
  assert.strictEqual(kpiDelta(3, Infinity), undefined);
});

it("KPI: goodDirection, deltaTone, and deltaMode coerce their settings", () => {
  assert.strictEqual(goodDirection("down"), "down");
  assert.strictEqual(goodDirection("up"), "up");
  assert.strictEqual(goodDirection(undefined), "up");
  assert.strictEqual(deltaTone("up", "up"), "good");
  assert.strictEqual(deltaTone("down", "up"), "bad");
  assert.strictEqual(deltaTone("down", "down"), "good");
  assert.strictEqual(deltaTone("up", "down"), "bad");
  assert.strictEqual(deltaTone("none", "down"), "neutral");
  assert.strictEqual(deltaMode(false), false);
  assert.strictEqual(deltaMode("absolute"), "absolute");
  assert.strictEqual(deltaMode("both"), "both");
  assert.strictEqual(deltaMode("percent"), "percent");
  assert.strictEqual(deltaMode("anything"), "percent");
});

it("KPI: deltaText writes a tile's delta and a tooltip's signed change", () => {
  const up = kpiDelta(110, 100);
  const down = kpiDelta(90, 100);
  assert.strictEqual(deltaText(up, "percent", formats), "▲ 10%");
  assert.strictEqual(deltaText(down, "percent", formats), "▼ 10%");
  assert.strictEqual(deltaText(down, "absolute", formats), "▼ 10");
  assert.strictEqual(deltaText(up, "both", formats), "▲ 10 (10%)");
  assert.strictEqual(deltaText(up, "both", formats, true), "+10 (+10%)");
  assert.strictEqual(deltaText(down, "both", formats, true), "-10 (-10%)");
  const flat = kpiDelta(4, 4);
  assert.strictEqual(deltaText(flat, "percent", formats), "0%");
  const fromZero = kpiDelta(4, 0);
  assert.strictEqual(
    deltaText(fromZero, "percent", formats),
    "▲ 4",
    "falls back to the absolute change",
  );
  assert.strictEqual(deltaText(fromZero, "both", formats), "▲ 4");
  assert.strictEqual(DELTA_GLYPHS.none, "");
});

it("KPI: kpiPeriods groups rows by time in time order", () => {
  const rows = [
    {row: {t: "2025-03", v: 3}, i: 0},
    {row: {t: "2025-01", v: 1}, i: 1},
    {row: {t: "2025-03", v: 4}, i: 2},
    {row: {t: "2025-02", v: 2}, i: 3},
  ];
  const periods = kpiPeriods(rows, d => d.t);
  assert.deepStrictEqual(
    periods.map(p => p.time),
    ["2025-01", "2025-02", "2025-03"],
  );
  assert.deepStrictEqual(
    periods[2].rows.map(r => r.i),
    [0, 2],
  );
  const named = kpiPeriods(
    [
      {row: {t: "Q2"}, i: 0},
      {row: {t: "Q1"}, i: 1},
    ],
    d => d.t,
  );
  assert.deepStrictEqual(
    named.map(p => p.time),
    ["Q2", "Q1"],
    "values that aren't dates keep their data order",
  );
  const dates = kpiPeriods(
    [
      {row: {t: new Date(2025, 1, 1)}, i: 0},
      {row: {t: new Date(2025, 0, 1)}, i: 1},
      {row: {t: new Date(2025, 1, 1)}, i: 2},
    ],
    d => d.t,
  );
  assert.strictEqual(dates.length, 2, "equal dates share a period");
  assert.strictEqual(dates[0].rows[0].i, 1);
});

it("KPI: kpiSeries compares the current periods with as many before them", () => {
  const periods = [1, 2, 3, 4, 5].map(v => ({
    time: 2020 + v,
    rows: [{row: {v}, i: v}],
  }));
  const sum = rows => rows.reduce((s, r) => s + r.row.v, 0);
  const latest = kpiSeries(periods, p => p.time === 2025, sum);
  assert.deepStrictEqual(
    latest.points.map(p => [p.value, p.current]),
    [
      [1, false],
      [2, false],
      [3, false],
      [4, false],
      [5, true],
    ],
  );
  assert.strictEqual(latest.previous, 4);
  assert.deepStrictEqual(latest.previousTimes, [2024]);
  const two = kpiSeries(periods, p => p.time >= 2024, sum);
  assert.strictEqual(two.previous, 2 + 3, "two periods against two before");
  assert.deepStrictEqual(two.previousTimes, [2022, 2023]);
  const first = kpiSeries(periods, p => p.time === 2021, sum);
  assert.ok(Number.isNaN(first.previous), "nothing before the first period");
  const short = kpiSeries(periods, p => p.time >= 2022 && p.time <= 2024, sum);
  assert.ok(Number.isNaN(short.previous), "too few periods before");
  const none = kpiSeries(periods, () => false, sum);
  assert.ok(Number.isNaN(none.previous));
  assert.strictEqual(none.points.length, 5);
});

it("KPI: kpiGrid fills the area with tiles near the aspect", () => {
  const area = {x: 0, y: 0, width: 900, height: 300};
  const opts = {padding: 10, aspect: TILE_ASPECT};
  const tiles = kpiGrid(6, area, opts);
  assert.strictEqual(tiles.length, 6);
  assert.strictEqual(new Set(tiles.map(t => t.y)).size, 2, "two rows of three");
  for (const t of tiles) {
    assert.ok(t.x >= 0 && t.x + t.width <= 900 + 1e-9);
    assert.ok(t.y >= 0 && t.y + t.height <= 300 + 1e-9);
  }
  assert.strictEqual(tiles[1].x - tiles[0].x - tiles[0].width, 10);
  const fixed = kpiGrid(6, area, {...opts, columns: 2});
  assert.strictEqual(new Set(fixed.map(t => t.x)).size, 2);
  assert.strictEqual(new Set(fixed.map(t => t.y)).size, 3);
  assert.deepStrictEqual(kpiGrid(0, area, opts), []);
  assert.strictEqual(TILE_PADDING, 12);
});

it("KPI: tileContent stacks the text and gives the bottom to the sparkline", () => {
  const all = tileContent(300, 200, {
    label: true,
    delta: true,
    sparkline: true,
  });
  assert.ok(all.label.y < all.value.y && all.value.y < all.delta.y);
  assert.ok(all.delta.y + all.delta.size / 2 <= all.sparkline.y);
  assert.strictEqual(all.sparkline.x, all.pad);
  assert.strictEqual(all.sparkline.width, 300 - all.pad * 2);
  assert.strictEqual(all.sparkline.y + all.sparkline.height, 200 - all.pad);
  assert.ok(all.sparkline.height >= MIN_SPARKLINE_HEIGHT);
  assert.ok(all.value.size > all.label.size, "the value reads largest");

  const bare = tileContent(300, 200, {
    label: false,
    delta: false,
    sparkline: false,
  });
  assert.strictEqual(bare.label, undefined);
  assert.strictEqual(bare.delta, undefined);
  assert.strictEqual(bare.sparkline, undefined);
  assert.strictEqual(bare.comparison, true);
  assert.ok(
    Math.abs(bare.value.y - 100) < 1,
    "a lone value centers in the tile",
  );

  const short = tileContent(300, 70, {
    label: true,
    delta: true,
    sparkline: true,
  });
  assert.strictEqual(short.sparkline, undefined, "no room for a sparkline");

  const huge = tileContent(2000, 1500, {
    label: true,
    delta: true,
    sparkline: true,
  });
  assert.strictEqual(huge.value.size, MAX_VALUE_SIZE);
});

/** The top and bottom of a tile's text lines, with the line height tileContent uses. */
const extent = content => {
  const lines = [content.label, content.value, content.delta].filter(Boolean);
  return {
    top: Math.min(...lines.map(l => l.y - (l.size * 1.25) / 2)),
    bottom: Math.max(...lines.map(l => l.y + (l.size * 1.25) / 2)),
  };
};

it("KPI: tileContent keeps a short tile's text inside it, dropping parts as room runs out", () => {
  const parts = {label: true, delta: true, sparkline: false};
  const roomy = tileContent(300, 200, parts);
  assert.strictEqual(roomy.comparison, true);
  for (const height of [90, 60, 44, 30, 22, 14, 6]) {
    const c = tileContent(300, height, parts);
    if (c.value) {
      const {top, bottom} = extent(c);
      assert.ok(top >= c.pad - 1e-9, `${height}: top inside`);
      assert.ok(bottom <= height - c.pad + 1e-9, `${height}: bottom inside`);
    }
    for (const l of [c.label, c.value, c.delta].filter(Boolean))
      assert.ok(l.size >= MIN_TEXT_SIZE, `${height}: legible text`);
  }
  const tight = tileContent(300, 44, parts);
  assert.strictEqual(tight.comparison, false, "the comparison words go first");
  assert.ok(tight.label === undefined || tight.delta !== undefined);
  const tiny = tileContent(300, 22, parts);
  assert.strictEqual(tiny.label, undefined, "then the label");
  assert.ok(tiny.value, "the value stays longest");
  const sliver = tileContent(300, 6, parts);
  assert.deepStrictEqual(
    [sliver.label, sliver.value, sliver.delta],
    [undefined, undefined, undefined],
    "nothing fits",
  );
});

it("KPI: sparklineType coerces the setting", () => {
  assert.strictEqual(sparklineType(false), false);
  assert.strictEqual(sparklineType("line"), "line");
  assert.strictEqual(sparklineType("bar"), "bar");
  assert.strictEqual(sparklineType("area"), "area");
  assert.strictEqual(sparklineType(true), "area");
});

it("KPI: sparklinePoints spans the box and fits the values", () => {
  const box = {x: 10, y: 20, width: 100, height: 50};
  const line = sparklinePoints([1, 3, 2], box, "line");
  assert.deepStrictEqual(
    line.map(p => p.x),
    [10, 60, 110],
  );
  assert.deepStrictEqual(
    line.map(p => p.y),
    [70, 20, 45],
  );
  assert.ok(line.every(p => p.base === 70));
  const bars = sparklinePoints([2, 4], box, "bar");
  assert.deepStrictEqual(
    bars.map(p => p.x),
    [35, 85],
  );
  assert.deepStrictEqual(
    bars.map(p => [p.y, p.base]),
    [
      [45, 70],
      [20, 70],
    ],
    "bars read from zero",
  );
  const negative = sparklinePoints([-2, 2], box, "bar");
  assert.strictEqual(negative[0].base, 45, "zero sits mid-box");
  assert.strictEqual(negative[0].y, 70);
  const flat = sparklinePoints([5, 5], box, "line");
  assert.deepStrictEqual(
    flat.map(p => p.y),
    [45, 45],
  );
  const zeros = sparklinePoints([0, 0], box, "bar");
  assert.ok(
    zeros.every(p => p.y === p.base),
    "zero bars stay flat",
  );
  const gap = sparklinePoints([1, NaN, 3], box, "line");
  assert.ok(Number.isNaN(gap[1].x) && Number.isNaN(gap[1].y));
  assert.strictEqual(sparklinePoints([5], box, "line")[0].x, 60);
  assert.deepStrictEqual(sparklinePoints([], box, "line"), []);
  assert.deepStrictEqual(sparklinePoints([NaN], box, "line"), []);
});
