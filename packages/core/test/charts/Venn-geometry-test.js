import {it} from "vitest";
import assert from "assert";
import {
  circleCrossings,
  circleOverlap,
  circlePath,
  distance,
  distanceForOverlap,
  insideAll,
  intersection,
  intersectionArea,
  intersectionPath,
  segmentArea,
} from "../../src/charts/Venn/circles.ts";
import {nelderMead} from "../../src/charts/Venn/nelderMead.ts";
import {near} from "~test/helpers.js";

const circle = (x, y, radius) => ({x, y, radius});

it("Venn circles: distance between two points", () => {
  assert.strictEqual(distance({x: 0, y: 0}, {x: 3, y: 4}), 5);
});

it("Venn circles: segmentArea is 0 for no height, half the circle at the radius, all of it at the diameter", () => {
  assert.strictEqual(segmentArea(2, 0), 0);
  near(segmentArea(2, 2), Math.PI * 2, 1e-9);
  near(segmentArea(2, 4), Math.PI * 4, 1e-9);
  near(segmentArea(2, 9), Math.PI * 4, 1e-9);
});

it("Venn circles: circleOverlap is 0 apart, the smaller circle inside, a lens between", () => {
  assert.strictEqual(circleOverlap(1, 1, 2), 0);
  assert.strictEqual(circleOverlap(1, 1, 5), 0);
  near(circleOverlap(3, 1, 1), Math.PI, 1e-9);
  // Two unit circles one radius apart share 2π/3 − √3/2.
  near(circleOverlap(1, 1, 1), (2 * Math.PI) / 3 - Math.sqrt(3) / 2, 1e-9);
});

it("Venn circles: circleCrossings finds the two crossing points, or none", () => {
  const points = circleCrossings(circle(0, 0, 1), circle(1, 0, 1));
  assert.strictEqual(points.length, 2);
  for (const p of points) {
    near(p.x, 0.5, 1e-9);
    near(Math.abs(p.y), Math.sqrt(3) / 2, 1e-9);
  }
  assert.deepStrictEqual(circleCrossings(circle(0, 0, 1), circle(3, 0, 1)), []);
  assert.deepStrictEqual(circleCrossings(circle(0, 0, 3), circle(0, 0, 1)), []);
});

it("Venn circles: distanceForOverlap inverts circleOverlap", () => {
  const d = distanceForOverlap(2, 1.5, 2);
  near(circleOverlap(2, 1.5, d), 2, 1e-6);
  assert.strictEqual(distanceForOverlap(2, 1, 0), 3);
  assert.strictEqual(distanceForOverlap(2, 1, Math.PI), 1);
  assert.strictEqual(distanceForOverlap(2, 1, 99), 1);
});

it("Venn circles: insideAll checks every circle", () => {
  const pair = [circle(0, 0, 1), circle(1, 0, 1)];
  assert.ok(insideAll({x: 0.5, y: 0}, pair));
  assert.ok(!insideAll({x: -0.5, y: 0}, pair));
});

it("Venn circles: intersection of two circles matches the lens, with two arcs", () => {
  const pair = [circle(0, 0, 1), circle(1, 0, 1)];
  const {area, arcs} = intersection(pair);
  near(area, circleOverlap(1, 1, 1), 1e-9);
  assert.strictEqual(arcs.length, 2);
  near(intersectionArea(pair), area, 1e-9);
});

it("Venn circles: intersection of three circles (the Reuleaux triangle)", () => {
  // Three unit circles, each centered on the others' crossing: they share a
  // Reuleaux triangle of area (π − √3) / 2.
  const trio = [
    circle(0, 0, 1),
    circle(1, 0, 1),
    circle(0.5, Math.sqrt(3) / 2, 1),
  ];
  const {area, arcs} = intersection(trio);
  near(area, (Math.PI - Math.sqrt(3)) / 2, 1e-9);
  assert.strictEqual(arcs.length, 3);
  near(intersectionArea(trio), area, 1e-9);
});

it("Venn circles: intersection is the smallest circle when it lies inside the rest, else nothing", () => {
  const nested = intersection([circle(0, 0, 3), circle(0.5, 0, 1)]);
  near(nested.area, Math.PI, 1e-9);
  assert.strictEqual(nested.arcs.length, 1);
  assert.strictEqual(nested.arcs[0].circle.radius, 1);
  const apart = intersection([
    circle(0, 0, 1),
    circle(5, 0, 1),
    circle(0, 5, 1),
  ]);
  assert.strictEqual(apart.area, 0);
  assert.deepStrictEqual(apart.arcs, []);
  assert.deepStrictEqual(intersection([]), {area: 0, arcs: []});
  near(intersection([circle(1, 1, 2)]).area, Math.PI * 4, 1e-9);
});

it("Venn circles: circlePath draws a whole circle from two arcs", () => {
  assert.strictEqual(
    circlePath(circle(10, 20, 5)),
    "M5,20A5,5,0,1,0,15,20A5,5,0,1,0,5,20Z",
  );
});

it("Venn circles: intersectionPath outlines a lens, a nested circle, or nothing", () => {
  const lens = intersectionPath([circle(0, 0, 1), circle(1, 0, 1)]);
  assert.ok(lens.startsWith("M"));
  assert.strictEqual((lens.match(/A/g) || []).length, 2);
  assert.ok(lens.endsWith("Z"));
  assert.strictEqual(
    intersectionPath([circle(0, 0, 3), circle(0, 0, 1)]),
    circlePath(circle(0, 0, 1)),
  );
  assert.strictEqual(intersectionPath([circle(0, 0, 1), circle(9, 0, 1)]), "");
});

it("Venn nelderMead: finds the minimum of a bowl, deterministically", () => {
  const bowl = ([x, y]) => (x - 3) ** 2 + (y + 2) ** 2 + 1;
  const a = nelderMead(bowl, [0, 0]);
  near(a.x[0], 3, 1e-3);
  near(a.x[1], -2, 1e-3);
  near(a.fx, 1, 1e-6);
  assert.deepStrictEqual(nelderMead(bowl, [0, 0]), a);
});

it("Venn nelderMead: minimizes Rosenbrock's valley, and handles no dimensions", () => {
  const rosen = ([x, y]) => (1 - x) ** 2 + 100 * (y - x * x) ** 2;
  const {x} = nelderMead(rosen, [-1, 1], {maxIterations: 2000});
  near(x[0], 1, 1e-2);
  near(x[1], 1, 1e-2);
  assert.deepStrictEqual(
    nelderMead(() => 7, []),
    {x: [], fx: 7},
  );
});
