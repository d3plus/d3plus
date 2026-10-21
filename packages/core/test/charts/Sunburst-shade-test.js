import assert from "assert";
import {colorLighter} from "@d3plus/color";
import {
  partitionShadeActive,
  partitionShadeAmount,
  partitionShadeDefaults,
  partitionShadeFill,
} from "../../es/src/charts/partition/shade.js";

const close = (a, b, msg) =>
  assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} vs ${b}`);

it("Sunburst shade: the top ring keeps its color", () => {
  assert.strictEqual(partitionShadeAmount(0), 0);
  assert.strictEqual(partitionShadeAmount(-1), 0);
});

it("Sunburst shade: each ring lightens one step more than the ring inside it", () => {
  assert.deepStrictEqual(partitionShadeDefaults, {step: 0.22, max: 0.6});
  close(partitionShadeAmount(1), 0.22, "second ring");
  close(partitionShadeAmount(2), 0.44, "third ring");
});

it("Sunburst shade: caps the lightening so deep rings keep their hue", () => {
  assert.strictEqual(partitionShadeAmount(3), 0.6);
  assert.strictEqual(partitionShadeAmount(9), 0.6);
});

it("Sunburst shade: honors a custom step and cap", () => {
  close(partitionShadeAmount(2, {step: 0.1}), 0.2, "custom step");
  close(partitionShadeAmount(3, {max: 0.3}), 0.3, "custom cap");
  assert.strictEqual(partitionShadeAmount(2, {step: 0}), 0);
});

it("Sunburst shade: partitionShadeFill lightens with colorLighter and passes non-colors through", () => {
  assert.strictEqual(
    partitionShadeFill("#4c6ef5", 0.3),
    colorLighter("#4c6ef5", 0.3),
  );
  assert.strictEqual(partitionShadeFill("#4c6ef5", 0), "#4c6ef5");
  assert.strictEqual(partitionShadeFill("none", 0.3), "none");
  assert.strictEqual(partitionShadeFill("pattern:abc", 0.3), "pattern:abc");
  assert.strictEqual(partitionShadeFill(undefined, 0.3), undefined);
});

it("Sunburst shade: applies only on the default color path", () => {
  const color = () => "A";
  const fill = () => "#000";
  const schema = (extra = {}) => ({
    shade: true,
    color,
    shapeConfig: {fill},
    ...extra,
  });
  const defaults = {color, fill};
  assert.strictEqual(partitionShadeActive(schema(), defaults), true);
  assert.strictEqual(
    partitionShadeActive(schema({shade: false}), defaults),
    false,
    "turned off",
  );
  assert.strictEqual(
    partitionShadeActive(schema({colorScale: "value"}), defaults),
    false,
    "colorScale",
  );
  assert.strictEqual(
    partitionShadeActive(schema({colorOrdinal: true}), defaults),
    false,
    "ordinal colors",
  );
  assert.strictEqual(
    partitionShadeActive(schema({color: () => "B"}), defaults),
    false,
    "user color accessor",
  );
  assert.strictEqual(
    partitionShadeActive(schema({shapeConfig: {fill: () => "red"}}), defaults),
    false,
    "user fill",
  );
  assert.strictEqual(
    partitionShadeActive(
      schema({shapeConfig: {fill, Path: {fill: "red"}}}),
      defaults,
    ),
    false,
    "user Path fill",
  );
});
