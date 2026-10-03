import assert from "assert";
import it from "../jsdom.js";
import {Plot} from "../../es/index.js";
import {projectionPositions, trendStep} from "../../es/src/charts/Plot/trendProjection.js";
import {
  computePlotTrendFits,
  computeTrendFits,
  trendLineDefaults,
  trendProjectionPositions,
} from "../../es/src/charts/Plot/trendLines.js";
import {emitTrendLines} from "../../es/src/charts/Plot/trendScene.js";
import {nearestProjectedSample, trendTooltipRows} from "../../es/src/charts/Plot/trendTooltip.js";

/** #289: trend lines projected past the end of the data. */

/** A minimal viz for the fit stage: series per `id`, a numeric x axis. */
function fakeViz(config = {}, schema = {}) {
  return {
    _trendLine: true,
    _trendLineConfig: {...trendLineDefaults(), ...config},
    _drawDepth: 0,
    _ids: d => [d.id],
    _drawLabel: d => `Label ${d.id}`,
    _xConfig: {},
    _yConfig: {},
    schema: {
      discrete: "x",
      stacked: false,
      shapeConfig: {fill: d => (d.id === "A" ? "red" : "blue")},
      translate: s => `T(${s})`,
      ...schema,
    },
  };
}

/** Formatted Plot rows: `[id, x, y]` triples. */
const rows = triples => triples.map(([id, x, y], i) => ({data: {id}, i, id, x, y}));

const years = [2010, 2011, 2012, 2013];
const yearRows = rows([
  ["A", 2010, 2], ["A", 2011, 4.5], ["A", 2012, 5.5], ["A", 2013, 8],
  ["B", 2010, 10], ["B", 2011, 9], ["B", 2012, 8], ["B", 2013, 7],
]);

it("trendStep — numbers step by the median gap", () => {
  const step = trendStep([2010, 2011, 2012, 2014]);
  assert.strictEqual(step(2014, 1), 2015, "median of [1, 1, 2]");
  assert.strictEqual(step(2014, 3), 2017);
  assert.strictEqual(trendStep([0.1, 0.2, 0.3])(0.3, 1), 0.4, "no floating point noise");
  assert.strictEqual(trendStep([3, 1, 2, 2])(3, 1), 4, "unsorted, with repeats");
});

it("trendStep — dates step by their calendar interval", () => {
  const yearly = trendStep([new Date(2020, 0, 1), new Date(2021, 0, 1), new Date(2022, 0, 1)]);
  assert.strictEqual(+yearly(new Date(2022, 0, 1), 2), +new Date(2024, 0, 1), "years");
  const quarterly = trendStep([new Date(2023, 0, 1), new Date(2023, 3, 1), new Date(2023, 6, 1)]);
  assert.strictEqual(+quarterly(new Date(2023, 6, 1), 1), +new Date(2023, 9, 1), "three months");
  const monthly = trendStep([new Date(2023, 0, 1), new Date(2023, 1, 1), new Date(2023, 2, 1)]);
  assert.strictEqual(+monthly(new Date(2023, 2, 1), 1), +new Date(2023, 3, 1), "months keep to the 1st");
  const weekly = trendStep([new Date(2023, 0, 2), new Date(2023, 0, 9), new Date(2023, 0, 16)]);
  assert.strictEqual(+weekly(new Date(2023, 0, 16), 1), +new Date(2023, 0, 23), "seven days");
});

it("trendStep — unaligned dates step by the median milliseconds", () => {
  const t0 = +new Date(2023, 0, 1);
  const step = trendStep([t0 + 250, t0 + 1750, t0 + 3250].map(t => new Date(t)));
  assert.strictEqual(+step(new Date(t0 + 3250), 1), t0 + 4750);
});

it("trendStep — nothing to step for categories or one value", () => {
  assert.strictEqual(trendStep(["Low", "Mid", "High"]), null, "categories");
  assert.strictEqual(trendStep([2010, "Mid"]), null, "mixed");
  assert.strictEqual(trendStep([2010]), null, "one value");
  assert.strictEqual(trendStep([2010, 2010]), null, "one distinct value");
  assert.strictEqual(trendStep([]), null, "empty");
});

it("projectionPositions — a number of steps", () => {
  assert.deepStrictEqual(projectionPositions(years, 3), [2014, 2015, 2016]);
  assert.deepStrictEqual(projectionPositions(years, 2.7), [2014, 2015], "whole steps");
  assert.deepStrictEqual(projectionPositions([2013, 2010, 2012, 2011], 1), [2014], "past the largest value");
  assert.deepStrictEqual(projectionPositions(years, 0), [], "0 is off");
  assert.deepStrictEqual(projectionPositions(years, -2), [], "negative is off");
  assert.deepStrictEqual(projectionPositions(years, undefined), [], "unset is off");
  assert.deepStrictEqual(projectionPositions(["Low", "High"], 3), [], "categories are skipped");
});

it("projectionPositions — up to an end value", () => {
  assert.deepStrictEqual(projectionPositions(years, {to: 2016}), [2014, 2015, 2016]);
  assert.deepStrictEqual(projectionPositions(years, {to: 2015.5}), [2014, 2015], "stops before passing the end");
  assert.deepStrictEqual(projectionPositions(years, {to: 2013}), [], "not past the last value");
  assert.deepStrictEqual(projectionPositions(years, {}), [], "no end");
  assert.deepStrictEqual(projectionPositions(years, {to: "soon"}), [], "unusable end");
  const dates = [new Date(2020, 0, 1), new Date(2021, 0, 1)];
  const out = projectionPositions(dates, {to: 2023});
  assert.deepStrictEqual(out.map(d => d.getFullYear()), [2022, 2023], "a year parses as a date on a time axis");
  assert.ok(out.every(d => d instanceof Date));
  assert.strictEqual(projectionPositions(dates, {to: new Date(2022, 5, 1)}).length, 1, "a Date end");
});

it("trendProjectionPositions", () => {
  assert.deepStrictEqual(
    trendProjectionPositions([2010, 2013], [2014, 2015], [2010, 2011, 2012, 2013, 2014, 2015]),
    [2013, 2014, 2015],
    "point scale: from the fit's end through each projected category",
  );
  const continuous = trendProjectionPositions([0, 10], [12, 14], null);
  assert.strictEqual(continuous[0], 10, "starts where the fit ends");
  assert.strictEqual(continuous[continuous.length - 1], 14, "ends at the last step");
  assert.ok(continuous.includes(12), "includes every step");
  assert.ok(continuous.every((n, i) => !i || n > continuous[i - 1]), "ascending and unique");
  assert.deepStrictEqual(trendProjectionPositions([0, 10], [8], null), [], "steps not past the fit");
  assert.deepStrictEqual(trendProjectionPositions([0, 10], [], null), [], "no steps");
});

it("computeTrendFits — projected samples continue the fit", () => {
  const [a] = computeTrendFits(fakeViz(), yearRows, years, [2014, 2015]);
  const observed = a.samples.filter(s => !s.projected);
  const projected = a.samples.filter(s => s.projected);
  assert.deepStrictEqual(observed.map(s => s.x), years, "fitted stretch unchanged");
  assert.deepStrictEqual(projected.map(s => s.x), [2013, 2014, 2015], "projection starts where the data ends");
  assert.deepStrictEqual(projected.map(s => !!s.step), [false, true, true], "steps flagged for hover");
  projected.forEach(s => assert.ok(Math.abs(s.y - a.fit.predict(s.x)) < 1e-9, "same line"));
  assert.ok(a.samples.every(s => s.lci === undefined), "no band unless asked");
});

it("computeTrendFits — each series projects from its own last value", () => {
  const ragged = yearRows.filter(r => !(r.id === "B" && r.x === 2013));
  const [, b] = computeTrendFits(fakeViz(), ragged, years, [2014]);
  assert.deepStrictEqual(b.samples.filter(s => s.projected).map(s => s.x), [2012, 2013, 2014]);
  assert.deepStrictEqual(b.samples.filter(s => s.step).map(s => s.x), [2013, 2014], "every axis value past its data is a step");
});

it("computeTrendFits — the band becomes a prediction interval over the projection", () => {
  const [a] = computeTrendFits(fakeViz({confidence: true}), yearRows, years, [2014, 2015]);
  const width = s => s.hci - s.lci;
  const atEnd = a.samples.filter(s => s.x === 2013);
  assert.strictEqual(atEnd.length, 2, "the fit's end is sampled on both sides");
  assert.ok(width(atEnd[1]) > width(atEnd[0]), "the fan is wider than the confidence band");
  const fan = a.samples.filter(s => s.projected);
  assert.ok(fan.every((s, i) => !i || width(s) > width(fan[i - 1])), "and keeps widening");
  assert.ok(a.samples.every(s => s.lci !== undefined), "every sample is banded");
  const [quad] = computeTrendFits({...fakeViz({confidence: true}), _trendLine: "polynomial"}, yearRows, years, [2014]);
  assert.ok(quad.samples.every(s => s.lci === undefined), "only linear fits are banded");
});

it("computeTrendFits — time axis samples hit every projected date", () => {
  const dates = [2010, 2011, 2012, 2013].map(y => new Date(y, 0, 1));
  const data = rows(dates.map((d, i) => ["A", d, i * 2 + (i % 2)]));
  const steps = projectionPositions(dates, 2);
  const [a] = computeTrendFits(fakeViz({}, {}), data, dates, steps);
  const stepped = a.samples.filter(s => s.step);
  assert.deepStrictEqual(stepped.map(s => s.x.getFullYear()), [2014, 2015]);
  assert.ok(stepped.every(s => s.x instanceof Date));
  assert.ok(a.samples.filter(s => s.projected).length > 2, "evenly sampled in between");
});

it("computePlotTrendFits — a projection widens the independent axis", () => {
  const viz = fakeViz({projection: 2});
  const out = computePlotTrendFits({viz, plotFormattedData: yearRows, xData: years, yData: [2, 10]});
  assert.deepStrictEqual(out.xData, [...years, 2014, 2015], "projected years join the x values");
  assert.ok(Math.max(...out.yData) > 10 || Math.min(...out.yData) < 2, "y covers the projected values");

  const off = computePlotTrendFits({viz: fakeViz(), plotFormattedData: yearRows, xData: years, yData: [2, 10]});
  assert.strictEqual(off.xData, undefined, "x untouched without a projection");

  const disabled = fakeViz({projection: 2});
  disabled._trendLine = false;
  assert.deepStrictEqual(computePlotTrendFits({viz: disabled, plotFormattedData: yearRows, xData: years, yData: []}), {});
});

it("computePlotTrendFits — horizontal charts project along y", () => {
  const viz = fakeViz({projection: 1}, {discrete: "y"});
  const flipped = yearRows.map(r => ({...r, x: r.y, y: r.x}));
  const out = computePlotTrendFits({viz, plotFormattedData: flipped, xData: [2, 10], yData: years});
  assert.deepStrictEqual(out.yData, [...years, 2014]);
  assert.ok(out.xData.length > 2, "dependent values on x");
});

it("computePlotTrendFits — stacked charts project the totals", () => {
  const viz = fakeViz({projection: 2}, {stacked: true});
  const out = computePlotTrendFits({viz, plotFormattedData: yearRows, xData: years, yData: []});
  assert.strictEqual(viz._trendFits.length, 1);
  assert.deepStrictEqual(out.xData, [...years, 2014, 2015]);
});

it("computePlotTrendFits — category axes ignore a projection", () => {
  const viz = fakeViz({projection: 3});
  const cats = rows([["A", "Low", 1], ["A", "Mid", 2], ["A", "High", 4]]);
  const out = computePlotTrendFits({viz, plotFormattedData: cats, xData: ["Low", "Mid", "High"], yData: [1, 4]});
  assert.strictEqual(out.xData, undefined);
  assert.ok(viz._trendFits[0].samples.every(s => !s.projected));
});

const scale = v => v * 10;
const walk = node => [node, ...(node.children || []).flatMap(walk)];
const sceneFit = (samples, extra = {}) => ({
  id: "A", label: "A", color: "red", axis: "x", row: {id: "A"},
  fit: {type: "linear", coefficients: [0, 1], r2: 1, n: 3, extent: [0, 2]},
  samples, ...extra,
});
const sceneViz = (fits, config = {}) => ({
  _trendFits: fits,
  _trendLineConfig: {...trendLineDefaults(), ...config},
  schema: {duration: 0},
});
const projectedSamples = [
  {x: 0, y: 0, lci: -1, hci: 1}, {x: 1, y: 1, lci: 0, hci: 2}, {x: 2, y: 2, lci: 1, hci: 3},
  {x: 2, y: 2, lci: 0, hci: 4, projected: true}, {x: 3, y: 3, lci: 0, hci: 6, projected: true, step: true},
];

it("emitTrendLines — the projection draws as its own styled line", () => {
  const [group] = emitTrendLines(sceneViz([sceneFit(projectedSamples)], {projectionConfig: {strokeDasharray: "1 3", strokeWidth: 5}}), scale, scale);
  const paths = walk(group).filter(n => n.type === "path" && n.paint && n.paint.stroke === "red" && !/::hit$/.test(n.key || ""));
  assert.strictEqual(paths.length, 2, "fitted line + projection");
  const [fitted, projection] = paths;
  assert.deepStrictEqual(fitted.paint.strokeDasharray, [6, 4], "fitted stretch keeps the line style");
  assert.deepStrictEqual(projection.paint.strokeDasharray, [1, 3], "projectionConfig styles the projection");
  assert.strictEqual(projection.paint.strokeWidth, 5);
  assert.ok(walk(group).some(n => /trend-A-projection/.test(n.key || "")), "stably keyed");
  assert.ok(walk(group).filter(n => n.trendFit).length >= 2, "both segments carry the fit for hover");
  const band = group.children[0];
  assert.strictEqual(band.paint.fill, "red", "one band spans the fit and its fan");
});

it("emitTrendLines — default projection style, and no projection without projected samples", () => {
  const [group] = emitTrendLines(sceneViz([sceneFit(projectedSamples)]), scale, scale);
  const dashes = walk(group)
    .filter(n => n.type === "path" && n.paint && n.paint.stroke === "red" && !/::hit$/.test(n.key || ""))
    .map(n => n.paint.strokeDasharray);
  assert.deepStrictEqual(dashes[dashes.length - 1], [2, 4], "dotted by default");
  const [plain] = emitTrendLines(sceneViz([sceneFit(projectedSamples.slice(0, 3))]), scale, scale);
  assert.ok(!walk(plain).some(n => /projection/.test(n.key || "")), "nothing extra");
});

const tooltipViz = {
  _xTime: false,
  _xConfig: {title: "Year"},
  _yConfig: {},
  _xFunc: v => v * 10,
  schema: {locale: "en-US", discrete: "x", translate: s => `T(${s})`},
};

it("trendTooltipRows — a projected sample leads the tooltip", () => {
  const trend = sceneFit(projectedSamples);
  const sample = {x: 2030, y: 1234.5, lci: 1000, hci: 1500, projected: true, step: true};
  const out = trendTooltipRows({...tooltipViz, _yKey: "value"}, trend, sample);
  assert.deepStrictEqual(out[0], ["Year", "2030 (T(Projected))"]);
  assert.deepStrictEqual(out[1], ["value", "1.23k (1k – 1.5k)"]);
  assert.strictEqual(out[2][0], "T(Trend Line)", "then the fit's own rows");
  const unbanded = trendTooltipRows(tooltipViz, trend, {x: 2030, y: 12, projected: true});
  assert.strictEqual(unbanded[1][1], "12", "no bounds without a band");
  assert.strictEqual(trendTooltipRows(tooltipViz, trend, {x: 1, y: 1})[0][0], "T(Trend Line)", "observed samples add nothing");
});

it("nearestProjectedSample", () => {
  const trend = sceneFit(projectedSamples);
  assert.strictEqual(nearestProjectedSample(tooltipViz, trend, [31, 0]).x, 3, "snaps to the projected step");
  assert.strictEqual(nearestProjectedSample(tooltipViz, trend, [26, 0]).x, 3, "between samples, the nearest step");
  assert.strictEqual(nearestProjectedSample(tooltipViz, trend, [9, 0]), undefined, "over the fitted stretch");
  assert.strictEqual(nearestProjectedSample(tooltipViz, trend, [20, 0]), undefined, "the fit's own end is not projected");
  assert.strictEqual(nearestProjectedSample({...tooltipViz, _xFunc: undefined}, trend, [31, 0]), undefined);
});

it("Plot trendLineConfig — projection defaults", () => {
  const plot = new Plot();
  assert.strictEqual(plot.trendLineConfig().projection, 0, "off by default");
  assert.deepStrictEqual(plot.trendLineConfig().projectionConfig, {strokeDasharray: "2 4"});
  plot.trendLineConfig({projection: {to: 2030}});
  assert.deepStrictEqual(plot.trendLineConfig().projection, {to: 2030});
});
