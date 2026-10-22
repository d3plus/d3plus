import {it} from "vitest";
import assert from "assert";
import {
  densityAt,
  densityGroups,
  densityStats,
  densityWidthScale,
  sortByMedian,
} from "../../src/charts/helpers/densityData.ts";
import {near} from "~test/helpers.js";

it("densityStats: quartiles, extent, mean, and curve", () => {
  const s = densityStats([9, 1, 5, 3, 7], {points: 21});
  assert.deepStrictEqual(s.values, [1, 3, 5, 7, 9], "sorted values");
  assert.strictEqual(s.n, 5);
  assert.strictEqual(s.min, 1);
  assert.strictEqual(s.q1, 3);
  assert.strictEqual(s.median, 5);
  assert.strictEqual(s.q3, 7);
  assert.strictEqual(s.max, 9);
  assert.strictEqual(s.mean, 5);
  assert.strictEqual(s.curve.length, 21);
  assert.strictEqual(s.peak, Math.max(...s.curve.map(p => p[1])), "peak is the highest density");
});

it("densityStats: interpolates quartiles like d3.quantile", () => {
  const s = densityStats([1, 2, 3, 4]);
  assert.strictEqual(s.q1, 1.75);
  assert.strictEqual(s.median, 2.5);
  assert.strictEqual(s.q3, 3.25);
});

it("densityStats: ignores non-finite values and returns null without any", () => {
  const s = densityStats([2, NaN, 4, Infinity]);
  assert.deepStrictEqual(s.values, [2, 4]);
  assert.strictEqual(densityStats([]), null);
  assert.strictEqual(densityStats([NaN]), null);
});

it("densityStats: passes the curve options through", () => {
  const s = densityStats([0, 10], {cut: 0, points: 3});
  assert.deepStrictEqual(s.curve.map(p => p[0]), [0, 5, 10]);
});

it("densityStats: a single value has equal quartiles and one bump", () => {
  const s = densityStats([4], {points: 11});
  assert.strictEqual(s.q1, 4);
  assert.strictEqual(s.median, 4);
  assert.strictEqual(s.q3, 4);
  near(s.curve[5][0], 4, 1e-9, "bump centered on the value");
  assert.ok(s.peak > 0);
});

it("densityGroups: groups rows by key in order of first appearance", () => {
  const rows = [
    {g: "b", v: 1}, {g: "a", v: 2}, {g: "b", v: 3}, {g: "a", v: "4"}, {g: "c", v: null},
  ];
  const groups = densityGroups(rows, {value: d => d.v, key: d => d.g, density: {points: 5}});
  assert.deepStrictEqual(groups.map(g => g.key), ["b", "a"], "c has no finite values");
  assert.strictEqual(groups[0].first, rows[0]);
  assert.deepStrictEqual(groups[0].summary.rows, [rows[0], rows[2]]);
  assert.deepStrictEqual(groups[0].summary.observed, [1, 3]);
  assert.deepStrictEqual(groups[1].summary.observed, [2, 4], "numeric strings count");
  assert.strictEqual(groups[1].summary.curve.length, 5);
});

it("densityGroups: drops missing, empty, and non-numeric values and empty rows", () => {
  const rows = [{v: ""}, {v: undefined}, {v: "x"}, null, {v: 0}, {v: false}];
  const groups = densityGroups(rows, {value: d => d.v, key: () => "all"});
  assert.strictEqual(groups.length, 1);
  assert.deepStrictEqual(groups[0].summary.observed, [0, 0], "0 and false (→ 0) are kept");
  assert.deepStrictEqual(densityGroups([], {value: d => d.v, key: () => ""}), []);
});

it("densityGroups: passes the row index to the accessors", () => {
  const seen = [];
  densityGroups([{v: 1}, {v: 2}], {value: (d, i) => (seen.push(i), d.v), key: () => ""});
  assert.deepStrictEqual(seen, [0, 1]);
});

const summary = (peak, n) => ({peak, n});

it("densityWidthScale: area scales every curve by the widest peak", () => {
  const all = [summary(0.5, 10), summary(0.25, 40)];
  const scale = densityWidthScale(all, "area");
  assert.strictEqual(scale(all[0]), 2);
  assert.strictEqual(scale(all[1]), 2);
  assert.strictEqual(densityWidthScale(all)(all[0]), 2, "area is the default");
});

it("densityWidthScale: width scales each curve to its own peak", () => {
  const all = [summary(0.5, 10), summary(0.25, 40)];
  const scale = densityWidthScale(all, "width");
  assert.strictEqual(scale(all[0]) * 0.5, 1);
  assert.strictEqual(scale(all[1]) * 0.25, 1);
});

it("densityWidthScale: count weights each curve by its observations", () => {
  const all = [summary(0.5, 10), summary(0.25, 40)];
  const scale = densityWidthScale(all, "count");
  // Weighted peaks: 5 and 10; the second fills the width.
  near(scale(all[1]) * 0.25, 1, 1e-12, "largest weighted peak spans the width");
  near(scale(all[0]) * 0.5, 0.5, 1e-12, "half the observations, half the width");
});

it("densityWidthScale: zero peaks scale to 0", () => {
  const flat = [summary(0, 3)];
  assert.strictEqual(densityWidthScale(flat, "area")(flat[0]), 0);
  assert.strictEqual(densityWidthScale(flat, "width")(flat[0]), 0);
  assert.strictEqual(densityWidthScale(flat, "count")(flat[0]), 0);
  assert.strictEqual(densityWidthScale([], "area")(summary(1, 1)), 0);
});

it("sortByMedian: keeps data order, or sorts by median with stable ties", () => {
  const g = (key, median) => ({key, summary: {median}});
  const groups = [g("a", 3), g("b", 1), g("c", 3), g("d", 2)];
  assert.deepStrictEqual(sortByMedian(groups, false).map(d => d.key), ["a", "b", "c", "d"]);
  assert.deepStrictEqual(sortByMedian(groups, "ascending").map(d => d.key), ["b", "d", "a", "c"]);
  assert.deepStrictEqual(sortByMedian(groups, "descending").map(d => d.key), ["a", "c", "d", "b"]);
  assert.deepStrictEqual(sortByMedian(groups, "bogus").map(d => d.key), ["a", "b", "c", "d"]);
  assert.notStrictEqual(sortByMedian(groups, false), groups, "returns a copy");
  assert.deepStrictEqual(groups.map(d => d.key), ["a", "b", "c", "d"], "input untouched");
});

it("densityAt: interpolates between curve points and is 0 outside", () => {
  const curve = [[0, 0], [1, 2], [3, 0]];
  assert.strictEqual(densityAt(curve, 0), 0);
  assert.strictEqual(densityAt(curve, 1), 2);
  assert.strictEqual(densityAt(curve, 0.5), 1);
  assert.strictEqual(densityAt(curve, 2), 1);
  assert.strictEqual(densityAt(curve, 3), 0);
  assert.strictEqual(densityAt(curve, -1), 0);
  assert.strictEqual(densityAt(curve, 3.5), 0);
  assert.strictEqual(densityAt([], 1), 0);
  assert.strictEqual(densityAt([[2, 0.4]], 2), 0.4, "a one-point curve");
});
