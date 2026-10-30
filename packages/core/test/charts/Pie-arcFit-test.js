import {it} from "vitest";
import assert from "assert";
import {
  fitRing,
  isFullTurn,
  pieSweep,
  ringExtent,
  sweepFraction,
} from "../../src/charts/Pie/arcFit.ts";
import {near} from "~test/helpers.js";

const TAU = Math.PI * 2;
const rad = deg => (deg * Math.PI) / 180;

const boxNear = (actual, expected, msg) => {
  for (const k of ["x0", "x1", "y0", "y1"])
    near(actual[k], expected[k], 1e-9, `${msg}: ${k}`);
};

it("pieSweep: defaults to one full turn from 12 o'clock", () => {
  assert.deepStrictEqual(pieSweep(undefined, undefined), {start: 0, end: TAU});
  assert.deepStrictEqual(pieSweep(0, undefined), {start: 0, end: TAU});
});

it("pieSweep: converts degrees, and an unset end makes a full turn from the start", () => {
  const half = pieSweep(-90, 90);
  near(half.start, -Math.PI / 2, 1e-12, "start");
  near(half.end, Math.PI / 2, 1e-12, "end");
  const rotated = pieSweep(90, undefined);
  near(rotated.start, Math.PI / 2, 1e-12, "rotated start");
  near(rotated.end - rotated.start, TAU, 1e-12, "rotated full turn");
  const nulls = pieSweep(null, null);
  assert.deepStrictEqual(nulls, {start: 0, end: TAU}, "null is unset");
});

it("pieSweep: caps the sweep at one turn either way, and keeps counter-clockwise sweeps", () => {
  const over = pieSweep(0, 720);
  near(over.end - over.start, TAU, 1e-12, "clockwise cap");
  const ccw = pieSweep(90, -90);
  near(ccw.end - ccw.start, -Math.PI, 1e-12, "counter-clockwise half");
  const ccwOver = pieSweep(0, -500);
  near(ccwOver.end - ccwOver.start, -TAU, 1e-12, "counter-clockwise cap");
});

it("isFullTurn: true only for a whole turn either way", () => {
  assert.ok(isFullTurn(0, TAU));
  assert.ok(isFullTurn(1, 1 - TAU));
  assert.ok(!isFullTurn(0, Math.PI));
  assert.ok(!isFullTurn(0, 0));
});

it("sweepFraction: where an angle falls within the sweep", () => {
  const full = {start: 0, end: TAU};
  near(sweepFraction(Math.PI, full), 0.5, 1e-12, "full: 6 o'clock");
  near(sweepFraction(-Math.PI / 2, full), 0.75, 1e-12, "full: wraps negatives");
  const half = {start: -Math.PI / 2, end: Math.PI / 2};
  near(sweepFraction(-Math.PI / 2, half), 0, 1e-12, "half: start");
  near(sweepFraction(0, half), 0.5, 1e-12, "half: 12 o'clock is the middle");
  near(sweepFraction(Math.PI / 4, half), 0.75, 1e-12, "half: 1:30");
  const ccw = {start: Math.PI / 2, end: -Math.PI / 2};
  near(sweepFraction(0, ccw), 0.5, 1e-12, "counter-clockwise: middle");
  near(sweepFraction(Math.PI / 4, ccw), 0.25, 1e-12, "counter-clockwise: 1:30");
  assert.strictEqual(sweepFraction(1, {start: 1, end: 1}), 0, "empty sweep");
});

it("ringExtent: a full circle is the unit square", () => {
  boxNear(ringExtent(0, TAU), {x0: -1, x1: 1, y0: -1, y1: 1}, "full");
  boxNear(
    ringExtent(rad(30), rad(390), 0.5),
    {x0: -1, x1: 1, y0: -1, y1: 1},
    "rotated full with a hole",
  );
});

it("ringExtent: a half ring opening downward spans the width and the top half", () => {
  boxNear(
    ringExtent(rad(-90), rad(90)),
    {x0: -1, x1: 1, y0: -1, y1: 0},
    "top half",
  );
});

it("ringExtent: a half ring opening upward spans the bottom half", () => {
  boxNear(
    ringExtent(rad(90), rad(270)),
    {x0: -1, x1: 1, y0: 0, y1: 1},
    "bottom half",
  );
  boxNear(
    ringExtent(rad(270), rad(90)),
    {x0: -1, x1: 1, y0: 0, y1: 1},
    "the same half, counter-clockwise",
  );
});

it("ringExtent: a quarter from 12 to 3 o'clock is the top-right unit square", () => {
  boxNear(ringExtent(0, rad(90)), {x0: 0, x1: 1, y0: -1, y1: 0}, "quarter");
});

it("ringExtent: a span crossing 12 o'clock includes the top extreme", () => {
  const b = ringExtent(rad(-45), rad(45));
  const s = Math.SQRT1_2;
  boxNear(b, {x0: -s, x1: s, y0: -1, y1: 0}, "crosses 0");
  // The same span, with angles past one turn.
  boxNear(ringExtent(rad(315), rad(405)), b, "crosses 360");
});

it("ringExtent: the inner radius pulls the footprint off the center", () => {
  // From 2 to 4 o'clock, the outer arc crosses 3 o'clock; the center is the
  // leftmost point without a hole, the inner arc's ends with one.
  const start = rad(60);
  const end = rad(120);
  const solid = ringExtent(start, end);
  near(solid.x0, 0, 1e-12, "no hole: reaches the center");
  near(solid.x1, 1, 1e-12, "no hole: reaches 3 o'clock");
  const ring = ringExtent(start, end, 0.5);
  near(ring.x0, 0.5 * Math.sin(start), 1e-12, "hole: inner ends set the left");
  near(ring.x1, 1, 1e-12, "hole: right unchanged");
  near(ring.y0, -Math.cos(start), 1e-12, "hole: top is the outer start");
  // A half ring's inner ends sit on its flat edge, so a hole changes nothing.
  boxNear(
    ringExtent(rad(-90), rad(90), 0.6),
    ringExtent(rad(-90), rad(90)),
    "half ring",
  );
  // The inner fraction is clamped to the outer radius.
  boxNear(ringExtent(start, end, 4), ringExtent(start, end, 1), "clamped");
});

it("fitRing: a full circle is centered at the largest radius that fits, less the padding", () => {
  const fit = fitRing(800, 600, 0, TAU, 0, 3);
  assert.strictEqual(fit.cx, 400);
  assert.strictEqual(fit.cy, 300);
  assert.strictEqual(fit.radius, 297);
  boxNear(fit.box, {x0: -297, x1: 297, y0: -297, y1: 297}, "box");
});

it("fitRing: a half ring in a tall area fills the width, centered", () => {
  const fit = fitRing(800, 600, rad(-90), rad(90));
  near(fit.radius, 400, 1e-9, "fills the width");
  near(fit.cx, 400, 1e-9, "centered horizontally");
  near(fit.cy, 500, 1e-9, "footprint centered vertically");
});

it("fitRing: a half ring in a wide area fills the height", () => {
  const fit = fitRing(1000, 300, rad(-90), rad(90), 0, 5);
  near(fit.radius, 290, 1e-9, "fills the height, less padding");
  near(fit.cx, 500, 1e-9, "centered horizontally");
  near(fit.cy, 295, 1e-9, "fills the padded height");
});

it("fitRing: a half ring opening upward is centered", () => {
  const fit = fitRing(800, 600, rad(90), rad(270));
  near(fit.radius, 400, 1e-9, "fills the width");
  near(fit.cy, 100, 1e-9, "footprint centered vertically");
});

it("fitRing: a quarter is centered in a wide area", () => {
  const fit = fitRing(500, 300, 0, rad(90));
  near(fit.radius, 300, 1e-9, "fills the height");
  near(fit.cx, 100, 1e-9, "footprint centered horizontally");
  near(fit.cy, 300, 1e-9, "fills the height");
});

it("fitRing: a span crossing 12 o'clock fills the width, centered", () => {
  const fit = fitRing(400, 400, rad(-45), rad(45));
  const s = Math.SQRT1_2;
  near(fit.radius, 400 / (2 * s), 1e-9, "fills the width");
  near(fit.cx, 200, 1e-9, "symmetric span is centered");
  near(fit.cy, (400 + fit.radius) / 2, 1e-9, "footprint centered vertically");
});

it("fitRing: a hole lets a ring whose footprint includes the center grow", () => {
  const start = rad(60);
  const end = rad(120);
  const solid = fitRing(300, 400, start, end, 0);
  const ring = fitRing(300, 400, start, end, 100);
  assert.ok(ring.radius > solid.radius, "grows");
  const w = ring.box.x1 - ring.box.x0;
  const h = ring.box.y1 - ring.box.y0;
  assert.ok(w <= 300 + 1e-6 && h <= 400 + 1e-6, "still fits");
  near(w, 300, 1e-3, "fills the width it is limited by");
  near(ring.box.x0, 100 * Math.sin(start), 1e-6, "inner ends set the left");
  // A half ring's footprint doesn't depend on its hole.
  near(
    fitRing(800, 600, rad(-90), rad(90), 200).radius,
    400,
    1e-9,
    "half ring",
  );
});

it("fitRing: an empty area gives a zero radius", () => {
  assert.strictEqual(fitRing(0, 0, rad(-90), rad(90)).radius, 0);
  assert.strictEqual(fitRing(4, 4, 0, TAU, 0, 3).radius, 0);
});
