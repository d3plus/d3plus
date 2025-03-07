import assert from "assert";
import {default as lineIntersection} from "../src/lineIntersection.js";

it("geom/lineIntersection", () => {

  const point = JSON.stringify([2, 2]);
  assert.strictEqual(point, JSON.stringify(lineIntersection([0, 0], [4, 4], [4, 0], [0, 4])), "crossing segments");
  assert.strictEqual(point, JSON.stringify(lineIntersection([0, 0], [2, 2], [4, 0], [0, 4])), "touching segments");
  assert.strictEqual(point, JSON.stringify(lineIntersection([0, 0], [1, 1], [4, 0], [0, 4])), "non-touching segments");
  assert.strictEqual(null, lineIntersection([0, 0], [1, 1], [1, 0], [2, 1]), "parallel segments");

});
