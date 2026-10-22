import {it} from "vitest";
import assert from "assert";
import {
  conversionRates,
  largestValue,
  monotoneSlopes,
  profileKnots,
  profileSlice,
  segmentWidth,
  sliceExtent,
  slicePath,
  stageSpans,
  stageWidths,
} from "../../src/charts/Funnel/funnelGeometry.ts";

const close = (a, b, msg, eps = 1e-9) =>
  assert.ok(Math.abs(a - b) <= eps, `${msg}: ${a} ≈ ${b}`);

it("Funnel geometry: stageSpans splits the length into stages and gaps", () => {
  const spans = stageSpans(3, 280, 0.2);
  // slot = 280 / (3 - 0.2) = 100; each stage 80 long, 20 between.
  assert.deepStrictEqual(spans, [
    {start: 0, end: 80},
    {start: 100, end: 180},
    {start: 200, end: 280},
  ]);
});

it("Funnel geometry: stageSpans fills the length with one stage, and clamps padding", () => {
  assert.deepStrictEqual(stageSpans(1, 50, 0.5), [{start: 0, end: 50}]);
  const touching = stageSpans(2, 100, -1);
  assert.deepStrictEqual(touching, [
    {start: 0, end: 50},
    {start: 50, end: 100},
  ]);
  const wide = stageSpans(2, 100, 5);
  assert.ok(wide[0].end > wide[0].start, "padding is capped below 1");
  close(wide[1].end, 100, "last stage ends at the length");
});

it("Funnel geometry: stageSpans returns nothing without stages or room", () => {
  assert.deepStrictEqual(stageSpans(0, 100, 0.3), []);
  assert.deepStrictEqual(stageSpans(3, 0, 0.3), []);
  assert.deepStrictEqual(stageSpans(3, NaN, 0.3), []);
});

it("Funnel geometry: stageWidths scales to the largest value", () => {
  assert.deepStrictEqual(stageWidths([200, 100, 50], 400), [400, 200, 100]);
});

it("Funnel geometry: stageWidths draws negative and missing values at zero", () => {
  assert.deepStrictEqual(
    stageWidths([100, -20, NaN, undefined], 100),
    [100, 0, 0, 0],
  );
  assert.deepStrictEqual(stageWidths([0, 0], 100), [0, 0]);
});

it("Funnel geometry: largestValue ignores negative and missing values", () => {
  assert.strictEqual(largestValue([200, 900, 50]), 900);
  assert.strictEqual(largestValue([-500, NaN, undefined, 30]), 30);
  assert.strictEqual(largestValue([]), 0);
  assert.strictEqual(largestValue([-1, NaN]), 0);
});

it("Funnel geometry: stageWidths measures against a larger shared scale", () => {
  // Shared max 800: a funnel whose widest stage is 200 draws at a quarter width.
  assert.deepStrictEqual(stageWidths([200, 100, 50], 400, 800), [100, 50, 25]);
  // A shared max below the funnel's own largest value doesn't stretch it past the breadth.
  assert.deepStrictEqual(stageWidths([200, 100, 50], 400, 100), [400, 200, 100]);
  // Zero, negative, or missing shared max falls back to the funnel's own scale.
  assert.deepStrictEqual(stageWidths([200, 100], 400, 0), [400, 200]);
  assert.deepStrictEqual(stageWidths([200, 100], 400, -5), [400, 200]);
  assert.deepStrictEqual(stageWidths([200, 100], 400, NaN), [400, 200]);
  // A shared scale still sizes a funnel with no drawable values to zero.
  assert.deepStrictEqual(stageWidths([0, -3], 400, 800), [0, 0]);
});

it("Funnel geometry: monotoneSlopes flattens at turning points and plateaus", () => {
  const points = [
    {s: 0, w: 10},
    {s: 1, w: 5},
    {s: 2, w: 5},
    {s: 3, w: 0},
  ];
  const m = monotoneSlopes(points);
  assert.strictEqual(m.length, 4);
  assert.strictEqual(m[1], 0, "plateau start is flat");
  assert.strictEqual(m[2], 0, "plateau end is flat");
  assert.ok(m[0] < 0 && m[3] < 0, "ends follow the falling secants");
});

it("Funnel geometry: monotoneSlopes averages same-direction secants and limits overshoot", () => {
  const m = monotoneSlopes([
    {s: 0, w: 0},
    {s: 1, w: 1},
    {s: 2, w: 3},
  ]);
  assert.strictEqual(m[1], 1.5);
  const steep = monotoneSlopes([
    {s: 0, w: 0},
    {s: 1, w: 10},
    {s: 2, w: 10.1},
  ]);
  assert.ok(
    steep[1] <= 3 * 0.1 + 1e-9,
    `slope into a near-plateau is limited (got ${steep[1]})`,
  );
  assert.deepStrictEqual(monotoneSlopes([{s: 0, w: 4}]), [0]);
});

it("Funnel geometry: profileKnots holds each stage's width without taper", () => {
  const spans = [
    {start: 0, end: 10},
    {start: 15, end: 25},
  ];
  assert.deepStrictEqual(profileKnots(spans, [100, 40], false), [
    {s: 0, w: 100, m: 0},
    {s: 10, w: 100, m: 0},
    {s: 15, w: 40, m: 0},
    {s: 25, w: 40, m: 0},
  ]);
  assert.deepStrictEqual(profileKnots([], [], false), []);
});

it("Funnel geometry: profileKnots runs from stage start to stage start with taper", () => {
  const spans = [
    {start: 0, end: 10},
    {start: 15, end: 25},
  ];
  const knots = profileKnots(spans, [100, 40], true);
  assert.deepStrictEqual(
    knots.map(k => [k.s, k.w]),
    [
      [0, 100],
      [15, 40],
      [25, 40],
    ],
    "the last stage keeps its own width",
  );
  assert.strictEqual(knots[2].m, 0, "flat at the end");
});

it("Funnel geometry: segmentWidth interpolates linearly or along a Hermite curve", () => {
  const a = {s: 0, w: 100, m: 0};
  const b = {s: 10, w: 0, m: 0};
  assert.strictEqual(segmentWidth(a, b, 5, "linear"), 50);
  assert.strictEqual(segmentWidth(a, b, 5, "smooth"), 50, "symmetric S-curve");
  assert.ok(
    segmentWidth(a, b, 2, "smooth") > 80,
    "eases out of the first width",
  );
  assert.strictEqual(segmentWidth(a, b, -5, "linear"), 100, "clamped before");
  assert.strictEqual(segmentWidth(a, b, 50, "linear"), 0, "clamped after");
  assert.strictEqual(segmentWidth(a, {...b, s: 0}, 0, "linear"), 100);
});

it("Funnel geometry: profileSlice samples a stage, a neck, and a smooth neck", () => {
  const knots = profileKnots(
    [
      {start: 0, end: 10},
      {start: 20, end: 30},
    ],
    [100, 40],
    false,
  );
  assert.deepStrictEqual(profileSlice(knots, 0, 10, "linear"), [
    [0, 100],
    [10, 100],
  ]);
  assert.deepStrictEqual(profileSlice(knots, 10, 20, "linear"), [
    [10, 100],
    [20, 40],
  ]);
  const smooth = profileSlice(knots, 10, 20, "smooth", 4);
  assert.strictEqual(smooth.length, 5);
  assert.deepStrictEqual(smooth[0], [10, 100]);
  assert.deepStrictEqual(smooth[4], [20, 40]);
  assert.deepStrictEqual(
    profileSlice(knots, 0, 10, "smooth", 4),
    [
      [0, 100],
      [10, 100],
    ],
    "flat segments need no samples",
  );
  assert.deepStrictEqual(profileSlice(knots, 5, 5, "linear"), []);
});

it("Funnel geometry: profileSlice reads both sides of a width step at a shared knot", () => {
  const knots = profileKnots(
    [
      {start: 0, end: 10},
      {start: 10, end: 20},
    ],
    [100, 40],
    false,
  );
  assert.deepStrictEqual(profileSlice(knots, 0, 10, "linear"), [
    [0, 100],
    [10, 100],
  ]);
  assert.deepStrictEqual(profileSlice(knots, 10, 20, "linear"), [
    [10, 40],
    [20, 40],
  ]);
  assert.deepStrictEqual(
    profileSlice(knots, 0, 20, "linear"),
    [
      [0, 100],
      [10, 100],
      [10, 40],
      [20, 40],
    ],
    "a slice across the step keeps both widths",
  );
});

it("Funnel geometry: slicePath outlines a slice in either orientation", () => {
  const points = [
    [0, 100],
    [10, 50],
  ];
  assert.strictEqual(
    slicePath(points, 60, "vertical"),
    "M10,0L35,10L85,10L110,0Z",
  );
  assert.strictEqual(
    slicePath(points, 60, "horizontal"),
    "M0,10L10,35L10,85L0,110Z",
  );
  assert.strictEqual(slicePath([[0, 10]], 0, "vertical"), "");
  assert.strictEqual(
    slicePath(
      [
        [0.123, 1],
        [1.006, 1],
      ],
      0,
      "vertical",
    ),
    "M-0.5,0.12L-0.5,1.01L0.5,1.01L0.5,0.12Z",
    "rounded to two decimals",
  );
});

it("Funnel geometry: sliceExtent finds the narrowest and widest points", () => {
  assert.deepStrictEqual(
    sliceExtent([
      [0, 80],
      [5, 20],
      [10, 40],
    ]),
    {min: 20, max: 80},
  );
  assert.deepStrictEqual(sliceExtent([]), {min: 0, max: 0});
});

it("Funnel geometry: conversionRates against the first and previous stages", () => {
  const {first, previous} = conversionRates([200, 100, 25]);
  assert.deepStrictEqual(first, [1, 0.5, 0.125]);
  assert.ok(Number.isNaN(previous[0]), "the first stage has no previous");
  assert.deepStrictEqual(previous.slice(1), [0.5, 0.25]);
});

it("Funnel geometry: conversionRates is NaN against a zero or missing stage", () => {
  const {first, previous} = conversionRates([0, 10, NaN, 5]);
  assert.ok(first.every(Number.isNaN));
  assert.ok(Number.isNaN(previous[1]));
  assert.ok(Number.isNaN(previous[3]));
});
