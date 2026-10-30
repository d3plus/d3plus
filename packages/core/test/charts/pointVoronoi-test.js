import {describe, it} from "vitest";
import assert from "assert";

import {pointVoronoi, polygonDistance} from "../../internal.ts";

/**
    `pointVoronoi`, the Voronoi diagram behind nearest-point hover (and the
    cells label placement reads): nearest within a distance, edge distances
    for sized points, ties, degenerate inputs, clipped cells, and neighbors.
*/

const bounds = {x: 0, y: 0, width: 100, height: 100};
const pts = (...xy) => xy.map(([x, y, r], i) => ({x, y, r, item: `p${i}`}));

/** Whether a ring's vertices all lie inside a box. */
const within = (ring, b) =>
  ring.every(
    ([x, y]) =>
      x >= b.x - 1e-6 &&
      x <= b.x + b.width + 1e-6 &&
      y >= b.y - 1e-6 &&
      y <= b.y + b.height + 1e-6,
  );

/** A ring's signed area (shoelace). */
const area = ring =>
  Math.abs(
    ring.reduce((s, [x, y], i) => {
      const [nx, ny] = ring[(i + 1) % ring.length];
      return s + x * ny - nx * y;
    }, 0) / 2,
  );

describe("pointVoronoi", () => {
  it("finds the nearest point within the distance", () => {
    const v = pointVoronoi(pts([10, 10], [50, 50], [90, 10]), bounds);
    const m = v.nearest(55, 50, 20);
    assert.strictEqual(m.index, 1);
    assert.strictEqual(m.point.item, "p1");
    assert.strictEqual(m.distance, 5);
    assert.strictEqual(v.nearest(84, 14, 20).index, 2);
  });

  it("returns null beyond the distance", () => {
    const v = pointVoronoi(pts([10, 10], [50, 50]), bounds);
    assert.strictEqual(v.nearest(30, 80, 20), null);
    assert.strictEqual(v.nearest(50, 75, 20), null, "25px away");
    assert.ok(v.nearest(50, 75), "unlimited by default");
    assert.strictEqual(v.nearest(50, 70, 20).distance, 20, "inclusive");
  });

  it("measures from a point's edge", () => {
    // Pointer at x=58: 8px from the small point's center, 2px from the big
    // point's edge (center 80, radius 20).
    const v = pointVoronoi(pts([50, 50, 0], [80, 50, 20]), bounds);
    const m = v.nearest(58, 50, 20);
    assert.strictEqual(m.index, 1);
    assert.strictEqual(m.distance, 2);
    assert.strictEqual(v.nearest(75, 50, 20).distance, 0, "inside is 0");
    // Out of reach of the small point but within reach of the big one's edge.
    assert.strictEqual(v.nearest(80, 85, 20).index, 1);
  });

  it("counts a missing, negative, or non-finite radius as 0", () => {
    const v = pointVoronoi(
      pts([20, 50, NaN], [50, 50, -4], [80, 50, undefined]),
      bounds,
    );
    assert.strictEqual(v.nearest(30, 50, 10).index, 0);
    assert.strictEqual(v.nearest(30, 50, 10).distance, 10);
    assert.strictEqual(v.nearest(56, 50, 10).distance, 6);
    assert.strictEqual(v.nearest(88, 50, 10).index, 2);
  });

  it("breaks ties by the nearer center, then the lower index", () => {
    const v = pointVoronoi(pts([40, 50], [60, 50]), bounds);
    assert.strictEqual(v.nearest(50, 50, 20).index, 0);
    const sized = pointVoronoi(pts([40, 50, 5], [70, 50, 15]), bounds);
    // Both edges 5px away; the first center is nearer.
    assert.strictEqual(sized.nearest(50, 50, 20).index, 0);
    const reversed = pointVoronoi(pts([60, 50], [40, 50]), bounds);
    assert.strictEqual(reversed.nearest(50, 50, 20).index, 0);
  });

  it("handles a single point", () => {
    const v = pointVoronoi(pts([30, 40]), bounds);
    assert.strictEqual(v.nearest(35, 40, 10).index, 0);
    assert.strictEqual(v.nearest(80, 80, 10), null);
    assert.deepStrictEqual(v.neighbors(0), []);
    assert.strictEqual(area(v.cell(0)), 100 * 100, "the whole box");
  });

  it("handles empty input", () => {
    const v = pointVoronoi([], bounds);
    assert.strictEqual(v.nearest(10, 10, 50), null);
    assert.strictEqual(v.cell(0), null);
    assert.deepStrictEqual(v.neighbors(0), []);
    assert.deepStrictEqual(v.bounds, bounds);
  });

  it("leaves out non-finite points and coincident duplicates", () => {
    const v = pointVoronoi(pts([NaN, 10], [20, 20], [20, 20]), bounds);
    assert.strictEqual(v.nearest(25, 20, 10).index, 1, "the first duplicate");
    assert.strictEqual(v.cell(0), null);
    assert.strictEqual(v.cell(2), null);
    assert.deepStrictEqual(v.neighbors(2), []);
    assert.strictEqual(v.nearest(NaN, 0, 10), null);
  });

  it("clips cells to the bounds and covers them", () => {
    const v = pointVoronoi(
      pts([10, 10], [50, 50], [90, 10], [20, 80], [80, 85]),
      bounds,
    );
    let total = 0;
    for (let i = 0; i < 5; i++) {
      const ring = v.cell(i);
      assert.ok(within(ring, bounds), `cell ${i} inside the bounds`);
      assert.notDeepStrictEqual(ring[0], ring[ring.length - 1], "open ring");
      assert.strictEqual(
        polygonDistance(...[v.points[i].x, v.points[i].y], ring),
        0,
      );
      total += area(ring);
    }
    assert.ok(Math.abs(total - 100 * 100) < 1e-6, "cells tile the box");
  });

  it("splits two points' box down the middle", () => {
    const v = pointVoronoi(pts([25, 50], [75, 50]), bounds);
    const xs = v.cell(0).map(([x]) => x);
    assert.strictEqual(Math.max(...xs), 50);
    assert.strictEqual(area(v.cell(0)), 50 * 100);
  });

  it("grows the bounds to hold every point", () => {
    const v = pointVoronoi(pts([10, 10], [150, -20]), bounds);
    assert.deepStrictEqual(v.bounds, {x: 0, y: -20, width: 150, height: 120});
    assert.ok(within(v.cell(1), v.bounds));
  });

  it("lists neighbors", () => {
    // A center point ringed by four, plus a far corner only the ring touches.
    const v = pointVoronoi(
      pts([50, 50], [50, 20], [80, 50], [50, 80], [20, 50], [98, 98]),
      bounds,
    );
    assert.deepStrictEqual(v.neighbors(0), [1, 2, 3, 4]);
    assert.ok(!v.neighbors(5).includes(0), "the corner isn't adjacent");
    assert.ok(v.neighbors(5).includes(2) && v.neighbors(5).includes(3));
    for (const n of v.neighbors(2))
      assert.ok(v.neighbors(n).includes(2), "symmetric");
  });

  it("finds an edge match past a nearer center", () => {
    // A row of small points, with a big bubble below the pointer reaching
    // closer than any of them.
    const row = [10, 20, 30, 40, 50, 60, 70].map(x => [x, 10, 1]);
    const v = pointVoronoi(pts(...row, [40, 70, 45]), bounds);
    const m = v.nearest(40, 22, 20);
    assert.strictEqual(m.index, 7);
    assert.strictEqual(m.distance, 3);
  });
});

describe("polygonDistance", () => {
  const square = [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
  ];
  it("is 0 inside and the edge distance outside", () => {
    assert.strictEqual(polygonDistance(5, 5, square), 0);
    assert.strictEqual(polygonDistance(13, 5, square), 3);
    assert.strictEqual(polygonDistance(13, 14, square), 5, "to a corner");
  });
});
