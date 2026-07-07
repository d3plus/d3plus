import assert from "assert";
import {defaultSize, outside} from "../../es/src/charts/Plot/labelPlacement.js";

it("charts/labelPlacement defaultSize routes the accessor value through the size scale", () => {
  const ctx = {_sizeScaleD3: v => (v == null ? 7 : v * 2), _size: d => d.s};
  assert.strictEqual(defaultSize.call(ctx, {s: 4}), 8);
});

it("charts/labelPlacement defaultSize passes null to the size scale with no size accessor", () => {
  const ctx = {_sizeScaleD3: v => (v == null ? 7 : v * 2), _size: null};
  assert.strictEqual(defaultSize.call(ctx, {}), 7);
});

it("charts/labelPlacement outside forces inside labels for stacked plots", () => {
  assert.strictEqual(outside.call({schema: {stacked: true}}, {}, 0), false);
});

it("charts/labelPlacement outside honors an explicit inside/outside label position", () => {
  const ctx = {schema: {stacked: false}, _labelPosition: () => "outside"};
  assert.strictEqual(outside.call(ctx, {}, 0), true);
  ctx._labelPosition = () => "inside";
  assert.strictEqual(outside.call(ctx, {}, 0), false);
});

it("charts/labelPlacement outside auto-places labels by comparing bar size to space", () => {
  // Vertical bars: y is the non-discrete axis. range [0,400] with zero at
  // the bottom (400); _getPosition maps y=v to pixel 400 - 2v.
  const yAxis = {
    _d3Scale: {range: () => [0, 400]},
    _getPosition: v => 400 - v * 2,
  };
  const ctx = {
    schema: {stacked: false, discrete: "x"},
    _labelPosition: () => "auto",
    _yAxis: yAxis,
    _y: d => d.y,
  };
  // Short bar (y=50): occupies 100px, less than half the 400px space → outside.
  assert.strictEqual(outside.call(ctx, {y: 50}, 0), true, "short bar → outside");
  // Tall bar (y=180): occupies 360px, more than half the space → inside.
  assert.strictEqual(outside.call(ctx, {y: 180}, 0), false, "tall bar → inside");
});
