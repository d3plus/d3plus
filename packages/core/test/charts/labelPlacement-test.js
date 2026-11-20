import {it} from "vitest";
import assert from "assert";
import {
  defaultSize,
  growsBack,
  outside,
} from "../../src/charts/Plot/labelPlacement.ts";

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
  const ctx = {schema: {stacked: false, labelPosition: () => "outside"}};
  assert.strictEqual(outside.call(ctx, {}, 0), true);
  ctx.schema.labelPosition = () => "inside";
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
    schema: {stacked: false, discrete: "x", labelPosition: () => "auto"},
    _yAxis: yAxis,
    _y: d => d.y,
  };
  // Short bar (y=50): occupies 100px, less than half the 400px space → outside.
  assert.strictEqual(
    outside.call(ctx, {y: 50}, 0),
    true,
    "short bar → outside",
  );
  // Tall bar (y=180): occupies 360px, more than half the space → inside.
  assert.strictEqual(
    outside.call(ctx, {y: 180}, 0),
    false,
    "tall bar → inside",
  );
});

it("charts/labelPlacement growsBack and outside measure bars from growFrom", () => {
  const yAxis = {
    _d3Scale: {range: () => [0, 400]},
    _getPosition: v => 400 - v * 4,
    schema: {},
  };
  const ctx = {
    schema: {
      stacked: false,
      discrete: "x",
      growFrom: 50,
      labelPosition: () => "auto",
    },
    _yAxis: yAxis,
    _y: d => d.y,
  };
  assert.strictEqual(
    growsBack(ctx, "y", {y: 40}, 0),
    true,
    "below 50 hangs down",
  );
  assert.strictEqual(growsBack(ctx, "y", {y: 60}, 0), false);
  // From 50 (200px), a bar to 10 spans 160 of the 200px below: inside.
  assert.strictEqual(outside.call(ctx, {y: 10}, 0), false);
  // A bar to 45 spans 20px: outside.
  assert.strictEqual(outside.call(ctx, {y: 45}, 0), true);
  ctx.schema.stacked = true;
  assert.strictEqual(
    growsBack(ctx, "y", {y: 10}, 0),
    false,
    "a stacked band reads by its sign",
  );
  ctx.schema.stacked = undefined;
  ctx.schema.growFrom = undefined;
  assert.strictEqual(growsBack(ctx, "y", {y: 40}, 0), false, "else from 0");
});
