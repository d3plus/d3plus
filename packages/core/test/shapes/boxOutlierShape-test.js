import {it} from "vitest";
import assert from "assert";
import {Circle, Rect} from "../../index.ts";
import {drawsOutlier, outlierShape} from "../../src/shapes/boxOutlierShape.ts";

it("outlierShape: the class a Box's outlier setting names", () => {
  assert.strictEqual(outlierShape("Circle"), Circle);
  assert.strictEqual(outlierShape("Rect"), Rect);
  for (const v of [false, undefined, null, "", "Line", "toString"])
    assert.strictEqual(outlierShape(v), undefined, `${v}`);
});

it("drawsOutlier: only a named outlier shape draws a point", () => {
  assert.strictEqual(drawsOutlier("Circle"), true);
  assert.strictEqual(drawsOutlier("Rect"), true);
  assert.strictEqual(drawsOutlier(false), false);
  assert.strictEqual(drawsOutlier("constructor"), false);
});
