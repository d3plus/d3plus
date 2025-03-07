import assert from "assert";
import {default as pointDistanceSquared} from "../src/pointDistanceSquared.js";

it("geom/pointDistanceSquared", () => {

  assert.strictEqual(50, pointDistanceSquared([0, 0], [5, 5]), "euclidean distance");

});
