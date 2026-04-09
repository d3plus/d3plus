import assert from "assert";
import {default as closest} from "../es/src/closest.js";

it("closest", () => {
  assert.strictEqual(closest(9, [0, 10]), 10, "Closest Over");
  assert.strictEqual(closest(1, [0, 10]), 0, "Closest Under");
  assert.strictEqual(closest(1, undefined), void 0, "Undefined");
  assert.strictEqual(closest(1, []), void 0, "Empty Array");
  assert.strictEqual(closest(1, null), void 0, "Null");
  assert.strictEqual(closest(1, "not an array"), void 0, "Non-array");
  assert.strictEqual(closest(5, [5]), 5, "Single element");
  assert.strictEqual(closest(5, [0, 5, 10]), 5, "Exact match");
});
