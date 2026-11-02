/**
    Arrowheads on curved edge ends. On a curve, the tangent at the tip and
    the curve a few pixels back point different ways, so a head aimed along
    the tangent leaves the stroke's end off its axis. Here a head is aimed
    along the chord from where its base sits on the path to its tip, and the
    stroke follows the path up to the base, then runs straight along that
    chord to end inside the head (see `arrowTrim`). The join at the base is
    under the head, so the stroke reads smooth.

    The path is a polyline (a sampled curve, or projected points such as a
    map's) or a cubic Bézier curve.
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import {arrowNode, cubicPathD, trimCubic} from "./edgeArrows.js";
import type {EdgeArrowTrims} from "./edgeArrows.js";
import {cubicPoint} from "./linkLabelGeometry.js";

type Point = [number, number];
type Cubic = [Point, Point, Point, Point];

/** One arrowed end of an edge: its head's tip and direction, its base on the path, and where the stroke ends. */
export interface ArrowedEnd {
  tip: Point;
  /** The head's direction, from its base to its tip, in radians. */
  angle: number;
  /** Where the head's base sits on the path. */
  base: Point;
  /** Where the stroke ends: on the head's axis, `trim` back from its tip. */
  cut: Point;
}

/**
    The point `distance` pixels back along a polyline from its last point
    (its first point when the polyline is shorter than that). Pass the
    points reversed for a distance from the first point.
*/
export function pathPointBack(
  points: readonly Point[],
  distance: number,
): Point {
  if (!points.length) return [NaN, NaN];
  let left = Math.max(0, distance);
  for (let k = points.length - 1; k > 0; k--) {
    const b = points[k];
    const a = points[k - 1];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len >= left) {
      const t = len ? left / len : 0;
      return [b[0] + (a[0] - b[0]) * t, b[1] + (a[1] - b[1]) * t];
    }
    left -= len;
  }
  return points[0];
}

/** A cubic Bézier curve as a polyline of `steps` chords. */
export function cubicPolyline(curve: Cubic, steps = 64): Point[] {
  return Array.from({length: steps + 1}, (_, k) =>
    cubicPoint(...curve, k / steps),
  );
}

/** The direction (radians) of the chord from `base` to `tip`. */
export function chordAngle(base: Point, tip: Point): number {
  return Math.atan2(tip[1] - base[1], tip[0] - base[0]);
}

/**
    A head at `tip` aimed along the chord from `base` (where its base sits
    on the path), and the stroke's end `trim` back from the tip on that
    chord.
*/
export function arrowAlongChord(
  tip: Point,
  base: Point,
  trim: number,
): ArrowedEnd {
  const angle = chordAngle(base, tip);
  return {
    tip,
    angle,
    base,
    cut: [tip[0] - Math.cos(angle) * trim, tip[1] - Math.sin(angle) * trim],
  };
}

/**
    A cubic edge's visible stroke and its arrowed ends: each head's tip sits
    `tipBack` pixels back along the curve from its end, its base `size`
    further back, and the stroke runs along the curve between the bases,
    then straight along each head's axis to its `cut`.
    @param curve The edge, from its source end to its target end.
    @param trims The edge's arrow ends, size, and stroke trims (see `edgeArrowTrims`).
    @param tipBack How far back along the curve each end's tip sits.
*/
export function cubicArrowEdge(
  curve: Cubic,
  trims: EdgeArrowTrims,
  tipBack: {source: number; target: number} = {source: 0, target: 0},
): {d: string; source?: ArrowedEnd; target?: ArrowedEnd} {
  const {ends, size} = trims;
  if (!ends.source && !ends.target) return {d: cubicPathD(curve)};
  const line = cubicPolyline(curve);
  const body = trimCubic(
    curve,
    ends.source ? tipBack.source + size : 0,
    ends.target ? tipBack.target + size : 0,
  );
  const target = ends.target
    ? arrowAlongChord(
        pathPointBack(line, tipBack.target),
        body[3],
        trims.target,
      )
    : undefined;
  const source = ends.source
    ? arrowAlongChord(
        pathPointBack([...line].reverse(), tipBack.source),
        body[0],
        trims.source,
      )
    : undefined;
  return {d: chordEndsPathD(cubicPathD(body), source, target), source, target};
}

const round = (n: number): number => Math.round(n * 100) / 100;

/**
    A path `body` (starting with its own `M`) extended straight along each
    arrowed end's axis: from the source head's `cut` to the body's start,
    and from the body's end to the target head's `cut`.
*/
export function chordEndsPathD(
  body: string,
  source?: ArrowedEnd,
  target?: ArrowedEnd,
): string {
  const at = (p: Point) => `${round(p[0])},${round(p[1])}`;
  const start = source
    ? `M${at(source.cut)}L${at(source.base)}${body.replace(/^M[^A-Za-z]*/, "")}`
    : body;
  return target ? `${start}L${at(target.cut)}` : start;
}

/**
    The head nodes for an edge's arrowed ends, keyed `${keyPrefix}-t` and
    `${keyPrefix}-s`, or by `keys`.
*/
export function chordArrowNodes(opts: {
  ends: {source?: ArrowedEnd; target?: ArrowedEnd};
  size: number;
  datum: DataPoint;
  keyPrefix: string;
  keys?: {source: string; target: string};
  fill?: string;
  opacity?: number;
}): SceneNode[] {
  const out: SceneNode[] = [];
  for (const end of ["target", "source"] as const) {
    const e = opts.ends[end];
    if (!e) continue;
    out.push(
      arrowNode({
        key:
          opts.keys?.[end] ??
          `${opts.keyPrefix}-${end === "target" ? "t" : "s"}`,
        datum: opts.datum,
        x: e.tip[0],
        y: e.tip[1],
        angle: e.angle,
        size: opts.size,
        fill: opts.fill,
        opacity: opts.opacity,
      }),
    );
  }
  return out;
}
