import {it} from "vitest";
import assert from "assert";
import {
  polarInnerRadius,
  polarLevels,
  polarPadAngle,
  polarRadius,
  polarSlots,
  polarStack,
} from "../../src/charts/polar/geometry.ts";
import {polarSlotArc} from "../../src/charts/polar/wedgeLayout.ts";
import {near} from "~test/helpers.js";

const TAU = Math.PI * 2;

it("polar geometry: polarRadius: sqrt spaces values by area", () => {
  const r = v => polarRadius(v, [0, 100], 0, 200);
  near(r(0), 0, 1e-9, "domain min at the center");
  near(r(100), 200, 1e-9, "domain max at the outer radius");
  near(r(25), 100, 1e-9, "a quarter of the value is half the radius");
  // Area of the disc up to each value is proportional to the value.
  near(r(50) ** 2 / r(100) ** 2, 0.5, 1e-9, "half the value, half the area");
});

it("polar geometry: polarRadius: sqrt with an inner radius keeps ring area proportional", () => {
  const r = v => polarRadius(v, [0, 100], 50, 150);
  near(r(0), 50, 1e-9, "domain min at the inner radius");
  near(r(100), 150, 1e-9, "domain max at the outer radius");
  const ring = v => r(v) ** 2 - 50 ** 2;
  near(ring(40) / ring(100), 0.4, 1e-9, "ring area share");
});

it("polar geometry: polarRadius: linear spaces values evenly and clamps", () => {
  const r = v => polarRadius(v, [0, 100], 20, 120, "linear");
  near(r(50), 70, 1e-9, "midpoint");
  near(r(-10), 20, 1e-9, "below the domain clamps to the inner radius");
  near(r(500), 120, 1e-9, "above the domain clamps to the outer radius");
  near(r(NaN), 20, 1e-9, "non-finite maps to the inner radius");
  near(polarRadius(5, [5, 5], 10, 90, "linear"), 10, 1e-9, "an empty domain maps to the inner radius");
});

it("polar geometry: polarSlots: splits the sweep into equal slots", () => {
  const slots = polarSlots(4);
  assert.strictEqual(slots.length, 4);
  near(slots[0].startAngle, 0, 1e-9, "first start");
  near(slots[0].angle, TAU / 8, 1e-9, "first center");
  near(slots[3].endAngle, TAU, 1e-9, "last end");
  const offset = polarSlots(2, Math.PI / 2, Math.PI);
  near(offset[0].startAngle, Math.PI / 2, 1e-9, "custom start");
  near(offset[1].endAngle, Math.PI * 1.5, 1e-9, "custom sweep");
  assert.deepStrictEqual(polarSlots(0), [], "no slots");
});

it("polar geometry: polarStack: stacks within each slot in order", () => {
  const stack = polarStack([
    {slot: 0, value: 10},
    {slot: 1, value: 5},
    {slot: 0, value: 20},
    {slot: 0, value: -4},
    {slot: 1, value: NaN},
  ]);
  assert.deepStrictEqual(stack, [
    {slot: 0, y0: 0, y1: 10},
    {slot: 1, y0: 0, y1: 5},
    {slot: 0, y0: 10, y1: 30},
    {slot: 0, y0: 30, y1: 30},
    {slot: 1, y0: 5, y1: 5},
  ]);
});

it("polar geometry: polarPadAngle: padAngle wins, else padPixel at the radius", () => {
  near(polarPadAngle(0.1, 5, 100), 0.1, 1e-9, "explicit angle");
  near(polarPadAngle(0, 5, 100), 0.05, 1e-9, "pixels at the radius");
  near(polarPadAngle(0, 5, 0), 0, 1e-9, "no radius");
  near(polarPadAngle(0, 0, 100), 0, 1e-9, "no padding");
});

it("polar geometry: polarLevels: nice domain and ticks from the data", () => {
  const levels = polarLevels([12, 87], 4);
  assert.deepStrictEqual(levels.domain, [0, 100]);
  assert.deepStrictEqual(levels.ticks, [0, 20, 40, 60, 80, 100]);
});

it("polar geometry: polarLevels: user domain ends replace the data's", () => {
  const both = polarLevels([12, 87], 4, [0, 200]);
  assert.deepStrictEqual(both.domain, [0, 200]);
  assert.deepStrictEqual(both.ticks, [0, 50, 100, 150, 200]);
  const hiOnly = polarLevels([12, 87], 4, [undefined, 150]);
  assert.deepStrictEqual(hiOnly.domain, [0, 150]);
  const fixed = polarLevels([12, 87], [0, 50, 100], [0, 60]);
  assert.deepStrictEqual(
    fixed.ticks,
    [0, 50],
    "explicit levels outside the domain drop",
  );
  const inverted = polarLevels([12, 87], 4, [500, 100]);
  assert.deepStrictEqual(
    inverted.domain,
    [0, 100],
    "an empty range falls back to the data's",
  );
});

it("polar geometry: polarInnerRadius: pixels, a function of the outer radius, or none", () => {
  assert.strictEqual(polarInnerRadius(40, 200), 40);
  assert.strictEqual(
    polarInnerRadius(r => r / 4, 200),
    50,
  );
  assert.strictEqual(polarInnerRadius(undefined, 200), 0);
  assert.strictEqual(polarInnerRadius(-5, 200), 0);
  assert.strictEqual(
    polarInnerRadius(500, 200),
    190,
    "never reaches the outer radius",
  );
});

it("polar geometry: polarSlotArc: insets the slot and pads by pixels at the sector's middle", () => {
  const slot = {startAngle: 0, endAngle: 1, angle: 0.5};
  const arc = polarSlotArc(slot, 30, 40, {
    inset: 0.2,
    padAngle: 0,
    padPixel: 5,
  });
  near(arc.startAngle, 0.1, 1e-9, "start inset");
  near(arc.endAngle, 0.9, 1e-9, "end inset");
  assert.strictEqual(arc.innerRadius, 30);
  assert.strictEqual(arc.outerRadius, 40);
  near(arc.padAngle, 5 / 50, 1e-9, "padPixel at hypot(30, 40)");
  const full = polarSlotArc(slot, 0, 10, {
    inset: 0,
    padAngle: 0.02,
    padPixel: 0,
  });
  near(full.startAngle, 0, 1e-9, "no inset");
  near(full.padAngle, 0.02, 1e-9, "explicit pad angle");
  const capped = polarSlotArc(slot, 0, 10, {
    inset: 2,
    padAngle: 0,
    padPixel: 0,
  });
  near(capped.endAngle - capped.startAngle, 0.05, 1e-9, "the inset never swallows the slot");
});
