import {it} from "vitest";
import assert from "assert";
import {
  BIVARIATE_COLORS,
  bivariateBins,
  bivariateBucketCount,
  bivariatePalette,
  bivariateScale,
  isBivariatePair,
  resampleGrid,
} from "../../src/components/ColorScale/bivariateScale.ts";

/** Every value's bin. */
const binsOf = (values, n) => {
  const {bin} = bivariateBins(values, n);
  return values.map(bin);
};

it("BIVARIATE_COLORS — Stevens' blue–red 3×3, low/low first", () => {
  assert.deepStrictEqual(BIVARIATE_COLORS, [
    "#e8e8e8",
    "#e4acac",
    "#c85a5a",
    "#b0d5df",
    "#ad9ea5",
    "#985356",
    "#64acbe",
    "#627f8c",
    "#574249",
  ]);
});

it("bivariateBucketCount — 3 by default, held within 2–4", () => {
  assert.strictEqual(bivariateBucketCount(undefined), 3);
  assert.strictEqual(bivariateBucketCount("4"), 3, "a string isn't a count");
  assert.strictEqual(bivariateBucketCount(NaN), 3);
  assert.strictEqual(bivariateBucketCount(2), 2);
  assert.strictEqual(bivariateBucketCount(4), 4);
  assert.strictEqual(bivariateBucketCount(1), 2);
  assert.strictEqual(bivariateBucketCount(9), 4);
  assert.strictEqual(bivariateBucketCount(2.6), 3, "rounds");
});

it("bivariateBins — quantiles holding equal shares of the values", () => {
  const nine = [5, 1, 9, 3, 7, 2, 8, 4, 6];
  assert.deepStrictEqual(binsOf(nine, 3), [1, 0, 2, 0, 2, 0, 2, 1, 1]);
  const ten = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  assert.deepStrictEqual(binsOf(ten, 3), [0, 0, 0, 1, 1, 1, 1, 2, 2, 2]);
  assert.deepStrictEqual(binsOf(ten, 2), [0, 0, 0, 0, 0, 1, 1, 1, 1, 1]);
  assert.deepStrictEqual(
    binsOf([1, 2, 3, 4, 5, 6, 7, 8], 4),
    [0, 0, 1, 1, 2, 2, 3, 3],
  );
  const {ranges} = bivariateBins(ten, 3);
  assert.deepStrictEqual(ranges, [
    [1, 3],
    [4, 7],
    [8, 10],
  ]);
});

it("bivariateBins — ties share a bin, ranked at their middle", () => {
  assert.deepStrictEqual(binsOf([1, 1, 1, 2], 3), [1, 1, 1, 2]);
  assert.deepStrictEqual(binsOf([1, 2, 2, 2], 3), [0, 1, 1, 1]);
  assert.deepStrictEqual(binsOf([1, 1, 2, 2], 2), [0, 0, 1, 1]);
  assert.deepStrictEqual(
    binsOf([4, 4, 4], 3),
    [1, 1, 1],
    "one value sits in the middle",
  );
  assert.deepStrictEqual(binsOf([4, 4], 2), [1, 1]);
  // A tie group whose middle rank lands right on a bin's edge.
  assert.deepStrictEqual(binsOf([1, 1, 1, 1, 2, 2], 3), [1, 1, 1, 1, 2, 2]);
  const {ranges} = bivariateBins([1, 1, 1, 2], 3);
  assert.deepStrictEqual(ranges, [null, [1, 1], [2, 2]], "an empty bin");
});

it("bivariateBins — ignores missing values, and ranks any value", () => {
  const {bin, ranges} = bivariateBins([3, NaN, 1, undefined, 2, null], 3);
  assert.deepStrictEqual([1, 2, 3].map(bin), [0, 1, 2]);
  assert.deepStrictEqual(ranges, [
    [1, 1],
    [2, 2],
    [3, 3],
  ]);
  assert.strictEqual(bin(-50), 0, "below the data");
  assert.strictEqual(bin(50), 2, "above the data");
  assert.strictEqual(bin(NaN), 0);
  assert.strictEqual(bivariateBins([], 3).bin(4), 0, "no data");
});

it("resampleGrid — keeps a grid of the size asked for", () => {
  const grid = resampleGrid(BIVARIATE_COLORS, 3);
  assert.deepStrictEqual(grid, BIVARIATE_COLORS);
  assert.notStrictEqual(grid, BIVARIATE_COLORS, "a copy");
});

it("resampleGrid — a 2×2 keeps the corners", () => {
  assert.deepStrictEqual(resampleGrid(BIVARIATE_COLORS, 2), [
    "#e8e8e8",
    "#c85a5a",
    "#64acbe",
    "#574249",
  ]);
});

it("resampleGrid — a 4×4 keeps the corners and blends between", () => {
  const grid = resampleGrid(BIVARIATE_COLORS, 4);
  assert.strictEqual(grid.length, 16);
  assert.strictEqual(grid[0], "#e8e8e8");
  assert.strictEqual(grid[3], "#c85a5a");
  assert.strictEqual(grid[12], "#64acbe");
  assert.strictEqual(grid[15], "#574249");
  assert.ok(
    grid.every(c => /^#[0-9a-f]{6}$/.test(c)),
    "hex colors",
  );
  // The second cell along the first row sits 2/3 of the way from #e8e8e8
  // to #e4acac: rgb(229.3, 192, 192).
  assert.strictEqual(grid[1], "#e5c0c0");
});

it("resampleGrid — bilinear blend of a 2×2 into a 3×3", () => {
  const grid = resampleGrid(["#000000", "#ff0000", "#0000ff", "#ff00ff"], 3);
  assert.deepStrictEqual(grid, [
    "#000000",
    "#800000",
    "#ff0000",
    "#000080",
    "#800080",
    "#ff0080",
    "#0000ff",
    "#8000ff",
    "#ff00ff",
  ]);
});

it("resampleGrid — not a square grid of at least 2×2", () => {
  assert.deepStrictEqual(resampleGrid(["#000"], 3), []);
  assert.deepStrictEqual(resampleGrid(["#000", "#111", "#222"], 3), []);
});

it("bivariatePalette — Stevens' scheme unless given a square grid", () => {
  assert.deepStrictEqual(bivariatePalette(undefined, 3), BIVARIATE_COLORS);
  assert.deepStrictEqual(
    bivariatePalette(["#000", "#f00", "#00f"], 3),
    BIVARIATE_COLORS,
    "not square",
  );
  assert.deepStrictEqual(
    bivariatePalette(["#000", "#f00", "#00f", "nope"], 2),
    resampleGrid(BIVARIATE_COLORS, 2),
    "not all colors",
  );
  const own = ["#000000", "#ff0000", "#0000ff", "#ff00ff"];
  assert.deepStrictEqual(bivariatePalette(own, 2), own);
  assert.strictEqual(bivariatePalette(own, 4).length, 16);
});

it("isBivariatePair — two finite numbers", () => {
  assert.ok(isBivariatePair([1, 2]));
  assert.ok(!isBivariatePair([1]));
  assert.ok(!isBivariatePair([1, NaN]));
  assert.ok(!isBivariatePair(["1", 2]));
  assert.ok(!isBivariatePair(3));
  assert.ok(!isBivariatePair(undefined));
});

it("bivariateScale — a pair's bins pick its cell and color", () => {
  const pairs = [
    [1, 10],
    [2, 30],
    [3, 20],
    [4, 60],
    [5, 50],
    [6, 40],
    [7, 90],
    [8, 80],
    [9, 70],
  ];
  const scale = bivariateScale(pairs, 3, BIVARIATE_COLORS);
  assert.deepStrictEqual(scale.cell([1, 10]), [0, 0]);
  assert.deepStrictEqual(scale.cell([5, 50]), [1, 1]);
  assert.deepStrictEqual(scale.cell([9, 70]), [2, 2]);
  assert.deepStrictEqual(scale.cell([2, 80]), [0, 2]);
  assert.strictEqual(scale([1, 10]), "#e8e8e8", "low/low");
  assert.strictEqual(scale([9, 10]), "#c85a5a", "the first variable high");
  assert.strictEqual(scale([1, 90]), "#64acbe", "the second variable high");
  assert.strictEqual(scale([9, 90]), "#574249", "high/high");
  assert.strictEqual(scale([5, 50]), "#ad9ea5");
  assert.strictEqual(scale(5), undefined, "not a pair");
  assert.strictEqual(scale(undefined), undefined);
  assert.strictEqual(scale.cell([1, NaN]), null);
  assert.strictEqual(scale.size, 3);
  assert.deepStrictEqual(scale.domain(), pairs);
  assert.deepStrictEqual(scale.range(), BIVARIATE_COLORS);
});

it("bivariateScale — 2×2 and 4×4", () => {
  const pairs = [1, 2, 3, 4, 5, 6, 7, 8].map(v => [v, 9 - v]);
  const two = bivariateScale(pairs, 2, bivariatePalette(undefined, 2));
  assert.strictEqual(two([1, 8]), "#64acbe");
  assert.strictEqual(two([8, 1]), "#c85a5a");
  const four = bivariateScale(pairs, 4, bivariatePalette(undefined, 4));
  assert.deepStrictEqual(four.cell([3, 6]), [1, 2]);
  assert.strictEqual(four([8, 1]), "#c85a5a");
});
