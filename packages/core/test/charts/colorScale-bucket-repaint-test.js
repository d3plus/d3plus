import {it} from "vitest";
import assert from "assert";

import VizBase from "../../src/charts/viz/VizBase.ts";
import {shapeHoverEnabled} from "../../src/charts/viz/shapeHover.ts";
import {
  colorScaleBucketOf,
  colorScaleBucketRows,
  hoverColorScaleBucket,
} from "../../src/charts/features/colorScaleBucket.ts";

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
  assert.strictEqual(
    viz.repaints,
    0,
    "single-region hover must not repaint on a hoverOpacity:1 chart",
  );
});

it("normal dimming charts still repaint on hover", () => {
  const viz = fakeViz(0.5, false);
  hover.call(viz, false);
  assert.strictEqual(
    viz.repaints,
    1,
    "hoverOpacity < 1 should repaint the scene",
  );
});

it("clearing hover with no argument does not repaint", () => {
  const viz = fakeViz(1, true);
  hover.call(viz, undefined);
  assert.strictEqual(
    viz.repaints,
    0,
    "hover(undefined) is a read/guarded no-op",
  );
});

it("shape hover repaints at hoverOpacity:1 on charts that outline the hovered shape (Calendar)", () => {
  const viz = fakeViz(1, false);
  viz._hoverOutline = true;
  hover.call(viz, () => true);
  assert.strictEqual(viz.repaints, 1, "the outline needs a repaint");
});

it("shapeHoverEnabled: off at hoverOpacity:1 unless the chart outlines the hovered shape", () => {
  const viz = (hoverOpacity, outline) => ({
    schema: {shapeConfig: {hoverOpacity}},
    _hoverOutline: outline,
  });
  assert.strictEqual(shapeHoverEnabled(viz(0.5)), true);
  assert.strictEqual(shapeHoverEnabled(viz(undefined)), true);
  assert.strictEqual(shapeHoverEnabled(viz(1)), false);
  assert.strictEqual(shapeHoverEnabled(viz(1, true)), true);
});

it("colorScaleBucketOf unwraps wrapped bucket data and ignores non-buckets", () => {
  const bucket = {_isColorScaleBucket: true, color: "#abc"};
  assert.strictEqual(colorScaleBucketOf(bucket), bucket, "direct bucket");
  assert.strictEqual(
    colorScaleBucketOf({__d3plus__: true, data: bucket}),
    bucket,
    "one-level wrapped",
  );
  assert.strictEqual(
    colorScaleBucketOf({
      __d3plus__: true,
      data: {__d3plus__: true, data: bucket},
    }),
    bucket,
    "double wrapped (label -> shape-row -> bucket)",
  );
  assert.strictEqual(colorScaleBucketOf({foo: 1}), null, "non-bucket -> null");
  assert.strictEqual(
    colorScaleBucketOf({__d3plus__: true, data: {x: 1}}),
    null,
    "wrapped non-bucket -> null",
  );
});

it("colorScaleBucketRows: the first row in each bucket, keyed by bucket color", () => {
  const rows = [{v: 1}, {v: 5}, {v: 2}, {v: 9}];
  const viz = {
    _colorScaleClass: {
      _data: rows,
      _colorScale: v => (v < 4 ? "low" : "high"),
    },
    schema: {colorScale: d => d.v},
  };
  const buckets = colorScaleBucketRows(viz);
  assert.deepStrictEqual([...buckets.keys()], ["low", "high"]);
  assert.deepStrictEqual(buckets.get("low"), {row: rows[0], i: 0});
  assert.deepStrictEqual(buckets.get("high"), {row: rows[1], i: 1});
  assert.strictEqual(
    colorScaleBucketRows({_colorScaleClass: {}, schema: {}}),
    null,
    "null without a colorScale",
  );
});

/** A chart whose colorScale splits values at 4, recording its hovers. */
const bucketViz = () => ({
  _colorScaleClass: {_colorScale: v => (v < 4 ? "low" : "high")},
  schema: {colorScale: d => d.v},
  hovers: [],
  hover(_) {
    this.hovers.push(_);
  },
});

it("hoverColorScaleBucket: lights the rows in a bucket, from a swatch or its label", () => {
  const low = {_isColorScaleBucket: true, color: "low"};
  for (const d of [
    low,
    {__d3plus__: true, data: {__d3plus__: true, data: low}},
  ]) {
    const viz = bucketViz();
    assert.strictEqual(hoverColorScaleBucket(viz, d), true);
    assert.strictEqual(viz._hoverBucket, true);
    assert.strictEqual(viz.hovers.length, 1);
    const [predicate] = viz.hovers;
    assert.deepStrictEqual(
      [{v: 1}, {v: 5}, {v: 3}].map((row, i) => predicate(row, i)),
      [true, false, true],
    );
    assert.strictEqual(predicate(low, 0), true, "the swatch itself matches");
  }
});

it("hoverColorScaleBucket: leaves anything but a bucket alone", () => {
  const viz = bucketViz();
  assert.strictEqual(hoverColorScaleBucket(viz, {v: 1}), false);
  assert.strictEqual(hoverColorScaleBucket(viz, undefined), false);
  assert.strictEqual(viz._hoverBucket, undefined);
  assert.deepStrictEqual(viz.hovers, []);
});

it("hoverColorScaleBucket: a bucket without a colorScale to read lights nothing", () => {
  const viz = {...bucketViz(), _colorScaleClass: {}};
  const bucket = {_isColorScaleBucket: true, color: "low"};
  assert.strictEqual(hoverColorScaleBucket(viz, bucket), true);
  assert.strictEqual(viz._hoverBucket, undefined);
  assert.deepStrictEqual(viz.hovers, []);
});
