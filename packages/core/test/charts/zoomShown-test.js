import assert from "assert";
import it from "../jsdom.js";
import {forgetTransform, recordTransform, showsTransform} from "../../es/src/charts/drawSteps/zoomShown.js";

it("zoomShown: a chart with nothing recorded is drawn at the identity transform", () => {
  const viz = {};
  assert.strictEqual(showsTransform(viz, {k: 1, x: 0, y: 0}), true);
  assert.strictEqual(showsTransform(viz, {k: 1, x: 5, y: 0}), false);
  assert.strictEqual(showsTransform(viz, {k: 2, x: 0, y: 0}), false);
});

it("zoomShown: recordTransform sets the transform a chart is drawn at", () => {
  const viz = {};
  recordTransform(viz, {k: 2, x: -40, y: -10});
  assert.strictEqual(showsTransform(viz, {k: 2, x: -40, y: -10}), true);
  assert.strictEqual(showsTransform(viz, {k: 2, x: -41, y: -10}), false);
  assert.strictEqual(showsTransform(viz, {k: 1, x: 0, y: 0}), false);
  assert.strictEqual(showsTransform({}, {k: 2, x: -40, y: -10}), false, "each chart keeps its own");
});

it("zoomShown: recordTransform copies the transform", () => {
  const viz = {}, t = {k: 3, x: 1, y: 2};
  recordTransform(viz, t);
  t.k = 4;
  assert.strictEqual(showsTransform(viz, {k: 3, x: 1, y: 2}), true);
});

it("zoomShown: forgetTransform returns a chart to the identity transform", () => {
  const viz = {};
  recordTransform(viz, {k: 2, x: -40, y: -10});
  forgetTransform(viz);
  assert.strictEqual(showsTransform(viz, {k: 1, x: 0, y: 0}), true);
  assert.strictEqual(showsTransform(viz, {k: 2, x: -40, y: -10}), false);
});

it("zoomShown: a transform without a numeric scale never matches", () => {
  const viz = {};
  for (const t of [undefined, null, false, "translate(0,0)", {x: 0, y: 0}, {k: "1", x: 0, y: 0}])
    assert.strictEqual(showsTransform(viz, t), false, String(JSON.stringify(t)));
  assert.strictEqual(showsTransform(viz, {k: 1}), true, "missing x/y read as 0");
});
