import {it} from "vitest";
import assert from "assert";

import {outlineExit, outlineReach} from "../../internal.ts";

const close = (a, b, eps = 1e-9) =>
  assert.ok(Math.abs(a - b) < eps, `${a} is not close to ${b}`);

it("outlineReach puts a hairline's end on a circle node's edge, any way it leaves", () => {
  close(outlineReach({r: 10}, 0), 10);
  close(outlineReach({r: 10}, 2.1), 10);
  close(outlineReach({r: 10, shape: "Circle"}, -1), 10);
});

it("outlineReach puts both corners of a wide stroke's square end on the circle", () => {
  close(outlineReach({r: 10}, 0, 12), 8);
  assert.strictEqual(outlineReach({r: 10}, 0, 20), 0, "as wide as the node");
  assert.strictEqual(outlineReach({r: 10}, 0, 30), 0, "wider than the node");
});

it("outlineReach reads a Rect node's box, defaulting to a square 2r across", () => {
  const box = {shape: "Rect", r: 5, width: 40, height: 10};
  close(outlineReach(box, 0), 20, 1e-9);
  close(outlineReach(box, Math.PI), 20, 1e-9);
  close(outlineReach(box, Math.PI / 2), 5, 1e-9);
  // Toward a corner: out through the nearer side.
  close(outlineReach(box, Math.atan2(1, 1)), 5 * Math.SQRT2, 1e-9);
  close(outlineReach({shape: "Rect", r: 5}, 0), 5);
  close(outlineReach({shape: "Rect", r: 5}, Math.PI / 4), 5 * Math.SQRT2);
});

it("outlineReach keeps both corners of a wide stroke inside a box", () => {
  const square = {shape: "Rect", r: 10};
  // Square to a side, the corners meet the side with the end's middle.
  close(outlineReach(square, 0, 6), 10);
  // At 45°, the corner nearer the box's corner leaves first.
  const angle = Math.PI / 4;
  const reach = outlineReach(square, angle, 4);
  const corner = [
    reach * Math.cos(angle) + 2 * Math.sin(angle),
    reach * Math.sin(angle) - 2 * Math.cos(angle),
  ];
  close(Math.max(...corner.map(Math.abs)), 10);
  assert.ok(reach < 10 * Math.SQRT2);
  assert.strictEqual(
    outlineReach({shape: "Rect", r: 10, height: 4}, 0, 6),
    0,
    "a stroke wider than the box",
  );
});

it("outlineReach treats a missing or bad size as a point", () => {
  assert.strictEqual(outlineReach({}, 0), 0);
  assert.strictEqual(outlineReach({r: NaN}, 0), 0);
  assert.strictEqual(outlineReach({r: -4}, 0), 0);
  assert.strictEqual(outlineReach({r: 4}, 0, NaN), 4);
});

it("outlineReach turns a Rect node's box by its rotate", () => {
  const box = {shape: "Rect", width: 40, height: 10, rotate: 90};
  close(outlineReach(box, 0), 5);
  close(outlineReach(box, Math.PI / 2), 20);
  close(outlineReach({...box, rotate: 180}, 0), 20);
  close(outlineReach({...box, rotate: NaN}, 0), 20, 1e-9);
  // Circles have no turn.
  close(outlineReach({r: 10, rotate: 45}, 0), 10);
});

it("outlineExit is where a line to one side of the center meets the outline", () => {
  close(outlineExit({r: 10}, 0), 10);
  close(outlineExit({r: 10}, 1.3, 6), 8);
  close(outlineExit({r: 10}, 1.3, -6), 8);
  assert.strictEqual(outlineExit({r: 10}, 0, 10), 0, "a tangent misses");
  const box = {shape: "Rect", width: 40, height: 10};
  close(outlineExit(box, 0, 4), 20);
  close(outlineExit(box, -Math.PI / 2, 15), 5);
  assert.strictEqual(outlineExit(box, 0, 6), 0, "a line past the box misses");
  // Up and to the right, a pixel to the right of the line: out through the top.
  const angle = -Math.PI / 4;
  const t = outlineExit(box, angle, 1);
  const y = t * Math.sin(angle) + Math.cos(angle);
  close(y, -5);
  // Turned a quarter, the box runs tall.
  close(outlineExit({...box, rotate: 90}, -Math.PI / 2, 3), 20);
  // outlineReach takes the nearer of the stroke's two edges.
  close(
    outlineReach(box, angle, 2),
    Math.min(outlineExit(box, angle, 1), outlineExit(box, angle, -1)),
  );
});
