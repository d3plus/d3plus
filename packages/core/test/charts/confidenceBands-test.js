import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {BarChart, LinePlot, RESET} from "../../index.ts";

import {
  bandOpacityTargets,
  boundOrValue,
  confidenceBands,
  DEFAULT_BAND_OPACITY,
  extraBandValues,
  layerOpacities,
  resolveConfidenceBands,
  rowBands,
} from "../../src/charts/Plot/confidenceBands.ts";

useJsdom();

// #212: `confidence` takes several nested bands, outermost first.

const row = {v: 5, p5: 1, p95: 9, p25: 3, p75: 7};
const near = (a, b) => Math.abs(a - b) < 1e-6;

it("resolveConfidenceBands — a single [lower, upper] pair is one band", () => {
  const [band, ...rest] = resolveConfidenceBands(["p5", "p95"]);
  assert.strictEqual(rest.length, 0);
  assert.strictEqual(band.lower(row), 1);
  assert.strictEqual(band.upper(row), 9);
  assert.strictEqual(band.label, undefined);
  const fn = d => d.v;
  const [oneSided] = resolveConfidenceBands([fn, false]);
  assert.strictEqual(oneSided.lower, fn, "accessor functions are kept");
  assert.strictEqual(oneSided.upper, false, "a one-sided pair keeps its false side");
});

it("resolveConfidenceBands — a list of pairs, tuples with labels, or objects", () => {
  const bands = resolveConfidenceBands([
    ["p5", "p95", "90%"],
    {lower: "p25", upper: "p75", label: 50},
    ["p25", false],
  ]);
  assert.strictEqual(bands.length, 3);
  assert.deepStrictEqual(bands.map(b => b.label), ["90%", "50", undefined]);
  assert.strictEqual(bands[1].lower(row), 3);
  assert.strictEqual(bands[2].upper, false);
  const [single] = resolveConfidenceBands({lower: "p5", upper: "p95", label: "x"});
  assert.strictEqual(single.label, "x", "a lone object is one band");
  assert.strictEqual(resolveConfidenceBands([["p5", "p95"]]).length, 1, "a list of one");
});

it("resolveConfidenceBands — off values, and bands without a bound, give none", () => {
  assert.deepStrictEqual(resolveConfidenceBands(false), []);
  assert.deepStrictEqual(resolveConfidenceBands(undefined), []);
  assert.deepStrictEqual(resolveConfidenceBands(RESET), []);
  assert.deepStrictEqual(resolveConfidenceBands([false, false]), []);
  assert.deepStrictEqual(resolveConfidenceBands([]), []);
  const bands = resolveConfidenceBands([[false, false], ["p5", "p95"]]);
  assert.strictEqual(bands.length, 1, "an empty band is dropped");
});

it("confidenceBands — the chart's bands, or its lone pair", () => {
  assert.deepStrictEqual(confidenceBands(new LinePlot()), []);
  const single = new LinePlot().confidence(["p5", "p95"]);
  assert.strictEqual(confidenceBands(single).length, 1);
  const nested = new LinePlot().confidence([["p5", "p95"], ["p25", "p75"]]);
  assert.strictEqual(confidenceBands(nested).length, 2);
  const pairOnly = {_confidence: [d => d.p5, false]};
  const [band] = confidenceBands(pairOnly);
  assert.strictEqual(band.lower(row), 1, "a pair set without a band list");
  assert.strictEqual(band.upper, false);
  nested.confidence(false);
  assert.deepStrictEqual(confidenceBands(nested), [], "off again");
});

it("rowBands — each band's finite bounds, labeled", () => {
  const viz = new LinePlot().confidence([["p5", "p95", "90%"], ["p25", "p75"]]);
  assert.deepStrictEqual(rowBands(viz, row, 0), [
    {label: "90%", lower: 1, upper: 9},
    {label: "Band 2", lower: 3, upper: 7},
  ]);
  assert.deepStrictEqual(rowBands(viz, {p5: NaN, p95: 9}, 0), [
    {label: "90%", upper: 9},
    {label: "Band 2"},
  ], "non-finite bounds are left out");
  assert.deepStrictEqual(rowBands(viz, undefined, 0), []);
  viz.locale("es-ES");
  assert.strictEqual(rowBands(viz, row, 0)[1].label, "Banda 2", "translated");
});

it("bandOpacityTargets — a ramp from the outermost band to the innermost", () => {
  assert.deepStrictEqual(DEFAULT_BAND_OPACITY, [0.15, 0.6]);
  const ramp = bandOpacityTargets(undefined, 4);
  assert.strictEqual(ramp.length, 4);
  assert.ok(near(ramp[0], 0.15) && near(ramp[3], 0.6), "default ramp ends");
  assert.ok(near(ramp[1], 0.3) && near(ramp[2], 0.45), "evenly sampled");
  assert.deepStrictEqual(bandOpacityTargets(0.4, 3), [0.4, 0.4, 0.4], "a number for every band");
  assert.deepStrictEqual(bandOpacityTargets([0.2], 2), [0.2, 0.2], "a one-value ramp");
  const three = bandOpacityTargets([0.1, 0.5, 0.2], 5);
  assert.ok(near(three[2], 0.5), "middle stops are passed through");
  assert.deepStrictEqual(bandOpacityTargets([0.1, 0.9], 1), [0.9], "one band takes the inner end");
  assert.deepStrictEqual(bandOpacityTargets([0.1, 0.9], 0), []);
  assert.deepStrictEqual(bandOpacityTargets(["x"], 2), bandOpacityTargets(undefined, 2), "invalid → default");
});

it("layerOpacities — stacked layers composite to each band's target", () => {
  const targets = [0.2, 0.5, 0.8];
  const layers = layerOpacities(targets);
  let composite = 0;
  layers.forEach((layer, k) => {
    composite = 1 - (1 - composite) * (1 - layer);
    assert.ok(near(composite, targets[k]), `band ${k} composites to ${targets[k]}`);
  });
  assert.deepStrictEqual(layerOpacities([0.5, 0.3]), [0.5, 0], "a lighter inner band draws nothing");
  assert.deepStrictEqual(layerOpacities([1, 0.5]), [1, 0], "nothing shows through an opaque band");
  assert.deepStrictEqual(layerOpacities([-1, 2]), [0, 1], "targets are clamped");
  assert.deepStrictEqual(layerOpacities([]), []);
});

it("boundOrValue — a missing bound pinches the band onto the line", () => {
  assert.strictEqual(boundOrValue(3, 5), 3);
  assert.strictEqual(boundOrValue(0, 5), 0, "zero is a bound");
  assert.strictEqual(boundOrValue(undefined, 5), 5);
  assert.strictEqual(boundOrValue(null, 5), 5);
  assert.strictEqual(boundOrValue(NaN, 5), 5);
});

it("extraBandValues — every band after the first widens the axis", () => {
  const rows = [{data: row, i: 0}, {data: {p25: 2, p75: NaN}, i: 1}];
  const nested = new LinePlot().confidence([["p5", "p95"], ["p25", "p75"]]);
  assert.deepStrictEqual(extraBandValues(nested, rows), [3, 7, 2]);
  const single = new LinePlot().confidence(["p5", "p95"]);
  assert.deepStrictEqual(extraBandValues(single, rows), [], "a lone band adds nothing");
  assert.deepStrictEqual(extraBandValues(new LinePlot(), rows), []);
});

// The single-pair API is unchanged.

it("confidence — a single pair stores and returns the same [lower, upper] pair", () => {
  const viz = new LinePlot().confidence(["p5", "p95"]);
  const pair = viz.confidence();
  assert.ok(Array.isArray(pair) && pair.length === 2, "the getter returns the pair");
  assert.strictEqual(pair[0](row), 1);
  assert.strictEqual(pair[1](row), 9);
  assert.strictEqual(viz._confidence, pair);
  const fn = d => d.v + 1;
  const oneSided = new BarChart().confidence([false, fn]).confidence();
  assert.deepStrictEqual(oneSided, [false, fn], "functions and false are kept as given");
});

it("confidence — false, RESET, and an empty pair turn it off", () => {
  for (const off of [false, RESET, [false, false], []]) {
    const viz = new LinePlot().confidence(["p5", "p95"]).confidence(off);
    assert.strictEqual(viz.confidence(), false, `${String(off)} turns it off`);
  }
  const viz = new LinePlot().config({confidence: ["p5", "p95"]});
  assert.strictEqual(viz.confidence()[1](row), 9, "config() takes a pair");
  viz.config({confidence: false});
  assert.strictEqual(viz.confidence(), false, "and false");
});

it("confidence — nested bands: the getter returns every band, _confidence the first pair", () => {
  const viz = new LinePlot().confidence([["p5", "p95", "90%"], ["p25", "p75", "50%"]]);
  const bands = viz.confidence();
  assert.strictEqual(bands.length, 2);
  assert.deepStrictEqual(bands.map(b => b.label), ["90%", "50%"]);
  assert.strictEqual(viz._confidence[0](row), 1, "the outermost band drives error bars and lci/hci");
  assert.strictEqual(viz._confidence[1](row), 9);
  viz.config({confidence: [["p25", "p75"]]});
  assert.strictEqual(viz.confidence()[0](row), 3, "a list of one reads back as a pair");
});
