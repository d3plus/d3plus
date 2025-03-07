import assert from "assert";
import {default as segmentBoxContains} from "../src/segmentBoxContains.js";

it("geom/segmentBoxContains", () => {

  assert.strictEqual(true, segmentBoxContains([0, 0], [4, 4], [2, 2]), "inside");
  assert.strictEqual(true, segmentBoxContains([0, 0], [4, 4], [2, 0]), "edge");
  assert.strictEqual(false, segmentBoxContains([0, 0], [4, 4], [5, 5]), "outside");

});
