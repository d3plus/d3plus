import assert from "assert";

import VizBaseConfig from "../../es/src/charts/viz/VizBaseConfig.js";

/**
    Regression guard for the colorScale-bucket hover fix. Geomap disables
    per-shape hover dimming with `hoverOpacity: 1`, and the scene repaint used to
    be gated behind `hoverOpacity !== 1` — so hovering a colorScale bucket set
    `_hover`/`_hoverBucket` but never repainted, leaving the map un-dimmed. The
    fix schedules a repaint whenever a bucket hover is active, even at
    `hoverOpacity: 1`, while keeping single-region hover a no-op on such charts.
*/
const hover = VizBaseConfig.prototype.hover;

function fakeViz(hoverOpacity, hoverBucket) {
  let repaints = 0;
  return {
    _hover: undefined,
    _hoverBucket: hoverBucket,
    _sceneRenderer: {},
    _shapes: [],
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
