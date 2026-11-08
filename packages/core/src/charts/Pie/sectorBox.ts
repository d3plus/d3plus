/**
    Axis-aligned boxes centered on a ring segment's bisector: the line from
    the ring's center through the middle of the segment. A box centered on
    it reads as centered in its slice. Every box here is symmetric about its
    center, so where it goes is a single number, the center's distance from
    the ring's center along the bisector.

    Angles are radians in d3-shape's convention (0 at 12 o'clock, increasing
    clockwise), so a point at angle `a` and radius `r` sits at
    `(r·sin a, −r·cos a)`.
*/
import type {RingArc} from "../features/ringLabels.js";

const TAU = Math.PI * 2;
const EPSILON = 1e-9;

type Pt = [number, number];

/** A box by its top-left corner and size. */
export interface SectorBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** One straight side of a segment: the line its pad leaves along a boundary ray. */
export interface SectorSide {
  /** The unit normal pointing into the segment. */
  normal: Pt;
  /** The side's distance from the ring's center, along `normal`. */
  offset: number;
  /** The boundary ray's direction, away from the center. */
  ray: Pt;
}

/** A segment's edges, as `sectorEdges` resolves them. */
export interface SectorEdges {
  /** The bisector's angle. */
  mid: number;
  /** The bisector's direction, away from the center. */
  dir: Pt;
  /** The angle the segment spans, after its pad. */
  span: number;
  /** The radius a box stays outside of (0 for none). */
  inner: number;
  /** The radius a box stays inside of. */
  outer: number;
  /** The two straight sides, or none for a full turn. */
  sides: SectorSide[];
}

/** The point at angle `a` on the unit circle. */
const unit = (a: number): Pt => [Math.sin(a), -Math.cos(a)];

/**
    Resolves a ring segment's edges, the way d3-shape's arc draws it: a
    `padAngle` narrows a Pie wedge (no hole) by that angle, and offsets a
    ring segment's sides by a constant gap (`padAngle` at the default pad
    radius, `√(inner² + outer²)`). `padding` keeps a box that much further
    inside every edge. A full turn has no sides; its bisector points up.
    Null when the segment has no area.
    @param arc The segment.
    @param padding The room kept inside every edge, in pixels.
*/
export function sectorEdges(arc: RingArc, padding = 0): SectorEdges | null {
  let a0 = Math.min(arc.startAngle, arc.endAngle);
  let a1 = Math.max(arc.startAngle, arc.endAngle);
  const inner = arc.innerRadius > 0 ? arc.innerRadius + padding : 0;
  const outer = arc.outerRadius - padding;
  if (!(a1 - a0 > EPSILON) || !(outer > inner)) return null;
  if (a1 - a0 >= TAU - 1e-6)
    return {mid: 0, dir: unit(0), span: TAU, inner, outer, sides: []};
  const half = (arc.padAngle ?? 0) / 2;
  let gap = 0;
  if (half > 0 && arc.innerRadius > 0)
    gap = Math.hypot(arc.innerRadius, arc.outerRadius) * Math.sin(half);
  else if (half > 0) {
    a0 += half;
    a1 -= half;
  }
  const span = a1 - a0;
  if (!(span > EPSILON)) return null;
  const mid = (a0 + a1) / 2;
  const offset = gap + padding;
  const sides: SectorSide[] = [
    {normal: [Math.cos(a0), Math.sin(a0)], offset, ray: unit(a0)},
    {normal: [-Math.cos(a1), -Math.sin(a1)], offset, ray: unit(a1)},
  ];
  return {mid, dir: unit(mid), span, inner, outer, sides};
}

/** The least `t` at which a box of half-size `a`×`b` centered at `t·dir` clears a circle of radius `r` around the center. */
function clearInner(dir: Pt, a: number, b: number, r: number): number {
  if (!(r > 0)) return -Infinity;
  const ux = Math.abs(dir[0]);
  const uy = Math.abs(dir[1]);
  const found: number[] = [];
  // The nearest point is on the box's side facing the center…
  if (ux > EPSILON) {
    const t = (a + r) / ux;
    if (t * uy <= b + EPSILON) found.push(t);
  }
  // …or on its top or bottom…
  if (uy > EPSILON) {
    const t = (b + r) / uy;
    if (t * ux <= a + EPSILON) found.push(t);
  }
  // …or its corner nearest the center.
  const k = a * ux + b * uy;
  const disc = k * k - (a * a + b * b - r * r);
  if (disc >= 0) {
    const t = k + Math.sqrt(disc);
    if (t * ux >= a - EPSILON && t * uy >= b - EPSILON) found.push(t);
  }
  return found.length ? Math.min(...found) : Infinity;
}

/** The least `t` at which a box of half-size `a`×`b` centered at `t·dir` sits inside `side`. */
function insideSide(side: SectorSide, dir: Pt, a: number, b: number): number {
  const [nx, ny] = side.normal;
  const along = nx * dir[0] + ny * dir[1];
  const need = side.offset + a * Math.abs(nx) + b * Math.abs(ny);
  return along > EPSILON ? need / along : Infinity;
}

/**
    The least `t` at which a box centered at `t·dir` keeps clear of a
    segment's gap when the segment spans more than half a turn. The gap is
    then a convex wedge, so the box clears it when one of the box's own
    axes, or a side's normal, separates the two.
*/
function clearGap(edges: SectorEdges, a: number, b: number): number {
  const {dir, sides, span} = edges;
  let least = Math.min(...sides.map(s => insideSide(s, dir, a, b)));
  // The gap's apex sits on the bisector, where the two sides meet.
  const apex = sides[0].offset / Math.sin(span / 2);
  const axes: Pt[] = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  for (const e of axes) {
    const dot = (p: Pt) => e[0] * p[0] + e[1] * p[1];
    // The gap reaches no further than its apex along `e` only when both of
    // its edges run that way.
    if (dot(sides[0].ray) < -EPSILON || dot(sides[1].ray) < -EPSILON) continue;
    const reach = a * Math.abs(e[0]) + b * Math.abs(e[1]);
    const toward = dot(dir);
    const limit = apex * toward;
    if (toward < -EPSILON) least = Math.min(least, (reach - limit) / -toward);
    else if (reach <= limit + EPSILON) least = -Infinity;
  }
  return least;
}

/**
    The stretch of a segment's bisector where a `width`×`height` box can be
    centered and stay inside the segment, as distances from the ring's
    center: from `lo` to `hi`. For a whole disc it runs through the center,
    from `-hi` to `hi`. Null when the box fits nowhere along it.
    @param edges The segment's edges (see `sectorEdges`).
    @param width The box's width.
    @param height The box's height.
*/
export function sectorBoxRange(
  edges: SectorEdges,
  width: number,
  height: number,
): {lo: number; hi: number} | null {
  const a = width / 2;
  const b = height / 2;
  const {dir, inner, outer, sides, span} = edges;
  const ux = Math.abs(dir[0]);
  const uy = Math.abs(dir[1]);
  // The corner furthest from the center reaches the outer edge at `hi`.
  const k = a * ux + b * uy;
  const disc = k * k - (a * a + b * b - outer * outer);
  if (a * a + b * b > outer * outer || disc < 0) return null;
  const hi = -k + Math.sqrt(disc);
  if (!sides.length && !(inner > 0)) return {lo: -hi, hi};
  let lo = Math.max(0, clearInner(dir, a, b, inner));
  if (sides.length)
    lo = Math.max(
      lo,
      span > Math.PI
        ? clearGap(edges, a, b)
        : Math.max(...sides.map(s => insideSide(s, dir, a, b))),
    );
  return lo <= hi + EPSILON ? {lo, hi: Math.max(lo, hi)} : null;
}

/**
    The box of the given size centered on the bisector at distance `t`.
    @param edges The segment's edges.
    @param t The center's distance from the ring's center.
    @param width The box's width.
    @param height The box's height.
*/
export function sectorBoxAt(
  edges: SectorEdges,
  t: number,
  width: number,
  height: number,
): SectorBox {
  return {
    x: t * edges.dir[0] - width / 2,
    y: t * edges.dir[1] - height / 2,
    width,
    height,
  };
}

/**
    A `width`×`height` box centered on a segment's bisector, halfway along
    the stretch where it fits (see `sectorBoxRange`), so the room around it
    is shared out evenly. Null when it fits nowhere.
    @param edges The segment's edges.
    @param width The box's width.
    @param height The box's height.
*/
export function centeredSectorBox(
  edges: SectorEdges,
  width: number,
  height: number,
): SectorBox | null {
  const range = sectorBoxRange(edges, width, height);
  if (!range) return null;
  return sectorBoxAt(edges, (range.lo + range.hi) / 2, width, height);
}

/**
    The largest box of a given shape centered on a segment's bisector, at
    the one place along it where that box fits. The scale is searched from
    0 up to the ring's diameter.
    @param edges The segment's edges.
    @param size The box's width and height at a scale, growing with it.
    @param iterations How finely the scale is searched.
*/
export function largestSectorBox(
  edges: SectorEdges,
  size: (scale: number) => [number, number],
  iterations = 40,
): SectorBox | null {
  const fits = (s: number) => sectorBoxRange(edges, ...size(s)) !== null;
  let lo = 0;
  let hi = edges.outer * 2;
  if (!fits(lo)) return null;
  for (let n = 0; n < iterations; n++) {
    const s = (lo + hi) / 2;
    if (fits(s)) lo = s;
    else hi = s;
  }
  return lo > 0 ? centeredSectorBox(edges, ...size(lo)) : null;
}
