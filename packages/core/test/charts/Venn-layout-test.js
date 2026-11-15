import {it} from "vitest";
import assert from "assert";
import {
  circleOverlap,
  distance,
  intersectionArea,
} from "../../src/charts/Venn/circles.ts";
import {
  areaKey,
  classicLayout,
  greedyLayout,
  layoutAreas,
  proportionalLayout,
  vennLoss,
} from "../../src/charts/Venn/vennLayout.ts";
import {
  circleBounds,
  disjointClusters,
  fitCircles,
  normalizeCircles,
  orientCircles,
} from "../../src/charts/Venn/vennFit.ts";
import {
  exclusiveSizes,
  outsideCircles,
  regionMargin,
  vennLabelSpot,
} from "../../src/charts/Venn/vennRegions.ts";
import {near} from "~test/helpers.js";

const area = c => Math.PI * c.radius ** 2;
const trio = [
  {sets: ["A"], size: 12},
  {sets: ["B"], size: 12},
  {sets: ["C"], size: 12},
  {sets: ["A", "B"], size: 2},
  {sets: ["A", "C"], size: 2},
  {sets: ["B", "C"], size: 2},
  {sets: ["A", "B", "C"], size: 1},
];

it("Venn layout: areaKey is the same for the same sets in any order", () => {
  assert.strictEqual(areaKey(["B", "A"]), areaKey(["A", "B"]));
  assert.notStrictEqual(areaKey(["A"]), areaKey(["A", "B"]));
});

it("Venn layout: layoutAreas drops unknown sets and repeats, caps overlaps, and adds missing pairs as empty", () => {
  const areas = layoutAreas([
    {sets: ["A"], size: 10},
    {sets: ["B"], size: 4},
    {sets: ["C"], size: 0},
    {sets: ["A", "B"], size: 9},
    {sets: ["B", "A"], size: 1},
    {sets: ["A", "Z"], size: 1},
    {sets: ["D"], size: 5},
  ]);
  const sizes = Object.fromEntries(areas.map(a => [areaKey(a.sets), a.size]));
  assert.strictEqual(sizes[areaKey(["A", "B"])], 4, "capped at B's size");
  assert.ok(!(areaKey(["C"]) in sizes), "a set of size 0 has no circle");
  assert.ok(!(areaKey(["A", "Z"]) in sizes), "Z has no row of its own");
  assert.strictEqual(sizes[areaKey(["A", "D"])], 0);
  assert.strictEqual(sizes[areaKey(["B", "D"])], 0);
  assert.strictEqual(areas.length, 6);
});

it("Venn layout: vennLoss is zero for circles that match their areas", () => {
  const circles = {
    A: {x: 0, y: 0, radius: 1},
    B: {x: 1, y: 0, radius: 1},
  };
  const exact = circleOverlap(1, 1, 1);
  assert.strictEqual(vennLoss(circles, [{sets: ["A", "B"], size: exact}]), 0);
  near(vennLoss(circles, [{sets: ["A", "B"], size: exact + 2}]), 4, 1e-9);
  assert.strictEqual(vennLoss(circles, [{sets: ["A"], size: 99}]), 0);
});

it("Venn layout: greedyLayout places the most-overlapped set at the origin and the rest at their pair distances", () => {
  const circles = greedyLayout(
    layoutAreas([
      {sets: ["A"], size: 10},
      {sets: ["B"], size: 8},
      {sets: ["A", "B"], size: 3},
    ]),
  );
  near(area(circles.A), 10, 1e-9);
  near(area(circles.B), 8, 1e-9);
  near(
    circleOverlap(
      circles.A.radius,
      circles.B.radius,
      distance(circles.A, circles.B),
    ),
    3,
    1e-6,
  );
  assert.deepStrictEqual(greedyLayout([]), {});
});

it("Venn layout: proportionalLayout is exact for two sets", () => {
  const c = proportionalLayout([
    {sets: ["A"], size: 100},
    {sets: ["B"], size: 50},
    {sets: ["A", "B"], size: 20},
  ]);
  near(area(c.A), 100, 1e-9);
  near(area(c.B), 50, 1e-9);
  near(circleOverlap(c.A.radius, c.B.radius, distance(c.A, c.B)), 20, 1e-3);
});

it("Venn layout: proportionalLayout comes close for three sets drawn from real circles", () => {
  // Sizes measured off three circles, so a layout that matches them exists.
  const real = {
    A: {x: 0, y: 0, radius: 3},
    B: {x: 3.5, y: 0, radius: 2.5},
    C: {x: 1.5, y: 2.8, radius: 2},
  };
  const sets = [
    ["A"],
    ["B"],
    ["C"],
    ["A", "B"],
    ["A", "C"],
    ["B", "C"],
    ["A", "B", "C"],
  ];
  const sizes = sets.map(s => ({
    sets: s,
    size: intersectionArea(s.map(k => real[k])),
  }));
  const c = proportionalLayout(sizes);
  for (const {sets: s, size} of sizes)
    near(
      intersectionArea(s.map(k => c[k])),
      size,
      size * 0.05 + 0.05,
      s.join(),
    );
  assert.ok(vennLoss(c, sizes) < 0.05);
});

it("Venn layout: proportionalLayout keeps sets that share nothing apart, and a subset inside its superset", () => {
  const apart = proportionalLayout([
    {sets: ["A"], size: 10},
    {sets: ["B"], size: 10},
  ]);
  assert.ok(
    distance(apart.A, apart.B) >= apart.A.radius + apart.B.radius - 1e-6,
  );
  const nested = proportionalLayout([
    {sets: ["A"], size: 10},
    {sets: ["B"], size: 3},
    {sets: ["A", "B"], size: 3},
  ]);
  assert.ok(
    distance(nested.A, nested.B) + nested.B.radius <= nested.A.radius + 1e-6,
  );
  const one = proportionalLayout([{sets: ["A"], size: 4}]);
  near(area(one.A), 4, 1e-9);
});

it("Venn layout: classicLayout draws equal circles side by side, in a triangle, or in a ring", () => {
  assert.deepStrictEqual(classicLayout(["A"]), {A: {x: 0, y: 0, radius: 1}});
  const two = classicLayout(["A", "B"]);
  assert.ok(two.A.x < two.B.x);
  assert.strictEqual(distance(two.A, two.B), 1);
  const three = classicLayout(["A", "B", "C"]);
  near(distance(three.A, three.B), 1, 1e-9);
  near(distance(three.B, three.C), 1, 1e-9);
  assert.ok(three.A.y < three.C.y && three.B.y < three.C.y, "C below");
  const five = classicLayout(["A", "B", "C", "D", "E"]);
  for (const c of Object.values(five)) {
    assert.strictEqual(c.radius, 1);
    assert.ok(distance(c, {x: 0, y: 0}) < 1, "covers the center");
  }
  assert.deepStrictEqual(classicLayout([]), {});
});

it("Venn fit: circleBounds spans every circle's full extent", () => {
  assert.deepStrictEqual(
    circleBounds([
      {x: 0, y: 0, radius: 1},
      {x: 5, y: 2, radius: 2},
    ]),
    {x0: -1, x1: 7, y0: -1, y1: 4},
  );
});

it("Venn fit: disjointClusters groups circles that overlap directly or through others", () => {
  const groups = disjointClusters([
    {x: 0, y: 0, radius: 1, id: "a"},
    {x: 1.5, y: 0, radius: 1, id: "b"},
    {x: 3, y: 0, radius: 1, id: "c"},
    {x: 10, y: 0, radius: 1, id: "d"},
  ]);
  assert.deepStrictEqual(
    groups.map(g => g.map(c => c.id)),
    [["a", "b", "c"], ["d"]],
  );
});

it("Venn fit: orientCircles puts the largest at the origin and the next to its right", () => {
  const circles = [
    {x: 5, y: 5, radius: 1},
    {x: 5, y: 8, radius: 2},
  ];
  orientCircles(circles);
  assert.strictEqual(circles[0].radius, 2);
  near(circles[0].x, 0, 1e-9);
  near(circles[0].y, 0, 1e-9);
  near(circles[1].x, 3, 1e-9);
  near(circles[1].y, 0, 1e-9);
});

it("Venn fit: normalizeCircles packs a group that shares nothing beside the largest", () => {
  const out = normalizeCircles({
    A: {x: 0, y: 0, radius: 2},
    B: {x: 2, y: 0, radius: 2},
    C: {x: 100, y: 100, radius: 1},
  });
  const main = circleBounds([out.A, out.B]);
  assert.ok(out.C.x - out.C.radius > main.x1, "C sits to the right");
  assert.ok(out.C.y - out.C.radius < main.y1 && out.C.y > main.y0);
  near(distance(out.A, out.B), 2, 1e-9);
});

it("Venn fit: fitCircles scales and centers the circles in the box, inside the padding", () => {
  const out = fitCircles(
    {A: {x: 0, y: 0, radius: 1}, B: {x: 2, y: 0, radius: 1}},
    400,
    200,
    10,
  );
  const b = circleBounds(Object.values(out));
  near(b.y0, 10, 1e-9);
  near(b.y1, 190, 1e-9);
  near((b.x0 + b.x1) / 2, 200, 1e-9);
  near(out.A.radius, 90, 1e-9);
  assert.deepStrictEqual(fitCircles({}, 100, 100), {});
});

it("Venn regions: regionMargin is positive inside the region and negative outside", () => {
  const a = {x: 0, y: 0, radius: 2};
  const b = {x: 3, y: 0, radius: 2};
  assert.strictEqual(regionMargin({x: -1, y: 0}, [a], [b]), 1);
  assert.ok(regionMargin({x: 1.5, y: 0}, [a], [b]) < 0);
  assert.strictEqual(regionMargin({x: 1.5, y: 0}, [a, b], []), 0.5);
});

it("Venn regions: vennLabelSpot finds the deepest point of a region, or of the overlap when the region is covered", () => {
  const a = {x: 0, y: 0, radius: 2};
  const b = {x: 3, y: 0, radius: 2};
  const onlyA = vennLabelSpot([a], [b]);
  assert.ok(onlyA.x < 0, "left of A's center, away from B");
  near(onlyA.margin, regionMargin(onlyA, [a], [b]), 1e-9);
  assert.ok(onlyA.margin > 1);
  const lens = vennLabelSpot([a, b], []);
  near(lens.x, 1.5, 1e-3);
  near(lens.y, 0, 1e-3);
  const covered = vennLabelSpot([a, b], [{x: 1.5, y: 0, radius: 5}]);
  assert.strictEqual(covered.margin, 0);
  near(covered.x, 1.5, 1e-3);
});

it("Venn regions: outsideCircles leaves out the region's sets and any set containing them", () => {
  const circles = {
    A: {x: 0, y: 0, radius: 5},
    B: {x: 1, y: 0, radius: 1},
    C: {x: 8, y: 0, radius: 2},
  };
  assert.deepStrictEqual(outsideCircles(["B"], circles), [circles.C]);
  assert.deepStrictEqual(outsideCircles(["A"], circles), [
    circles.B,
    circles.C,
  ]);
});

it("Venn regions: exclusiveSizes subtracts the regions inside each one", () => {
  const sizes = exclusiveSizes(trio);
  assert.strictEqual(sizes.get(areaKey(["A"])), 12 - 2 - 2 + 1);
  assert.strictEqual(sizes.get(areaKey(["A", "B"])), 2 - 1);
  assert.strictEqual(sizes.get(areaKey(["A", "B", "C"])), 1);
  const bad = exclusiveSizes([
    {sets: ["A"], size: 1},
    {sets: ["A", "B"], size: 5},
  ]);
  assert.strictEqual(bad.get(areaKey(["A"])), 0, "never negative");
});
