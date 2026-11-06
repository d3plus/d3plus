/**
    Turns a bundled edge's control points into the polyline it draws as:
    straightened by the bundle's strength (as d3's `curveBundle.beta`
    does), then optionally rounded into a B-spline and thinned to the
    points that shape it.
*/

import type {Point} from "./polyline.js";

/**
    Each point pulled toward the straight line between the polyline's ends,
    to `strength` of the way from that line (0) to where it was (1).
*/
export function straightenPolyline(points: Point[], strength: number): Point[] {
  const n = points.length - 1;
  if (n < 2 || strength >= 1) return points.slice();
  const [x0, y0] = points[0];
  const [x1, y1] = points[n];
  return points.map(([x, y], k) => {
    const t = k / n;
    const sx = x0 + (x1 - x0) * t;
    const sy = y0 + (y1 - y0) * t;
    return [sx + (x - sx) * strength, sy + (y - sy) * strength];
  });
}

/**
    The uniform cubic B-spline through a polyline's control points, ends
    clamped so it starts and ends on them, sampled about every `spacing`
    pixels (between 1 and 8 samples a span).
*/
export function bsplinePolyline(points: Point[], spacing = 3): Point[] {
  if (points.length < 3) return points.slice();
  const first = points[0];
  const last = points[points.length - 1];
  const c = [first, first, ...points, last, last];
  const out: Point[] = [first];
  for (let k = 0; k + 3 < c.length; k++) {
    const [p0, p1, p2, p3] = [c[k], c[k + 1], c[k + 2], c[k + 3]];
    const span = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const steps = Math.min(8, Math.max(1, Math.ceil(span / spacing)));
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const it = 1 - t;
      const b0 = (it * it * it) / 6;
      const b1 = (3 * t * t * t - 6 * t * t + 4) / 6;
      const b2 = (-3 * t * t * t + 3 * t * t + 3 * t + 1) / 6;
      const b3 = (t * t * t) / 6;
      out.push([
        b0 * p0[0] + b1 * p1[0] + b2 * p2[0] + b3 * p3[0],
        b0 * p0[1] + b1 * p1[1] + b2 * p2[1] + b3 * p3[1],
      ]);
    }
  }
  out[out.length - 1] = last;
  return out;
}

/**
    The points of a polyline that keep its shape to within `tolerance`
    pixels (Ramer–Douglas–Peucker), its ends always kept.
*/
export function simplifyPolyline(points: Point[], tolerance: number): Point[] {
  if (points.length < 3) return points.slice();
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack: [number, number][] = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const [ax, ay] = points[a];
    const dx = points[b][0] - ax;
    const dy = points[b][1] - ay;
    const len = Math.hypot(dx, dy);
    let worst = -1;
    let far = 0;
    for (let k = a + 1; k < b; k++) {
      const [x, y] = points[k];
      const off = len
        ? Math.abs(dx * (ay - y) - (ax - x) * dy) / len
        : Math.hypot(x - ax, y - ay);
      if (off > far) {
        far = off;
        worst = k;
      }
    }
    if (worst >= 0 && far > tolerance) {
      keep[worst] = 1;
      stack.push([a, worst], [worst, b]);
    }
  }
  return points.filter((_, k) => keep[k]);
}

/**
    A bundled edge's drawn polyline: its control points straightened by
    `strength`, rounded into a B-spline when `smoothing` is on, and thinned
    to within a quarter pixel.
*/
export function smoothBundle(
  points: Point[],
  strength: number,
  smoothing: boolean,
): Point[] {
  const straight = straightenPolyline(points, strength);
  const curve = smoothing ? bsplinePolyline(straight) : straight;
  return simplifyPolyline(curve, 0.25);
}
