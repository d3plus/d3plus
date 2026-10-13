import assert from "assert";
import it from "../jsdom.js";
import {LinePlot} from "../../es/index.js";
import {emitLineBands} from "../../es/src/charts/Plot/lineBands.js";

// #212: a line's `confidence` bands, one Area per band, outermost first.

const plotted = (d, i) => ({__d3plus__: true, data: d, i, id: d.id, x: d.t, y: d.v, discrete: d.t});
const rows = [
  {id: "a", t: 1, v: 10},
  {id: "a", t: 2, v: 10, p5: 6, p95: 14, p25: 8, p75: 12},
  {id: "a", t: 3, v: 10, p5: 4, p95: 16, p25: 7, p75: 13},
].map(plotted);

// x: 1..3 → 0..200 px; y: 0..20 → 200..0 px.
const x = v => (v - 1) * 100;
const y = v => 200 - v * 10;

/** The Line group's position config, as plotEmit builds it. */
const positions = (discrete, px, py) =>
  discrete === "x"
    ? {discrete, duration: 0, x: px, x0: px, x1: null, y: py, y0: 200, y1: py}
    : {discrete, duration: 0, y: py, y0: py, y1: null, x: px, x0: 0, x1: px};

const ctx = viz => ({
  viz,
  values: rows,
  x,
  y,
  shapeConfig: positions("x", d => x(d.x), d => y(d.y)),
});

const chart = (confidence, config) => {
  const viz = new LinePlot()
    .duration(0)
    .confidence(confidence)
    .shapeConfig({Line: {curve: "linear"}});
  // Set by a render; the band's label accessor reads it.
  viz._drawLabel = () => "";
  if (config) viz.confidenceConfig(config);
  return viz;
};

/** The band's first three path points (its upper edge), in plot pixels. */
const upperEdge = node =>
  node.d
    .split("Z")[0]
    .slice(1)
    .split("L")
    .slice(0, 3)
    .map(p => p.split(",").map(Number))
    .map(([px, py]) => [px + node.transform.x, py + node.transform.y]);

it("emitLineBands — one band keeps the line's id and confidenceConfig's opacity", () => {
  const nodes = emitLineBands(ctx(chart(["p5", "p95"])));
  assert.strictEqual(nodes.length, 1);
  const [band] = nodes;
  assert.strictEqual(band.key, "a", "the band shares its line's key");
  assert.strictEqual(band.shapeType, "Area");
  assert.strictEqual(band.paint.fillOpacity, 0.5, "the default single-band opacity");
  assert.deepStrictEqual(upperEdge(band), [[0, 100], [100, 60], [200, 40]], "a row without bounds pinches onto the line");
});

it("emitLineBands — nested bands draw outermost first, each with its own key", () => {
  const nodes = emitLineBands(ctx(chart([["p5", "p95"], ["p25", "p75"]])));
  assert.deepStrictEqual(nodes.map(n => n.key), ["a", "a::band-1"]);
  assert.deepStrictEqual(upperEdge(nodes[0]).map(p => p[1]), [100, 60, 40], "outer upper bound");
  assert.deepStrictEqual(upperEdge(nodes[1]).map(p => p[1]), [100, 80, 70], "inner upper bound");
  const [outer, inner] = nodes.map(n => n.paint.fillOpacity);
  assert.strictEqual(outer, 0.15, "the outermost band at the ramp's light end");
  assert.ok(Math.abs(1 - (1 - outer) * (1 - inner) - 0.6) < 1e-5, "the innermost composites to the dark end");
});

it("emitLineBands — bandOpacity sets the ramp; other confidenceConfig keys still style the Area", () => {
  const nodes = emitLineBands(ctx(chart([["p5", "p95"], ["p25", "p75"]], {bandOpacity: 0.3, fill: "#123456"})));
  assert.deepStrictEqual(nodes.map(n => n.paint.fill), ["#123456", "#123456"]);
  assert.strictEqual(nodes[0].paint.fillOpacity, 0.3);
  assert.strictEqual(nodes[1].paint.fillOpacity, 0, "an equal inner target adds nothing");
});

it("emitLineBands — nothing without confidence", () => {
  assert.deepStrictEqual(emitLineBands(ctx(chart(false))), []);
});

it("emitLineBands — a vertical plot spans x", () => {
  const viz = chart(["p5", "p95"]);
  viz.schema.discrete = "y";
  const flipped = rows.map(d => ({...d, x: d.y, y: d.x}));
  const shapeConfig = positions("y", d => d.x * 10, d => (d.y - 1) * 100);
  const [band] = emitLineBands({viz, values: flipped, x: v => v * 10, y: v => (v - 1) * 100, shapeConfig});
  assert.deepStrictEqual(upperEdge(band), [[100, 0], [140, 100], [160, 200]], "upper bounds along x");
});
