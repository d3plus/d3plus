import assert from "assert";
import {default as shapeEdgePoint} from "../src/shapeEdgePoint.js";

it("geom/shapeEdgePoint", () => {

  assert.strictEqual(JSON.stringify([7, 7]), JSON.stringify(shapeEdgePoint(Math.PI * 0.25, 10).map(Math.round)), "circle");
  assert.strictEqual(JSON.stringify([10, 10]), JSON.stringify(shapeEdgePoint(Math.PI * 0.25, 10, "square").map(Math.round)), "square - quadrant 4");
  assert.strictEqual(JSON.stringify([-10, 10]), JSON.stringify(shapeEdgePoint(Math.PI * 0.75, 10, "square").map(Math.round)), "square - quadrant 3");
  assert.strictEqual(JSON.stringify([-10, -10]), JSON.stringify(shapeEdgePoint(Math.PI * 1.25, 10, "square").map(Math.round)), "square - quadrant 2");
  assert.strictEqual(JSON.stringify([10, -10]), JSON.stringify(shapeEdgePoint(Math.PI * 1.75, 10, "square").map(Math.round)), "square - quadrant 1");

});
