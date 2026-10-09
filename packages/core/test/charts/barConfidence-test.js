import assert from "assert";
import it from "../jsdom.js";
import {BarChart, RESET} from "../../es/index.js";
import {runStages} from "../../es/internal.js";
import {
  computePlotAxisValues,
  computePlotInitialDomains,
  formatPlotData,
} from "../../es/src/charts/Plot/pipeline.js";
import {
  capLength,
  clampErrorBar,
  confidenceBounds,
  inAxisBreak,
  CONFIDENCE_KEY_SUFFIX,
  errorBarPath,
  stackedBound,
  stackedConfidenceValues,
} from "../../es/src/charts/Plot/barConfidence.js";
import {nodeColor, ownerNode} from "../../es/src/charts/features/tooltipSwatch.js";

// #781: `confidence` draws error bars on a BarChart's bars.

it("stackedBound — keeps a bound's distance from the value, measured from the stacked end", () => {
  assert.strictEqual(stackedBound(12, 10, [20, 30]), 32, "upper bound above a positive bar's top");
  assert.strictEqual(stackedBound(7, 10, [20, 30]), 27, "lower bound below it");
  assert.strictEqual(stackedBound(-7, -5, [-8, -3]), -10, "a negative bar's end is its lower edge");
  assert.strictEqual(stackedBound(-3, -5, [-8, -3]), -6);
  // An expanded (percentage) stack scales the distance with the bar.
  assert.strictEqual(stackedBound(12, 10, [0.25, 0.5]), 0.55);
  assert.strictEqual(stackedBound(2, 0, [5, 5]), 7, "a zero-length bar keeps the raw distance");
});

it("confidenceBounds — finite bounds only, raw or shifted onto the stack", () => {
  const d = {y: 10, lci: 8, hci: 13};
  assert.deepStrictEqual(confidenceBounds(d, "y"), {lower: 8, upper: 13});
  assert.deepStrictEqual(confidenceBounds(d, "y", [20, 30]), {lower: 28, upper: 33});
  assert.deepStrictEqual(confidenceBounds({y: 10, lci: undefined, hci: 13}, "y"), {upper: 13}, "one-sided");
  assert.deepStrictEqual(confidenceBounds({y: 10, lci: NaN, hci: null}, "y"), {}, "none");
  assert.deepStrictEqual(confidenceBounds({x: 4, lci: 3, hci: 5}, "x"), {lower: 3, upper: 5}, "horizontal bars read x");
  assert.deepStrictEqual(confidenceBounds({y: NaN, lci: 3, hci: 5}, "y", [0, 1]), {}, "no stacked end without a value");
});

it("stackedConfidenceValues — every stacked bar's shifted bounds", () => {
  const rows = [
    {id: "a", discrete: "Q1", shape: "Bar", y: 10, lci: 8, hci: 13},
    {id: "b", discrete: "Q1", shape: "Bar", y: 5, lci: 4, hci: 9},
    {id: "c", discrete: "Q1", shape: "Area", y: 5, lci: 0, hci: 100},
  ];
  const stackData = [[[0, 10]], [[10, 15]], [[15, 20]]];
  const values = stackedConfidenceValues(rows, "y", stackData, ["a", "b", "c"], ["Q1"]);
  assert.deepStrictEqual(values, [8, 13, 14, 19], "Areas are skipped");
  assert.deepStrictEqual(stackedConfidenceValues(rows, "y", stackData, ["z"], ["Q1"]), [], "unstacked rows are skipped");
});

it("capLength — pixels, or a percentage of the bar's thickness", () => {
  assert.strictEqual(capLength(12, 40), 12);
  assert.strictEqual(capLength("25%", 40), 10);
  assert.strictEqual(capLength(" 100% ", 40), 40);
  assert.strictEqual(capLength(-4, 40), 0, "never negative");
  assert.strictEqual(capLength(undefined, 40), 20, "half the bar otherwise");
  assert.strictEqual(capLength("wide", 40), 20);
});

it("errorBarPath — a stroke between the bounds, capped at each", () => {
  assert.strictEqual(
    errorBarPath("x", 50, 10, 100, 120, 80),
    "M50,120L50,80M45,120L55,120M45,80L55,80",
    "vertical",
  );
  assert.strictEqual(
    errorBarPath("y", 50, 10, 100, 80, 120),
    "M80,50L120,50M80,45L80,55M120,45L120,55",
    "horizontal",
  );
  assert.strictEqual(
    errorBarPath("x", 50, 10, 100, undefined, 80),
    "M50,100L50,80M45,80L55,80",
    "a missing bound runs to the bar's end, uncapped",
  );
  assert.strictEqual(errorBarPath("x", 50, 0, 100, 120, 80), "M50,120L50,80", "no caps at zero width");
});

it("ownerNode — a hover target or an error bar resolves to the mark it belongs to", () => {
  const bar = {type: "rect", key: "a_Q1", shapeType: "Bar", paint: {fill: "blue", stroke: "navy"}};
  const errorBar = {type: "path", key: `a_Q1${CONFIDENCE_KEY_SUFFIX}`, shapeType: "Bar", paint: {fill: "none", stroke: "black"}};
  const hit = {type: "path", key: `a_Q1${CONFIDENCE_KEY_SUFFIX}::hit`, shapeType: "Bar", paint: {fill: "none", stroke: "transparent"}};
  const viz = {_chartScene: [{type: "group", key: "plot", children: [bar, hit, errorBar]}]};
  assert.strictEqual(ownerNode(viz, errorBar), bar);
  assert.strictEqual(ownerNode(viz, hit), bar);
  assert.strictEqual(ownerNode(viz, bar), bar, "a mark is its own owner");
  assert.strictEqual(ownerNode(viz, undefined), undefined);
  const orphan = {type: "path", key: "gone::confidence", paint: {stroke: "red"}};
  assert.strictEqual(ownerNode(viz, orphan), orphan, "falls back to the node itself");
  assert.strictEqual(nodeColor(viz, hit), "blue", "an error bar reads its bar's color");
});

/** Runs a BarChart's data → domain stages. */
function domains(viz) {
  viz._preDraw();
  viz._margin = {top: 0, right: 0, bottom: 0, left: 0};
  return runStages({viz}, [formatPlotData, computePlotAxisValues, computePlotInitialDomains])
    .plotInitialDomains;
}

const rows = [
  {id: "a", q: "Q1", v: 10, lo: 6, hi: 19},
  {id: "b", q: "Q1", v: 5, lo: 1, hi: 7},
  {id: "a", q: "Q2", v: 20, lo: 18, hi: 22},
  {id: "b", q: "Q2", v: 15, lo: 13, hi: 16},
];

it("BarChart — the value axis widens to fit the error bars", () => {
  const base = () => new BarChart().data(rows).groupBy("id").x("q").y("v");
  assert.deepStrictEqual(domains(base()).y, [5, 20], "without confidence");
  assert.deepStrictEqual(domains(base().confidence(["lo", "hi"])).y, [1, 22]);
});

it("BarChart — horizontal bars widen the x axis", () => {
  const viz = new BarChart().data(rows).groupBy("id").discrete("y").x("v").y("q")
    .confidence(["lo", "hi"]);
  assert.deepStrictEqual(domains(viz).x, [1, 22]);
});

it("BarChart — stacked bars widen the axis around their stacked ends", () => {
  // Every bar's upper bound sits 3 over its value, so the tallest stack's
  // top bar reaches 3 over the stack's total (35), whichever series it is.
  const stack = rows.map(d => ({...d, lo: d.v - 2, hi: d.v + 3}));
  const base = () => new BarChart().data(stack).groupBy("id").x("q").y("v").stacked(true);
  assert.deepStrictEqual(domains(base()).y, [0, 35], "without confidence");
  assert.deepStrictEqual(domains(base().confidence(["lo", "hi"])).y, [0, 38]);
});

it("BarChart — a stacked negative bar's bounds sit below its end", () => {
  const diverging = [
    {id: "a", q: "Q1", v: 10, lo: 9, hi: 11},
    {id: "b", q: "Q1", v: -5, lo: -9, hi: -4},
  ];
  const viz = new BarChart().data(diverging).groupBy("id").x("q").y("v").stacked(true)
    .confidence(["lo", "hi"]);
  assert.deepStrictEqual(domains(viz).y, [-9, 11]);
});

it("confidence(false) — turns the interval off", () => {
  const viz = new BarChart().confidence(["lo", "hi"]);
  assert.ok(Array.isArray(viz.confidence()), "on");
  assert.strictEqual(viz.confidence(false), viz, "chains");
  assert.strictEqual(viz.confidence(), false, "off");
  assert.strictEqual(new BarChart().confidence(), false, "off by default");
  assert.strictEqual(new BarChart().confidence([false, false]).confidence(), false, "no bounds is off");
  assert.strictEqual(new BarChart().config({confidence: ["lo", "hi"]}).config({confidence: false}).confidence(), false, "via config");
  const one = new BarChart().confidence([false, "hi"]).confidence();
  assert.strictEqual(one[0], false, "one-sided keeps the missing side off");
  assert.strictEqual(one[1]({hi: 3}), 3, "and reads the other");
});

it("confidence — RESET restores the default (off)", () => {
  const viz = new BarChart();
  viz.config({width: 400});
  viz.config({confidence: ["lo", "hi"]});
  assert.ok(Array.isArray(viz.confidence()));
  viz.config({confidence: RESET});
  assert.strictEqual(viz.confidence(), false);
});

it("confidence(false) — the axis no longer widens for the bounds", () => {
  const off = () => new BarChart().data(rows).groupBy("id").x("q").y("v").confidence(["lo", "hi"]).confidence(false);
  assert.deepStrictEqual(domains(off()).y, [5, 20]);
  const stacked = new BarChart().data(rows.map(d => ({...d, hi: d.v + 30}))).groupBy("id").x("q").y("v")
    .stacked(true).confidence(["lo", "hi"]).confidence(false);
  assert.deepStrictEqual(domains(stacked).y, [0, 35]);
});

it("clampErrorBar — keeps an error bar on the axis, dropping cut-off caps", () => {
  assert.deepStrictEqual(clampErrorBar(80, 20, 50, [0, 100]),
    {lower: 80, upper: 20, end: 50, caps: {lower: true, upper: true}}, "inside: untouched");
  assert.deepStrictEqual(clampErrorBar(120, -10, 50, [0, 100]),
    {lower: 100, upper: 0, end: 50, caps: {lower: false, upper: false}}, "both cut off");
  assert.deepStrictEqual(clampErrorBar(undefined, 20, 150, [0, 100]),
    {lower: undefined, upper: 20, end: 100, caps: {lower: false, upper: true}}, "one-sided, end clamped");
  assert.deepStrictEqual(clampErrorBar(120, 20, 50),
    {lower: 120, upper: 20, end: 50, caps: {lower: true, upper: true}}, "no extent, no clamp");
});

it("errorBarPath — leaves out the caps it's told to", () => {
  assert.strictEqual(errorBarPath("x", 50, 10, 100, 120, 80, {lower: false}), "M50,120L50,80M45,80L55,80");
  assert.strictEqual(errorBarPath("x", 50, 10, 100, 120, 80, {lower: false, upper: false}), "M50,120L50,80");
});

it("inAxisBreak — a value strictly inside a break's range", () => {
  const breaks = [{start: 80, end: 900}, {start: 0, end: -50}];
  assert.strictEqual(inAxisBreak(breaks, 850), true);
  assert.strictEqual(inAxisBreak(breaks, -10), true, "either edge order");
  assert.strictEqual(inAxisBreak(breaks, 900), false, "an edge is on the axis");
  assert.strictEqual(inAxisBreak(breaks, 950), false);
  assert.strictEqual(inAxisBreak(undefined, 850), false);
  assert.strictEqual(inAxisBreak(breaks, undefined), false);
});

it("confidenceConfig — deep-merges, keeping nested siblings", () => {
  const viz = new BarChart();
  viz.confidenceConfig({Bar: {stroke: "red", strokeWidth: 3}, capWidth: 8});
  viz.confidenceConfig({Bar: {stroke: "green"}});
  assert.deepStrictEqual(viz.confidenceConfig().Bar, {stroke: "green", strokeWidth: 3});
  assert.strictEqual(viz.confidenceConfig().capWidth, 8);
  assert.strictEqual(typeof viz.confidenceConfig().fill, "function", "the band default survives");
});

it("confidenceConfig — RESET at any depth restores the default", () => {
  const viz = new BarChart();
  const defaults = viz.confidenceConfig();
  viz.config({confidenceConfig: {Bar: {stroke: "red", strokeWidth: 3}, fillOpacity: 0.2}});
  viz.config({confidenceConfig: {Bar: {stroke: RESET}, fillOpacity: RESET}});
  assert.deepStrictEqual(viz.confidenceConfig().Bar, {strokeWidth: 3}, "a nested RESET removes a key with no default");
  assert.strictEqual(viz.confidenceConfig().fillOpacity, defaults.fillOpacity, "a top-level RESET restores its default");
  viz.config({confidenceConfig: RESET});
  assert.deepStrictEqual(Object.keys(viz.confidenceConfig()).sort(), ["fill", "fillOpacity"]);
  assert.notStrictEqual(viz.confidenceConfig(), defaults, "a fresh object");
});
