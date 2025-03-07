import assert from "assert";
import {default as closest} from "../src/closest.js";

it("closest", () => {

  assert.strictEqual(closest(9, [0, 10]), 10, "Closest Over");
  assert.strictEqual(closest(1, [0, 10]), 0, "Closest Under");
  assert.strictEqual(closest(1, undefined), void 0, "Undefined");
  assert.strictEqual(closest(1, []), void 0, "Empty Array");

});
