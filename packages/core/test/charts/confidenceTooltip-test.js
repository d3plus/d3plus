import assert from "assert";
import it from "../jsdom.js";
import {BarChart, LinePlot} from "../../es/index.js";
import {
  confidenceRows,
  confidenceSuffix,
  confidenceTooltipEnabled,
  rangeSuffix,
  rowConfidence,
} from "../../es/src/charts/Plot/confidenceTooltip.js";

// #781: tooltips list a Plot's `confidence` bounds.

const fmt = v => `<${v}>`;

it("rowConfidence — the row's own finite bounds, read through the accessors", () => {
  const viz = new BarChart().confidence(["lo", "hi"]);
  assert.deepStrictEqual(rowConfidence(viz, {lo: 1, hi: 4}, 0), {lower: 1, upper: 4});
  assert.deepStrictEqual(rowConfidence(viz, {lo: 0, hi: NaN}, 0), {lower: 0}, "zero counts, NaN doesn't");
  assert.deepStrictEqual(rowConfidence(viz, {lo: "x", hi: null}, 0), {}, "non-numbers are skipped");
  assert.deepStrictEqual(rowConfidence(viz, undefined, 0), {});
  const fn = new LinePlot().confidence([d => d.v - 1, false]);
  assert.deepStrictEqual(rowConfidence(fn, {v: 5}, 0), {lower: 4}, "accessor functions, one-sided");
  assert.deepStrictEqual(rowConfidence(new BarChart(), {lo: 1, hi: 4}, 0), {}, "nothing while off");
});

it("confidenceTooltipEnabled — on with confidence, off via confidenceConfig.tooltip", () => {
  assert.strictEqual(confidenceTooltipEnabled(new BarChart()), false, "no confidence");
  const viz = new BarChart().confidence(["lo", "hi"]);
  assert.strictEqual(confidenceTooltipEnabled(viz), true);
  viz.confidenceConfig({tooltip: false});
  assert.strictEqual(confidenceTooltipEnabled(viz), false);
});

it("confidenceRows — a labeled, formatted row per bound", () => {
  const viz = new BarChart().confidence(["lo", "hi"]);
  assert.deepStrictEqual(confidenceRows(viz, {lo: 1, hi: 4}, 0, fmt), [["Lower Bound", "<1>"], ["Upper Bound", "<4>"]]);
  assert.deepStrictEqual(confidenceRows(viz, {hi: 4}, 0, fmt), [["Upper Bound", "<4>"]], "one-sided");
  assert.deepStrictEqual(confidenceRows(viz, {}, 0, fmt), [], "no bounds, no rows");
  viz.locale("es-ES");
  assert.deepStrictEqual(confidenceRows(viz, {lo: 1, hi: 4}, 0, fmt).map(r => r[0]), ["Límite Inferior", "Límite Superior"], "translated");
  viz.confidenceConfig({tooltip: false});
  assert.deepStrictEqual(confidenceRows(viz, {lo: 1, hi: 4}, 0, fmt), [], "opted out");
});

it("rangeSuffix — both, either, or neither bound", () => {
  assert.strictEqual(rangeSuffix(1, 4, fmt), " (<1> – <4>)");
  assert.strictEqual(rangeSuffix(1, undefined, fmt), " (≥ <1>)");
  assert.strictEqual(rangeSuffix(undefined, 4, fmt), " (≤ <4>)");
  assert.strictEqual(rangeSuffix(undefined, NaN, fmt), "");
});

it("confidenceSuffix — a row's range, unless off", () => {
  const viz = new LinePlot().confidence(["lo", "hi"]);
  assert.strictEqual(confidenceSuffix(viz, {lo: 1, hi: 4}, 0, fmt), " (<1> – <4>)");
  assert.strictEqual(confidenceSuffix(viz, {}, 0, fmt), "");
  viz.confidenceConfig({tooltip: false});
  assert.strictEqual(confidenceSuffix(viz, {lo: 1, hi: 4}, 0, fmt), "");
  assert.strictEqual(confidenceSuffix(new LinePlot(), {lo: 1, hi: 4}, 0, fmt), "", "confidence off");
});
