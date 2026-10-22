import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {BarChart, LinePlot} from "../../index.ts";
import {
  bandRows,
  confidenceRows,
  confidenceSuffix,
  confidenceTooltipEnabled,
  rangeSuffix,
  rangeText,
  rowConfidence,
} from "../../src/charts/Plot/confidenceTooltip.ts";

useJsdom();

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

// #212: nested bands list one range row per band.

it("rangeText — the bare range, without the suffix's parentheses", () => {
  assert.strictEqual(rangeText(1, 4, fmt), "<1> – <4>");
  assert.strictEqual(rangeText(1, undefined, fmt), "≥ <1>");
  assert.strictEqual(rangeText(undefined, 4, fmt), "≤ <4>");
  assert.strictEqual(rangeText(NaN, undefined, fmt), "");
});

it("bandRows — a [label, range] row per band with a bound, outermost first", () => {
  const viz = new LinePlot().confidence([["p5", "p95", "90%"], ["p25", "p75"], ["p40", false, "20%"]]);
  const d = {p5: 1, p95: 9, p25: 3, p75: 7};
  assert.deepStrictEqual(bandRows(viz, d, 0, fmt), [
    ["90%", "<1> – <9>"],
    ["Band 2", "<3> – <7>"],
  ], "a band without bounds on the row is skipped");
  assert.deepStrictEqual(bandRows(viz, {p40: 2}, 0, fmt), [["20%", "≥ <2>"]], "one-sided");
});

it("confidenceRows — nested bands list their ranges; a lone band keeps Lower/Upper Bound", () => {
  const nested = new LinePlot().confidence([["lo", "hi", "90%"], ["mlo", "mhi", "50%"]]);
  const d = {lo: 1, hi: 9, mlo: 4, mhi: 6};
  assert.deepStrictEqual(confidenceRows(nested, d, 0, fmt), [["90%", "<1> – <9>"], ["50%", "<4> – <6>"]]);
  const single = new LinePlot().confidence([["lo", "hi", "90%"]]);
  assert.deepStrictEqual(confidenceRows(single, d, 0, fmt), [["Lower Bound", "<1>"], ["Upper Bound", "<9>"]]);
  nested.confidenceConfig({tooltip: false});
  assert.deepStrictEqual(confidenceRows(nested, d, 0, fmt), [], "opted out");
});

it("confidenceSuffix — nested bands show the outermost band's range", () => {
  const viz = new LinePlot().confidence([["lo", "hi"], ["mlo", "mhi"]]);
  assert.strictEqual(confidenceSuffix(viz, {lo: 1, hi: 9, mlo: 4, mhi: 6}, 0, fmt), " (<1> – <9>)");
});
