import assert from "assert";
import {default as pointRotate} from "../src/pointRotate.js";

it("geom/pointRotate", () => {

  assert.strictEqual(JSON.stringify([-4, -4]), JSON.stringify(pointRotate([4, 4], Math.PI).map(Math.round)), "default origin");
  assert.strictEqual(JSON.stringify([-0, 0]), JSON.stringify(pointRotate([4, 4], Math.PI, [2, 2]).map(Math.round)), "custom origin");

});
