import {it} from "vitest";
import assert from "assert";
import {
  largestRemainder,
  waffleCellGeometry,
  waffleCellPosition,
  waffleCounts,
  waffleGrid,
} from "../../src/charts/Waffle/waffleLayout.ts";

const total = arr => arr.reduce((a, b) => a + b, 0);

it("largestRemainder: splits exact quotas without rounding", () => {
  assert.deepStrictEqual(largestRemainder([50, 30, 20], 100), [50, 30, 20]);
  assert.deepStrictEqual(largestRemainder([1, 1], 10), [5, 5]);
});

it("largestRemainder: hands leftover units to the largest remainders, always summing to the total", () => {
  // Quotas 33.3̅ each: one leftover unit goes to the first (tie → earlier).
  assert.deepStrictEqual(largestRemainder([1, 1, 1], 100), [34, 33, 33]);
  // Quotas 43.1, 18.6, 16.2, 10.2, 5.7, 3.9, 2.3 → floors sum to 97; .9 .7 .6 win.
  const energy = [43.1, 18.6, 16.2, 10.2, 5.7, 3.9, 2.3];
  assert.deepStrictEqual(largestRemainder(energy, 100), [43, 19, 16, 10, 6, 4, 2]);
  for (const values of [[7, 13, 29, 1], [0.1, 0.2, 0.7], [999, 1, 1, 1], [3, 3, 3, 3, 3, 3, 3]])
    for (const units of [1, 7, 10, 100, 250])
      assert.strictEqual(total(largestRemainder(values, units)), units, `${values} into ${units}`);
});

it("largestRemainder: breaks equal remainders toward the larger value, then the earlier one", () => {
  // Quotas 2.5 and 7.5 — equal remainders; the larger value takes the unit.
  assert.deepStrictEqual(largestRemainder([1, 3], 10), [2, 8]);
  assert.deepStrictEqual(largestRemainder([3, 1], 10), [8, 2]);
  // Same value and remainder: the earlier one wins.
  assert.deepStrictEqual(largestRemainder([1, 1], 3), [2, 1]);
});

it("largestRemainder: gives nothing to zero, negative, or non-finite values", () => {
  assert.deepStrictEqual(largestRemainder([5, 0, -3, NaN, 5], 10), [5, 0, 0, 0, 5]);
  assert.deepStrictEqual(largestRemainder([0, 0], 10), [0, 0], "no positive values");
  assert.deepStrictEqual(largestRemainder([2, 3], 0), [0, 0], "no units");
  assert.deepStrictEqual(largestRemainder([], 10), []);
  // A tiny value can lose its only unit to larger remainders, but never goes negative.
  const counts = largestRemainder([1000, 1], 10);
  assert.deepStrictEqual(counts, [10, 0]);
});

it("largestRemainder: rounds a fractional total", () => {
  assert.strictEqual(total(largestRemainder([1, 2, 3], 9.6)), 10);
});

it("waffleCounts: shares every cell of the grid by default", () => {
  assert.deepStrictEqual(waffleCounts([60, 30, 10], {cells: 100}), [60, 30, 10]);
  assert.deepStrictEqual(waffleCounts([60, 30, 10], {cells: 20}), [12, 6, 2]);
});

it("waffleCounts: with a unit, each cell counts that much of the value", () => {
  assert.deepStrictEqual(waffleCounts([14, 5, 3], {cells: 100, unit: 1}), [14, 5, 3]);
  // 18400 + 3150 + 6870 + 1240 = 29660 → 59.32 → 59 cells of 500.
  const counts = waffleCounts([18400, 3150, 6870, 1240], {cells: 100, unit: 500});
  assert.strictEqual(total(counts), 59);
  assert.deepStrictEqual(counts, [37, 6, 14, 2]);
});

it("waffleCounts: ignores a unit that isn't a positive number", () => {
  for (const unit of [0, -5, NaN, Infinity])
    assert.deepStrictEqual(waffleCounts([1, 1], {cells: 10, unit}), [5, 5], String(unit));
});

it("waffleGrid: keeps rows × columns by default", () => {
  assert.deepStrictEqual(waffleGrid(37, {rows: 10, columns: 10, fillDirection: "row"}), {rows: 10, columns: 10});
  assert.deepStrictEqual(waffleGrid(0, {rows: 4, columns: 25, fillDirection: "column"}), {rows: 4, columns: 25});
});

it("waffleGrid: with a unit, grows along the fill direction to fit the count", () => {
  const unit = 1;
  assert.deepStrictEqual(waffleGrid(30, {rows: 10, columns: 10, fillDirection: "row", unit}), {rows: 3, columns: 10});
  assert.deepStrictEqual(waffleGrid(59, {rows: 10, columns: 12, fillDirection: "row", unit}), {rows: 5, columns: 12});
  assert.deepStrictEqual(waffleGrid(59, {rows: 4, columns: 12, fillDirection: "column", unit}), {rows: 4, columns: 15});
  assert.deepStrictEqual(waffleGrid(0, {rows: 4, columns: 12, fillDirection: "row", unit}), {rows: 1, columns: 12}, "an empty grid keeps one row");
});

it("waffleGrid: coerces invalid sizes to at least one row and column", () => {
  assert.deepStrictEqual(waffleGrid(10, {rows: 0, columns: NaN, fillDirection: "row"}), {rows: 1, columns: 1});
  assert.deepStrictEqual(waffleGrid(10, {rows: 3.6, columns: -2, fillDirection: "row"}), {rows: 4, columns: 1});
});

it("waffleCellPosition: fills along rows from the top left by default", () => {
  const grid = {rows: 3, columns: 4, fillDirection: "row", fillStart: "top-left"};
  assert.deepStrictEqual(waffleCellPosition(0, grid), {row: 0, column: 0});
  assert.deepStrictEqual(waffleCellPosition(3, grid), {row: 0, column: 3});
  assert.deepStrictEqual(waffleCellPosition(4, grid), {row: 1, column: 0});
  assert.deepStrictEqual(waffleCellPosition(11, grid), {row: 2, column: 3});
});

it("waffleCellPosition: fills down columns", () => {
  const grid = {rows: 3, columns: 4, fillDirection: "column", fillStart: "top-left"};
  assert.deepStrictEqual(waffleCellPosition(2, grid), {row: 2, column: 0});
  assert.deepStrictEqual(waffleCellPosition(3, grid), {row: 0, column: 1});
  assert.deepStrictEqual(waffleCellPosition(11, grid), {row: 2, column: 3});
});

it("waffleCellPosition: starts from any corner", () => {
  const at = (fillStart, fillDirection = "row") =>
    waffleCellPosition(1, {rows: 3, columns: 4, fillDirection, fillStart});
  assert.deepStrictEqual(at("top-right"), {row: 0, column: 2});
  assert.deepStrictEqual(at("bottom-left"), {row: 2, column: 1});
  assert.deepStrictEqual(at("bottom-right"), {row: 2, column: 2});
  assert.deepStrictEqual(at("bottom-left", "column"), {row: 1, column: 0});
  assert.deepStrictEqual(at("bottom-right", "column"), {row: 1, column: 3});
});

it("waffleCellPosition: visits every cell of the grid exactly once", () => {
  for (const fillDirection of ["row", "column"])
    for (const fillStart of ["top-left", "top-right", "bottom-left", "bottom-right"]) {
      const seen = new Set();
      for (let k = 0; k < 12; k++) {
        const {row, column} = waffleCellPosition(k, {rows: 3, columns: 4, fillDirection, fillStart});
        assert.ok(row >= 0 && row < 3 && column >= 0 && column < 4);
        seen.add(`${row},${column}`);
      }
      assert.strictEqual(seen.size, 12, `${fillDirection} from ${fillStart}`);
    }
});

it("waffleCellGeometry: sizes square cells to the tighter side and centers the grid", () => {
  const g = waffleCellGeometry(500, 218, {rows: 10, columns: 10, padding: 2});
  // (218 + 2) / 10 = 22 pitch → 20px cells; the grid is 218 wide.
  assert.strictEqual(g.size, 20);
  assert.strictEqual(g.padding, 2);
  assert.strictEqual(g.y, 0);
  assert.strictEqual(g.x, (500 - 218) / 2);
});

it("waffleCellGeometry: fits a non-square grid", () => {
  const g = waffleCellGeometry(400, 400, {rows: 2, columns: 8, padding: 0});
  assert.strictEqual(g.size, 50);
  assert.strictEqual(g.x, 0);
  assert.strictEqual(g.y, 150);
});

it("waffleCellGeometry: shrinks a gap that would swallow tiny cells", () => {
  const g = waffleCellGeometry(30, 30, {rows: 10, columns: 10, padding: 5});
  assert.ok(g.padding <= 0.4 * (g.size + g.padding) + 1e-9, "the gap is at most 40% of the pitch");
  assert.ok(g.size > 0);
  const width = 10 * g.size + 9 * g.padding;
  assert.ok(width <= 30 + 1e-9, "the grid still fits");
});

it("waffleCellGeometry: collapses to nothing in an empty area", () => {
  const g = waffleCellGeometry(0, -10, {rows: 10, columns: 10, padding: 2});
  assert.strictEqual(g.size, 0);
  assert.ok(Number.isFinite(g.x) && Number.isFinite(g.y));
});
