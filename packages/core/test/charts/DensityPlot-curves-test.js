import {it} from "vitest";
import assert from "assert";
import {kernelDensity, silvermanBandwidth} from "@d3plus/math";
import {
  densityCurves,
  densityGrid,
  densityHeightLabel,
  densityHeightScale,
  pooledBandwidth,
  resolveDensityScale,
} from "../../src/charts/DensityPlot/densityCurves.ts";

/** Trapezoid area under a `[value, density]` curve. */
const area = curve =>
  curve
    .slice(1)
    .reduce(
      (sum, [x, y], i) => sum + ((x - curve[i][0]) * (y + curve[i][1])) / 2,
      0,
    );

const rows = [
  {g: "a", v: 1},
  {g: "a", v: 2},
  {g: "a", v: 2.5},
  {g: "a", v: 4},
  {g: "b", v: 10},
  {g: "b", v: 11},
  {g: "b", v: "12"},
  {g: "b", v: null},
  {g: "c", v: "n/a"},
];
const options = {value: d => d.v, key: d => d.g};

it("densityGrid: covers the range in round steps", () => {
  const grid = densityGrid(148.7, 241.3, 100);
  assert.deepStrictEqual(grid.extent, [148, 242]);
  assert.strictEqual(grid.points, 95);
  assert.strictEqual(grid.decimals, 0);

  const fine = densityGrid(0.29, 6.31, 100);
  assert.deepStrictEqual(fine.extent, [0.25, 6.35]);
  assert.strictEqual(fine.decimals, 2);
  assert.strictEqual(fine.points, 123);

  const quarter = densityGrid(0, 10, 41);
  assert.ok(quarter.extent[0] <= 0 && quarter.extent[1] >= 10);
  assert.strictEqual(quarter.decimals, 1, "a 0.5 step needs one decimal");
});

it("densityGrid: a degenerate range keeps its ends", () => {
  assert.deepStrictEqual(densityGrid(3, 3, 50), {
    extent: [3, 3],
    points: 50,
    decimals: 0,
  });
  assert.strictEqual(densityGrid(0, 1, NaN).points >= 2, true);
});

it("pooledBandwidth: Silverman's rule on every value, unless overridden", () => {
  const values = [1, 2, 2.5, 4, 10, 11, 12];
  assert.strictEqual(pooledBandwidth(values), silvermanBandwidth(values));
  assert.strictEqual(
    pooledBandwidth([...values, NaN]),
    pooledBandwidth(values),
  );
  assert.strictEqual(pooledBandwidth(values, {bandwidth: 0.5}), 0.5);
  let seen;
  assert.strictEqual(
    pooledBandwidth(values, {bandwidth: v => ((seen = v), 2)}),
    2,
  );
  assert.deepStrictEqual(seen, values, "a function gets every value");
  assert.strictEqual(
    pooledBandwidth(values, {bandwidth: -1}),
    silvermanBandwidth(values),
    "a non-positive bandwidth falls back",
  );
  assert.ok(Number.isNaN(pooledBandwidth([])));
});

it("densityCurves: every group shares one bandwidth and one grid", () => {
  const {groups, bandwidth, extent, n} = densityCurves(rows, options);
  assert.strictEqual(n, 7, "rows without a finite value are dropped");
  assert.deepStrictEqual(
    groups.map(g => g.key),
    ["a", "b"],
    "groups without values are dropped",
  );
  assert.strictEqual(
    bandwidth,
    silvermanBandwidth([1, 2, 2.5, 4, 10, 11, 12]),
    "pooled bandwidth",
  );
  const [a, b] = groups;
  assert.deepStrictEqual(
    a.summary.curve.map(p => p[0]),
    b.summary.curve.map(p => p[0]),
    "the same x values",
  );
  const xs = a.summary.curve.map(p => p[0]);
  assert.strictEqual(xs[0], extent[0]);
  assert.strictEqual(xs[xs.length - 1], extent[1]);
  assert.ok(extent[0] <= 1 - 3 * bandwidth, "runs cut bandwidths below");
  assert.ok(extent[1] >= 12 + 3 * bandwidth, "and above");
  xs.forEach(x => assert.strictEqual(x, Number(x.toFixed(6)), "round steps"));
  // Each curve is the group's own estimate at the shared bandwidth.
  const own = kernelDensity([1, 2, 2.5, 4], {
    bandwidth,
    extent,
    points: xs.length,
  });
  a.summary.curve.forEach(([, y], i) =>
    assert.ok(Math.abs(y - own[i][1]) < 1e-12),
  );
  groups.forEach(g => assert.ok(Math.abs(area(g.summary.curve) - 1) < 0.01));
  assert.strictEqual(a.summary.n, 4);
  assert.strictEqual(b.summary.median, 11);
});

it("densityCurves: honors densityConfig", () => {
  const fixed = densityCurves(rows, {
    ...options,
    density: {bandwidth: 1, cut: 0, kernel: "epanechnikov"},
  });
  assert.strictEqual(fixed.bandwidth, 1);
  assert.deepStrictEqual(fixed.extent, [1, 12]);
  const explicit = densityCurves(rows, {
    ...options,
    density: {extent: [0, 20], points: 21},
  });
  assert.deepStrictEqual(explicit.extent, [0, 20]);
  assert.strictEqual(explicit.groups[0].summary.curve.length, 21);
  assert.deepStrictEqual(densityCurves([], options), {
    groups: [],
    bandwidth: NaN,
    extent: undefined,
    n: 0,
  });
});

it("densityHeightScale: area, count share, or own peak", () => {
  const {groups, n} = densityCurves(rows, options);
  const [a, b] = groups;
  assert.strictEqual(densityHeightScale(n, "area")(a), 1);
  assert.strictEqual(densityHeightScale(n)(b), 1, "area by default");
  assert.strictEqual(densityHeightScale(n, "count")(a), 4 / 7);
  assert.strictEqual(densityHeightScale(0, "count")(a), 0);
  assert.strictEqual(densityHeightScale(n, "width")(b), 1 / b.summary.peak);
  // Share-weighted curves add up to one density of every observation.
  const count = densityHeightScale(n, "count");
  const total = a.summary.curve.map(([x, y], i) => [
    x,
    y * count(a) + b.summary.curve[i][1] * count(b),
  ]);
  assert.ok(Math.abs(area(total) - 1) < 0.01);
});

it("resolveDensityScale: densityScale, else count when stacked", () => {
  assert.strictEqual(resolveDensityScale(undefined, false), "area");
  assert.strictEqual(resolveDensityScale(undefined, true), "count");
  assert.strictEqual(resolveDensityScale("width", true), "width");
  assert.strictEqual(resolveDensityScale("area", true), "area");
  assert.strictEqual(resolveDensityScale("bogus", false), "area");
});

it("densityHeightLabel: Density, or Relative Density for width", () => {
  assert.strictEqual(densityHeightLabel("area"), "Density");
  assert.strictEqual(densityHeightLabel("count"), "Density");
  assert.strictEqual(densityHeightLabel("width"), "Relative Density");
});
