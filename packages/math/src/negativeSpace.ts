import {polygonHull} from "d3-polygon";

import type {Point} from "./lineIntersection.js";

/** An axis-aligned box: top-left corner plus size. */
export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Options for `negativeSpace`: padding, minimum box size, grid resolution, and extra boxes to avoid. */
export interface NegativeSpaceOptions {
  /** Space kept clear around every obstacle, in pixels. Default 0. */
  padding?: number;
  /** Smallest width a returned box may have. Default 1. */
  minWidth?: number;
  /** Smallest height a returned box may have. Default 1. */
  minHeight?: number;
  /** Number of evenly spaced grid lines added per axis, so the hull's diagonal edges are resolved finely. Default 48. */
  divisions?: number;
  /** Other boxes to keep clear of, each on its own rather than as part of the marks' hull (e.g. controls overlaid on the chart). */
  exclude?: Bounds[];
}

/** Edges of the polygon, as `[from, to]` pairs (the polygon is implicitly closed). */
function polygonEdges(poly: Point[]): Array<[Point, Point]> {
  return poly.map((p, i) => [p, poly[(i + 1) % poly.length]] as [Point, Point]);
}

/** Projects every point onto an axis, returning [min, max]. */
function project(points: Point[], ax: number, ay: number): [number, number] {
  let lo = Infinity, hi = -Infinity;
  for (const [x, y] of points) {
    const v = x * ax + y * ay;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  return [lo, hi];
}

/**
    Whether a rectangle's interior overlaps a convex polygon's interior, by the
    separating axis theorem. Touching edges do not count as overlap.
*/
function rectHitsConvex(
  x0: number, y0: number, x1: number, y1: number,
  poly: Point[], polyBox: [number, number, number, number], edges: Array<[Point, Point]>,
): boolean {
  const eps = 1e-9;
  if (x1 <= polyBox[0] + eps || x0 >= polyBox[2] - eps) return false;
  if (y1 <= polyBox[1] + eps || y0 >= polyBox[3] - eps) return false;
  const corners: Point[] = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  for (const [a, b] of edges) {
    const ax = -(b[1] - a[1]), ay = b[0] - a[0];
    if (!ax && !ay) continue;
    const [p0, p1] = project(poly, ax, ay);
    const [r0, r1] = project(corners, ax, ay);
    const tol = eps * Math.hypot(ax, ay);
    if (r1 <= p0 + tol || r0 >= p1 - tol) return false;
  }
  return true;
}

/** Sorted, de-duplicated values clipped to [lo, hi]. */
function gridLines(values: number[], lo: number, hi: number, divisions: number): number[] {
  const all = [lo, hi];
  for (let i = 1; i < divisions; i++) all.push(lo + ((hi - lo) * i) / divisions);
  for (const v of values) if (v > lo && v < hi) all.push(v);
  all.sort((a, b) => a - b);
  return all.filter((v, i) => i === 0 || v - all[i - 1] > 1e-6);
}

/**
    Finds the open, axis-aligned rectangles inside `bounds` that lie entirely
    outside the marks described by `obstacles`. The marks are treated as a single
    solid region — the convex hull of every (padded) obstacle box — so a hole in
    the middle of a ring of points is never returned, only the space around them.
    Boxes in `options.exclude` are kept clear too, each on its own. Each
    returned box is maximal (it cannot grow in any direction without leaving
    `bounds` or touching the hull or an excluded box). Results are sorted largest area first, and the
    output is deterministic for a given input.
    @param bounds The region to search, such as a chart's plot area.
    @param obstacles The bounding boxes of the marks drawn inside `bounds`.
    @param options Padding and minimum-size options.
*/
export default function negativeSpace(
  bounds: Bounds,
  obstacles: Bounds[],
  options: NegativeSpaceOptions = {},
): Bounds[] {
  const {padding = 0, minWidth = 1, minHeight = 1, divisions = 48, exclude = []} = options;
  const bx0 = bounds.x, by0 = bounds.y;
  const bx1 = bounds.x + bounds.width, by1 = bounds.y + bounds.height;
  if (!(bounds.width > 0 && bounds.height > 0)) return [];

  const points: Point[] = [];
  for (const o of obstacles) {
    if (![o.x, o.y, o.width, o.height].every(Number.isFinite)) continue;
    const x0 = o.x - padding, y0 = o.y - padding;
    const x1 = o.x + o.width + padding, y1 = o.y + o.height + padding;
    points.push([x0, y0], [x1, y0], [x1, y1], [x0, y1]);
  }
  const blocks = exclude.filter(b => [b.x, b.y, b.width, b.height].every(Number.isFinite));
  if (!points.length && !blocks.length) {
    return bounds.width >= minWidth && bounds.height >= minHeight ? [{...bounds}] : [];
  }

  let hull = points.length ? polygonHull(points) as Point[] | null : [];
  if (!hull) {
    const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    hull = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  }
  const hullBox: [number, number, number, number] = hull.length
    ? [
      Math.min(...hull.map(p => p[0])), Math.min(...hull.map(p => p[1])),
      Math.max(...hull.map(p => p[0])), Math.max(...hull.map(p => p[1])),
    ]
    : [0, 0, 0, 0];
  const edges = polygonEdges(hull);

  const xs = gridLines([...hull.map(p => p[0]), ...blocks.flatMap(b => [b.x, b.x + b.width])], bx0, bx1, divisions);
  const ys = gridLines([...hull.map(p => p[1]), ...blocks.flatMap(b => [b.y, b.y + b.height])], by0, by1, divisions);
  const nx = xs.length - 1, ny = ys.length - 1;

  // occupied[j][i]: cell between xs[i..i+1] and ys[j..j+1] overlaps the hull or an excluded box.
  const hitsBlock = (x0: number, y0: number, x1: number, y1: number): boolean =>
    blocks.some(b => x0 < b.x + b.width && b.x < x1 && y0 < b.y + b.height && b.y < y1);
  const occupied: Uint8Array[] = [];
  for (let j = 0; j < ny; j++) {
    const row = new Uint8Array(nx);
    for (let i = 0; i < nx; i++) {
      const [x0, y0, x1, y1] = [xs[i], ys[j], xs[i + 1], ys[j + 1]];
      row[i] = (hull.length && rectHitsConvex(x0, y0, x1, y1, hull, hullBox, edges)) || hitsBlock(x0, y0, x1, y1) ? 1 : 0;
    }
    occupied.push(row);
  }

  // Row-wise prefix sums, to test whether a span of the next row is empty.
  const prefix = occupied.map(row => {
    const p = new Uint32Array(nx + 1);
    for (let i = 0; i < nx; i++) p[i + 1] = p[i] + row[i];
    return p;
  });
  const spanEmpty = (j: number, i0: number, i1: number): boolean =>
    prefix[j][i1 + 1] - prefix[j][i0] === 0;

  // Histogram sweep: for each row as the bottom edge, every bar's widest
  // rectangle at its own height. Every maximal empty rectangle is one of
  // these; the ones that could still grow downward are dropped.
  const seen = new Set<string>();
  const results: Bounds[] = [];
  const heights = new Uint32Array(nx);
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) heights[i] = occupied[j][i] ? 0 : heights[i] + 1;
    const left = new Int32Array(nx), right = new Int32Array(nx);
    const stack: number[] = [];
    for (let i = 0; i < nx; i++) {
      while (stack.length && heights[stack[stack.length - 1]] >= heights[i]) stack.pop();
      left[i] = stack.length ? stack[stack.length - 1] + 1 : 0;
      stack.push(i);
    }
    stack.length = 0;
    for (let i = nx - 1; i >= 0; i--) {
      while (stack.length && heights[stack[stack.length - 1]] >= heights[i]) stack.pop();
      right[i] = stack.length ? stack[stack.length - 1] - 1 : nx - 1;
      stack.push(i);
    }
    for (let i = 0; i < nx; i++) {
      const h = heights[i];
      if (!h) continue;
      const i0 = left[i], i1 = right[i];
      if (j + 1 < ny && spanEmpty(j + 1, i0, i1)) continue;
      const key = `${i0},${i1},${j - h + 1},${j}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const x = xs[i0], y = ys[j - h + 1];
      const width = xs[i1 + 1] - x, height = ys[j + 1] - y;
      if (width >= minWidth && height >= minHeight) results.push({x, y, width, height});
    }
  }

  return results.sort(
    (a, b) => b.width * b.height - a.width * a.height || a.y - b.y || a.x - b.x,
  );
}
