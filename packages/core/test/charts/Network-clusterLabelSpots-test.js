import {it} from "vitest";
import assert from "assert";
import {polygonContains, polygonHull} from "d3-polygon";

import {
  clusterLabelObstacles,
  nearestPoint,
  placeClusterLabel,
} from "../../internal.ts";
import {polygonRows} from "../../src/charts/Network/polygonRows.ts";

/**
    The cluster-name placement helpers give the same answers as
    straightforward versions of themselves: `polygonRows` as d3-polygon's
    `polygonContains`, `placeClusterLabel` as a point-by-point search, and
    the obstacle and nearest-node grids as string-keyed ones.
*/

const seeded = seed => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

/** A random convex hull of `n` points around a center. */
const randomHull = (random, n, scale = 200) =>
  polygonHull(
    Array.from({length: n}, () => [
      100 + random() * scale,
      80 + random() * scale * 0.6,
    ]),
  );

/** A random star-shaped (non-convex) polygon. */
const randomStar = (random, n) =>
  Array.from({length: n}, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const r = 20 + random() * 80;
    return [150 + r * Math.cos(a), 150 + r * Math.sin(a)];
  });

it("polygonRows: equals polygonContains", () => {
  const random = seeded(3);
  const polygons = [
    [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ],
    [
      [0, 0],
      [5, 5],
      [10, 10],
    ],
    [
      [0, 0],
      [0, 0],
      [4, 0],
      [4, 3],
    ],
    [[1, 1]],
  ];
  for (let i = 0; i < 40; i++) polygons.push(randomHull(random, 3 + i * 4));
  for (let i = 0; i < 20; i++) polygons.push(randomStar(random, 5 + i));
  for (const polygon of polygons) {
    const contains = polygonRows(polygon).contains;
    const points = [
      [NaN, 5],
      [5, NaN],
      [-0, 0],
      [0, -0],
    ];
    // Vertices, edge midpoints, and points along each vertex's row.
    for (const [x, y] of polygon)
      points.push([x, y], [x - 1e-9, y], [x + 1e-9, y], [x + 3, y]);
    polygon.forEach((p, k) => {
      const q = polygon[(k + 1) % polygon.length];
      points.push([(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]);
    });
    for (let k = 0; k < 400; k++)
      points.push([random() * 400 - 50, random() * 300 - 50]);
    // Grid rows shared by many points.
    for (let gx = -10; gx <= 320; gx += 11)
      for (let gy = -10; gy <= 320; gy += 13) points.push([gx, gy]);
    for (const point of points)
      assert.strictEqual(
        contains(point),
        polygonContains(polygon, point),
        `${JSON.stringify(polygon)} at ${point}`,
      );
  }
});

/** `placeClusterLabel` as written point by point with `polygonContains`. */
function referencePlace(hull, size, target, blocked, padding = 0, step = 4) {
  const xs = hull.map(p => p[0]);
  const ys = hull.map(p => p[1]);
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
  const [y0, y1] = [Math.min(...ys), Math.max(...ys)];
  const nx = Math.min(120, Math.ceil((x1 - x0) / step) + 1);
  const ny = Math.min(120, Math.ceil((y1 - y0) / step) + 1);
  const spots = [];
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < ny; j++) {
      const p = [
        x0 + (nx > 1 ? ((x1 - x0) * i) / (nx - 1) : 0),
        y0 + (ny > 1 ? ((y1 - y0) * j) / (ny - 1) : 0),
      ];
      if (polygonContains(hull, p)) spots.push(p);
    }
  const away = ([x, y]) => (x - target[0]) ** 2 + (y - target[1]) ** 2;
  spots.sort((a, b) => away(a) - away(b));
  const {width, height} = size;
  for (const [cx, cy] of spots) {
    const x = cx - width / 2;
    const y = cy - height / 2;
    const corners = [
      [x, y],
      [x + width, y],
      [x + width, y + height],
      [x, y + height],
    ];
    if (!corners.every(c => polygonContains(hull, c))) continue;
    const box = {
      x: x - padding,
      y: y - padding,
      width: width + padding * 2,
      height: height + padding * 2,
    };
    if (!blocked(box)) return {x, y, width, height};
  }
  return null;
}

it("placeClusterLabel: equals a point-by-point search", () => {
  const random = seeded(19);
  for (let trial = 0; trial < 60; trial++) {
    const hull = randomHull(
      random,
      4 + Math.floor(random() * 60),
      40 + trial * 4,
    );
    const target = [
      hull.reduce((s, p) => s + p[0], 0) / hull.length,
      hull.reduce((s, p) => s + p[1], 0) / hull.length,
    ];
    const circles = Array.from({length: Math.floor(random() * 40)}, () => ({
      x: 100 + random() * 300,
      y: 80 + random() * 200,
      r: 2 + random() * 12,
    }));
    const obstacles = clusterLabelObstacles(circles, []);
    const step = [4, 4, 2, 7.5][trial % 4];
    const padding = trial % 3;
    // Every font size a name tries, on the same hull (the cache's case).
    for (let fontSize = 16; fontSize >= 10; fontSize--) {
      const size = {
        width: fontSize * (2 + (trial % 7)),
        height: fontSize * 1.2,
      };
      const expected = referencePlace(
        hull,
        size,
        target,
        obstacles.hits,
        padding,
        step,
      );
      const actual = placeClusterLabel(
        hull,
        size,
        target,
        obstacles.hits,
        padding,
        step,
      );
      assert.deepStrictEqual(actual, expected, `trial ${trial} @ ${fontSize}`);
    }
  }
  // A hull that is a single point, and one that is a line.
  const point = [
    [5, 5],
    [5, 5],
    [5, 5],
  ];
  const line = [
    [0, 0],
    [10, 10],
    [20, 20],
  ];
  for (const hull of [point, line]) {
    const size = {width: 0, height: 0};
    assert.deepStrictEqual(
      placeClusterLabel(hull, size, [5, 5], () => false),
      referencePlace(hull, size, [5, 5], () => false),
    );
  }
});

/** The obstacle grid, string-keyed. */
function referenceObstacles(circles, boxes, cell = 32) {
  const buckets = new Map();
  const each = (b, fn) => {
    for (
      let i = Math.floor(b.x / cell);
      i <= Math.floor((b.x + b.width) / cell);
      i++
    )
      for (
        let j = Math.floor(b.y / cell);
        j <= Math.floor((b.y + b.height) / cell);
        j++
      )
        fn(`${i},${j}`);
  };
  const extent = o =>
    "r" in o
      ? {x: o.x - o.r, y: o.y - o.r, width: o.r * 2, height: o.r * 2}
      : o;
  const add = o => {
    const b = extent(o);
    if (![b.x, b.y, b.width, b.height].every(Number.isFinite)) return;
    each(b, key => {
      const list = buckets.get(key);
      if (list) list.push(o);
      else buckets.set(key, [o]);
    });
  };
  circles.forEach(add);
  boxes.forEach(add);
  const hitsCircle = (b, c) => {
    const dx = c.x - Math.max(b.x, Math.min(c.x, b.x + b.width));
    const dy = c.y - Math.max(b.y, Math.min(c.y, b.y + b.height));
    return dx * dx + dy * dy < c.r * c.r;
  };
  const overlap = (a, b) =>
    a.x < b.x + b.width &&
    b.x < a.x + a.width &&
    a.y < b.y + b.height &&
    b.y < a.y + a.height;
  const hits = box => {
    let hit = false;
    each(box, key => {
      if (hit) return;
      for (const o of buckets.get(key) ?? [])
        if ("r" in o ? hitsCircle(box, o) : overlap(box, o)) {
          hit = true;
          return;
        }
    });
    return hit;
  };
  return {hits, add};
}

it("clusterLabelObstacles: equals a string-keyed grid", () => {
  const random = seeded(23);
  for (let trial = 0; trial < 30; trial++) {
    const circles = Array.from({length: 60}, () => ({
      x: random() * 600 - 100,
      y: random() * 400 - 100,
      r: random() * 20,
    }));
    circles.push({x: NaN, y: 4, r: 3}, {x: -0, y: -0, r: 5});
    const boxes = Array.from({length: 20}, () => ({
      x: random() * 600 - 100,
      y: random() * 400 - 100,
      width: random() * 50,
      height: random() * 30,
    }));
    const actual = clusterLabelObstacles(circles, boxes);
    const expected = referenceObstacles(circles, boxes);
    for (let k = 0; k < 300; k++) {
      const box = {
        x: random() * 700 - 150,
        y: random() * 500 - 150,
        width: random() * 80,
        height: random() * 30,
      };
      assert.strictEqual(actual.hits(box), expected.hits(box));
      if (k % 50 === 0) {
        actual.add(box);
        expected.add(box);
      }
    }
  }
});

/** The nearest-point grid, string-keyed. */
function referenceNearest(points, cell = 32) {
  const buckets = new Map();
  let ix0 = Infinity,
    ix1 = -Infinity,
    iy0 = Infinity,
    iy1 = -Infinity;
  for (const p of points) {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
    const i = Math.floor(p.x / cell);
    const j = Math.floor(p.y / cell);
    [ix0, ix1, iy0, iy1] = [
      Math.min(ix0, i),
      Math.max(ix1, i),
      Math.min(iy0, j),
      Math.max(iy1, j),
    ];
    const key = `${i},${j}`;
    const list = buckets.get(key);
    if (list) list.push(p);
    else buckets.set(key, [p]);
  }
  return (x, y) => {
    if (!buckets.size) return undefined;
    const ci = Math.floor(x / cell);
    const cj = Math.floor(y / cell);
    const reach = Math.max(
      Math.abs(ci - ix0),
      Math.abs(ci - ix1),
      Math.abs(cj - iy0),
      Math.abs(cj - iy1),
    );
    let best;
    let bestD = Infinity;
    for (let k = 0; k <= reach; k++) {
      if (best && (k - 1) * cell > Math.sqrt(bestD)) break;
      for (let i = ci - k; i <= ci + k; i++)
        for (let j = cj - k; j <= cj + k; j++) {
          if (Math.max(Math.abs(i - ci), Math.abs(j - cj)) !== k) continue;
          for (const p of buckets.get(`${i},${j}`) ?? []) {
            const d = (p.x - x) ** 2 + (p.y - y) ** 2;
            if (d < bestD) [best, bestD] = [p, d];
          }
        }
    }
    return best;
  };
}

it("nearestPoint: equals a string-keyed grid, ties included", () => {
  const random = seeded(29);
  for (let trial = 0; trial < 20; trial++) {
    // Points on a coarse lattice, so many queries tie.
    const points = Array.from({length: 80}, (_, id) => ({
      id,
      x: Math.round(random() * 20) * 16 - 64,
      y: Math.round(random() * 12) * 16 - 64,
    }));
    points.push({id: "nan", x: NaN, y: 1});
    const actual = nearestPoint(points);
    const expected = referenceNearest(points);
    for (let k = 0; k < 300; k++) {
      const x = Math.round(random() * 50) * 8 - 100;
      const y = Math.round(random() * 30) * 8 - 100;
      assert.strictEqual(actual(x, y), expected(x, y), `${x},${y}`);
    }
    assert.strictEqual(actual(NaN, 0), expected(NaN, 0));
  }
  assert.strictEqual(nearestPoint([])(1, 1), referenceNearest([])(1, 1));
});
