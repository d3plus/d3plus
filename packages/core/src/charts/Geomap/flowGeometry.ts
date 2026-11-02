/**
    Pure geometry for Geomap's links: which place a link end names, the
    point a region's link ends at, and each link's path, a great circle
    through the map's projection, optionally lifted into an arc.
*/

import {geoArea, geoCentroid, geoDistance, geoInterpolate} from "d3-geo";
import type {GeoPermissibleObjects} from "d3-geo";

import type {LinkAnchor} from "../features/linkLabelGeometry.js";

/** A geographic coordinate, `[longitude, latitude]` (d3's order). */
export type LonLat = [number, number];
/** A point in the map's projected pixel space. */
export type Point = [number, number];
/** Projects a coordinate to pixels, or null where the projection has none. */
export type Projector = (p: LonLat) => Point | null | undefined;
/** d3-geo's path generator for the map's projection. */
export type GeoPathFn = (object: GeoPermissibleObjects) => string | null;

/** A link's drawn path and the polylines its arrowheads and label follow. */
export interface FlowArc {
  /** The path's `d`. */
  d: string;
  /**
      The path as projected points, from source to target, or null when the
      projection cuts the path (at the antimeridian, or past its clip edge).
  */
  points: Point[] | null;
  /** The drawn run of the path leaving its source, or null when the source is hidden. */
  sourceRun: Point[] | null;
  /** The drawn run of the path reaching its target, or null when the target is hidden. */
  targetRun: Point[] | null;
}

/** Whether `v` is a `[longitude, latitude]` pair of finite numbers. */
export function isLonLat(v: unknown): v is LonLat {
  return (
    Array.isArray(v) &&
    v.length === 2 &&
    typeof v[0] === "number" &&
    typeof v[1] === "number" &&
    Number.isFinite(v[0]) &&
    Number.isFinite(v[1]) &&
    Math.abs(v[1]) <= 90
  );
}

/**
    A row's `point` value as a coordinate: a pair whose two entries read as
    finite numbers (CSV data gives strings), or null.
*/
export function toLonLat(v: unknown): LonLat | null {
  if (!Array.isArray(v) || v.length < 2) return null;
  const c: LonLat = [Number(v[0]), Number(v[1])];
  return isLonLat(c) ? c : null;
}

/**
    The point a link to a geographic feature ends at: the centroid of the
    feature's largest polygon (so a country's link meets its mainland, not a
    point between its islands), or of the whole geometry when it isn't a
    MultiPolygon. Null when the feature has no geometry.
*/
export function featureAnchor(feature: unknown): LonLat | null {
  const geometry = (
    feature as {geometry?: {type: string; coordinates: unknown}}
  )?.geometry;
  if (!geometry) return null;
  let part: GeoPermissibleObjects = geometry as GeoPermissibleObjects;
  if (geometry.type === "MultiPolygon") {
    const polygons = geometry.coordinates as number[][][][];
    let best = -1;
    for (const coordinates of polygons) {
      const polygon = {type: "Polygon", coordinates} as GeoPermissibleObjects;
      const area = sphericalArea(polygon);
      if (area > best) {
        best = area;
        part = polygon;
      }
    }
  }
  let c = geoCentroid(part) as LonLat;
  // A ring wound the wrong way encloses the rest of the sphere, whose
  // centroid is the antipode of the shape's.
  if (geoArea(part) > 2 * Math.PI)
    c = [c[0] > 0 ? c[0] - 180 : c[0] + 180, -c[1]];
  return isLonLat(c) ? c : null;
}

/** A shape's area on the unit sphere, whichever way its rings wind. */
function sphericalArea(object: GeoPermissibleObjects): number {
  const area = geoArea(object);
  return Math.min(area, 4 * Math.PI - area);
}

/** `count + 1` evenly spaced points along the great circle from `a` to `b`. */
export function greatCircle(a: LonLat, b: LonLat, count: number): LonLat[] {
  const interpolate = geoInterpolate(a, b);
  const n = Math.max(1, Math.round(count));
  return Array.from({length: n + 1}, (_, k) => interpolate(k / n) as LonLat);
}

/**
    Lifts a polyline into an arc: each point moves off the straight line
    between its ends, most at the middle, by `curve` times that line's
    length, to the left of the direction of travel (right for a negative
    `curve`). The ends stay put.
*/
export function liftPolyline(points: Point[], curve: number): Point[] {
  if (!curve || points.length < 2) return points.slice();
  const [x0, y0] = points[0];
  const [x1, y1] = points[points.length - 1];
  const length = Math.hypot(x1 - x0, y1 - y0);
  if (!length) return points.slice();
  // On screen (y down), the left of travel is the direction rotated -90°.
  const nx = (y1 - y0) / length;
  const ny = -(x1 - x0) / length;
  const last = points.length - 1;
  return points.map(([x, y], k) => {
    const t = k / last;
    const h = 4 * t * (1 - t) * curve * length;
    return [x + nx * h, y + ny * h];
  });
}

/** The numbers in a path string, in order. */
function pathNumbers(d: string): number[] {
  return (d.match(/-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) ?? []).map(Number);
}

/**
    Whether d3-geo drew a line as one unbroken run from `a` to `b`: one
    subpath, starting and ending (within a pixel) at the two points.
*/
export function unbrokenPath(d: string, a: Point, b: Point): boolean {
  if ((d.match(/M/g) ?? []).length !== 1) return false;
  const n = pathNumbers(d);
  if (n.length < 4) return false;
  const near = (x: number, y: number, p: Point) =>
    Math.abs(x - p[0]) <= 1 && Math.abs(y - p[1]) <= 1;
  return near(n[0], n[1], a) && near(n[n.length - 2], n[n.length - 1], b);
}

const round = (n: number): number => Math.round(n * 100) / 100;

/** A polyline as a path `d`. */
export function polylinePath(points: Point[]): string {
  return points
    .map(([x, y], k) => `${k ? "L" : "M"}${round(x)},${round(y)}`)
    .join("");
}

/**
    Whether the projection cuts the great circle from `a` to `b` (across
    the antimeridian, between geoAlbersUsa's insets, past a globe's horizon,
    or anywhere else it breaks or shortens the line), so it isn't drawn as
    one run from one end to the other.
*/
export function greatCircleCut(
  a: LonLat,
  b: LonLat,
  projection: Projector,
  path: GeoPathFn,
): boolean {
  const straight = path({type: "LineString", coordinates: [a, b]});
  const pa = finitePoint(projection(a));
  const pb = finitePoint(projection(b));
  return !straight || !pa || !pb || !unbrokenPath(straight, pa, pb);
}

/**
    A link drawn on the screen between two projected points: the straight
    line between them, bowed by `curve` the way `liftPolyline` bows it.
*/
export function screenArc(pa: Point, pb: Point, curve = 0): FlowArc {
  const chord = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]);
  const count = Math.min(128, Math.max(16, Math.ceil(chord / 4)));
  const line: Point[] = Array.from({length: count + 1}, (_, k) => {
    const t = k / count;
    return [pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t];
  });
  const drawn = liftPolyline(line, curve);
  return {
    d: polylinePath(drawn),
    points: drawn,
    sourceRun: drawn,
    targetRun: drawn,
  };
}

/**
    A link's path between two coordinates: the great circle between them
    through the map's projection, lifted into an arc by `curve` (see
    `liftPolyline`) when the projection draws it unbroken.

    When the projection cuts the great circle, a flat map draws the link on
    the screen between its two ends instead (see `screenArc`), so it
    crosses the map rather than leaving by one edge and coming back by the
    other. A globe (see `clipsToCircle`), or a flat map hiding one of the
    ends, draws it as d3-geo clips it, without the lift. Null when the two
    places are the same or the projection hides the whole path.
*/
export function flowArc(
  a: LonLat,
  b: LonLat,
  projection: Projector,
  path: GeoPathFn,
  curve = 0,
): FlowArc | null {
  if (!geoDistance(a, b)) return null;
  const straight = path({type: "LineString", coordinates: [a, b]});
  if (!straight) return null;
  const pa = finitePoint(projection(a));
  const pb = finitePoint(projection(b));
  const flat = !clipsToCircle(projection);
  const shown = (p: LonLat) => coordinateVisible(path, p);
  const onScreen = () =>
    flat && pa && pb && shown(a) && shown(b) ? screenArc(pa, pb, curve) : null;
  const chord = pa && pb ? Math.hypot(pb[0] - pa[0], pb[1] - pa[1]) : 0;
  const count = Math.min(128, Math.max(16, Math.ceil(chord / 4)));
  const samples = greatCircle(a, b, count);
  if (!pa || !pb || !unbrokenPath(straight, pa, pb)) {
    const fallback = onScreen();
    if (fallback) return fallback;
    // Keep the runs the projection draws, for the arrowheads at the ends.
    const runs = splitRuns(
      samples.map(p => (shown(p) ? finitePoint(projection(p)) : null)),
    );
    return {d: straight, points: null, ...runs};
  }
  const points: Point[] = [];
  for (const p of samples) {
    const q = finitePoint(projection(p));
    if (!q)
      return (
        onScreen() ?? {
          d: straight,
          points: null,
          sourceRun: null,
          targetRun: null,
        }
      );
    points.push(q);
  }
  const drawn = curve ? liftPolyline(points, curve) : points;
  return {
    d: curve ? polylinePath(drawn) : straight,
    points: drawn,
    sourceRun: drawn,
    targetRun: drawn,
  };
}

/** A projected point as a pair of finite numbers, or null. */
function finitePoint(q: Point | null | undefined): Point | null {
  return q && Number.isFinite(q[0]) && Number.isFinite(q[1])
    ? [q[0], q[1]]
    : null;
}

/**
    Splits a projected polyline into the runs drawn unbroken: it breaks at
    each missing point and at each jump far longer than the polyline's
    typical step (where the projection wraps it across the map). Returns the
    run leaving the first point and the run reaching the last, each null
    when that point is missing or its run is a single point.
*/
export function splitRuns(points: (Point | null)[]): {
  sourceRun: Point[] | null;
  targetRun: Point[] | null;
} {
  const steps: number[] = [];
  for (let k = 1; k < points.length; k++) {
    const p = points[k - 1];
    const q = points[k];
    if (p && q) steps.push(Math.hypot(q[0] - p[0], q[1] - p[1]));
  }
  const sorted = [...steps].sort((x, y) => x - y);
  const typical = sorted[Math.floor(sorted.length / 2)] ?? 0;
  const jump = Math.max(50, typical * 10);
  const runs: {start: number; points: Point[]}[] = [];
  let run: {start: number; points: Point[]} | null = null;
  points.forEach((p, k) => {
    const prev = run?.points[run.points.length - 1];
    if (!p || (prev && Math.hypot(p[0] - prev[0], p[1] - prev[1]) > jump)) {
      if (run) runs.push(run);
      run = p ? {start: k, points: [p]} : null;
      return;
    }
    if (!run) run = {start: k, points: []};
    run.points.push(p);
  });
  if (run) runs.push(run);
  const first = runs[0];
  const last = runs[runs.length - 1];
  const ok = (r: {points: Point[]} | undefined) => !!r && r.points.length > 1;
  return {
    sourceRun: ok(first) && first.start === 0 ? first.points : null,
    targetRun:
      ok(last) && last.start + last.points.length === points.length
        ? last.points
        : null,
  };
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

/**
    Where an arrowhead at one end of a polyline goes: `inset` back from that
    end (to clear the mark there), pointing into the end.
*/
export function polylineEndTip(
  points: Point[],
  end: "source" | "target",
  inset = 0,
): LinkAnchor {
  const length = polylineLength(points);
  const room = Math.min(Math.max(0, inset), length / 2);
  if (end === "target") return polylineAt(points, length - room);
  const at = polylineAt(points, room);
  return {...at, angle: at.angle + Math.PI};
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
    The default arrowhead size for a link `width` pixels wide: three times
    the width (at least 6), held to 12 pixels so wide links don't carry
    oversized heads, but never under 1.5 times the width, so the head's base
    (1.2 times its size) stays wider than the line it ends.
*/
export function flowArrowSize(width: number): number {
  const w = Number.isFinite(width) && width > 0 ? width : 1;
  return Math.max(6, Math.min(w * 3, Math.max(12, w * 1.5)));
}

/**
    Whether a projection clips the sphere to a circle (a globe, or any
    projection with a `clipAngle`), where a bowed arc would leave the disc.
*/
export function clipsToCircle(projection: unknown): boolean {
  const clipAngle = (projection as {clipAngle?: () => unknown} | null)
    ?.clipAngle;
  if (typeof clipAngle !== "function") return false;
  const angle = clipAngle.call(projection);
  // An unset clip angle reads as 0 (clipping only at the antimeridian).
  return typeof angle === "number" && Number.isFinite(angle) && angle > 0;
}

/** Whether the projection draws a coordinate, read through its clipping stream. */
export function coordinateVisible(path: GeoPathFn, coord: LonLat): boolean {
  return !!path({type: "Point", coordinates: coord});
}
