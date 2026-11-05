import {it} from "vitest";
import assert from "assert";

import * as polyline from "../../src/charts/features/polyline.ts";
import * as flowGeometry from "../../src/charts/Geomap/flowGeometry.ts";

/**
    The shared polyline helpers: Geomap reads the same functions through
    `flowGeometry`, and `polylineReach` finds where a path leaves a circle
    around its start.
*/

const {
  polylineAt,
  polylineBox,
  polylineLength,
  polylineMidpoint,
  polylinePath,
  polylineReach,
  trimPolyline,
} = polyline;

const close = (a, b, eps = 1e-9) =>
  assert.ok(Math.abs(a - b) < eps, `${a} is not close to ${b}`);

const line = [
  [0, 0],
  [30, 0],
  [30, 40],
];

it("flowGeometry re-exports the shared polyline helpers", () => {
  for (const name of [
    "polylineAt",
    "polylineBox",
    "polylineLength",
    "polylineMidpoint",
    "polylinePath",
    "trimPolyline",
  ])
    assert.strictEqual(flowGeometry[name], polyline[name], name);
});

it("polylinePath, polylineLength, polylineAt, polylineMidpoint, and polylineBox", () => {
  assert.strictEqual(
    polylinePath([[0.123, 1], ...line.slice(1)]),
    "M0.12,1L30,0L30,40",
  );
  assert.strictEqual(polylineLength(line), 70);
  assert.deepStrictEqual(polylineAt(line, 10), {x: 10, y: 0, angle: 0});
  const mid = polylineMidpoint(line);
  assert.deepStrictEqual([mid.x, mid.y], [30, 5]);
  close(mid.angle, Math.PI / 2);
  assert.deepStrictEqual(polylineBox(line), [
    [0, 0],
    [30, 40],
  ]);
});

it("trimPolyline cuts each end along the length", () => {
  assert.deepStrictEqual(trimPolyline(line, 10, 20), [
    [10, 0],
    [30, 0],
    [30, 20],
  ]);
  assert.deepStrictEqual(trimPolyline(line, 50, 50), [
    [30, 5],
    [30, 5],
  ]);
});

it("polylineReach finds where a polyline leaves a circle around its start", () => {
  close(polylineReach(line, 10), 10);
  // Leaves a circle of radius 50 at (30, 40): 30 along the first segment, 40 up.
  close(polylineReach(line, 50), 70);
  // A bend inside the circle: the distance walked is longer than the radius.
  close(polylineReach(line, Math.hypot(30, 20)), 50);
  assert.strictEqual(polylineReach(line, 99), 70, "never leaves it");
  assert.strictEqual(polylineReach(line, 0), 0);
  assert.strictEqual(polylineReach([], 5), 0);
});
