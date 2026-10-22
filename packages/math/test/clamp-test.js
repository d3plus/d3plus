import assert from "assert";
import {default as clamp} from "../es/src/clamp.js";

it("clamp", () => {
  assert.strictEqual(clamp(5, 0, 10), 5, "inside the range");
  assert.strictEqual(clamp(-3, 0, 10), 0, "below the range");
  assert.strictEqual(clamp(42, 0, 10), 10, "above the range");
  assert.strictEqual(clamp(0, 0, 10), 0, "at the lower bound");
  assert.strictEqual(clamp(10, 0, 10), 10, "at the upper bound");
  assert.strictEqual(clamp(0.5, 0, 1), 0.5, "fractional range");
  assert.strictEqual(clamp(5, 10, 0), 10, "an inverted range returns min");
});
