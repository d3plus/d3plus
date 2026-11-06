/**
    Measuring and drawing polylines: a sampled curve, a map's projected
    link, or a bundled edge, as a list of `[x, y]` points.
*/

import type {LinkAnchor} from "./linkLabelGeometry.js";

/** A point in pixels, `[x, y]`. */
export type Point = [number, number];

const round = (n: number): number => Math.round(n * 100) / 100;

/** A polyline as a path `d`. */
export function polylinePath(points: Point[]): string {
  return points
    .map(([x, y], k) => `${k ? "L" : "M"}${round(x)},${round(y)}`)
    .join("");
}

/**
    A polyline shortened along its length by `start` pixels at its first
    end and `end` at its last. When the cuts meet, it collapses to the
    point where they do.
*/
export function trimPolyline(
  points: Point[],
  start: number,
  end: number,
): Point[] {
  const length = polylineLength(points);
  const s = Math.max(0, start);
  const e = Math.max(0, end);
  if (!s && !e) return points.slice();
  if (s + e >= length) {
    const at = polylineAt(points, (length * s) / (s + e || 1));
    return [
      [at.x, at.y],
      [at.x, at.y],
    ];
  }
  const out: Point[] = [];
  let walked = 0;
  const first = polylineAt(points, s);
  const last = polylineAt(points, length - e);
  out.push([first.x, first.y]);
  for (let k = 1; k < points.length - 1; k++) {
    walked += Math.hypot(
      points[k][0] - points[k - 1][0],
      points[k][1] - points[k - 1][1],
    );
    if (walked > s && walked < length - e) out.push(points[k]);
  }
  out.push([last.x, last.y]);
  return out;
}

/** A polyline's length. */
export function polylineLength(points: Point[]): number {
  let length = 0;
  for (let k = 1; k < points.length; k++)
    length += Math.hypot(
      points[k][0] - points[k - 1][0],
      points[k][1] - points[k - 1][1],
    );
  return length;
}

/**
    The point `distance` along a polyline from its start (clamped to its
    ends), and the direction the polyline runs there, in radians.
*/
export function polylineAt(points: Point[], distance: number): LinkAnchor {
  const last = points.length - 1;
  let left = Math.max(0, distance);
  for (let k = 1; k <= last; k++) {
    const [x0, y0] = points[k - 1];
    const [x1, y1] = points[k];
    const step = Math.hypot(x1 - x0, y1 - y0);
    if (!step) continue;
    const angle = Math.atan2(y1 - y0, x1 - x0);
    if (left <= step || k === last) {
      const t = Math.min(1, left / step);
      return {x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t, angle};
    }
    left -= step;
  }
  const [x, y] = points[0] ?? [0, 0];
  return {x, y, angle: 0};
}

/** The middle of a polyline's length, and its direction there. */
export function polylineMidpoint(points: Point[]): LinkAnchor {
  return polylineAt(points, polylineLength(points) / 2);
}

/** The box around a polyline, as `[[x0, y0], [x1, y1]]`. */
export function polylineBox(points: Point[]): [Point, Point] {
  const xs = points.map(p => p[0]);
  const ys = points.map(p => p[1]);
  return [
    [Math.min(...xs), Math.min(...ys)],
    [Math.max(...xs), Math.max(...ys)],
  ];
}

/**
    How far along a polyline, from its first point, it first gets `radius`
    pixels away from that point: where it leaves a circle of that radius
    around its start. The polyline's whole length when it never does.
*/
export function polylineReach(points: Point[], radius: number): number {
  if (!points.length || radius <= 0) return 0;
  const [cx, cy] = points[0];
  let walked = 0;
  for (let k = 1; k < points.length; k++) {
    const [x0, y0] = points[k - 1];
    const [x1, y1] = points[k];
    const dx = x1 - x0;
    const dy = y1 - y0;
    const step = Math.hypot(dx, dy);
    if (Math.hypot(x1 - cx, y1 - cy) >= radius && step) {
      // Where the segment crosses the circle: |p0 + t·d − c| = radius.
      const fx = x0 - cx;
      const fy = y0 - cy;
      const a = dx * dx + dy * dy;
      const b = 2 * (fx * dx + fy * dy);
      const c = fx * fx + fy * fy - radius * radius;
      const t = (-b + Math.sqrt(Math.max(0, b * b - 4 * a * c))) / (2 * a);
      return walked + Math.min(1, Math.max(0, t)) * step;
    }
    walked += step;
  }
  return walked;
}
