import {it} from "vitest";
import assert from "assert";
import {
  default as kernelDensity,
  epanechnikovKernel,
  gaussianKernel,
  silvermanBandwidth,
} from "../src/kernelDensity.ts";

const close = (actual, expected, tol, msg) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${msg}: ${actual} vs ${expected}`);

/** Trapezoidal area under `[x, y]` points. */
const area = points =>
  points.reduce((s, [x, y], i) => (i ? s + ((x - points[i - 1][0]) * (y + points[i - 1][1])) / 2 : s), 0);

/** Trapezoidal integral of `fn` over `[lo, hi]`. */
const integrate = (fn, lo, hi, steps = 2000) => {
  const pts = Array.from({length: steps + 1}, (_, i) => {
    const x = lo + ((hi - lo) * i) / steps;
    return [x, fn(x)];
  });
  return area(pts);
};

/** Inverse standard normal CDF (Acklam's approximation). */
function probit(p) {
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];
  const q = Math.min(p, 1 - p);
  let x;
  if (q > 0.02425) {
    const u = p - 0.5, r = u * u;
    return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * u) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }
  const r = Math.sqrt(-2 * Math.log(q));
  x = (((((c[0] * r + c[1]) * r + c[2]) * r + c[3]) * r + c[4]) * r + c[5]) /
    ((((d[0] * r + d[1]) * r + d[2]) * r + d[3]) * r + 1);
  return p < 0.5 ? x : -x;
}

/** A deterministic standard normal sample: evenly spaced quantiles. */
const normalSample = n => Array.from({length: n}, (_, i) => probit((i + 0.5) / n));

it("gaussianKernel: peaks at 1/√(2π) and is symmetric", () => {
  close(gaussianKernel(0), 1 / Math.sqrt(2 * Math.PI), 1e-12, "peak");
  close(gaussianKernel(1.3), gaussianKernel(-1.3), 1e-15, "symmetric");
  close(gaussianKernel(1), 0.24197072451914337, 1e-12, "φ(1)");
});

it("gaussianKernel: integrates to 1", () => {
  close(integrate(gaussianKernel, -10, 10), 1, 1e-6, "area");
});

it("epanechnikovKernel: is 3/(4√5)·(1 - u²/5) inside [-√5, √5] and 0 outside", () => {
  const r5 = Math.sqrt(5);
  close(epanechnikovKernel(0), 0.75 / r5, 1e-12, "peak");
  close(epanechnikovKernel(1), (0.75 / r5) * 0.8, 1e-12, "u = 1");
  close(epanechnikovKernel(-1), epanechnikovKernel(1), 1e-15, "symmetric");
  assert.strictEqual(epanechnikovKernel(r5), 0);
  assert.strictEqual(epanechnikovKernel(-r5), 0);
  assert.strictEqual(epanechnikovKernel(2.3), 0);
  assert.strictEqual(epanechnikovKernel(-5), 0);
});

it("epanechnikovKernel: integrates to 1 with unit variance", () => {
  const r5 = Math.sqrt(5);
  close(integrate(epanechnikovKernel, -r5, r5), 1, 1e-6, "area");
  close(integrate(u => u * u * epanechnikovKernel(u), -r5, r5), 1, 1e-5, "variance");
});

it("gaussianKernel: has unit variance", () => {
  close(integrate(u => u * u * gaussianKernel(u), -10, 10), 1, 1e-6, "variance");
});

it("silvermanBandwidth: is 0.9 · min(σ, IQR/1.34) · n^(-1/5)", () => {
  // σ (sample) of 1…10 is 3.0277; IQR is 7.75 - 3.25 = 4.5, /1.34 = 3.3582.
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const sd = Math.sqrt(values.reduce((s, v) => s + (v - 5.5) ** 2, 0) / 9);
  close(silvermanBandwidth(values), 0.9 * sd * Math.pow(10, -0.2), 1e-12, "σ is the smaller spread");
});

it("silvermanBandwidth: uses the IQR when it is the smaller spread", () => {
  // A heavy outlier inflates σ but not the IQR.
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 1000];
  const iqr = (7.75 - 3.25) / 1.34;
  close(silvermanBandwidth(values), 0.9 * iqr * Math.pow(10, -0.2), 1e-12, "IQR / 1.34");
});

it("silvermanBandwidth: ignores order and non-finite values", () => {
  const a = silvermanBandwidth([5, 1, 3, 2, 4]);
  const b = silvermanBandwidth([1, NaN, 2, 3, Infinity, 4, 5, undefined, null]);
  close(a, b, 1e-12, "same bandwidth");
});

it("silvermanBandwidth: falls back to σ when the IQR is zero", () => {
  const values = [0, 5, 5, 5, 5, 5, 5, 10];
  const sd = Math.sqrt(values.reduce((s, v) => s + (v - 5) ** 2, 0) / 7);
  close(silvermanBandwidth(values), 0.9 * sd * Math.pow(8, -0.2), 1e-12, "σ");
});

it("silvermanBandwidth: falls back to a tenth of the magnitude when values don't vary", () => {
  close(silvermanBandwidth([50, 50, 50, 50]), 0.9 * 5 * Math.pow(4, -0.2), 1e-12, "all equal");
  close(silvermanBandwidth([-20]), 0.9 * 2, 1e-12, "single negative value");
  close(silvermanBandwidth([0, 0]), 0.9 * Math.pow(2, -0.2), 1e-12, "zeros use 1");
});

it("silvermanBandwidth: is NaN without values", () => {
  assert.ok(Number.isNaN(silvermanBandwidth([])));
  assert.ok(Number.isNaN(silvermanBandwidth([NaN, undefined])));
});

it("silvermanBandwidth: shrinks as the sample grows", () => {
  assert.ok(silvermanBandwidth(normalSample(1000)) < silvermanBandwidth(normalSample(100)));
});

it("kernelDensity: returns an empty array without finite values", () => {
  assert.deepStrictEqual(kernelDensity([]), []);
  assert.deepStrictEqual(kernelDensity([NaN, Infinity, null, undefined, "4"]), []);
});

it("kernelDensity: recovers a standard normal density", () => {
  const curve = kernelDensity(normalSample(2000), {extent: [-4, 4], points: 161});
  const at = x => curve.find(p => Math.abs(p[0] - x) < 1e-9)[1];
  close(at(0), 1 / Math.sqrt(2 * Math.PI), 0.02, "peak height ≈ φ(0)");
  close(at(1), gaussianKernel(1), 0.02, "f(1) ≈ φ(1)");
  close(at(-2), gaussianKernel(2), 0.01, "f(-2) ≈ φ(2)");
  close(at(1.5), at(-1.5), 1e-9, "symmetric sample gives a symmetric curve");
  const peak = curve.reduce((m, p) => (p[1] > m[1] ? p : m));
  close(peak[0], 0, 0.1, "mode ≈ 0");
  close(area(curve), 1, 0.01, "area ≈ 1");
});

it("kernelDensity: recovers a uniform density away from its edges", () => {
  const sample = Array.from({length: 1000}, (_, i) => (i + 0.5) / 1000 * 4); // U(0, 4)
  const curve = kernelDensity(sample, {extent: [0, 4], points: 41});
  curve
    .filter(([x]) => x >= 1 && x <= 3)
    .forEach(([x, y]) => close(y, 0.25, 0.02, `f(${x}) ≈ 1/4`));
});

it("kernelDensity: integrates to 1 with the default extent", () => {
  const curve = kernelDensity([1, 2, 2.5, 4, 7, 7.2, 9], {points: 400});
  close(area(curve), 1, 0.01, "gaussian");
  const epan = kernelDensity([1, 2, 2.5, 4, 7, 7.2, 9], {kernel: "epanechnikov", points: 400});
  close(area(epan), 1, 0.01, "epanechnikov");
});

it("kernelDensity: evaluates `points` evenly spaced values across `cut` bandwidths past the extent", () => {
  const values = [2, 4, 6];
  const h = silvermanBandwidth(values);
  const curve = kernelDensity(values, {points: 11});
  assert.strictEqual(curve.length, 11);
  close(curve[0][0], 2 - 3 * h, 1e-9, "starts 3 bandwidths below the minimum");
  close(curve[10][0], 6 + 3 * h, 1e-9, "ends 3 bandwidths above the maximum");
  const steps = curve.slice(1).map((p, i) => p[0] - curve[i][0]);
  steps.forEach(s => close(s, steps[0], 1e-9, "even spacing"));
  const trimmed = kernelDensity(values, {cut: 0, points: 5});
  assert.deepStrictEqual(trimmed.map(p => p[0]), [2, 3, 4, 5, 6], "cut 0 stops at the data");
});

it("kernelDensity: defaults to 100 points and evaluates at least 2", () => {
  assert.strictEqual(kernelDensity([1, 2, 3]).length, 100);
  assert.strictEqual(kernelDensity([1, 2, 3], {points: 1}).length, 2);
  assert.strictEqual(kernelDensity([1, 2, 3], {points: 0}).length, 2);
});

it("kernelDensity: honors an explicit extent in either order", () => {
  const curve = kernelDensity([1, 2, 3], {extent: [10, -10], points: 3});
  assert.deepStrictEqual(curve.map(p => p[0]), [-10, 0, 10]);
});

it("kernelDensity: uses an explicit bandwidth", () => {
  const curve = kernelDensity([0], {bandwidth: 2, extent: [0, 2], points: 2});
  close(curve[0][1], gaussianKernel(0) / 2, 1e-12, "peak is φ(0)/h");
  close(curve[1][1], gaussianKernel(1) / 2, 1e-12, "one bandwidth out is φ(1)/h");
});

it("kernelDensity: accepts a bandwidth function and ignores invalid bandwidths", () => {
  let seen;
  const curve = kernelDensity([3, 1, NaN, 2], {
    bandwidth: v => {
      seen = v;
      return 1;
    },
    extent: [2, 2],
  });
  assert.deepStrictEqual(seen, [3, 1, 2], "receives the finite values");
  close(curve[0][1], (gaussianKernel(1) * 2 + gaussianKernel(0)) / 3, 1e-12, "uses h = 1");
  const fallback = kernelDensity([1, 2, 3], {bandwidth: -1, points: 3});
  const silverman = kernelDensity([1, 2, 3], {points: 3});
  assert.deepStrictEqual(fallback, silverman, "non-positive bandwidth falls back to Silverman");
});

it("kernelDensity: supports the epanechnikov kernel's compact support", () => {
  const curve = kernelDensity([0], {kernel: "epanechnikov", bandwidth: 1, extent: [-4, 4], points: 17});
  curve.forEach(([x, y]) => {
    if (Math.abs(x) >= Math.sqrt(5)) assert.strictEqual(y, 0, `zero at ${x}`);
    else close(y, epanechnikovKernel(x), 1e-12, `kernel shape at ${x}`);
  });
});

it("kernelDensity: recovers a standard normal density with the epanechnikov kernel", () => {
  const curve = kernelDensity(normalSample(2000), {kernel: "epanechnikov", extent: [-4, 4], points: 161});
  const at = x => curve.find(p => Math.abs(p[0] - x) < 1e-9)[1];
  close(at(0), 1 / Math.sqrt(2 * Math.PI), 0.02, "peak height ≈ φ(0)");
  close(at(1), gaussianKernel(1), 0.02, "f(1) ≈ φ(1)");
  close(area(curve), 1, 0.01, "area ≈ 1");
});

it("kernelDensity: accepts a custom kernel function", () => {
  const box = u => (Math.abs(u) <= 0.5 ? 1 : 0);
  const curve = kernelDensity([0, 0, 10], {kernel: box, bandwidth: 2, extent: [0, 10], points: 2});
  close(curve[0][1], 2 / (3 * 2), 1e-12, "two observations under the box");
  close(curve[1][1], 1 / (3 * 2), 1e-12, "one observation under the box");
});

it("kernelDensity: falls back to gaussian for an unknown kernel name", () => {
  const a = kernelDensity([1, 2, 3], {kernel: "nope", points: 5});
  const b = kernelDensity([1, 2, 3], {points: 5});
  assert.deepStrictEqual(a, b);
});

it("kernelDensity: draws a single value as one symmetric bump", () => {
  const curve = kernelDensity([5], {points: 101});
  const h = silvermanBandwidth([5]);
  close(curve[50][0], 5, 1e-9, "centered on the value");
  close(curve[50][1], gaussianKernel(0) / h, 1e-12, "peak is φ(0)/h");
  close(curve[20][1], curve[80][1], 1e-12, "symmetric");
  close(area(curve), 1, 0.01, "area ≈ 1");
});

it("kernelDensity: draws equal values as the same bump as one value, scaled by its spread", () => {
  const curve = kernelDensity([2, 2, 2, 2], {points: 51});
  assert.ok(curve.every(p => Number.isFinite(p[1])), "finite densities");
  const peak = curve.reduce((m, p) => (p[1] > m[1] ? p : m));
  close(peak[0], 2, 1e-9, "peaks at the value");
  close(area(curve), 1, 0.01, "area ≈ 1");
});

it("kernelDensity: returns one point when the evaluation range collapses", () => {
  const curve = kernelDensity([4, 4], {cut: 0});
  assert.strictEqual(curve.length, 1);
  assert.strictEqual(curve[0][0], 4);
  assert.ok(curve[0][1] > 0);
});

it("kernelDensity: is bimodal for two separated clusters", () => {
  const values = [...normalSample(200).map(v => v - 4), ...normalSample(200).map(v => v + 4)];
  const curve = kernelDensity(values, {extent: [-8, 8], points: 161});
  const at = x => curve.find(p => Math.abs(p[0] - x) < 1e-9)[1];
  assert.ok(at(-4) > 4 * at(0), "left mode well above the trough");
  assert.ok(at(4) > 4 * at(0), "right mode well above the trough");
});
