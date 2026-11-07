import {it} from "vitest";
import assert from "assert";
import {polygonHull} from "d3-polygon";
import {default as negativeSpace, hullPoints} from "../src/negativeSpace.ts";

// Reference: every padded corner of every finite obstacle.
function refCorners(obstacles, padding) {
  const points = [];
  for (const o of obstacles) {
    if (![o.x, o.y, o.width, o.height].every(Number.isFinite)) continue;
    const x0 = o.x - padding,
      y0 = o.y - padding;
    const x1 = o.x + o.width + padding,
      y1 = o.y + o.height + padding;
    points.push([x0, y0], [x1, y0], [x1, y1], [x0, y1]);
  }
  return points;
}

function seeded(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

/** Obstacle sets: scattered boxes, map-like outlines of points, grids, lines, duplicates and degenerate ones. */
function obstacleSets(random) {
  const sets = [
    [],
    [{x: 5, y: 5, width: 0, height: 0}],
    [{x: 5, y: 5, width: 10, height: 3}],
    [{x: NaN, y: 5, width: 1, height: 1}],
    [
      {x: 1, y: 1, width: 0, height: 0},
      {x: 1, y: 1, width: 0, height: 0},
    ],
    // Points on one line.
    Array.from({length: 50}, (_, i) => ({x: i * 3, y: 7, width: 0, height: 0})),
    Array.from({length: 50}, (_, i) => ({x: i, y: i, width: 0, height: 0})),
  ];
  // A grid: many corners exactly on the hull's edges.
  const grid = [];
  for (let i = 0; i < 20; i++)
    for (let j = 0; j < 15; j++)
      grid.push({x: i * 10, y: j * 10, width: 4, height: 4});
  sets.push(grid);
  for (let n = 0; n < 30; n++) {
    const count = 1 + Math.floor(random() * 400);
    const kind = n % 3;
    const set = [];
    for (let k = 0; k < count; k++) {
      if (kind === 0)
        set.push({
          x: random() * 800,
          y: random() * 600,
          width: random() * 40,
          height: random() * 40,
        });
      else if (kind === 1) {
        // An outline traced into points, like a map region or a pie wedge.
        const a = random() * Math.PI * 2;
        const r = 200 + random() * 20;
        set.push({
          x: 400 + Math.cos(a) * r,
          y: 300 + Math.sin(a) * r * 0.6,
          width: 0,
          height: 0,
        });
      } else {
        // Snapped to whole pixels, with repeats.
        const x = Math.round(random() * 50) * 4,
          y = Math.round(random() * 30) * 4;
        set.push({x, y, width: 0, height: 0}, {x, y, width: 0, height: 0});
      }
    }
    sets.push(set);
  }
  return sets;
}

it("hullPoints — the hull of the kept corners is the hull of every corner", () => {
  const random = seeded(5);
  let dropped = 0;
  for (const set of obstacleSets(random))
    for (const padding of [0, 2, 7.5]) {
      const all = refCorners(set, padding);
      const kept = hullPoints(set, padding);
      assert.ok(kept.length <= all.length);
      dropped += all.length - kept.length;
      const keys = new Set(all.map(p => `${p[0]},${p[1]}`));
      assert.ok(
        kept.every(p => keys.has(`${p[0]},${p[1]}`)),
        "only corners",
      );
      assert.deepStrictEqual(
        all.length ? polygonHull(kept) : [],
        all.length ? polygonHull(all) : [],
      );
    }
  assert.ok(dropped > 1000, "leaves interior corners out");
});

it("negativeSpace — the same open space as the hull of every corner", () => {
  // The obstacles' hull, as one box per vertex, gives the same open space.
  const random = seeded(9);
  const bounds = {x: -20, y: -20, width: 900, height: 700};
  for (const set of obstacleSets(random).slice(8)) {
    const hull = polygonHull(refCorners(set, 3));
    const asBoxes = hull.map(([x, y]) => ({x, y, width: 0, height: 0}));
    assert.deepStrictEqual(
      negativeSpace(bounds, set, {padding: 3}),
      negativeSpace(bounds, asBoxes),
    );
  }
});
