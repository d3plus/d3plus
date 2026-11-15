/**
    The classic ellipse diagrams that show every combination of four or
    five sets: Venn's four ellipses and Grünbaum's five rotationally
    symmetric ellipses. Each ellipse is drawn as a fine polygon, so the
    area its sets share is an intersection of convex polygons (clipped one
    against the next), and a region's label goes at the point deepest
    inside the part of it no other ellipse covers.
*/

import {polygonArea, polygonContains} from "d3-polygon";

import {nelderMead} from "./nelderMead.js";
import type {VennLabelSpot} from "./vennRegions.js";

/** A point as `[x, y]`. */
export type VennPoint = [number, number];

/** An ellipse by its center, its two radii, and its rotation (radians, clockwise on screen). */
export interface VennEllipse {
  x: number;
  y: number;
  rx: number;
  ry: number;
  rotation: number;
}

/** How many sides each ellipse's polygon has. */
export const ELLIPSE_SEGMENTS = 240;

const DEGREE = Math.PI / 180;

/**
    Venn's four ellipses, left to right: two tilted one way, two the other,
    the middle two sharing a center, so all fifteen combinations appear,
    each as one piece. The offsets, shape and tilt are the ones that give
    the smallest region the most room.
*/
export const FOUR_ELLIPSES: VennEllipse[] = [
  {x: -0.3, y: 0.3, rx: 1, ry: 0.65, rotation: 50 * DEGREE},
  {x: 0, y: 0, rx: 1, ry: 0.65, rotation: 50 * DEGREE},
  {x: 0, y: 0, rx: 1, ry: 0.65, rotation: -50 * DEGREE},
  {x: 0.3, y: 0.3, rx: 1, ry: 0.65, rotation: -50 * DEGREE},
];

/**
    Grünbaum's five congruent ellipses, each turned a fifth of a circle
    from the last around a common center (the first above it), so all
    thirty-one combinations appear. The offset, shape and twist are the
    ones that give the smallest region the most room.
*/
export const FIVE_ELLIPSES: VennEllipse[] = Array.from({length: 5}, (_, k) => {
  const angle = -Math.PI / 2 + (k * 2 * Math.PI) / 5;
  return {
    x: 0.15 * Math.cos(angle),
    y: 0.15 * Math.sin(angle),
    rx: 1,
    ry: 0.7,
    rotation: angle + 30 * DEGREE,
  };
});

/**
    The classic ellipses for `names`, keyed by name in order: four or five
    sets, and undefined for any other count.
*/
export function classicEllipses(
  names: string[],
): Record<string, VennEllipse> | undefined {
  const base =
    names.length === 4
      ? FOUR_ELLIPSES
      : names.length === 5
        ? FIVE_ELLIPSES
        : undefined;
  if (!base) return undefined;
  return Object.fromEntries(names.map((s, k) => [s, {...base[k]}]));
}

/** An ellipse's outline as a polygon of `segments` points. */
export function ellipsePolygon(
  e: VennEllipse,
  segments: number = ELLIPSE_SEGMENTS,
): VennPoint[] {
  const cos = Math.cos(e.rotation);
  const sin = Math.sin(e.rotation);
  return Array.from({length: segments}, (_, k) => {
    const t = (k / segments) * 2 * Math.PI;
    const u = e.rx * Math.cos(t);
    const v = e.ry * Math.sin(t);
    return [e.x + u * cos - v * sin, e.y + u * sin + v * cos];
  });
}

/**
    The polygon with its points in the order whose interior lies to the
    left of each edge by the cross product (`polygonArea`, which counts
    the other way round, is then negative).
*/
function positive(p: VennPoint[]): VennPoint[] {
  return polygonArea(p) > 0 ? p.slice().reverse() : p;
}

/** Where segment `a`–`b` crosses the line through `c`–`d`. */
function crossing(
  a: VennPoint,
  b: VennPoint,
  c: VennPoint,
  d: VennPoint,
): VennPoint {
  const r = [b[0] - a[0], b[1] - a[1]];
  const s = [d[0] - c[0], d[1] - c[1]];
  const den = r[0] * s[1] - r[1] * s[0];
  const t = den ? ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / den : 0;
  return [a[0] + t * r[0], a[1] + t * r[1]];
}

/**
    The part of `subject` inside the convex polygon `clip`
    (Sutherland–Hodgman), or an empty list when they don't overlap.
*/
export function clipConvex(
  subject: VennPoint[],
  clip: VennPoint[],
): VennPoint[] {
  const edges = positive(clip);
  let out = subject.slice();
  const side = (c: VennPoint, d: VennPoint, p: VennPoint) =>
    (d[0] - c[0]) * (p[1] - c[1]) - (d[1] - c[1]) * (p[0] - c[0]);
  for (let i = 0; i < edges.length && out.length; i++) {
    const c = edges[i];
    const d = edges[(i + 1) % edges.length];
    const input = out;
    out = [];
    for (let j = 0; j < input.length; j++) {
      const p = input[j];
      const q = input[(j + 1) % input.length];
      const pIn = side(c, d, p) >= 0;
      const qIn = side(c, d, q) >= 0;
      if (pIn) out.push(p);
      if (pIn !== qIn) out.push(crossing(p, q, c, d));
    }
  }
  return out.length >= 3 ? out : [];
}

/** The area every polygon shares (each convex), as a polygon; empty when they share none. */
export function polygonIntersection(polygons: VennPoint[][]): VennPoint[] {
  if (!polygons.length) return [];
  let shared = positive(polygons[0]);
  for (const p of polygons.slice(1)) {
    shared = clipConvex(shared, p);
    if (!shared.length) return [];
  }
  return Math.abs(polygonArea(shared)) > 1e-9 ? shared : [];
}

/** The distance from `p` to the nearest edge of `polygon`. */
export function edgeDistance(p: VennPoint, polygon: VennPoint[]): number {
  let best = Infinity;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = dx * dx + dy * dy;
    const t = len
      ? Math.max(
          0,
          Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len),
        )
      : 0;
    best = Math.min(
      best,
      Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy),
    );
  }
  return best;
}

/**
    How far `p` is from the nearest edge of the region inside every
    `inside` polygon and outside every `outside` polygon: positive inside
    the region, negative outside it.
*/
export function polygonMargin(
  p: VennPoint,
  inside: VennPoint[][],
  outside: VennPoint[][],
): number {
  let margin = Infinity;
  for (const poly of inside) {
    const d = edgeDistance(p, poly);
    margin = Math.min(margin, polygonContains(poly, p) ? d : -d);
  }
  for (const poly of outside) {
    const d = edgeDistance(p, poly);
    margin = Math.min(margin, polygonContains(poly, p) ? -d : d);
  }
  return margin;
}

/**
    The point deepest inside the region within every `inside` polygon and
    outside every `outside` one, with its margin: the best of a grid over
    the polygons' shared area, then refined. When that region is empty,
    the deepest point of the shared area instead, with a margin of 0.
*/
export function polygonLabelSpot(
  inside: VennPoint[][],
  outside: VennPoint[][],
): VennLabelSpot {
  const shared = polygonIntersection(inside);
  if (!shared.length) return {x: 0, y: 0, margin: 0};
  const xs = shared.map(p => p[0]);
  const ys = shared.map(p => p[1]);
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
  const [y0, y1] = [Math.min(...ys), Math.max(...ys)];
  const steps = 16;
  let start: VennPoint = [(x0 + x1) / 2, (y0 + y1) / 2];
  let best = -Infinity;
  for (let i = 0; i <= steps; i++)
    for (let j = 0; j <= steps; j++) {
      const p: VennPoint = [
        x0 + ((x1 - x0) * i) / steps,
        y0 + ((y1 - y0) * j) / steps,
      ];
      const m = polygonMargin(p, inside, outside);
      if (m > best) {
        best = m;
        start = p;
      }
    }
  const {x} = nelderMead(
    p => -polygonMargin([p[0], p[1]], inside, outside),
    start,
    {maxIterations: 300, minErrorDelta: 1e-10},
  );
  const margin = polygonMargin([x[0], x[1]], inside, outside);
  if (margin > 0) return {x: x[0], y: x[1], margin};
  if (outside.length) return {...polygonLabelSpot(inside, []), margin: 0};
  return {x: x[0], y: x[1], margin: 0};
}

/** An SVG path through a polygon's points. */
export function polygonPath(polygon: VennPoint[]): string {
  if (!polygon.length) return "";
  return `M${polygon.map(p => `${p[0]},${p[1]}`).join("L")}Z`;
}

/** The box around points. */
export interface PointBounds {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** The box around every point given. */
export function pointBounds(points: VennPoint[]): PointBounds {
  let x0 = Infinity,
    x1 = -Infinity,
    y0 = Infinity,
    y1 = -Infinity;
  for (const [x, y] of points) {
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  return {x0, x1, y0, y1};
}

/** A uniform scale then a shift, as `[x * scale + dx, y * scale + dy]`. */
export interface PointFit {
  scale: number;
  dx: number;
  dy: number;
}

/**
    The scale and shift that fit `bounds` inside a `width` × `height` box
    less `padding` on every side, centered, keeping its proportions.
*/
export function fitBounds(
  bounds: PointBounds,
  width: number,
  height: number,
  padding = 0,
): PointFit {
  const {x0, x1, y0, y1} = bounds;
  const w = Math.max(0, width - 2 * padding);
  const h = Math.max(0, height - 2 * padding);
  const scale = x1 > x0 && y1 > y0 ? Math.min(w / (x1 - x0), h / (y1 - y0)) : 0;
  return {
    scale,
    dx: padding + (w - (x1 - x0) * scale) / 2 - x0 * scale,
    dy: padding + (h - (y1 - y0) * scale) / 2 - y0 * scale,
  };
}

/** A point moved by a fit. */
export function fitPoint([x, y]: VennPoint, fit: PointFit): VennPoint {
  return [x * fit.scale + fit.dx, y * fit.scale + fit.dy];
}

/**
    Scales and centers polygons to fit inside a `width` × `height` box less
    `padding` on every side, keeping their proportions.
*/
export function fitPolygons(
  polygons: Record<string, VennPoint[]>,
  width: number,
  height: number,
  padding = 0,
): Record<string, VennPoint[]> {
  const all = Object.values(polygons).flat();
  if (!all.length) return {};
  const fit = fitBounds(pointBounds(all), width, height, padding);
  return Object.fromEntries(
    Object.entries(polygons).map(([s, poly]) => [
      s,
      poly.map(p => fitPoint(p, fit)),
    ]),
  );
}
