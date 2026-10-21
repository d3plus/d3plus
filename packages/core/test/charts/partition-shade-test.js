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

const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} vs ${b}`);

const color = () => "blue";
const fill = () => "#4c6ef5";
const defaults = {color, fill};
const schema = (extra = {}) => ({
  shade: true,
  color,
  shapeConfig: {fill},
  ...extra,
});

it("partition shade: the top level keeps its color", () => {
  assert.strictEqual(partitionShadeAmount(0), 0);
  assert.strictEqual(partitionShadeAmount(-1), 0);
});

it("partition shade: each level lightens one step more than its parent, up to the cap", () => {
  assert.deepStrictEqual(partitionShadeDefaults, {step: 0.22, max: 0.6});
  assert.strictEqual(partitionShadeAmount(1), 0.22);
  close(partitionShadeAmount(2), 0.44, "third level");
  assert.strictEqual(partitionShadeAmount(3), 0.6);
  assert.strictEqual(partitionShadeAmount(5), 0.6);
  assert.strictEqual(partitionShadeAmount(9), 0.6);
});

it("partition shade: honors a custom step and cap", () => {
  assert.strictEqual(partitionShadeAmount(2, {step: 0.1}), 0.2);
  close(partitionShadeAmount(3, {max: 0.3}), 0.3, "custom cap");
  assert.strictEqual(partitionShadeAmount(2, {step: 0}), 0);
});

it("partition shade: partitionShadeFill lightens colors and passes the rest through", () => {
  assert.strictEqual(partitionShadeFill("#4c6ef5", 0.3), colorLighter("#4c6ef5", 0.3));
  assert.strictEqual(partitionShadeFill("#4c6ef5", 0), "#4c6ef5");
  assert.strictEqual(partitionShadeFill("none", 0.3), "none");
  assert.strictEqual(partitionShadeFill("url(#x)", 0.3), "url(#x)");
  assert.strictEqual(partitionShadeFill("pattern:abc", 0.3), "pattern:abc");
  assert.strictEqual(partitionShadeFill(undefined, 0.3), undefined);
});

it("partition shade: partitionShadeActive applies only on the default color path", () => {
  assert.strictEqual(partitionShadeActive(schema(), defaults), true);
  assert.strictEqual(partitionShadeActive(schema({shade: false}), defaults), false, "turned off");
  assert.strictEqual(partitionShadeActive(schema({colorScale: "v"}), defaults), false, "colorScale");
  assert.strictEqual(partitionShadeActive(schema({colorOrdinal: true}), defaults), false, "ordinal colors");
  assert.strictEqual(partitionShadeActive(schema({color: () => "red"}), defaults), false, "user color accessor");
  assert.strictEqual(partitionShadeActive(schema({shapeConfig: {fill: () => "red"}}), defaults), false, "user fill");
});

it("partition shade: partitionShadeActive reads the chart's own shapeConfig key", () => {
  const rectFill = schema({shapeConfig: {fill, Rect: {fill: "red"}}});
  assert.strictEqual(partitionShadeActive(rectFill, defaults, "Rect"), false);
  assert.strictEqual(partitionShadeActive(rectFill, defaults), true, "Path is the default key");
  const pathFill = schema({shapeConfig: {fill, Path: {fill: "red"}}});
  assert.strictEqual(partitionShadeActive(pathFill, defaults), false, "user Path fill");
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
