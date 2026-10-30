import {it, vi} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {LinePlot, SlopeChart} from "../../index.ts";
import {
  prepareSlope,
  slopeChartDef,
  slopeColors,
  slopeColorsDark,
  slopeColorsLight,
  slopeDirection,
  slopeDirections,
  slopeFill,
  slopePeriods,
  slopeValueAxis,
} from "../../internal.ts";

useJsdom();

it("SlopeChart — a LinePlot labeled at both ends with values", () => {
  const viz = new SlopeChart();
  assert.ok(viz instanceof LinePlot);
  assert.strictEqual(slopeChartDef.name, "SlopeChart");
  assert.strictEqual(viz.lineLabels(), "both");
  assert.deepStrictEqual(viz.lineLabelConfig(), {value: true});
  assert.strictEqual(viz.lineMarkers(), true);
  assert.strictEqual(viz.slopeColor(), false);
  assert.strictEqual(viz.legend()(), false);
  assert.strictEqual(viz.axisHover(), "x");
  assert.strictEqual(viz.discrete(), "x");
  assert.deepStrictEqual(viz.yConfig().labels, []);
  assert.deepStrictEqual(viz.yConfig().ticks, []);
  assert.strictEqual(viz.yConfig().barConfig.stroke, "transparent");
  assert.ok(viz.yConfig().gridConfig, "keeps Plot's y config");
});

it("slopeValueAxis — hides the value axis", () => {
  assert.deepStrictEqual(slopeValueAxis, {
    barConfig: {stroke: "transparent"},
    labels: [],
    ticks: [],
  });
});

it("SlopeChart — user config wins over its defaults", () => {
  const valueFormat = v => `${v}%`;
  const viz = new SlopeChart().config({
    lineLabels: "end",
    lineLabelConfig: {valueFormat},
    lineMarkers: false,
    slopeColor: {up: "blue"},
    yConfig: {labels: [10], ticks: [10]},
  });
  assert.strictEqual(viz.lineLabels(), "end");
  assert.deepStrictEqual(viz.lineLabelConfig(), {value: true, valueFormat});
  assert.strictEqual(viz.lineMarkers(), false);
  assert.deepStrictEqual(viz.slopeColor(), {up: "blue"});
  assert.deepStrictEqual(viz.yConfig().labels, [10]);
  const fresh = new SlopeChart();
  assert.strictEqual(fresh.lineLabels(), "both", "per instance");
  assert.deepStrictEqual(fresh.yConfig().labels, []);
  assert.strictEqual(new LinePlot().lineLabels(), undefined);
});

it("slopePeriods — distinct periods in order", () => {
  assert.deepStrictEqual(slopePeriods([2024, 2015, 2024, 2015]), [2015, 2024]);
  const a = new Date(2015, 0, 1);
  const b = new Date(2024, 0, 1);
  assert.deepStrictEqual(
    slopePeriods([b, new Date(+a), a, null]),
    [b, a].reverse(),
  );
  assert.deepStrictEqual(slopePeriods(["After", "Before", "After"]), [
    "After",
    "Before",
  ]);
  assert.deepStrictEqual(slopePeriods([undefined]), []);
});

it("slopeDirection — up, down, or flat", () => {
  assert.strictEqual(slopeDirection(1, 2), "up");
  assert.strictEqual(slopeDirection(2, 1), "down");
  assert.strictEqual(slopeDirection(2, 2), "flat");
});

it("slopeDirections — each series from its first period to its last", () => {
  const rows = [
    {id: "a", year: 2024, v: 5},
    {id: "a", year: 2015, v: 3},
    {id: "b", year: 2015, v: 9},
    {id: "b", year: 2020, v: 12},
    {id: "b", year: 2024, v: 4},
    {id: "c", year: 2015, v: 2},
    {id: "c", year: 2024, v: 2},
    {id: "d", year: 2020, v: 1},
    {id: "e", year: 2015, v: "n/a"},
  ];
  const dirs = slopeDirections(
    rows,
    d => d.id,
    d => d.year,
    d => d.v,
  );
  assert.deepStrictEqual(Object.fromEntries(dirs), {
    a: "up",
    b: "down",
    c: "flat",
    d: "flat",
  });
});

it("slopeColors — theme defaults under the setting's own colors", () => {
  assert.strictEqual(slopeColors(false, false), null);
  assert.strictEqual(slopeColors(undefined, true), null);
  assert.deepStrictEqual(slopeColors(true, false), slopeColorsLight);
  assert.deepStrictEqual(slopeColors(true, true), slopeColorsDark);
  assert.deepStrictEqual(slopeColors(true, false, "#123456"), {
    ...slopeColorsLight,
    flat: "#123456",
  });
  assert.deepStrictEqual(
    slopeColors({up: "blue", flat: "gray"}, true, "#999"),
    {
      ...slopeColorsDark,
      up: "blue",
      flat: "gray",
    },
  );
});

/** A viz stand-in holding `rows`, keyed by `id`, `year`, and `v`. */
const fakeViz = (rows, schema = {}) => ({
  _filteredData: rows,
  _id: d => d.id,
  _x: d => d.year,
  _y: d => d.v,
  ctx: {},
  schema,
});

it("prepareSlope — notes directions and warns past two periods", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  try {
    const two = fakeViz([
      {id: "a", year: 2015, v: 1},
      {id: "a", year: 2024, v: 2},
    ]);
    prepareSlope(two);
    assert.strictEqual(two.ctx.slope.directions.get("a"), "up");
    assert.strictEqual(warn.mock.calls.length, 0);
    const utc = y => new Date(Date.UTC(y, 0, 1));
    const three = fakeViz([
      {id: "a", year: utc(2024), v: 1},
      {id: "a", year: utc(2015), v: 2},
      {id: "a", year: utc(2020), v: 2},
    ]);
    prepareSlope(three);
    prepareSlope(three);
    assert.strictEqual(warn.mock.calls.length, 1, "once per chart");
    assert.match(warn.mock.calls[0][0], /SlopeChart compares two periods/);
    assert.match(
      warn.mock.calls[0][0],
      /has 3 \(2015-01-01, 2020-01-01, 2024-01-01\)/,
    );
  } finally {
    warn.mockRestore();
  }
});

it("slopeFill — a series' direction color when slopeColor is on", () => {
  const viz = fakeViz(
    [
      {id: "a", year: 2015, v: 1},
      {id: "a", year: 2024, v: 2},
      {id: "b", year: 2015, v: 3},
      {id: "b", year: 2024, v: 2},
      {id: "c", year: 2015, v: 3},
      {id: "c", year: 2024, v: 3},
    ],
    {slopeColor: false},
  );
  prepareSlope(viz);
  assert.strictEqual(slopeFill(viz, {id: "a"}, 0), undefined);
  viz.schema.slopeColor = true;
  assert.strictEqual(slopeFill(viz, {id: "a"}, 0), slopeColorsLight.up);
  // Label records and wrapped rows unwrap to their row.
  assert.strictEqual(
    slopeFill(viz, {__d3plus__: true, data: {id: "b", i: 2}}, 0),
    slopeColorsLight.down,
  );
  assert.strictEqual(slopeFill(viz, {id: "zzz"}, 0), undefined);
  viz._theme = {dark: true, textMuted: "#abcdef"};
  assert.strictEqual(slopeFill(viz, {id: "a"}, 0), slopeColorsDark.up);
  assert.strictEqual(slopeFill(viz, {id: "c"}, 0), "#abcdef");
  viz.schema.slopeColor = {down: "purple"};
  assert.strictEqual(slopeFill(viz, {id: "b"}, 0), "purple");
  assert.strictEqual(
    slopeFill(fakeViz([], {slopeColor: true}), {id: "a"}, 0),
    undefined,
  );
});
