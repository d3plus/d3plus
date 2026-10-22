import assert from "assert";
import {resolveAccessor} from "../../es/src/charts/features/emitHelpers.js";

it("resolveAccessor calls a function value with the datum and index", () => {
  const seen = [];
  const fn = (d, i) => (seen.push([d, i]), d.v * 2);
  const d = {v: 3};
  assert.strictEqual(resolveAccessor(fn, d, 4), 6);
  assert.deepStrictEqual(seen, [[d, 4]]);
});

it("resolveAccessor returns a non-function value as-is", () => {
  assert.strictEqual(resolveAccessor("red", {}, 0), "red");
  assert.strictEqual(resolveAccessor(0, {}, 0), 0);
  assert.strictEqual(resolveAccessor(undefined, {}, 0), undefined);
});
