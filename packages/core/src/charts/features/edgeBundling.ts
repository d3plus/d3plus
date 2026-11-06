/**
    Force-directed edge bundling (Holten & van Wijk, 2009). Each straight
    edge is split into points, and each point is pulled toward the matching
    points of the edges compatible with it (edges running the same way, at
    a similar length, near it, and in view of it), while a spring along the
    edge keeps it smooth. Over a few cycles the points double and the step
    halves, so edges gather into bundles that fan out at their ends.

    Pure geometry in screen space. The simulation runs on the edges scaled
    to a fixed size, so its settings behave the same at any chart size, and
    a cache keyed by the edges' positions and the settings lets a redraw
    reuse it.
*/

import {smoothBundle} from "./edgeBundlingSmooth.js";
import type {Point} from "./polyline.js";

/** An edge as its two ends, source then target. */
export type Segment = readonly [Point, Point];

/** The `linkBundleConfig` settings (see `EDGE_BUNDLE_DEFAULTS`). */
export interface EdgeBundleOptions {
  /** How closely a path keeps to its bundle: 0 draws it straight, 1 fully bundled. */
  strength: number;
  /** How many times the points along each edge double. */
  cycles: number;
  /** Simulation steps in the first cycle; each later cycle takes two thirds as many. */
  iterations: number;
  /** The compatibility (0–1) two edges need to pull on each other. */
  compatibility: number;
  /** Whether the bundled points are joined by a smooth curve (else by straight lines). */
  smoothing: boolean;
}

export const EDGE_BUNDLE_DEFAULTS: EdgeBundleOptions = {
  strength: 0.85,
  cycles: 6,
  iterations: 50,
  compatibility: 0.4,
  smoothing: true,
};

/** The size (in simulation units) the edges' bounding box is scaled to. */
const UNIT = 1000;
/** The spring constant. */
const STIFFNESS = 0.1;
/** The first cycle's step size, in simulation units. */
const STEP = 3;

const length = (s: Segment): number =>
  Math.hypot(s[1][0] - s[0][0], s[1][1] - s[0][1]);
const midpoint = (s: Segment): Point => [
  (s[0][0] + s[1][0]) / 2,
  (s[0][1] + s[1][1]) / 2,
];

/** |cos| of the angle between two edges: 1 parallel, 0 perpendicular. */
export function angleCompatibility(p: Segment, q: Segment): number {
  const lp = length(p);
  const lq = length(q);
  if (!lp || !lq) return 0;
  const dot =
    (p[1][0] - p[0][0]) * (q[1][0] - q[0][0]) +
    (p[1][1] - p[0][1]) * (q[1][1] - q[0][1]);
  return Math.abs(dot / (lp * lq));
}

/** How alike two edges' lengths are: 1 for equal lengths, toward 0 as they differ. */
export function scaleCompatibility(p: Segment, q: Segment): number {
  const lp = length(p);
  const lq = length(q);
  if (!lp || !lq) return 0;
  const avg = (lp + lq) / 2;
  return 2 / (avg / Math.min(lp, lq) + Math.max(lp, lq) / avg);
}

/** How near two edges' midpoints are, relative to their average length. */
export function positionCompatibility(p: Segment, q: Segment): number {
  const avg = (length(p) + length(q)) / 2;
  const [px, py] = midpoint(p);
  const [qx, qy] = midpoint(q);
  const dist = Math.hypot(px - qx, py - qy);
  return avg + dist ? avg / (avg + dist) : 0;
}

/**
    How much of `q` lies alongside `p`: `q`'s ends projected onto the line
    through `p` span an interval, and this is 1 when that interval is
    centered on `p`'s midpoint, falling to 0 as `p`'s midpoint reaches its
    ends.
*/
function visibility(p: Segment, q: Segment): number {
  const [[x0, y0], [x1, y1]] = p;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const l2 = dx * dx + dy * dy;
  if (!l2) return 0;
  const project = ([x, y]: Point): Point => {
    const t = ((x - x0) * dx + (y - y0) * dy) / l2;
    return [x0 + t * dx, y0 + t * dy];
  };
  const i0 = project(q[0]);
  const i1 = project(q[1]);
  const span = Math.hypot(i1[0] - i0[0], i1[1] - i0[1]);
  if (!span) return 0;
  const [mx, my] = midpoint(p);
  const off = Math.hypot((i0[0] + i1[0]) / 2 - mx, (i0[1] + i1[1]) / 2 - my);
  return Math.max(0, 1 - (2 * off) / span);
}

/** The smaller of each edge's visibility from the other (see Holten & van Wijk). */
export function visibilityCompatibility(p: Segment, q: Segment): number {
  return Math.min(visibility(p, q), visibility(q, p));
}

/** Two edges' compatibility, 0–1: the product of the four measures. */
export function edgeCompatibility(p: Segment, q: Segment): number {
  return (
    angleCompatibility(p, q) *
    scaleCompatibility(p, q) *
    positionCompatibility(p, q) *
    visibilityCompatibility(p, q)
  );
}

/**
    The largest ratio between two edges' lengths whose scale compatibility
    still reaches `threshold` (Infinity for a threshold of 0 or less).
*/
export function maxLengthRatio(threshold: number): number {
  if (threshold <= 0) return Infinity;
  if (threshold >= 1) return 1;
  const cs = (r: number) => 2 / ((1 + r) / 2 + (2 * r) / (1 + r));
  let lo = 1;
  let hi = 2;
  while (cs(hi) >= threshold) hi *= 2;
  for (let k = 0; k < 50; k++) {
    const mid = (lo + hi) / 2;
    if (cs(mid) >= threshold) lo = mid;
    else hi = mid;
  }
  return lo;
}

/**
    Each edge's compatible edges, as compressed rows: edge `e`'s neighbors
    are `neighbors[offsets[e]]` up to `neighbors[offsets[e + 1]]`, and each
    one's `weights` entry is its compatibility, negative when the two edges
    run opposite ways. Only pairs reaching `threshold` are kept; a grid over
    the edges' midpoints skips pairs too far apart to reach it.
*/
export interface CompatibilityGraph {
  offsets: Int32Array;
  neighbors: Int32Array;
  weights: Float32Array;
}

/** The smallest and largest of `values` (a loop, so any count works). */
function bounds(values: Iterable<number>): [number, number] {
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of values) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  return lo <= hi ? [lo, hi] : [0, 0];
}

/** Edge midpoints bucketed into a square grid of `cell`-sized cells. */
function midpointGrid(mids: Point[], cell: number) {
  const [x0, x1] = bounds(mids.map(m => m[0]));
  const [y0, y1] = bounds(mids.map(m => m[1]));
  const nx = Math.max(1, Math.ceil((x1 - x0) / cell) + 1);
  const ny = Math.max(1, Math.ceil((y1 - y0) / cell) + 1);
  const cells: number[][] = Array.from({length: nx * ny}, () => []);
  const cx = (x: number) => Math.min(nx - 1, Math.max(0, (x - x0) / cell) | 0);
  const cy = (y: number) => Math.min(ny - 1, Math.max(0, (y - y0) / cell) | 0);
  mids.forEach((m, e) => cells[cy(m[1]) * nx + cx(m[0])].push(e));
  return {cells, nx, cx, cy};
}

/** Each edge's direction, length, and midpoint, as flat arrays. */
function edgeTable(edges: readonly Segment[]) {
  const n = edges.length;
  const t = {
    x0: new Float64Array(n),
    y0: new Float64Array(n),
    dx: new Float64Array(n),
    dy: new Float64Array(n),
    len: new Float64Array(n),
    mx: new Float64Array(n),
    my: new Float64Array(n),
  };
  edges.forEach(([[x0, y0], [x1, y1]], e) => {
    t.x0[e] = x0;
    t.y0[e] = y0;
    t.dx[e] = x1 - x0;
    t.dy[e] = y1 - y0;
    t.len[e] = Math.hypot(x1 - x0, y1 - y0);
    t.mx[e] = (x0 + x1) / 2;
    t.my[e] = (y0 + y1) / 2;
  });
  return t;
}

/**
    Edges `e` and `f`'s compatibility, signed by whether they run the same
    way, or 0 as soon as a measure shows it can't reach `threshold`.
*/
function pairCompatibility(
  t: ReturnType<typeof edgeTable>,
  e: number,
  f: number,
  threshold: number,
): number {
  const le = t.len[e];
  const lf = t.len[f];
  const dot = t.dx[e] * t.dx[f] + t.dy[e] * t.dy[f];
  let c = Math.abs(dot) / (le * lf);
  if (c < threshold) return 0;
  const avg = (le + lf) / 2;
  c *= 2 / (avg / Math.min(le, lf) + Math.max(le, lf) / avg);
  if (c < threshold) return 0;
  c *= avg / (avg + Math.hypot(t.mx[e] - t.mx[f], t.my[e] - t.my[f]));
  if (c < threshold) return 0;
  const seg = (k: number): Segment => [
    [t.x0[k], t.y0[k]],
    [t.x0[k] + t.dx[k], t.y0[k] + t.dy[k]],
  ];
  c *= visibilityCompatibility(seg(e), seg(f));
  if (c < threshold || c <= 0) return 0;
  return dot < 0 ? -c : c;
}

/** The compatible pairs among `edges` (see `CompatibilityGraph`). */
export function compatibilityGraph(
  edges: readonly Segment[],
  threshold: number,
): CompatibilityGraph {
  const n = edges.length;
  const t = edgeTable(edges);
  const ratio = Math.min(maxLengthRatio(threshold), 1e6);
  // Position compatibility alone must reach the threshold.
  const reach = threshold > 0 ? (1 - threshold) / threshold : Infinity;
  const lists: number[][] = Array.from({length: n}, () => []);
  const weights: number[][] = Array.from({length: n}, () => []);
  const mids = edges.map(midpoint);
  const span = Math.max(
    1,
    bounds(mids.flatMap(m => [Math.abs(m[0]), Math.abs(m[1])]))[1],
  );
  const radius = (e: number) =>
    Math.min(reach * ((t.len[e] * (1 + ratio)) / 2), 4 * span);
  const radii = Array.from(t.len, (_, e) => radius(e)).sort((a, b) => a - b);
  const cell = Math.max(radii[n >> 1] || span, (2 * span) / 256);
  const {cells, nx, cx, cy} = midpointGrid(mids, cell);
  const ny = cells.length / nx;
  for (let e = 0; e < n && n > 1; e++) {
    if (!t.len[e]) continue;
    const r = radius(e);
    for (let gy = cy(t.my[e] - r); gy <= cy(t.my[e] + r) && gy < ny; gy++)
      for (let gx = cx(t.mx[e] - r); gx <= cx(t.mx[e] + r); gx++)
        for (const f of cells[gy * nx + gx]) {
          if (f <= e || !t.len[f]) continue;
          const w = pairCompatibility(t, e, f, threshold);
          if (!w) continue;
          lists[e].push(f);
          weights[e].push(w);
          lists[f].push(e);
          weights[f].push(w);
        }
  }
  const offsets = new Int32Array(n + 1);
  for (let e = 0; e < n; e++) offsets[e + 1] = offsets[e] + lists[e].length;
  return {
    offsets,
    neighbors: Int32Array.from(lists.flat()),
    weights: Float32Array.from(weights.flat()),
  };
}

/**
    `segments + 1` points spaced evenly along a polyline's length, from its
    first point to its last.
*/
export function subdividePolyline(points: Point[], segments: number): Point[] {
  const n = Math.max(1, Math.round(segments));
  const cumulative = [0];
  for (let k = 1; k < points.length; k++)
    cumulative.push(
      cumulative[k - 1] +
        Math.hypot(
          points[k][0] - points[k - 1][0],
          points[k][1] - points[k - 1][1],
        ),
    );
  const total = cumulative[cumulative.length - 1];
  const out: Point[] = [points[0]];
  let k = 1;
  for (let s = 1; s < n; s++) {
    const at = (total * s) / n;
    while (k < points.length - 1 && cumulative[k] < at) k++;
    const step = cumulative[k] - cumulative[k - 1];
    const t = step ? (at - cumulative[k - 1]) / step : 0;
    out.push([
      points[k - 1][0] + (points[k][0] - points[k - 1][0]) * t,
      points[k - 1][1] + (points[k][1] - points[k - 1][1]) * t,
    ]);
  }
  out.push(points[points.length - 1]);
  return out;
}

/** Re-spaces each edge's `count` inner points into `next` inner points. */
function resubdivide(
  edges: readonly Segment[],
  inner: Float64Array,
  count: number,
  next: number,
): Float64Array {
  const out = new Float64Array(edges.length * next * 2);
  edges.forEach((edge, e) => {
    const line: Point[] = [edge[0]];
    for (let i = 0; i < count; i++) {
      const o = (e * count + i) * 2;
      line.push([inner[o], inner[o + 1]]);
    }
    line.push(edge[1]);
    const spaced = subdividePolyline(line, next + 1);
    for (let i = 0; i < next; i++) {
      out[(e * next + i) * 2] = spaced[i + 1][0];
      out[(e * next + i) * 2 + 1] = spaced[i + 1][1];
    }
  });
  return out;
}

/**
    One simulation step: moves every inner point by `step` times the spring
    pull of its neighbors along the edge plus the unit pulls, weighted by
    compatibility, toward the matching point of each compatible edge.
*/
function simulationStep(
  edges: readonly Segment[],
  lengths: Float64Array,
  graph: CompatibilityGraph,
  pts: Float64Array,
  out: Float64Array,
  count: number,
  step: number,
): void {
  const {offsets, neighbors, weights} = graph;
  for (let e = 0; e < edges.length; e++) {
    const base = e * count;
    const kP = lengths[e] ? (STIFFNESS * (count + 1)) / lengths[e] : 0;
    for (let i = 0; i < count; i++) {
      const o = (base + i) * 2;
      const x = pts[o];
      const y = pts[o + 1];
      const px = i ? pts[o - 2] : edges[e][0][0];
      const py = i ? pts[o - 1] : edges[e][0][1];
      const nx = i < count - 1 ? pts[o + 2] : edges[e][1][0];
      const ny = i < count - 1 ? pts[o + 3] : edges[e][1][1];
      let fx = kP * (px + nx - 2 * x);
      let fy = kP * (py + ny - 2 * y);
      for (let k = offsets[e]; k < offsets[e + 1]; k++) {
        const w = weights[k];
        const j = w < 0 ? count - 1 - i : i;
        const q = (neighbors[k] * count + j) * 2;
        const dx = pts[q] - x;
        const dy = pts[q + 1] - y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 1e-6) continue;
        const s = Math.abs(w) / d;
        fx += dx * s;
        fy += dy * s;
      }
      out[o] = x + step * fx;
      out[o + 1] = y + step * fy;
    }
  }
}

/**
    Runs the simulation on `edges` (already in simulation units) and returns
    each edge's control points, its two ends included.
*/
function simulate(
  edges: readonly Segment[],
  options: EdgeBundleOptions,
): Point[][] {
  const graph = compatibilityGraph(edges, options.compatibility);
  const lengths = Float64Array.from(edges.map(length));
  let count = 1;
  let pts: Float64Array = new Float64Array(edges.length * 2);
  edges.forEach((edge, e) => {
    const [mx, my] = midpoint(edge);
    pts[e * 2] = mx;
    pts[e * 2 + 1] = my;
  });
  let step = STEP;
  let iterations = Math.max(0, Math.round(options.iterations));
  const cycles = Math.max(0, Math.round(options.cycles));
  for (let c = 0; c < cycles; c++) {
    if (c) {
      pts = resubdivide(edges, pts, count, count * 2);
      count *= 2;
    }
    let out: Float64Array = new Float64Array(pts.length);
    for (let it = 0; it < iterations; it++) {
      simulationStep(edges, lengths, graph, pts, out, count, step);
      [pts, out] = [out, pts];
    }
    step /= 2;
    iterations = Math.max(1, Math.round((iterations * 2) / 3));
  }
  return edges.map((edge, e) => {
    const line: Point[] = [edge[0]];
    for (let i = 0; i < count; i++)
      line.push([pts[(e * count + i) * 2], pts[(e * count + i) * 2 + 1]]);
    line.push(edge[1]);
    return line;
  });
}

/** Scales points so the box around them is `UNIT` across at its widest. */
function normalizer(edges: readonly Segment[]) {
  const [x0, x1] = bounds(edges.flatMap(s => [s[0][0], s[1][0]]));
  const [y0, y1] = bounds(edges.flatMap(s => [s[0][1], s[1][1]]));
  const size = Math.max(x1 - x0, y1 - y0) || 1;
  const k = UNIT / size;
  return {
    to: ([x, y]: Point): Point => [(x - x0) * k, (y - y0) * k],
    from: ([x, y]: Point): Point => [x / k + x0, y / k + y0],
  };
}

/** Cached simulations, by `edgeBundleKey`, and how many have run. */
export interface EdgeBundleCache {
  entries: Map<string, Point[][]>;
  runs: number;
}

/** A new, empty cache for `bundleEdges`. */
export function edgeBundleCache(): EdgeBundleCache {
  return {entries: new Map(), runs: 0};
}

/** How many simulations a cache keeps. */
const CACHE_SIZE = 4;

/** The settings with every missing or invalid entry at its default. */
export function edgeBundleOptions(
  options: Partial<EdgeBundleOptions> = {},
): EdgeBundleOptions {
  const num = (v: unknown, fallback: number) =>
    typeof v === "number" && Number.isFinite(v) ? v : fallback;
  const d = EDGE_BUNDLE_DEFAULTS;
  return {
    strength: Math.min(1, Math.max(0, num(options.strength, d.strength))),
    cycles: Math.max(0, num(options.cycles, d.cycles)),
    iterations: Math.max(0, num(options.iterations, d.iterations)),
    compatibility: num(options.compatibility, d.compatibility),
    smoothing: options.smoothing ?? d.smoothing,
  };
}

/**
    The cache key for bundling `edges` with `options`: the edges' ends to a
    tenth of a pixel, and the settings the simulation reads.
*/
export function edgeBundleKey(
  edges: readonly Segment[],
  options: EdgeBundleOptions,
): string {
  const r = (n: number) => Math.round(n * 10);
  const ends = edges
    .map(([a, b]) => `${r(a[0])},${r(a[1])},${r(b[0])},${r(b[1])}`)
    .join(";");
  return `${options.cycles}|${options.iterations}|${options.compatibility}|${ends}`;
}

/** The simulated control points for `edges`, from the cache when it has them. */
function bundledControls(
  edges: readonly Segment[],
  options: EdgeBundleOptions,
  cache?: EdgeBundleCache,
): Point[][] {
  const key = cache ? edgeBundleKey(edges, options) : "";
  const hit = cache?.entries.get(key);
  if (hit) {
    cache!.entries.delete(key);
    cache!.entries.set(key, hit);
    return hit;
  }
  const norm = normalizer(edges);
  const scaled = edges.map(([a, b]) => [norm.to(a), norm.to(b)] as Segment);
  const controls = simulate(scaled, options).map((line, e) => {
    const out = line.map(norm.from);
    out[0] = edges[e][0];
    out[out.length - 1] = edges[e][1];
    return out;
  });
  if (cache) {
    cache.runs++;
    cache.entries.set(key, controls);
    while (cache.entries.size > CACHE_SIZE)
      cache.entries.delete(cache.entries.keys().next().value!);
  }
  return controls;
}

/**
    Bundles `edges` (see the module notes) and returns each one's path as a
    polyline from its source to its target: the simulated points pulled
    toward the straight edge by `1 - strength`, and joined by a smooth
    curve when `smoothing` is on. An edge of no length stays as its two
    ends.
*/
export function bundleEdges(
  edges: readonly Segment[],
  options: Partial<EdgeBundleOptions> = {},
  cache?: EdgeBundleCache,
): Point[][] {
  if (!edges.length) return [];
  const o = edgeBundleOptions(options);
  const controls = bundledControls(edges, o, cache);
  return controls.map((line, e) =>
    length(edges[e])
      ? smoothBundle(line, o.strength, o.smoothing)
      : [edges[e][0], edges[e][1]],
  );
}
