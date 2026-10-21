import {it} from "vitest";
import assert from "assert";
import {colorLighter} from "@d3plus/color";
import {
  partitionFillResolver,
  partitionShadeActive,
  partitionShadeAmount,
  partitionShadeDefaults,
  partitionShadeFill,
} from "../../src/charts/partition/shade.ts";

const color = () => "blue";
const fill = () => "#4c6ef5";
const defaults = {color, fill};
const schema = (extra = {}) => ({
  shade: true,
  color,
  shapeConfig: {fill},
  ...extra,
});

it("partition shade: partitionShadeAmount steps per level up to the cap", () => {
  assert.deepStrictEqual(partitionShadeDefaults, {step: 0.22, max: 0.6});
  assert.strictEqual(partitionShadeAmount(0), 0);
  assert.strictEqual(partitionShadeAmount(-1), 0);
  assert.strictEqual(partitionShadeAmount(1), 0.22);
  assert.strictEqual(partitionShadeAmount(5), 0.6);
  assert.strictEqual(partitionShadeAmount(2, {step: 0.1}), 0.2);
});

it("partition shade: partitionShadeFill lightens colors and passes the rest through", () => {
  assert.strictEqual(partitionShadeFill("#4c6ef5", 0.3), colorLighter("#4c6ef5", 0.3));
  assert.strictEqual(partitionShadeFill("#4c6ef5", 0), "#4c6ef5");
  assert.strictEqual(partitionShadeFill("url(#x)", 0.3), "url(#x)");
  assert.strictEqual(partitionShadeFill(undefined, 0.3), undefined);
});

it("partition shade: partitionShadeActive reads the chart's own shapeConfig key", () => {
  assert.strictEqual(partitionShadeActive(schema(), defaults), true);
  assert.strictEqual(partitionShadeActive(schema({shade: false}), defaults), false);
  assert.strictEqual(partitionShadeActive(schema({colorScale: "v"}), defaults), false);
  assert.strictEqual(partitionShadeActive(schema({color: () => "red"}), defaults), false);
  const rectFill = schema({shapeConfig: {fill, Rect: {fill: "red"}}});
  assert.strictEqual(partitionShadeActive(rectFill, defaults, "Rect"), false);
  assert.strictEqual(partitionShadeActive(rectFill, defaults), true, "Path is the default key");
  const pathFill = schema({shapeConfig: {fill, Path: {fill: "red"}}});
  assert.strictEqual(partitionShadeActive(pathFill, defaults, "Rect"), true);
});

it("partition shade: partitionFillResolver shades by level on the default path only", () => {
  const sc = {fill: d => d.c};
  const node = level => ({datum: {c: "#4c6ef5"}, i: 0, level});
  const shaded = partitionFillResolver(schema(), sc, defaults, "Rect");
  assert.strictEqual(shaded(node(0)), "#4c6ef5");
  assert.strictEqual(shaded(node(1)), colorLighter("#4c6ef5", 0.22));
  const custom = partitionFillResolver(
    schema({shadeConfig: {step: 0.1}}),
    sc,
    defaults,
    "Rect",
  );
  assert.strictEqual(custom(node(2)), colorLighter("#4c6ef5", 0.2));
  const off = partitionFillResolver(schema({shade: false}), sc, defaults, "Rect");
  assert.strictEqual(off(node(2)), "#4c6ef5");
  const none = partitionFillResolver(schema(), {fill: () => 4}, defaults, "Rect");
  assert.strictEqual(none(node(1)), undefined, "a non-string fill resolves to nothing");
});
