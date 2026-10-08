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

it("Sunburst shade: the top ring keeps its color, whatever its sibling rank", () => {
  assert.strictEqual(sunburstShadeAmount(0, 0), 0);
  assert.strictEqual(sunburstShadeAmount(0, 1), 0);
});

it("Sunburst shade: lightens 0.1 per level plus 0.32 across siblings", () => {
  close(sunburstShadeAmount(1, 0), 0.1, "largest child");
  close(sunburstShadeAmount(1, 1), 0.42, "smallest child");
  close(sunburstShadeAmount(1, 0.5), 0.26, "middle child");
  close(sunburstShadeAmount(2, 0.25), 0.28, "second level");
});

it("Sunburst shade: caps the lightening so outer slivers keep their hue", () => {
  assert.strictEqual(sunburstShadeDefaults.max, 0.5);
  assert.strictEqual(sunburstShadeAmount(2, 1), 0.5);
  assert.strictEqual(sunburstShadeAmount(9, 1), 0.5);
  close(sunburstShadeAmount(1, 5), 0.42, "spread clamps to 1");
});

it("Sunburst shade: honors custom strengths", () => {
  close(sunburstShadeAmount(1, 1, {depth: 0.2, sibling: 0}), 0.2, "depth only");
  close(sunburstShadeAmount(3, 0, {max: 0.15}), 0.15, "custom cap");
  assert.strictEqual(sunburstShadeAmount(2, 1, {depth: 0, sibling: 0}), 0);
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
