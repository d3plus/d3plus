import {it} from "vitest";
import assert from "assert";

import VizBase from "../../src/charts/viz/VizBase.ts";
import {shapeHoverEnabled} from "../../src/charts/viz/shapeHover.ts";
import {colorScaleBucketOf} from "../../src/charts/features/colorScaleBucket.ts";

/**
    Regression guard for the colorScale-bucket hover fix. Geomap disables
    per-shape hover dimming with `hoverOpacity: 1`, and the scene repaint used to
    be gated behind `hoverOpacity !== 1` — so hovering a colorScale bucket set
    `_hover`/`_hoverBucket` but never repainted, leaving the map un-dimmed. The
    fix schedules a repaint whenever a bucket hover is active, even at
    `hoverOpacity: 1`, while keeping single-region hover a no-op on such charts.
*/
const hover = VizBase.prototype.hover;

function fakeViz(hoverOpacity, hoverBucket) {
  let repaints = 0;
  return {
    _hover: undefined,
    _hoverBucket: hoverBucket,
    _sceneRenderer: {},
    schema: {shapeConfig: {hoverOpacity}, legend: false},
    _scheduleSceneRepaint() {
      repaints++;
    },
    get repaints() {
      return repaints;
    },
  };
}

it("colorScale bucket hover repaints the scene even at hoverOpacity:1 (Geomap)", () => {
  const viz = fakeViz(1, true);
  hover.call(viz, () => true);
  assert.strictEqual(viz.repaints, 1, "bucket hover should schedule a repaint");
});

it("plain shape hover stays a no-op at hoverOpacity:1 (no bucket)", () => {
  const viz = fakeViz(1, false);
  hover.call(viz, () => true);
  assert.strictEqual(viz.repaints, 0, "single-region hover must not repaint on a hoverOpacity:1 chart");
});

it("normal dimming charts still repaint on hover", () => {
  const viz = fakeViz(0.5, false);
  hover.call(viz, false);
  assert.strictEqual(viz.repaints, 1, "hoverOpacity < 1 should repaint the scene");
});

it("clearing hover with no argument does not repaint", () => {
  const viz = fakeViz(1, true);
  hover.call(viz, undefined);
  assert.strictEqual(viz.repaints, 0, "hover(undefined) is a read/guarded no-op");
});

it("shape hover repaints at hoverOpacity:1 on charts that outline the hovered shape (Calendar)", () => {
  const viz = fakeViz(1, false);
  viz._hoverOutline = true;
  hover.call(viz, () => true);
  assert.strictEqual(viz.repaints, 1, "the outline needs a repaint");
});

it("shapeHoverEnabled: off at hoverOpacity:1 unless the chart outlines the hovered shape", () => {
  const viz = (hoverOpacity, outline) => ({schema: {shapeConfig: {hoverOpacity}}, _hoverOutline: outline});
  assert.strictEqual(shapeHoverEnabled(viz(0.5)), true);
  assert.strictEqual(shapeHoverEnabled(viz(undefined)), true);
  assert.strictEqual(shapeHoverEnabled(viz(1)), false);
  assert.strictEqual(shapeHoverEnabled(viz(1, true)), true);
});

it("colorScaleBucketOf unwraps wrapped bucket data and ignores non-buckets", () => {
  const bucket = {_isColorScaleBucket: true, color: "#abc"};
  assert.strictEqual(colorScaleBucketOf(bucket), bucket, "direct bucket");
  assert.strictEqual(colorScaleBucketOf({__d3plus__: true, data: bucket}), bucket, "one-level wrapped");
  assert.strictEqual(
    colorScaleBucketOf({__d3plus__: true, data: {__d3plus__: true, data: bucket}}),
    bucket, "double wrapped (label -> shape-row -> bucket)",
  );
  assert.strictEqual(colorScaleBucketOf({foo: 1}), null, "non-bucket -> null");
  assert.strictEqual(colorScaleBucketOf({__d3plus__: true, data: {x: 1}}), null, "wrapped non-bucket -> null");
});
