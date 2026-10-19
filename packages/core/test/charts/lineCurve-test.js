import assert from "assert";
import {curveLinear, curveMonotoneX, curveStep} from "d3-shape";
import it from "../jsdom.js";
import {LinePlot} from "../../es/index.js";
import {curveFactory, lineCurve} from "../../es/src/charts/Plot/lineCurve.js";

// The curve a Plot's lines draw with, shared by the shapes that follow them.

const rows = [
  {__d3plus__: true, data: {id: "a"}, i: 0, id: "a", x: 1, y: 10, discrete: 1},
  {__d3plus__: true, data: {id: "b"}, i: 1, id: "b", x: 1, y: 8, discrete: 1},
];

it("curveFactory — a curve name's d3 factory, linear when unknown", () => {
  assert.strictEqual(curveFactory("linear"), curveLinear);
  assert.strictEqual(curveFactory("monotoneX"), curveMonotoneX);
  assert.strictEqual(curveFactory("step"), curveStep);
  assert.strictEqual(curveFactory("nope"), curveLinear);
  assert.strictEqual(curveFactory(""), curveLinear);
});

it("lineCurve — the curve the lines draw with", () => {
  assert.strictEqual(lineCurve(new LinePlot(), rows[0]), "monotoneX", "a LinePlot's default");
  const plain = new LinePlot();
  plain.schema.discrete = undefined;
  assert.strictEqual(lineCurve(plain, rows[0]), "linear", "no discrete axis");
  assert.strictEqual(lineCurve(new LinePlot().shapeConfig({Line: {curve: "monotoneX"}}), rows[0]), "monotoneX");
  const byRow = new LinePlot().shapeConfig({Line: {curve: d => (d.id === "a" ? "natural" : "linear")}});
  assert.strictEqual(lineCurve(byRow, rows[0]), "natural", "an accessor reads the row");
  assert.strictEqual(lineCurve(byRow, undefined), "linear");
});
