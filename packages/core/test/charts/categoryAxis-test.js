import {it} from "vitest";
import assert from "assert";
import {
  categoryAxes,
  hasCategoryValues,
  isCategoryAxis,
} from "../../src/charts/Plot/categoryAxis.ts";

const viz = (schema = {}, extra = {}) => ({schema, ...extra});

it("hasCategoryValues — text that doesn't read as a number", () => {
  assert.strictEqual(hasCategoryValues(["Apples", "Bananas"]), true);
  assert.strictEqual(hasCategoryValues([1, 2, "Other"]), true, "any text");
  assert.strictEqual(hasCategoryValues([1, 2.5, 3]), false);
  assert.strictEqual(hasCategoryValues(["2019", "1.5", "-3"]), false);
  assert.strictEqual(hasCategoryValues([new Date(), undefined, null]), false);
  assert.strictEqual(hasCategoryValues([]), false);
});

it("categoryAxes — an axis with text, and its secondary axis", () => {
  const x = ["a", "b"],
    y = [1, 2];
  assert.deepStrictEqual(categoryAxes(viz(), {x, y}), ["x", "x2"]);
  assert.deepStrictEqual(categoryAxes(viz(), {x: y, y: x}), ["y", "y2"]);
  assert.deepStrictEqual(categoryAxes(viz(), {x, y: x}), [
    "x",
    "x2",
    "y",
    "y2",
  ]);
  assert.deepStrictEqual(categoryAxes(viz(), {x: y, y}), []);
  assert.deepStrictEqual(categoryAxes(viz(), {}), []);
});

it("categoryAxes — skips the discrete, sorted, and time axes", () => {
  const x = ["a", "b"];
  assert.deepStrictEqual(categoryAxes(viz({discrete: "x"}), {x, y: x}), [
    "y",
    "y2",
  ]);
  assert.deepStrictEqual(categoryAxes(viz({xSort: () => 0}), {x}), []);
  assert.deepStrictEqual(categoryAxes(viz({}, {_xTime: true}), {x}), []);
});

it("isCategoryAxis — reads the axes the draw noted", () => {
  const v = viz({}, {_categoryAxes: ["x", "x2"]});
  assert.strictEqual(isCategoryAxis(v, "x"), true);
  assert.strictEqual(isCategoryAxis(v, "x2"), true);
  assert.strictEqual(isCategoryAxis(v, "y"), false);
  assert.strictEqual(isCategoryAxis(viz(), "x"), false, "before a draw");
});
