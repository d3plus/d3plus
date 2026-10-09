import assert from "assert";
import {default as regression} from "../es/src/regression.js";

const close = (actual, expected, tol, msg) =>
  assert.ok(Math.abs(actual - expected) < tol, `${msg}: ${actual} vs ${expected}`);
const xs = [1, 2, 3, 4, 5, 6, 7, 8];
const make = f => xs.map(x => [x, f(x)]);

it("regression linear", () => {
  const fit = regression(make(x => 3 + 2 * x));
  assert.strictEqual(fit.type, "linear", "defaults to linear");
  close(fit.coefficients[0], 3, 1e-9, "intercept");
  close(fit.coefficients[1], 2, 1e-9, "slope");
  close(fit.r2, 1, 1e-12, "exact fit R²");
  close(fit.predict(10), 23, 1e-9, "predict");
  assert.strictEqual(fit.n, 8, "n");
  assert.deepStrictEqual(fit.extent, [1, 8], "extent");
  const noisy = regression(xs.map((x, i) => [x, 3 + 2 * x + (i % 2 ? 1.5 : -1.5)]));
  assert.ok(noisy.r2 < 1 && noisy.r2 > 0.8, "noisy fit lowers R²");
});

it("regression exponential", () => {
  const fit = regression(make(x => 2 * Math.exp(0.3 * x)), "exponential");
  close(fit.coefficients[0], 2, 1e-9, "a");
  close(fit.coefficients[1], 0.3, 1e-9, "b");
  close(fit.r2, 1, 1e-9, "R²");
  const dropped = regression([...make(x => 2 * Math.exp(0.3 * x)), [9, 0], [10, -4]], "exponential");
  assert.strictEqual(dropped.n, 8, "drops y <= 0");
});

it("regression logarithmic", () => {
  const fit = regression(make(x => 1 + 4 * Math.log(x)), "logarithmic");
  close(fit.coefficients[0], 1, 1e-9, "a");
  close(fit.coefficients[1], 4, 1e-9, "b");
  close(fit.predict(Math.E), 5, 1e-9, "predict");
  const dropped = regression([...make(x => 1 + 4 * Math.log(x)), [0, 3], [-1, 3]], "logarithmic");
  assert.strictEqual(dropped.n, 8, "drops x <= 0");
});

it("regression power", () => {
  const fit = regression(make(x => 3 * x ** 1.5), "power");
  close(fit.coefficients[0], 3, 1e-9, "a");
  close(fit.coefficients[1], 1.5, 1e-9, "b");
  close(fit.predict(4), 24, 1e-9, "predict");
  const dropped = regression([...make(x => 3 * x ** 1.5), [0, 1], [2, -1]], "power");
  assert.strictEqual(dropped.n, 8, "drops x <= 0 and y <= 0");
});

it("regression polynomial", () => {
  const quad = regression(make(x => 1 - 2 * x + 0.5 * x * x), "polynomial");
  assert.strictEqual(quad.coefficients.length, 3, "defaults to order 2");
  [1, -2, 0.5].forEach((c, i) => close(quad.coefficients[i], c, 1e-8, `c${i}`));
  close(quad.r2, 1, 1e-9, "R²");
  const cubic = regression(make(x => x ** 3 - x), "polynomial", {order: 3});
  assert.strictEqual(cubic.coefficients.length, 4, "respects order");
  [0, -1, 0, 1].forEach((c, i) => close(cubic.coefficients[i], c, 1e-6, `cubic c${i}`));
  close(cubic.predict(10), 990, 1e-6, "cubic predict");
  const t0 = Date.UTC(2020, 0, 1);
  const day = 864e5;
  const time = regression(
    xs.map(x => [t0 + x * day, (x - 4) ** 2]),
    "polynomial",
  );
  close(time.predict(t0 + 4 * day), 0, 1e-6, "stable on timestamp-scale x");
  assert.strictEqual(regression([[1, 1], [2, 4]], "polynomial", {order: 2}), null, "needs order + 1 points");
});

it("regression edge cases", () => {
  assert.strictEqual(regression([[1, 1]]), null, "one point");
  assert.strictEqual(regression([]), null, "empty");
  assert.strictEqual(regression(undefined), null, "undefined");
  assert.strictEqual(regression([[2, 1], [2, 3], [2, 5]]), null, "x does not vary");
  assert.strictEqual(regression([[2, 1], [2, 3], [2, 5]], "polynomial"), null, "polynomial x does not vary");
  const flat = regression([[1, 5], [2, 5], [3, 5]]);
  close(flat.coefficients[1], 0, 1e-12, "flat slope");
  assert.strictEqual(flat.r2, 1, "flat exact fit R² is 1");
  const withNaN = regression([...make(x => x), [NaN, 1], [3, Infinity]]);
  assert.strictEqual(withNaN.n, 8, "ignores non-finite points");
});
