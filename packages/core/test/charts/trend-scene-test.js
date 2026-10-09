import assert from "assert";
import it from "../jsdom.js";
import {emitTrendLines} from "../../es/src/charts/Plot/trendScene.js";
import {trendLineDefaults} from "../../es/src/charts/Plot/trendLines.js";

const linear = (x0, x1) => ({type: "linear", coefficients: [0, 1], r2: 1, n: 3, extent: [x0, x1]});
const fit = (id, extra = {}) => ({
  id,
  label: id,
  color: "red",
  axis: "x",
  fit: linear(0, 2),
  row: {id},
  samples: [{x: 0, y: 0}, {x: 1, y: 1}, {x: 2, y: 2}],
  ...extra,
});
const viz = (fits, config = {}) => ({
  _trendFits: fits,
  _trendLineConfig: {...trendLineDefaults(), ...config},
  schema: {duration: 0},
});
const scale = v => v * 10;

/** Every node in a subtree. */
const walk = node => [node, ...(node.children || []).flatMap(walk)];

it("emitTrendLines — nothing without fits", () => {
  assert.deepStrictEqual(emitTrendLines(viz([]), scale, scale), []);
  assert.deepStrictEqual(emitTrendLines({_trendLineConfig: {}, schema: {}}, scale, scale), []);
});

it("emitTrendLines — a keyed group per fit, stamped for hover", () => {
  const groups = emitTrendLines(viz([fit("A"), fit("B")]), scale, scale);
  assert.deepStrictEqual(groups.map(g => g.key), ["plot-trend-A", "plot-trend-B"]);
  const nodes = walk(groups[0]).slice(1);
  assert.ok(nodes.length, "has children");
  assert.ok(nodes.every(n => n.interactionGroup === "trend"), "trend chrome");
  assert.ok(nodes.every(n => n.interactive === true && n.trendFit.id === "A"), "pickable, carrying the fit");
  assert.ok(nodes.every(n => n.datum.id === "A"), "dims with its series");
  const line = nodes.find(n => n.type === "path" && n.paint && n.paint.stroke === "red");
  assert.ok(line, "a line in the fit's color");
  assert.deepStrictEqual(line.paint.strokeDasharray, [6, 4], "line styles from trendLineConfig");
});

it("emitTrendLines — tooltip off leaves the line inert", () => {
  const [group] = emitTrendLines(viz([fit("A")], {tooltip: false}), scale, scale);
  const nodes = walk(group).slice(1);
  assert.ok(nodes.every(n => n.interactive === false && n.trendFit === undefined));
});

it("emitTrendLines — a confidence band draws first and stays inert", () => {
  const banded = fit("A", {samples: [{x: 0, y: 0, lci: -1, hci: 1}, {x: 2, y: 2, lci: 1, hci: 3}]});
  const [group] = emitTrendLines(viz([banded], {confidenceConfig: {fillOpacity: 0.3}}), scale, scale);
  const [band] = group.children;
  assert.strictEqual(band.paint.fill, "red", "band fills with the line color");
  assert.strictEqual(band.paint.fillOpacity, 0.3, "confidenceConfig applies");
  assert.strictEqual(band.interactive, false, "band is not a hover target");
  assert.ok(group.children.slice(1).some(n => n.interactive === true), "the line still is");
});
