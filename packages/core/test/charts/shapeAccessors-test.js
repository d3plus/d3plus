import {it} from "vitest";
import assert from "assert";
import {
  plotShapeAccessors,
  shapeAccessor,
  withShapeAccessors,
} from "../../src/charts/Plot/shapeAccessors.ts";

/**
    A Plot reads its shapes' per-datum keys as the Shape setters do: a
    function as given, a string as a data field, anything else a constant.
*/

it("shapeAccessor — a string reads that field, anything else is a constant", () => {
  const row = {w: 14, h: "9"};
  assert.strictEqual(shapeAccessor("w")(row, 0), 14);
  assert.strictEqual(shapeAccessor("h")(row, 0), "9");
  assert.strictEqual(shapeAccessor("missing")(row, 0), undefined);
  assert.strictEqual(shapeAccessor(12)(row, 0), 12);
  assert.strictEqual(shapeAccessor(0)(row, 0), 0, "zero too");
  assert.strictEqual(shapeAccessor(null)(row, 0), null);
  const fn = d => d.w;
  assert.strictEqual(shapeAccessor(fn), fn);
  assert.strictEqual(shapeAccessor(undefined), undefined);
});

it("withShapeAccessors — makes each accessor key a function, keeping the rest", () => {
  const labelConfig = {width: 40};
  const source = {
    width: 12,
    height: "h",
    r: 0,
    x: 3,
    y: "y",
    id: "name",
    curve: "linear",
    fill: "red",
    hitArea: false,
    labelConfig,
  };
  const config = withShapeAccessors(source);
  const row = {h: 7, y: 2, name: "a"};
  assert.strictEqual(config.width(row, 0), 12);
  assert.strictEqual(config.height(row, 0), 7);
  assert.strictEqual(config.r(row, 0), 0);
  assert.strictEqual(config.x(row, 0), 3);
  assert.strictEqual(config.y(row, 0), 2);
  assert.strictEqual(config.id(row, 0), "a");
  assert.strictEqual(config.curve, "linear");
  assert.strictEqual(config.fill, "red", "only the accessor keys");
  assert.strictEqual(config.hitArea, false);
  assert.strictEqual(config.labelConfig, labelConfig);
  assert.strictEqual(source.width, 12, "the config is untouched");
  assert.ok(!("height" in withShapeAccessors({width: 1})), "adds no keys");
  assert.strictEqual(withShapeAccessors(undefined), undefined);
  assert.strictEqual(withShapeAccessors(12), undefined);
});

it("plotShapeAccessors — the shared keys and each shape's, not nested configs", () => {
  const config = plotShapeAccessors({
    r: 4,
    labelConfig: {width: 40},
    Rect: {width: "w", labelConfig: {height: 9}},
    Circle: {r: "size"},
    Box: {whiskerConfig: {width: 3}},
  });
  const row = {w: 20, size: 6};
  assert.strictEqual(config.r(row, 0), 4);
  assert.strictEqual(config.Rect.width(row, 0), 20);
  assert.strictEqual(config.Circle.r(row, 0), 6);
  assert.deepStrictEqual(config.labelConfig, {width: 40});
  assert.deepStrictEqual(config.Rect.labelConfig, {height: 9});
  assert.deepStrictEqual(config.Box.whiskerConfig, {width: 3});
});
