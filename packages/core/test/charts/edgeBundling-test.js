import {it} from "vitest";
import assert from "assert";
import fs from "node:fs";

import {
  EDGE_BUNDLE_DEFAULTS,
  angleCompatibility,
  bundleEdges,
  compatibilityGraph,
  edgeBundleCache,
  edgeBundleKey,
  edgeBundleOptions,
  edgeCompatibility,
  maxLengthRatio,
  positionCompatibility,
  scaleCompatibility,
  subdividePolyline,
  visibilityCompatibility,
} from "../../src/charts/features/edgeBundling.ts";
import {
  bsplinePolyline,
  simplifyPolyline,
  smoothBundle,
  straightenPolyline,
} from "../../src/charts/features/edgeBundlingSmooth.ts";
import {
  bundleLinkPaths,
  linkBundleCache,
} from "../../src/charts/features/linkBundle.ts";
import {linkBundleFields} from "../../src/charts/features/linkFields.ts";

/**
    Force-directed edge bundling: the four compatibility measures, the
    pruned compatible pairs, subdivision, the simulation pulling parallel
    edges together, its determinism and cache, the drawn path's smoothing,
    and its speed on the HS4 product space.
*/

const close = (a, b, eps = 1e-9) =>
  assert.ok(Math.abs(a - b) < eps, `${a} is not close to ${b}`);

const seg = (x0, y0, x1, y1) => [
  [x0, y0],
  [x1, y1],
];

it("angleCompatibility is |cos| of the angle between two edges", () => {
  close(angleCompatibility(seg(0, 0, 10, 0), seg(0, 5, 20, 5)), 1);
  // Reversed.
  close(angleCompatibility(seg(0, 0, 10, 0), seg(20, 5, 0, 5)), 1);
  close(angleCompatibility(seg(0, 0, 10, 0), seg(0, 0, 0, 10)), 0);
  close(angleCompatibility(seg(0, 0, 10, 0), seg(0, 0, 10, 10)), Math.SQRT1_2);
  assert.strictEqual(angleCompatibility(seg(0, 0, 0, 0), seg(0, 0, 1, 0)), 0);
});

it("scaleCompatibility is 1 for equal lengths and falls as they differ", () => {
  close(scaleCompatibility(seg(0, 0, 10, 0), seg(0, 5, 10, 5)), 1);
  // Lengths 10 and 30: average 20, so 2 / (20/10 + 30/20) = 4/7.
  close(scaleCompatibility(seg(0, 0, 10, 0), seg(0, 5, 30, 5)), 4 / 7);
  assert.strictEqual(scaleCompatibility(seg(0, 0, 0, 0), seg(0, 0, 1, 0)), 0);
});

it("positionCompatibility falls as the midpoints part, relative to length", () => {
  close(positionCompatibility(seg(0, 0, 10, 0), seg(0, 0, 10, 0)), 1);
  // Average length 10, midpoints 10 apart: 10 / (10 + 10).
  close(positionCompatibility(seg(0, 0, 10, 0), seg(0, 10, 10, 10)), 0.5);
});

it("visibilityCompatibility is 1 for edges side by side and 0 for ones end to end", () => {
  close(visibilityCompatibility(seg(0, 0, 10, 0), seg(0, 3, 10, 3)), 1);
  assert.strictEqual(
    visibilityCompatibility(seg(0, 0, 10, 0), seg(20, 0, 30, 0)),
    0,
  );
  // Offset by a quarter: q's projection is centered 2.5 off p's middle.
  close(visibilityCompatibility(seg(0, 0, 10, 0), seg(2.5, 3, 12.5, 3)), 0.5);
});

it("edgeCompatibility is the product of the four measures", () => {
  const p = seg(0, 0, 10, 0);
  const q = seg(1, 4, 13, 6);
  close(
    edgeCompatibility(p, q),
    angleCompatibility(p, q) *
      scaleCompatibility(p, q) *
      positionCompatibility(p, q) *
      visibilityCompatibility(p, q),
  );
});

it("maxLengthRatio bounds the length ratio a threshold allows", () => {
  for (const t of [0.2, 0.4, 0.6, 0.9]) {
    const r = maxLengthRatio(t);
    const cs = x => scaleCompatibility(seg(0, 0, 1, 0), seg(0, 0, x, 0));
    assert.ok(cs(r) >= t - 1e-9 && cs(r * 1.01) < t, `ratio ${r} for ${t}`);
  }
  assert.strictEqual(maxLengthRatio(0), Infinity);
  assert.strictEqual(maxLengthRatio(1), 1);
});

/** A seeded random number generator, for repeatable edge sets. */
function random(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

it("compatibilityGraph keeps exactly the pairs a full comparison would", () => {
  const rand = random(7);
  const edges = Array.from({length: 120}, () => {
    const x = rand() * 500;
    const y = rand() * 500;
    const a = rand() * Math.PI;
    const l = 10 + rand() * 120;
    return seg(x, y, x + Math.cos(a) * l, y + Math.sin(a) * l);
  });
  for (const t of [0.3, 0.6]) {
    const {offsets, neighbors, weights} = compatibilityGraph(edges, t);
    const found = new Set();
    for (let e = 0; e < edges.length; e++)
      for (let k = offsets[e]; k < offsets[e + 1]; k++) {
        found.add(`${e}-${neighbors[k]}`);
        const c = edgeCompatibility(edges[e], edges[neighbors[k]]);
        close(Math.abs(weights[k]), c, 1e-5);
      }
    let expected = 0;
    for (let e = 0; e < edges.length; e++)
      for (let f = 0; f < edges.length; f++)
        if (e !== f && edgeCompatibility(edges[e], edges[f]) >= t) {
          expected++;
          assert.ok(found.has(`${e}-${f}`), `${e}-${f} at ${t}`);
        }
    assert.strictEqual(found.size, expected);
    assert.ok(expected > 0, "some pairs are compatible");
  }
});

it("compatibilityGraph signs a pair running opposite ways negative", () => {
  const {weights} = compatibilityGraph(
    [seg(0, 0, 100, 0), seg(100, 5, 0, 5), seg(0, 10, 100, 10)],
    0.5,
  );
  // Edge 0's neighbors: 1 (reversed) then 2.
  assert.ok(weights[0] < 0 && weights[1] > 0);
});

it("subdividePolyline spaces points evenly along the length", () => {
  assert.deepStrictEqual(
    subdividePolyline(
      [
        [0, 0],
        [10, 0],
        [10, 10],
      ],
      4,
    ),
    [
      [0, 0],
      [5, 0],
      [10, 0],
      [10, 5],
      [10, 10],
    ],
  );
  assert.deepStrictEqual(
    subdividePolyline(
      [
        [0, 0],
        [8, 0],
      ],
      1,
    ),
    [
      [0, 0],
      [8, 0],
    ],
  );
});

/** Ten parallel edges, a pixel apart, from x = 0 to 300. */
const parallel = Array.from({length: 10}, (_, k) =>
  seg(0, 100 + k * 6, 300, 100 + k * 6),
);
const midY = line => {
  const xs = line.map(p => Math.abs(p[0] - 150));
  return line[xs.indexOf(Math.min(...xs))][1];
};

it("bundleEdges pulls parallel edges together in the middle, keeping their ends", () => {
  const paths = bundleEdges(parallel, {strength: 1});
  const before = 6 * 9;
  const mids = paths.map(midY);
  const after = Math.max(...mids) - Math.min(...mids);
  assert.ok(after < before / 3, `spread ${before} → ${after.toFixed(1)}`);
  paths.forEach((line, k) => {
    assert.deepStrictEqual(line[0], parallel[k][0]);
    assert.deepStrictEqual(line[line.length - 1], parallel[k][1]);
  });
  // Strength 0 draws them straight.
  for (const line of bundleEdges(parallel, {strength: 0}))
    for (const [, y] of line) assert.ok(Math.abs(y - line[0][1]) < 1e-6);
});

it("bundleEdges leaves an edge with no compatible partner straight", () => {
  const [a, b] = bundleEdges([seg(0, 0, 100, 0), seg(500, 0, 500, 100)]);
  for (const [, y] of a) close(y, 0, 1e-6);
  for (const [x] of b) close(x, 500, 1e-6);
  assert.deepStrictEqual(bundleEdges([]), []);
  assert.deepStrictEqual(bundleEdges([seg(4, 4, 4, 4)]), [
    [
      [4, 4],
      [4, 4],
    ],
  ]);
});

it("bundleEdges is deterministic", () => {
  assert.deepStrictEqual(bundleEdges(parallel), bundleEdges(parallel));
});

it("bundleEdges reuses a cached simulation for the same edges and settings", () => {
  const cache = edgeBundleCache();
  const first = bundleEdges(parallel, {}, cache);
  assert.strictEqual(cache.runs, 1);
  assert.deepStrictEqual(bundleEdges(parallel, {}, cache), first);
  assert.strictEqual(cache.runs, 1, "the same edges hit the cache");
  // Strength and smoothing shape the drawn path, not the simulation.
  bundleEdges(parallel, {strength: 0.3, smoothing: false}, cache);
  assert.strictEqual(cache.runs, 1);
  bundleEdges(parallel, {compatibility: 0.5}, cache);
  assert.strictEqual(cache.runs, 2, "a simulation setting runs it again");
  const moved = parallel.map(([a, b]) => [a, [b[0] + 1, b[1]]]);
  bundleEdges(moved, {}, cache);
  assert.strictEqual(cache.runs, 3, "so do moved edges");
  for (let k = 0; k < 6; k++)
    bundleEdges(
      parallel.map(([a, b]) => [a, [b[0] + 10 + k, b[1]]]),
      {},
      cache,
    );
  assert.ok(cache.entries.size <= 4, "the cache keeps the latest few");
});

it("edgeBundleKey reads the ends to a tenth of a pixel and the simulation settings", () => {
  const o = edgeBundleOptions();
  const key = edgeBundleKey([seg(0, 0, 10, 0)], o);
  assert.strictEqual(key, edgeBundleKey([seg(0.01, 0, 10, 0)], o));
  assert.notStrictEqual(key, edgeBundleKey([seg(0.5, 0, 10, 0)], o));
  assert.strictEqual(
    key,
    edgeBundleKey([seg(0, 0, 10, 0)], {...o, strength: 0}),
  );
  assert.notStrictEqual(
    key,
    edgeBundleKey([seg(0, 0, 10, 0)], {...o, cycles: 2}),
  );
});

it("edgeBundleOptions fills in and clamps the settings", () => {
  assert.deepStrictEqual(edgeBundleOptions(), EDGE_BUNDLE_DEFAULTS);
  assert.deepStrictEqual(
    edgeBundleOptions({
      strength: 3,
      cycles: -1,
      iterations: "x",
      smoothing: false,
    }),
    {...EDGE_BUNDLE_DEFAULTS, strength: 1, cycles: 0, smoothing: false},
  );
});

it("straightenPolyline blends the points toward the straight line", () => {
  const line = [
    [0, 0],
    [5, 10],
    [10, 0],
  ];
  assert.deepStrictEqual(straightenPolyline(line, 0.5), [
    [0, 0],
    [5, 5],
    [10, 0],
  ]);
  assert.deepStrictEqual(straightenPolyline(line, 1), line);
});

it("bsplinePolyline runs from the first point to the last, inside their hull", () => {
  const line = [
    [0, 0],
    [50, 40],
    [100, 0],
  ];
  const curve = bsplinePolyline(line);
  assert.deepStrictEqual(curve[0], [0, 0]);
  assert.deepStrictEqual(curve[curve.length - 1], [100, 0]);
  assert.ok(curve.length > 10);
  for (const [x, y] of curve) assert.ok(x >= 0 && x <= 100 && y >= 0 && y < 40);
  assert.deepStrictEqual(
    bsplinePolyline([
      [0, 0],
      [1, 1],
    ]),
    [
      [0, 0],
      [1, 1],
    ],
  );
});

it("simplifyPolyline drops the points within tolerance of the line", () => {
  assert.deepStrictEqual(
    simplifyPolyline(
      [
        [0, 0],
        [5, 0.1],
        [10, 0],
        [15, 5],
        [20, 10],
      ],
      0.25,
    ),
    [
      [0, 0],
      [10, 0],
      [20, 10],
    ],
  );
});

it("smoothBundle straightens, rounds, and thins a bundled path", () => {
  const line = [
    [0, 0],
    [25, 30],
    [50, 30],
    [75, 30],
    [100, 0],
  ];
  const curved = smoothBundle(line, 1, true);
  assert.deepStrictEqual(curved[0], [0, 0]);
  assert.deepStrictEqual(curved[curved.length - 1], [100, 0]);
  // Unsmoothed, only the bends are kept.
  assert.deepStrictEqual(smoothBundle(line, 1, false), [
    [0, 0],
    [25, 30],
    [75, 30],
    [100, 0],
  ]);
  for (const [, y] of smoothBundle(line, 0, true)) close(y, 0, 1e-9);
});

it("linkBundleFields declares linkBundle (off) and a merged linkBundleConfig", () => {
  const [bundle, config] = linkBundleFields();
  assert.deepStrictEqual(bundle, {key: "linkBundle", default: false});
  assert.strictEqual(config.key, "linkBundleConfig");
  assert.strictEqual(config.merge, true);
  assert.deepStrictEqual(config.default, EDGE_BUNDLE_DEFAULTS);
  assert.notStrictEqual(config.default, EDGE_BUNDLE_DEFAULTS);
});

it("bundleLinkPaths bundles with the chart's config through its own cache", () => {
  const viz = {ctx: {}, schema: {linkBundleConfig: {strength: 0}}};
  const cache = linkBundleCache(viz);
  assert.strictEqual(linkBundleCache(viz), cache, "created once");
  const paths = bundleLinkPaths(viz, parallel);
  assert.strictEqual(cache.runs, 1);
  for (const line of paths)
    for (const [, y] of line) assert.ok(Math.abs(y - line[0][1]) < 1e-6);
  bundleLinkPaths(viz, parallel);
  assert.strictEqual(cache.runs, 1);
});

it("bundleEdges bundles the 2,500-link HS4 product space in about a second", () => {
  const file = new URL(
    "../../dev/charts/Network/network_hs4.json",
    import.meta.url,
  );
  const {nodes, edges} = JSON.parse(fs.readFileSync(file, "utf8"));
  const byId = new Map(nodes.map(n => [n.id, n]));
  const xs = nodes.map(n => n.x);
  const ys = nodes.map(n => n.y);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  const k = Math.min(
    1200 / (Math.max(...xs) - x0),
    700 / (Math.max(...ys) - y0),
  );
  const at = n => [(n.x - x0) * k, (n.y - y0) * k];
  const segments = edges.map(e => [
    at(byId.get(e.source)),
    at(byId.get(e.target)),
  ]);
  assert.strictEqual(segments.length, 2532);
  const start = performance.now();
  const paths = bundleEdges(segments);
  const ms = performance.now() - start;
  assert.strictEqual(paths.length, 2532);
  // About a second on a laptop; generous here for slow CI machines.
  assert.ok(ms < 5000, `bundled in ${Math.round(ms)}ms`);
  console.log(`edge bundling: ${segments.length} edges in ${Math.round(ms)}ms`);
});
