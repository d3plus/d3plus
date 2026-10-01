import assert from "assert";
import it from "../jsdom.js";
import {Plot} from "../../es/index.js";
import {
  computePlotTrendFits,
  computeTrendFits,
  resolveTrendType,
  trendAxis,
  trendDomainValues,
  trendLineDefaults,
  trendNumberScale,
  trendSamplePositions,
} from "../../es/src/charts/Plot/trendLines.js";

/** A minimal viz for the fit stage: two series, one per `id`. */
function fakeViz(overrides = {}) {
  const {schema, ...rest} = overrides;
  return {
    _trendLine: true,
    _trendLineConfig: trendLineDefaults(),
    _drawDepth: 0,
    _ids: d => [d.id],
    _drawLabel: d => `Label ${d.id}`,
    _xConfig: {},
    _yConfig: {},
    schema: {
      discrete: undefined,
      stacked: false,
      shapeConfig: {fill: d => (d.id === "A" ? "red" : "blue")},
      translate: s => `T(${s})`,
      ...schema,
    },
    ...rest,
  };
}

/** Formatted Plot rows: `[id, x, y]` triples. */
const rows = triples => triples.map(([id, x, y], i) => ({data: {id}, i, id, x, y}));

const lineRows = rows([
  ["A", 1, 2], ["A", 2, 4], ["A", 3, 6],
  ["B", 1, 10], ["B", 2, 8], ["B", 3, 6],
]);

it("resolveTrendType", () => {
  assert.strictEqual(resolveTrendType(true), "linear", "true is linear");
  assert.strictEqual(resolveTrendType("power"), "power");
  assert.strictEqual(resolveTrendType(false), null, "false is off");
  assert.strictEqual(resolveTrendType(undefined), null, "unset is off");
  assert.strictEqual(resolveTrendType("cubic"), null, "unknown types are off");
});

it("trendAxis", () => {
  assert.strictEqual(trendAxis("y"), "y", "horizontal charts fit along y");
  assert.strictEqual(trendAxis("x"), "x");
  assert.strictEqual(trendAxis(undefined), "x", "scatter plots fit along x");
});

it("trendLineDefaults returns a fresh object", () => {
  const a = trendLineDefaults();
  a.group = "all";
  assert.strictEqual(trendLineDefaults().group, "series");
});

it("trendNumberScale", () => {
  const nums = trendNumberScale([1, 5, 9]);
  assert.strictEqual(nums.toNumber(5), 5, "numbers pass through");
  assert.strictEqual(nums.fromNumber(7.5), 7.5);

  const d1 = new Date(Date.UTC(2020, 0, 1));
  const dates = trendNumberScale([d1]);
  assert.strictEqual(dates.toNumber(d1), +d1, "dates by timestamp");
  assert.ok(dates.fromNumber(+d1) instanceof Date, "back to a Date");
  assert.strictEqual(+dates.fromNumber(+d1), +d1);

  const cats = trendNumberScale(["Low", "Mid", "High"]);
  assert.strictEqual(cats.toNumber("Mid"), 1, "categories by position");
  assert.ok(Number.isNaN(cats.toNumber("Other")), "unknown category");
  assert.strictEqual(cats.fromNumber(2), "High", "back to the category");
});

it("trendSamplePositions", () => {
  const even = trendSamplePositions([0, 10], null, 5);
  assert.deepStrictEqual(even, [0, 2.5, 5, 7.5, 10], "evenly spaced");
  assert.strictEqual(trendSamplePositions([0, 10], null).length, 50, "50 by default");
  assert.deepStrictEqual(trendSamplePositions([1, 3], [0, 1, 2, 3, 4]), [1, 2, 3], "categories within the extent");
  assert.deepStrictEqual(trendSamplePositions([4, 4], null), [4], "a single position");
});

it("trendDomainValues", () => {
  const fits = [
    {axis: "x", samples: [{x: 1, y: 5}, {x: 2, y: 7, lci: 3, hci: 9}]},
    {axis: "y", samples: [{x: 20, y: "a"}, {x: NaN, y: "b"}]},
  ];
  assert.deepStrictEqual(trendDomainValues(fits), [5, 7, 3, 9, 20], "dependent values and band bounds");
});

it("computeTrendFits — one fit per series", () => {
  const fits = computeTrendFits(fakeViz(), lineRows, [1, 2, 3]);
  assert.deepStrictEqual(fits.map(f => f.id), ["A", "B"]);
  assert.deepStrictEqual(fits.map(f => f.color), ["red", "blue"], "series colors");
  assert.deepStrictEqual(fits.map(f => f.label), ["Label A", "Label B"]);
  assert.strictEqual(fits[0].fit.coefficients[1], 2, "A's slope");
  assert.strictEqual(fits[1].fit.coefficients[1], -2, "B's slope");
  assert.strictEqual(fits[0].samples.length, 50);
  assert.deepStrictEqual(fits[0].samples[0], {x: 1, y: 2});
  assert.strictEqual(fits[0].row, lineRows[0].data, "keeps a source row");
});

it("computeTrendFits — off returns nothing", () => {
  assert.deepStrictEqual(computeTrendFits(fakeViz({_trendLine: false}), lineRows, [1, 2, 3]), []);
  assert.deepStrictEqual(computeTrendFits(fakeViz(), [], []), []);
});

it("computeTrendFits — group 'all'", () => {
  const viz = fakeViz();
  viz._trendLineConfig.group = "all";
  const fits = computeTrendFits(viz, lineRows, [1, 2, 3]);
  assert.strictEqual(fits.length, 1);
  assert.strictEqual(fits[0].id, "all");
  assert.strictEqual(fits[0].color, "#444", "dark gray");
  assert.strictEqual(fits[0].label, "T(Trend Line)", "translated label");
  assert.strictEqual(fits[0].fit.n, 6);
  assert.strictEqual(fits[0].row, undefined);
});

it("computeTrendFits — a custom stroke colors every line", () => {
  const viz = fakeViz();
  viz._trendLineConfig.stroke = "green";
  assert.deepStrictEqual(computeTrendFits(viz, lineRows, [1, 2, 3]).map(f => f.color), ["green", "green"]);
});

it("computeTrendFits — single-point ids fit by their parent level", () => {
  const points = rows([["A", 1, 1], ["B", 2, 2], ["C", 3, 3]]).map((r, i) => ({...r, data: {...r.data, group: i < 2 ? "G1" : "G2"}}));
  const top = computeTrendFits(fakeViz(), points, [1, 2, 3]);
  assert.deepStrictEqual(top.map(f => f.id), ["all"], "top level: all points together");
  const nested = computeTrendFits(
    fakeViz({_drawDepth: 1, _ids: d => [d.group, d.id]}),
    rows([["A", 1, 1], ["B", 2, 2], ["C", 3, 3], ["D", 4, 5]])
      .map((r, i) => ({...r, data: {...r.data, group: i < 2 ? "G1" : "G2"}})),
    [1, 2, 3, 4],
  );
  assert.deepStrictEqual(nested.map(f => f.id), ["G1", "G2"], "series from the parent groupBy");
});

it("computeTrendFits — skips series too small to fit", () => {
  const data = rows([["A", 1, 1], ["A", 2, 2], ["B", 1, 5]]);
  assert.deepStrictEqual(computeTrendFits(fakeViz(), data, [1, 2]).map(f => f.id), ["A"]);
});

it("computeTrendFits — discrete categories sample once per category", () => {
  const data = rows([["A", "Low", 1], ["A", "Mid", 2], ["A", "High", 3]]);
  const fits = computeTrendFits(fakeViz({schema: {discrete: "x"}}), data, ["Low", "Mid", "High"]);
  assert.deepStrictEqual(fits[0].samples.map(s => s.x), ["Low", "Mid", "High"]);
  assert.ok(Math.abs(fits[0].fit.r2 - 1) < 1e-12);
});

it("computeTrendFits — horizontal charts swap axes", () => {
  const data = rows([["A", 2, 1], ["A", 4, 2], ["A", 6, 3]]);
  const fits = computeTrendFits(fakeViz({schema: {discrete: "y"}}), data, [1, 2, 3]);
  assert.strictEqual(fits[0].axis, "y");
  assert.deepStrictEqual(fits[0].samples.map(s => [s.y, s.x]), [[1, 2], [2, 4], [3, 6]], "x is fit as a function of y");
});

it("computeTrendFits — stacked charts fit the totals", () => {
  const fits = computeTrendFits(fakeViz({schema: {stacked: true, discrete: "x"}}), lineRows, [1, 2, 3]);
  assert.strictEqual(fits.length, 1);
  assert.deepStrictEqual(fits[0].samples.map(s => s.y), [12, 12, 12], "A + B at each x");
});

it("computeTrendFits — confidence band is linear-only", () => {
  const noisy = rows([["A", 1, 1], ["A", 2, 3], ["A", 3, 2], ["A", 4, 5]]);
  const viz = fakeViz();
  viz._trendLineConfig.confidence = true;
  const [linear] = computeTrendFits(viz, noisy, [1, 2, 3, 4]);
  assert.ok(linear.samples.every(s => s.lci < s.y && s.y < s.hci), "bounds around the line");
  viz._trendLine = "exponential";
  const [exp] = computeTrendFits(viz, noisy, [1, 2, 3, 4]);
  assert.strictEqual(exp.samples[0].lci, undefined, "no band for other types");
});

it("computeTrendFits — log dependent axes drop non-positive samples", () => {
  const data = rows([["A", 1, 3], ["A", 2, 1], ["A", 3, -1]]);
  const fits = computeTrendFits(fakeViz({_yConfig: {scale: "log"}}), data, [1, 2, 3]);
  assert.ok(fits[0].samples.every(s => s.y > 0));
  assert.ok(fits[0].samples.length < 50);
});

it("computePlotTrendFits — stores fits and extends the dependent axis", () => {
  const viz = fakeViz();
  viz._trendLineConfig.confidence = true;
  const noisy = rows([["A", 1, 1], ["A", 2, 3], ["A", 3, 2], ["A", 4, 5]]);
  const out = computePlotTrendFits({viz, plotFormattedData: noisy, xData: [1, 2, 3, 4], yData: [1, 2, 3, 5]});
  assert.strictEqual(viz._trendFits.length, 1);
  assert.ok(out.yData.length > 4, "y values extended");
  assert.ok(Math.min(...out.yData) < 1, "covers the band below the data");
  assert.strictEqual(out.xData, undefined, "independent axis untouched");
  viz._trendLine = false;
  assert.deepStrictEqual(computePlotTrendFits({viz, plotFormattedData: noisy, xData: [], yData: []}), {});
  assert.deepStrictEqual(viz._trendFits, [], "cleared when off");
});

it("Plot trendLine / trendLineConfig accessors", () => {
  const plot = new Plot();
  assert.strictEqual(plot.trendLine(), false, "off by default");
  assert.strictEqual(plot.trendLine("power"), plot, "chainable");
  assert.strictEqual(plot.trendLine(), "power");
  assert.strictEqual(plot.trendLineConfig().group, "series");
  plot.trendLineConfig({group: "all", strokeWidth: 4});
  assert.strictEqual(plot.trendLineConfig().group, "all", "merged");
  assert.strictEqual(plot.trendLineConfig().strokeDasharray, "6 4", "keeps other defaults");
  assert.strictEqual(new Plot().trendLineConfig().group, "series", "defaults are per instance");
});
