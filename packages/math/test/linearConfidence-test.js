import assert from "assert";
import {default as linearConfidence} from "../es/src/linearConfidence.js";

const points = [[1, 2.1], [2, 3.9], [3, 6.2], [4, 7.8], [5, 10.1], [6, 11.9]];

it("linearConfidence", () => {
  const band = linearConfidence(points);
  assert.ok(band, "returns a function");
  const [lo, hi] = band(3.5);
  const mid = (lo + hi) / 2;
  assert.ok(Math.abs(mid - 7) < 0.1, "centered on the fitted line");
  const width = x => band(x)[1] - band(x)[0];
  assert.ok(width(3.5) < width(1) && width(3.5) < width(6), "narrowest at the mean x");
  assert.ok(Math.abs(width(1) - width(6)) < 1e-9, "symmetric about the mean x");
  const wide = linearConfidence(points, 0.99);
  assert.ok(wide(3.5)[1] - wide(3.5)[0] > width(3.5), "higher level widens the band");
});

it("linearConfidence edge cases", () => {
  assert.strictEqual(linearConfidence([[1, 1], [2, 2]]), null, "needs three points");
  assert.strictEqual(linearConfidence([[1, 1], [1, 2], [1, 3]]), null, "x must vary");
  assert.strictEqual(linearConfidence(points, 1), null, "level must be below 1");
  assert.strictEqual(linearConfidence(undefined), null, "undefined points");
  const exact = linearConfidence([[0, 0], [1, 1], [2, 2]]);
  assert.deepStrictEqual(exact(1), [1, 1], "a perfect fit has zero width");
  const withNaN = linearConfidence([...points, [NaN, 3], [7, Infinity]]);
  assert.deepStrictEqual(withNaN(2), linearConfidence(points)(2), "ignores non-finite points");
});
