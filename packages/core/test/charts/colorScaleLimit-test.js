import {it} from "vitest";
import assert from "assert";

import {
  axisRoom,
  configSize,
  drawsSwatches,
  isWide,
  limitFrame,
  MAX_SHARE,
  sideFrame,
  swatchFrame,
} from "../../src/charts/features/colorScaleLimit.ts";

it("MAX_SHARE: a colorScale takes at most a third of the chart", () => {
  assert.strictEqual(MAX_SHARE, 1 / 3);
  assert.strictEqual(600 * MAX_SHARE, 200);
});

it("isWide: a scale at the top or bottom runs along the chart's width", () => {
  assert.deepStrictEqual(
    ["top", "bottom", "left", "right", false].map(isWide),
    [true, true, false, false, false],
  );
});

it("axisRoom: the limit less the bar and the padding on both sides", () => {
  assert.strictEqual(axisRoom(200, 10, 5), 180);
  assert.strictEqual(axisRoom(200, 24, 8), 160);
});

it("axisRoom: counts whole pixels, rounding down", () => {
  assert.strictEqual(axisRoom(62.5, 10, 5), 42);
  assert.strictEqual(axisRoom(100, 10.4, 5), 79);
});

it("axisRoom: is never negative", () => {
  assert.strictEqual(axisRoom(20, 10, 5), 0);
  assert.strictEqual(axisRoom(12, 10, 5), 0);
});

/** A ColorScale's state after a draw, as `drawsSwatches` reads it. */
const scale = (type, schema = {}) => ({_scaleType: type, schema});

it("drawsSwatches: a bucket scale draws a swatch per bucket", () => {
  assert.deepStrictEqual(
    ["jenks", "buckets", "quantile"].map(type => drawsSwatches(scale(type))),
    [true, true, true],
  );
});

it("drawsSwatches: a gradient, a bucketed bar and a bivariate key don't", () => {
  assert.strictEqual(drawsSwatches(scale("linear")), false);
  assert.strictEqual(drawsSwatches(scale("log")), false);
  assert.strictEqual(drawsSwatches(scale("jenks", {bucketAxis: true})), false);
  assert.strictEqual(drawsSwatches(scale("jenks", {bivariate: true})), false);
});

const frame = {x: 20, y: 30, width: 600, height: 300, extra: "kept"};

it("limitFrame: a scale at the right keeps the frame's right edge", () => {
  assert.deepStrictEqual(
    limitFrame({...frame, orient: "right", align: "end"}, 250),
    {...frame, orient: "right", align: "end", x: 370, width: 250},
  );
});

it("limitFrame: a scale at the left keeps the frame's left edge", () => {
  assert.deepStrictEqual(
    limitFrame({...frame, orient: "left", align: "start"}, 250),
    {...frame, orient: "left", align: "start", width: 250},
  );
});

it("limitFrame: a scale at the bottom keeps the frame's bottom edge", () => {
  assert.deepStrictEqual(
    limitFrame({...frame, orient: "bottom", align: "end"}, 150),
    {...frame, orient: "bottom", align: "end", y: 180, height: 150},
  );
});

it("limitFrame: a scale at the top keeps the frame's top edge", () => {
  assert.deepStrictEqual(
    limitFrame({...frame, orient: "top", align: "start"}, 150),
    {...frame, orient: "top", align: "start", height: 150},
  );
});

it("limitFrame: a limit past the frame reaches out from the same edge", () => {
  assert.deepStrictEqual(
    limitFrame({...frame, orient: "right", align: "end"}, 700),
    {...frame, orient: "right", align: "end", x: -80, width: 700},
  );
});

it("limitFrame: leaves the frame it is given alone", () => {
  const given = {...frame, orient: "bottom", align: "end"};
  limitFrame(given, 150);
  assert.deepStrictEqual(given, {...frame, orient: "bottom", align: "end"});
});

/**
    A ColorScale drawn as swatches that claim `claim` across the scale (its
    bounds and its padding of 5 on both sides), as `swatchFrame` reads it.
*/
const swatches = (claim, legendConfig = {}, type = "jenks") => ({
  ...scale(type),
  legendConfig: () => legendConfig,
  outerBounds: () => ({width: claim - 10, height: claim - 10}),
  padding: () => 5,
});
// A third of the frame across each scale.
const right = {...frame, limit: 200, orient: "right", align: "end"};
const bottom = {...frame, limit: 100, orient: "bottom", align: "end"};

it("swatchFrame: swatches within the limit keep their frame", () => {
  assert.strictEqual(swatchFrame(swatches(200), right), undefined);
  assert.strictEqual(swatchFrame(swatches(100), bottom), undefined);
});

it("swatchFrame: swatches past the limit are laid out again within it", () => {
  assert.deepStrictEqual(swatchFrame(swatches(201), right), {
    ...right,
    x: 420,
    width: 200,
  });
  assert.deepStrictEqual(swatchFrame(swatches(101), bottom), {
    ...bottom,
    y: 230,
    height: 100,
  });
});

it("swatchFrame: legendConfig's size across the scale replaces the limit", () => {
  assert.deepStrictEqual(swatchFrame(swatches(100, {width: 450}), right), {
    ...right,
    x: 170,
    width: 450,
  });
  assert.deepStrictEqual(swatchFrame(swatches(290, {height: 120}), bottom), {
    ...bottom,
    y: 210,
    height: 120,
  });
  // The size along the scale is not a limit across it.
  assert.strictEqual(
    swatchFrame(swatches(100, {height: 120}), right),
    undefined,
  );
  assert.strictEqual(
    swatchFrame(swatches(100, {width: 450}), bottom),
    undefined,
  );
});

it("swatchFrame: a legendConfig size that is the frame's own keeps the frame", () => {
  assert.strictEqual(
    swatchFrame(swatches(500, {width: 600}), right),
    undefined,
  );
  assert.strictEqual(
    swatchFrame(swatches(290, {height: 300}), bottom),
    undefined,
  );
});

it("swatchFrame: only swatches along a side of the chart are limited", () => {
  assert.strictEqual(
    swatchFrame(swatches(500, {}, "linear"), right),
    undefined,
  );
  assert.strictEqual(
    swatchFrame(swatches(500), {...right, limit: undefined}),
    undefined,
  );
});

it("swatchFrame: a frame already cut down to the limit keeps it", () => {
  const cut = {...right, x: 420, width: 200};
  assert.strictEqual(swatchFrame(swatches(260), cut), undefined);
});

const side = {x: 20, y: 30, width: 600, height: 300};

it("sideFrame: with no size set, the limit is a third of the frame across the scale", () => {
  const r = {...side, orient: "right", align: "end"};
  assert.deepStrictEqual(sideFrame(r, undefined), {...r, limit: 200});
  const t = {...side, orient: "top", align: "start"};
  assert.deepStrictEqual(sideFrame(t, undefined), {...t, limit: 100});
});

it("sideFrame: a size set across the scale is its limit, the frame cut to it against its edge", () => {
  const r = {...side, orient: "right", align: "end"};
  assert.deepStrictEqual(sideFrame(r, 120), {
    ...r,
    x: 500,
    width: 120,
    limit: 120,
  });
  const l = {...side, orient: "left", align: "start"};
  assert.deepStrictEqual(sideFrame(l, 120), {...l, width: 120, limit: 120});
  const b = {...side, orient: "bottom", align: "end"};
  assert.deepStrictEqual(sideFrame(b, 50), {
    ...b,
    y: 280,
    height: 50,
    limit: 50,
  });
  const t = {...side, orient: "top", align: "start"};
  assert.deepStrictEqual(sideFrame(t, 50), {...t, height: 50, limit: 50});
});

it("sideFrame: a size set past the frame keeps the frame", () => {
  const r = {...side, orient: "right", align: "end"};
  assert.deepStrictEqual(sideFrame(r, 900), {...r, limit: 600});
  assert.deepStrictEqual(sideFrame(r, -10), {
    ...r,
    x: 620,
    width: 0,
    limit: 0,
  });
});

it("configSize: a finite number the config sets, or undefined", () => {
  assert.strictEqual(configSize({width: 120}, "width"), 120);
  assert.strictEqual(configSize({width: 120}, "height"), undefined);
  assert.strictEqual(configSize({height: "50"}, "height"), undefined);
  assert.strictEqual(configSize({height: NaN}, "height"), undefined);
  assert.strictEqual(configSize({}, "width"), undefined);
});
