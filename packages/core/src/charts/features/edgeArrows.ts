/**
    Shared arrowhead geometry for edge charts (Network, Rings, ArcDiagram,
    Geomap, Gantt).

    Arrowheads are drawn as filled-triangle `path` scene nodes rather than SVG
    `marker-end`, because d3plus renders to both SVG and Canvas and Canvas has no
    marker support. Each chart computes the tip point + tangent angle from its own
    edge geometry (edges terminate differently per chart) and calls `arrowNode`.
    The triangle lives in the same content coordinate space as its edge, so it
    pans/zooms and hover-dims in lockstep with the edge.

    Chord doesn't use this module — its ribbons carry arrowheads via d3-chord's
    `ribbonArrow`.

    @module
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import {cubicPoint} from "./linkLabelGeometry.js";

/** Which end(s) of an edge carry an arrowhead. `true` is equivalent to `"target"`. */
export type ArrowEndValue = boolean | "target" | "source" | "both";

/** The `arrows` config: a fixed value or a per-edge accessor. */
export type ArrowValue =
  ArrowEndValue | ((d: DataPoint, i: number) => ArrowEndValue);

/** Resolved per-edge arrow ends. */
export interface ArrowEnds {
  source: boolean;
  target: boolean;
}

/** Normalize an `arrows` config value for one edge into `{source, target}` flags. */
export function arrowEnds(
  arrows: ArrowValue,
  d: DataPoint,
  i: number,
): ArrowEnds {
  const v = typeof arrows === "function" ? arrows(d, i) : arrows;
  if (v === true || v === "target") return {source: false, target: true};
  if (v === "source") return {source: true, target: false};
  if (v === "both") return {source: true, target: true};
  return {source: false, target: false};
}

const round = (n: number): number => Math.round(n * 100) / 100;

/**
    SVG path `d` for a filled isosceles triangle whose tip is at `(x, y)`, pointing
    along `angle` (radians), with `size` the tip-to-base length.
*/
export function arrowPathD(
  x: number,
  y: number,
  angle: number,
  size: number,
): string {
  const halfBase = size * 0.6;
  const bx = x - Math.cos(angle) * size;
  const by = y - Math.sin(angle) * size;
  const nx = Math.cos(angle + Math.PI / 2);
  const ny = Math.sin(angle + Math.PI / 2);
  return `M${round(x)},${round(y)}L${round(bx + nx * halfBase)},${round(by + ny * halfBase)}L${round(bx - nx * halfBase)},${round(by - ny * halfBase)}Z`;
}

/**
    Tip point + direction for a straight-edge arrowhead sitting at the boundary of
    an endpoint node (radius `r`), pointing from `(fromX, fromY)` toward
    `(toX, toY)`. `gap` insets the tip slightly off the node edge. Used by Network
    (center-to-center links) and Rings' straight center-links.
*/
export function straightArrowTip(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  r: number,
  gap = 1,
): {x: number; y: number; angle: number} {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  return {
    x: toX - Math.cos(angle) * (r + gap),
    y: toY - Math.sin(angle) * (r + gap),
    angle,
  };
}

/**
    The arrowhead size for an edge drawn `strokeWidth` pixels wide when
    `arrowSize` isn't set: three times the stroke for thin edges, growing no
    larger than 12 pixels from a 4px stroke on, but never under 1.5 times the
    stroke (so the head stays wider than its line), and at least 6 pixels.
*/
export function defaultArrowSize(strokeWidth: number): number {
  const sw = Number.isFinite(strokeWidth) ? Math.max(0, strokeWidth) : 1;
  return Math.max(6, Math.min(sw * 3, Math.max(12, sw * 1.5)));
}

/**
    Resolve the arrowhead size from the `arrowSize` config (a number or per-edge
    accessor), falling back to `defaultArrowSize` for the edge's stroke width.
*/
export function arrowSizeFor(
  arrowSize: unknown,
  d: DataPoint,
  i: number,
  strokeWidth: number,
): number {
  const cfg =
    typeof arrowSize === "function"
      ? (arrowSize as (d: DataPoint, i: number) => unknown)(d, i)
      : arrowSize;
  return typeof cfg === "number" ? cfg : defaultArrowSize(strokeWidth);
}

/**
    How far back from an arrowhead's tip its edge's stroke ends, so the
    stroke's square (butt) end sits inside the head: the head is `1.2 × d`
    wide at `d` pixels from its tip, so this is where it is as wide as the
    stroke, at least halfway along the head and at most its base.
*/
export function arrowTrim(size: number, strokeWidth: number): number {
  const s = Number.isFinite(size) ? Math.max(0, size) : 0;
  const sw = Number.isFinite(strokeWidth) ? Math.max(0, strokeWidth) : 0;
  return Math.min(s, Math.max(s / 2, sw / 1.2));
}

/** An edge's arrowheads: which ends carry one, their size, and the stroke trim at each. */
export interface EdgeArrowTrims {
  ends: ArrowEnds;
  size: number;
  /** How far the stroke ends back from each end's arrow tip (0 without an arrow). */
  source: number;
  target: number;
}

/** Resolves an edge's `arrows`/`arrowSize` into its arrowhead ends, size, and stroke trims. */
export function edgeArrowTrims(opts: {
  arrows: ArrowValue;
  arrowSize: unknown;
  strokeWidth?: number;
  datum: DataPoint;
  i: number;
}): EdgeArrowTrims {
  const ends = arrowEnds(opts.arrows, opts.datum, opts.i);
  const sw = typeof opts.strokeWidth === "number" ? opts.strokeWidth : 1;
  const size =
    ends.source || ends.target
      ? arrowSizeFor(opts.arrowSize, opts.datum, opts.i, sw)
      : 0;
  const trim = arrowTrim(size, sw);
  return {
    ends,
    size,
    source: ends.source ? trim : 0,
    target: ends.target ? trim : 0,
  };
}

type Point = [number, number];

/**
    A straight segment from `a` to `b`, shortened by `start` pixels at `a`
    and `end` pixels at `b`. When the two overlap, it collapses to the point
    between them.
*/
export function trimSegment(
  a: Point,
  b: Point,
  start: number,
  end: number,
): [Point, Point] {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length = Math.hypot(dx, dy);
  const s = Math.max(0, start);
  const e = Math.max(0, end);
  if (!length) return [a, b];
  if (s + e >= length) {
    const t = Math.min(1, s / (s + e || 1));
    const m: Point = [a[0] + dx * t, a[1] + dy * t];
    return [m, m];
  }
  const p = (t: number): Point => [a[0] + dx * t, a[1] + dy * t];
  return [p(s / length), p(1 - e / length)];
}

/** Splits a cubic Bézier curve at `t`, returning its two halves. */
function splitCubic(
  [p0, p1, p2, p3]: [Point, Point, Point, Point],
  t: number,
): [[Point, Point, Point, Point], [Point, Point, Point, Point]] {
  const lerp = (a: Point, b: Point): Point => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
  ];
  const a = lerp(p0, p1);
  const b = lerp(p1, p2);
  const c = lerp(p2, p3);
  const d = lerp(a, b);
  const e = lerp(b, c);
  const f = lerp(d, e);
  return [
    [p0, a, d, f],
    [f, e, c, p3],
  ];
}

/**
    A cubic Bézier curve shortened along its own length by `start` pixels at
    its first end and `end` pixels at its last: the same curve, cut short,
    so the ends keep their direction. When the two cuts meet, it collapses
    to the point where they do.
    @param steps The number of chords the curve's length is measured in.
*/
export function trimCubic(
  curve: [Point, Point, Point, Point],
  start: number,
  end: number,
  steps = 64,
): [Point, Point, Point, Point] {
  const s = Math.max(0, start);
  const e = Math.max(0, end);
  if (!s && !e) return curve;
  const [p0, p1, p2, p3] = curve;
  const lengths = [0];
  let prev = p0;
  for (let k = 1; k <= steps; k++) {
    const p = cubicPoint(p0, p1, p2, p3, k / steps);
    lengths.push(lengths[k - 1] + Math.hypot(p[0] - prev[0], p[1] - prev[1]));
    prev = p;
  }
  const total = lengths[steps];
  // The parameter at `len` along the curve.
  const at = (len: number): number => {
    if (len <= 0) return 0;
    if (len >= total) return 1;
    let k = 1;
    while (k < steps && lengths[k] < len) k++;
    const span = lengths[k] - lengths[k - 1];
    return (k - 1 + (span ? (len - lengths[k - 1]) / span : 0)) / steps;
  };
  if (s + e >= total) {
    const point = cubicPoint(p0, p1, p2, p3, at((total * s) / (s + e || 1)));
    return [point, point, point, point];
  }
  const t0 = at(s);
  const t1 = at(total - e);
  // Cut the end off first, then the start, rescaling its parameter.
  const head = t1 < 1 ? splitCubic(curve, t1)[0] : curve;
  return t0 > 0 ? splitCubic(head, t0 / t1)[1] : head;
}

/** A cubic Bézier curve's SVG path. */
export function cubicPathD([p0, p1, p2, p3]: [
  Point,
  Point,
  Point,
  Point,
]): string {
  return `M${round(p0[0])},${round(p0[1])}C${round(p1[0])},${round(p1[1])} ${round(p2[0])},${round(p2[1])} ${round(p3[0])},${round(p3[1])}`;
}

/**
    The visible stroke of a straight, center-to-center edge between nodes
    of radius `source.r` and `target.r`: cut short inside each arrowhead
    (whose tip sits a pixel off the node's edge, see `straightArrowTip`).
    The full center-to-center path stays the edge's hit area.
*/
export function straightEdgeD(
  source: {x: number; y: number; r?: number},
  target: {x: number; y: number; r?: number},
  trims: {source: number; target: number},
): string {
  const [a, b] = trimSegment(
    [source.x, source.y],
    [target.x, target.y],
    trims.source ? (source.r ?? 0) + 1 + trims.source : 0,
    trims.target ? (target.r ?? 0) + 1 + trims.target : 0,
  );
  return `M${a[0]},${a[1]} ${b[0]},${b[1]}`;
}

/**
    Emit arrowhead nodes for a straight, center-to-center edge between two nodes
    (radii `source.r`/`target.r`), insetting each tip to the node boundary.
    Returns `[]` when `arrows` selects neither end. Used by Network and Rings'
    straight center-links.
*/
export function straightEdgeArrows(opts: {
  arrows: ArrowValue;
  arrowSize: unknown;
  strokeWidth?: number;
  datum: DataPoint;
  i: number;
  keyPrefix: string;
  fill?: string;
  source: {x: number; y: number; r?: number};
  target: {x: number; y: number; r?: number};
}): SceneNode[] {
  const ends = arrowEnds(opts.arrows, opts.datum, opts.i);
  if (!ends.source && !ends.target) return [];
  const size = arrowSizeFor(
    opts.arrowSize,
    opts.datum,
    opts.i,
    typeof opts.strokeWidth === "number" ? opts.strokeWidth : 1,
  );
  const {source: s, target: t, datum, fill, keyPrefix} = opts;
  const out: SceneNode[] = [];
  if (ends.target) {
    const tip = straightArrowTip(s.x, s.y, t.x, t.y, t.r ?? 0, 1);
    out.push(
      arrowNode({
        key: `${keyPrefix}-t`,
        datum,
        x: tip.x,
        y: tip.y,
        angle: tip.angle,
        size,
        fill,
      }),
    );
  }
  if (ends.source) {
    const tip = straightArrowTip(t.x, t.y, s.x, s.y, s.r ?? 0, 1);
    out.push(
      arrowNode({
        key: `${keyPrefix}-s`,
        datum,
        x: tip.x,
        y: tip.y,
        angle: tip.angle,
        size,
        fill,
      }),
    );
  }
  return out;
}

/** Inputs for a single arrowhead scene node. */
export interface ArrowNodeOpts {
  key: string | number;
  datum: DataPoint;
  x: number;
  y: number;
  /** Direction the arrow points, in radians. */
  angle: number;
  size: number;
  fill?: string;
  opacity?: number;
}

/**
    Build one arrowhead scene node. `interactive: false` so the edge path owns
    hit-testing, and the same `datum` as its edge so the hover-dim pass keeps the
    arrow paired with its edge.
*/
export function arrowNode(opts: ArrowNodeOpts): SceneNode {
  return {
    type: "path",
    key: opts.key,
    d: arrowPathD(opts.x, opts.y, opts.angle, opts.size),
    datum: opts.datum,
    interactive: false,
    paint: {
      fill: opts.fill,
      ...(opts.opacity !== undefined ? {opacity: opts.opacity} : {}),
    },
  } as SceneNode;
}
