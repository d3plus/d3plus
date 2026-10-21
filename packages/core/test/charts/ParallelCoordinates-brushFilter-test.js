import {it} from "vitest";
import assert from "assert";
import {
  brushFromPixels,
  hasBrushes,
  isNumericRange,
  pixelsFromBrush,
  rowPasses,
  valuePasses,
} from "../../src/charts/ParallelCoordinates/brushFilter.ts";

// A numeric axis from 0 (y = 200) up to 100 (y = 0), like a vertical axis.
const numeric = {
  type: "numeric",
  domain: [0, 100],
  position: v => 200 - v * 2,
  invert: px => (200 - px) / 2,
};
// A categorical axis with three points 50px apart.
const categorical = {
  type: "categorical",
  domain: ["a", "b", "c"],
  position: v => ({a: 50, b: 100, c: 150})[v] ?? NaN,
};

it("ParallelCoordinates brushFilter: isNumericRange tells a numeric range from a category list", () => {
  assert.ok(isNumericRange([1, 2]));
  assert.ok(!isNumericRange(["1", "2"]));
  assert.ok(!isNumericRange([1, 2, 3]));
  assert.ok(!isNumericRange(["a"]));
});

it("ParallelCoordinates brushFilter: valuePasses tests a value against a range or a category list", () => {
  assert.ok(valuePasses(5, [0, 10]));
  assert.ok(valuePasses(10, [10, 0]), "an inverted range still matches, inclusively");
  assert.ok(!valuePasses(11, [0, 10]));
  assert.ok(!valuePasses(null, [0, 10]), "missing values never pass");
  assert.ok(!valuePasses("5", [0, 10]), "a string is not inside a numeric range");
  assert.ok(valuePasses("b", ["a", "b"]));
  assert.ok(valuePasses(8, ["4", "8"]), "categories compare as strings");
  assert.ok(!valuePasses(undefined, ["a"]));
});

it("ParallelCoordinates brushFilter: rowPasses combines every brush with AND", () => {
  const brushes = {mpg: [20, 30], origin: ["USA"]};
  assert.ok(rowPasses({mpg: 25, origin: "USA"}, brushes));
  assert.ok(!rowPasses({mpg: 35, origin: "USA"}, brushes));
  assert.ok(!rowPasses({mpg: 25, origin: "Japan"}, brushes));
  assert.ok(rowPasses({mpg: 99}, undefined), "no brushes pass every row");
  assert.ok(rowPasses({mpg: 99}, {}));
});

it("ParallelCoordinates brushFilter: hasBrushes reports whether any brush is set", () => {
  assert.ok(!hasBrushes(undefined));
  assert.ok(!hasBrushes({}));
  assert.ok(hasBrushes({mpg: [1, 2]}));
});

it("ParallelCoordinates brushFilter: brushFromPixels inverts a numeric brush into a sorted value range", () => {
  assert.deepStrictEqual(brushFromPixels([40, 100], numeric), [50, 80]);
  assert.deepStrictEqual(brushFromPixels([100, 40], numeric), [50, 80], "pixel order doesn't matter");
  assert.strictEqual(brushFromPixels([0, 10], {...numeric, invert: undefined}), null);
});

it("ParallelCoordinates brushFilter: brushFromPixels picks the categories inside a categorical brush", () => {
  assert.deepStrictEqual(brushFromPixels([40, 110], categorical), ["a", "b"]);
  assert.strictEqual(brushFromPixels([60, 90], categorical), null, "no category inside");
});

it("ParallelCoordinates brushFilter: pixelsFromBrush draws a numeric range back onto its axis", () => {
  assert.deepStrictEqual(pixelsFromBrush([50, 80], numeric), [40, 100]);
  assert.strictEqual(pixelsFromBrush([50, 80], categorical), null, "a numeric range has no place on a categorical axis");
});

it("ParallelCoordinates brushFilter: pixelsFromBrush pads around the selected categories", () => {
  assert.deepStrictEqual(pixelsFromBrush(["c", "a"], categorical), [44, 156]);
  assert.deepStrictEqual(pixelsFromBrush(["b"], categorical, 10), [90, 110]);
  assert.strictEqual(pixelsFromBrush(["z"], categorical), null);
});
