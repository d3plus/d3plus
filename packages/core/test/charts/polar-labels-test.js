import {it} from "vitest";
import assert from "assert";
import {
  POLAR_LABEL_PADDING,
  polarBoxesOverlap,
  polarHorizontalLayout,
  polarLabelFitRadius,
  polarLabelPlacement,
  polarLabelRoom,
  polarLabelsCollide,
  polarSpokeRotation,
} from "../../src/charts/polar/labels.ts";
import {radarLevelLabels} from "../../src/charts/Radar/levels.ts";
import {near} from "~test/helpers.js";

const PAD = POLAR_LABEL_PADDING;

it("polar labels: polarLabelPlacement: pushes each box away from the circle", () => {
  const top = polarLabelPlacement(0, 100, 40, 10);
  near(top.x, -20, 1e-6, "centered over 12 o'clock");
  near(
    top.y + top.height,
    -(100 + PAD),
    1e-6,
    "bottom edge meets the label point",
  );
  const right = polarLabelPlacement(Math.PI / 2, 100, 40, 10);
  near(right.x, 100 + PAD, 1e-6, "left edge meets the label point");
  near(right.y, -5, 1e-6, "vertically centered at 3 o'clock");
  const left = polarLabelPlacement(-Math.PI / 2, 100, 40, 10);
  near(
    left.x + left.width,
    -(100 + PAD),
    1e-6,
    "right edge meets the label point",
  );
});

it("polar labels: polarLabelFitRadius: the largest radius whose labels stay inside", () => {
  const boxes = [
    {angle: Math.PI / 2, width: 50, height: 10},
    {angle: -Math.PI / 2, width: 30, height: 10},
    {angle: 0, width: 20, height: 10},
  ];
  const r = polarLabelFitRadius(boxes, 400, 400);
  near(r, 200 - 50 - PAD, 1e-6, "the widest side label sets the radius");
  for (const b of boxes) {
    const p = polarLabelPlacement(b.angle, r, b.width, b.height);
    assert.ok(
      p.x >= -200 - 1e-6 && p.x + p.width <= 200 + 1e-6,
      "fits horizontally",
    );
    assert.ok(
      p.y >= -200 - 1e-6 && p.y + p.height <= 200 + 1e-6,
      "fits vertically",
    );
  }
  assert.strictEqual(
    polarLabelFitRadius([], 300, 200),
    100,
    "no labels: half the short side",
  );
  assert.strictEqual(
    polarLabelFitRadius([{angle: 1, width: 900, height: 10}], 300, 200),
    0,
    "never negative",
  );
});

it("polar labels: polarLabelRoom: width left beside the circle", () => {
  near(
    polarLabelRoom(Math.PI / 2, 100, 400),
    200 - 100 - PAD,
    1e-6,
    "at 3 o'clock",
  );
  assert.strictEqual(
    polarLabelRoom(0, 100, 400),
    400,
    "at 12 o'clock the label grows vertically only",
  );
  assert.strictEqual(
    polarLabelRoom(Math.PI / 2, 300, 400),
    0,
    "no room past the edge",
  );
  const diag = polarLabelRoom(Math.PI / 4, 100, 400);
  const p = polarLabelPlacement(Math.PI / 4, 100, diag, 10);
  near(
    p.x + p.width,
    200,
    1e-6,
    "a label of exactly that width reaches the edge",
  );
});

it("polar labels: polarLabelsCollide: neighbors that overlap", () => {
  const few = [0, 1, 2, 3].map(i => ({
    angle: (i * Math.PI) / 2,
    width: 30,
    height: 12,
  }));
  assert.strictEqual(polarLabelsCollide(few, 100), false);
  const many = Array.from({length: 48}, (_v, i) => ({
    angle: (i * Math.PI * 2) / 48,
    width: 60,
    height: 12,
  }));
  assert.strictEqual(polarLabelsCollide(many, 100), true);
  assert.strictEqual(
    polarLabelsCollide([{angle: 0, width: 999, height: 99}], 10),
    false,
    "one label never collides",
  );
});

it("polar labels: polarHorizontalLayout: one line when the circle keeps its minimum size", () => {
  const out = polarHorizontalLayout({
    angles: [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2],
    widths: [20, 40, 20, 40],
    lineHeight: 12,
    width: 400,
    height: 400,
  });
  near(out.radius, 200 - 40 - PAD, 1e-6, "radius fit to the widest side label");
  assert.ok(
    out.labels.every(l => l.lines === 1),
    "single lines",
  );
});

it("polar labels: polarHorizontalLayout: wraps long labels at the minimum radius", () => {
  const out = polarHorizontalLayout({
    angles: [Math.PI / 2, -Math.PI / 2],
    widths: [300, 10],
    lineHeight: 12,
    width: 400,
    height: 400,
  });
  near(out.radius, 100, 1e-6, "half the largest radius");
  assert.strictEqual(out.labels[0].lines, 2, "the long label wraps");
  near(out.labels[0].width, 200 - 100 - PAD, 1e-6, "to its room");
  assert.strictEqual(out.labels[0].height, 24);
  assert.deepStrictEqual(
    out.labels[1],
    {width: 10, height: 12, lines: 1},
    "a short label stays put",
  );
});

it("polar labels: polarSpokeRotation: never upside down", () => {
  assert.deepStrictEqual(
    polarSpokeRotation(Math.PI / 2),
    {rotate: 0, anchor: "start"},
    "3 o'clock",
  );
  assert.deepStrictEqual(
    polarSpokeRotation(0),
    {rotate: 270, anchor: "start"},
    "12 o'clock reads upward",
  );
  const left = polarSpokeRotation(-Math.PI / 2);
  assert.strictEqual(left.anchor, "end", "9 o'clock runs toward the center");
  near(left.rotate, 0, 1e-6, "and reads left to right");
  const lowerLeft = polarSpokeRotation((5 * Math.PI) / 4);
  assert.strictEqual(lowerLeft.anchor, "end");
  near(lowerLeft.rotate, -45, 1e-6, "flipped half a turn");
});

it("polar labels: radarLevelLabels: toRadius places labels on a custom scale", () => {
  const opts = {
    ticks: [0, 25, 100],
    domain: [0, 100],
    radius: 200,
    angle: 0,
    format: String,
    measure: t => t.length * 6,
    fontSize: 10,
  };
  const linear = radarLevelLabels(opts);
  const sqrt = radarLevelLabels({
    ...opts,
    toRadius: v => 200 * Math.sqrt(v / 100),
  });
  assert.deepStrictEqual(
    linear.map(l => l.r),
    [0, 50, 200],
  );
  assert.deepStrictEqual(
    sqrt.map(l => l.r),
    [0, 100, 200],
  );
});

it("polar labels: polarBoxesOverlap: overlapping boxes, or boxes closer than the gap", () => {
  const a = {x: 0, y: 0, width: 10, height: 10};
  assert.strictEqual(
    polarBoxesOverlap(a, {x: 5, y: 5, width: 10, height: 10}),
    true,
  );
  assert.strictEqual(
    polarBoxesOverlap(a, {x: 11, y: 0, width: 10, height: 10}),
    true,
    "1px apart is inside the default 2px gap",
  );
  assert.strictEqual(
    polarBoxesOverlap(a, {x: 13, y: 0, width: 10, height: 10}),
    false,
  );
  assert.strictEqual(
    polarBoxesOverlap(a, {x: 11, y: 0, width: 10, height: 10}, 0),
    false,
    "no gap",
  );
  assert.strictEqual(
    polarBoxesOverlap(a, {x: 0, y: 20, width: 10, height: 10}),
    false,
    "apart vertically",
  );
});
