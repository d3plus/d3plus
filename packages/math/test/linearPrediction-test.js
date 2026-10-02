import assert from "assert";
import {default as linearConfidence} from "../es/src/linearConfidence.js";
import {default as linearPrediction} from "../es/src/linearPrediction.js";

const points = [[1, 2.1], [2, 3.9], [3, 6.2], [4, 7.8], [5, 10.1], [6, 11.9]];

it("linearPrediction", () => {
  const band = linearPrediction(points);
  assert.ok(band, "returns a function");
  const [lo, hi] = band(3.5);
  assert.ok(Math.abs((lo + hi) / 2 - 7) < 0.1, "centered on the fitted line");
  const width = x => band(x)[1] - band(x)[0];
  const ci = linearConfidence(points);
  const ciWidth = x => ci(x)[1] - ci(x)[0];
  [1, 3.5, 6, 10].forEach(x => assert.ok(width(x) > ciWidth(x), `wider than the confidence band at ${x}`));
  assert.ok(width(10) > width(6), "widens when extrapolating");
  // Known value: s² = SSres / (n − 2), t(0.975, 4) ≈ 2.776.
  const b = 34.6 / 17.5, a = 7 - b * 3.5;
  const ssRes = points.reduce((s, [x, y]) => s + (y - a - b * x) ** 2, 0);
  const expected = 2.7764 * Math.sqrt(ssRes / 4) * Math.sqrt(1 + 1 / 6 + (3.5 - 3.5) ** 2 / 17.5);
  assert.ok(Math.abs(width(3.5) / 2 - expected) < 1e-3, "matches the textbook margin at the mean");
});

it("linearPrediction edge cases", () => {
  assert.strictEqual(linearPrediction([[1, 1], [2, 2]]), null, "needs three points");
  assert.strictEqual(linearPrediction([[1, 1], [1, 2], [1, 3]]), null, "x must vary");
  assert.strictEqual(linearPrediction(points, 0), null, "level must be above 0");
  assert.strictEqual(linearPrediction(undefined), null, "undefined points");
  const exact = linearPrediction([[0, 0], [1, 1], [2, 2]]);
  assert.deepStrictEqual(exact(5), [5, 5], "a perfect fit has zero width");
});
