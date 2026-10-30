/**
    A Voronoi diagram over a set of points: the nearest point to a position
    (within a distance, measured from each point's edge), and each point's
    clipped cell and neighbors.

    @module
*/

import {Delaunay} from "d3-delaunay";
import type {Voronoi} from "d3-delaunay";
import type {Bounds} from "@d3plus/math";

/** One point in the diagram. */
export interface VoronoiPoint<T = unknown> {
  /** The point's center. */
  x: number;
  /** The point's center. */
  y: number;
  /** The mark's radius: distances are measured from its edge (default 0; a non-finite or negative radius counts as 0). */
  r?: number;
  /** What the point stands for (a scene node, a datum). */
  item: T;
}

/** A `nearest` match. */
export interface VoronoiMatch<T = unknown> {
  /** The point's index in the input array. */
  index: number;
  point: VoronoiPoint<T>;
  /** The distance from the position to the point's edge (0 inside it). */
  distance: number;
}

/** The Voronoi structure `pointVoronoi` builds. */
export interface PointVoronoi<T = unknown> {
  /** The points, in input order. */
  readonly points: readonly VoronoiPoint<T>[];
  /** The box the cells are clipped to: the bounds given, grown to hold every point. */
  readonly bounds: Bounds;
  /**
      The point closest to `[x, y]` whose edge lies within `maxDistance`
      (default Infinity), or null. Ties go to the point with the nearer
      center, then the lower index.
  */
  nearest(x: number, y: number, maxDistance?: number): VoronoiMatch<T> | null;
  /**
      The point's Voronoi cell clipped to `bounds`, as an open ring of
      vertices (the first vertex is not repeated at the end): every position
      in it is closer to this point's center than to any other. Null for an
      out-of-range index or a point that coincides with an earlier one.
  */
  cell(index: number): [number, number][] | null;
  /**
      The indices of the points whose cells share an edge or a corner with
      this one's (its Delaunay neighbors), in ascending order. Empty for a
      lone point or one that coincides with an earlier one.
  */
  neighbors(index: number): number[];
}

/** The smallest box holding `bounds` and every point. */
function grownBounds(points: readonly VoronoiPoint[], bounds: Bounds): Bounds {
  let x0 = bounds.x,
    y0 = bounds.y,
    x1 = bounds.x + bounds.width,
    y1 = bounds.y + bounds.height;
  for (const p of points) {
    x0 = Math.min(x0, p.x);
    y0 = Math.min(y0, p.y);
    x1 = Math.max(x1, p.x);
    y1 = Math.max(y1, p.y);
  }
  return {x: x0, y: y0, width: x1 - x0, height: y1 - y0};
}

/** The distance from `[x, y]` to the segment `a`–`b`. */
function segmentDistance(
  x: number,
  y: number,
  [ax, ay]: [number, number],
  [bx, by]: [number, number],
): number {
  const dx = bx - ax,
    dy = by - ay;
  const len = dx * dx + dy * dy;
  const t = len
    ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / len))
    : 0;
  return Math.hypot(x - (ax + t * dx), y - (ay + t * dy));
}

/** The distance from `[x, y]` to a polygon (0 inside it). */
export function polygonDistance(
  x: number,
  y: number,
  ring: [number, number][],
): number {
  let inside = false,
    min = Infinity;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i],
      [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside;
    min = Math.min(min, segmentDistance(x, y, ring[j], ring[i]));
  }
  return inside ? 0 : min;
}

/**
    Builds a Voronoi diagram over `points` (with d3-delaunay), clipped to
    `bounds`. Points with a non-finite coordinate are left out of the
    diagram: `nearest` never returns them and their `cell` is null. The
    Delaunay triangulation is built up front; the clipped cells only on the
    first call that needs them.
    @param points The points, in surface coordinates.
    @param bounds The box to clip cells to (grown to hold every point).
*/
export function pointVoronoi<T>(
  points: readonly VoronoiPoint<T>[],
  bounds: Bounds,
): PointVoronoi<T> {
  const valid = points
    .map((_, i) => i)
    .filter(i => Number.isFinite(points[i].x) && Number.isFinite(points[i].y));
  const box = grownBounds(
    valid.map(i => points[i]),
    bounds,
  );
  const delaunay = Delaunay.from(
    valid,
    i => points[i].x,
    i => points[i].y,
  );
  // Positions in `valid` (the diagram's own indices) for each input index.
  const slot = new Map(valid.map((i, s) => [i, s]));
  const radius = (p: VoronoiPoint<T>): number =>
    Number.isFinite(p.r) ? Math.max(0, p.r!) : 0;
  const maxRadius = valid.reduce((m, i) => Math.max(m, radius(points[i])), 0);
  let voronoi: Voronoi<number> | undefined;
  const diagram = (): Voronoi<number> =>
    (voronoi ??= delaunay.voronoi([
      box.x,
      box.y,
      box.x + box.width,
      box.y + box.height,
    ]));

  const cellOf = (s: number): [number, number][] | null => {
    const polygon = diagram().cellPolygon(s) as [number, number][] | null;
    return polygon ? polygon.slice(0, -1) : null;
  };
  const neighborSlots = (s: number): number[] =>
    [...delaunay.neighbors(s)].filter(n => n >= 0);

  const nearest = (
    x: number,
    y: number,
    maxDistance = Infinity,
  ): VoronoiMatch<T> | null => {
    if (!valid.length || !Number.isFinite(x) || !Number.isFinite(y))
      return null;
    const start = delaunay.find(x, y);
    const centerOf = (s: number): number =>
      Math.hypot(points[valid[s]].x - x, points[valid[s]].y - y);
    // Every point whose edge is within reach has its center within `reach`,
    // so its cell meets the disk of that radius; those cells are connected,
    // so a walk out from the nearest center finds them all.
    const reach = maxDistance + maxRadius;
    if (centerOf(start) > reach) return null;
    let best: VoronoiMatch<T> | null = null,
      bestCenter = Infinity;
    const seen = new Set([start]);
    const queue = [start];
    while (queue.length) {
      const s = queue.shift()!;
      const index = valid[s];
      const point = points[index];
      const center = centerOf(s);
      const distance = Math.max(0, center - radius(point));
      if (
        distance <= maxDistance &&
        (!best ||
          distance < best.distance ||
          (distance === best.distance &&
            (center < bestCenter ||
              (center === bestCenter && index < best.index))))
      ) {
        best = {index, point, distance};
        bestCenter = center;
      }
      for (const n of neighborSlots(s)) {
        if (seen.has(n)) continue;
        seen.add(n);
        const ring = cellOf(n);
        if (ring && polygonDistance(x, y, ring) <= reach) queue.push(n);
      }
    }
    return best;
  };

  return {
    points,
    bounds: box,
    nearest,
    cell: index => {
      const s = slot.get(index);
      return s === undefined ? null : cellOf(s);
    },
    neighbors: index => {
      const s = slot.get(index);
      if (s === undefined) return [];
      return neighborSlots(s)
        .map(n => valid[n])
        .sort((a, b) => a - b);
    },
  };
}
