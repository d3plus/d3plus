import assert from "assert";
import {default as polygonInside} from "../src/polygonInside.js";

it("geom/polygonInside", () => {

  const square = [[0, 0], [4, 0], [4, 4], [0, 4]];
  assert.strictEqual(true, polygonInside([[1, 1], [3, 1], [3, 3], [1, 3]], square), "inside");
  assert.strictEqual(false, polygonInside([[3, 1], [5, 1], [5, 3], [3, 3]], square), "overlap");
  assert.strictEqual(false, polygonInside([[5, 1], [8, 1], [8, 3], [5, 3]], square), "outsite");

});
