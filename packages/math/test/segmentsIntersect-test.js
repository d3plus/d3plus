import assert from "assert";
import {default as segmentsIntersect} from "../src/segmentsIntersect.js";

it("geom/segmentsIntersect", () => {

  assert.strictEqual(true, segmentsIntersect([0, 0], [4, 4], [4, 0], [0, 4]), "cross");
  assert.strictEqual(true, segmentsIntersect([0, 0], [4, 4], [4, 0], [4, 4]), "vertex");
  assert.strictEqual(false, segmentsIntersect([0, 0], [4, 4], [4, 0], [4, 2]), "false");
  assert.strictEqual(false, segmentsIntersect([0, 0], [0, 4], [4, 0], [4, 4]), "parallel");

});
