import assert from "assert";
import {colorLighter} from "@d3plus/color";
import {
  sunburstShadeActive,
  sunburstShadeAmount,
  sunburstShadeDefaults,
  sunburstShadeFill,
} from "../../es/src/charts/Sunburst/shade.js";

const close = (a, b, msg) =>
  assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} vs ${b}`);

it("Sunburst shade: the top ring keeps its color", () => {
  assert.strictEqual(sunburstShadeAmount(0), 0);
  assert.strictEqual(sunburstShadeAmount(-1), 0);
});

it("Sunburst shade: each ring lightens one step more than the ring inside it", () => {
  assert.deepStrictEqual(sunburstShadeDefaults, {step: 0.22, max: 0.6});
  close(sunburstShadeAmount(1), 0.22, "second ring");
  close(sunburstShadeAmount(2), 0.44, "third ring");
});

it("Sunburst shade: caps the lightening so deep rings keep their hue", () => {
  assert.strictEqual(sunburstShadeAmount(3), 0.6);
  assert.strictEqual(sunburstShadeAmount(9), 0.6);
});

it("Sunburst shade: honors a custom step and cap", () => {
  close(sunburstShadeAmount(2, {step: 0.1}), 0.2, "custom step");
  close(sunburstShadeAmount(3, {max: 0.3}), 0.3, "custom cap");
  assert.strictEqual(sunburstShadeAmount(2, {step: 0}), 0);
});

it("Sunburst shade: sunburstShadeFill lightens with colorLighter and passes non-colors through", () => {
  assert.strictEqual(
    sunburstShadeFill("#4c6ef5", 0.3),
    colorLighter("#4c6ef5", 0.3),
  );
  assert.strictEqual(sunburstShadeFill("#4c6ef5", 0), "#4c6ef5");
  assert.strictEqual(sunburstShadeFill("none", 0.3), "none");
  assert.strictEqual(sunburstShadeFill("pattern:abc", 0.3), "pattern:abc");
  assert.strictEqual(sunburstShadeFill(undefined, 0.3), undefined);
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
  assert.strictEqual(sunburstShadeActive(schema(), defaults), true);
  assert.strictEqual(
    sunburstShadeActive(schema({shade: false}), defaults),
    false,
    "turned off",
  );
  assert.strictEqual(
    sunburstShadeActive(schema({colorScale: "value"}), defaults),
    false,
    "colorScale",
  );
  assert.strictEqual(
    sunburstShadeActive(schema({colorOrdinal: true}), defaults),
    false,
    "ordinal colors",
  );
  assert.strictEqual(
    sunburstShadeActive(schema({color: () => "B"}), defaults),
    false,
    "user color accessor",
  );
  assert.strictEqual(
    sunburstShadeActive(schema({shapeConfig: {fill: () => "red"}}), defaults),
    false,
    "user fill",
  );
  assert.strictEqual(
    sunburstShadeActive(
      schema({shapeConfig: {fill, Path: {fill: "red"}}}),
      defaults,
    ),
    false,
    "user Path fill",
  );
});
