/**
    Pure geometry for link labels that follow a curved link: the link's
    centerline as points, trimmed to the edges of its nodes; where a label's
    anchor falls along it; the stretch the label covers, kept upright and
    short of tight turns; the path its text follows, which puts the glyphs'
    middles on the centerline; and the stretch its pad covers.
*/

import {samplePath} from "@d3plus/render";

import {curvature} from "../Plot/lineLabelsAlong.js";
import {
  offsetPolyline,
  polylineLength,
  trimPolyline,
  uprightPoints,
} from "./pathLabelGeometry.js";
import type {Pt} from "./pathLabelGeometry.js";
import {polylineReach} from "./polyline.js";

/** The most a label's stretch turns, in radians: past this, it is cut short. */
export const LINK_LABEL_MAX_TURN = Math.PI * 0.75;

/** A stretch that turns less than this (radians) takes a straight label. */
export const LINK_LABEL_STRAIGHT_TURN = 0.03;

/** The tightest a label's stretch may bend, as a radius in ems: a stretch is cut short of tighter bends. */
export const LINK_LABEL_MIN_RADIUS = 1.5;

/** How far below its centerline a label's baseline sits, in ems: glyphs span 0.8em above it to 0.2em below. */
const BASELINE_DROP = 0.3;

/**
    A path's `d` as points, its curves flattened.
    @param d The path.
*/
export function curvePoints(d: string): Pt[] {
  return samplePath(d).points.map(([x, y]): Pt => [x, y]);
}

/**
    The part of a polyline outside circles of radius `r0` around its first
    point and `r1` around its last: a link's run between the edges of its
    nodes. Empty when the circles cover it.
    @param points The polyline.
    @param r0 The radius around its first point.
    @param r1 The radius around its last point.
*/
export function trimToNodes(points: Pt[], r0 = 0, r1 = 0): Pt[] {
  if (points.length < 2) return [];
  const total = polylineLength(points);
  const from = polylineReach(points, r0);
  const to = total - polylineReach([...points].reverse(), r1);
  return to > from ? trimPolyline(points, from, to) : [];
}

/**
    How far along a polyline its point nearest `p` lies.
    @param points The polyline.
    @param p The point.
*/
export function distanceAlong(points: Pt[], p: Pt): number {
  let best = Infinity;
  let at = 0;
  let walked = 0;
  for (let k = 1; k < points.length; k++) {
    const [ax, ay] = points[k - 1];
    const [bx, by] = points[k];
    const dx = bx - ax,
      dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2
      ? Math.max(0, Math.min(1, ((p[0] - ax) * dx + (p[1] - ay) * dy) / len2))
      : 0;
    const dist = Math.hypot(ax + dx * t - p[0], ay + dy * t - p[1]);
    if (dist < best) {
      best = dist;
      at = walked + t * Math.sqrt(len2);
    }
    walked += Math.sqrt(len2);
  }
  return at;
}

/**
    The most a polyline turns along any `span` pixels of it, in radians: a
    circle of radius `r` turns `span / r`.
    @param points The polyline.
    @param span The length of the stretches measured.
*/
export function sharpestTurn(points: Pt[], span: number): number {
  const at: number[] = [];
  const turns: number[] = [];
  let walked = 0;
  let prev: number | null = null;
  for (let k = 1; k < points.length; k++) {
    const dx = points[k][0] - points[k - 1][0],
      dy = points[k][1] - points[k - 1][1];
    const len = Math.hypot(dx, dy);
    if (!len) continue;
    const angle = Math.atan2(dy, dx);
    if (prev !== null) {
      let turn = Math.abs(angle - prev);
      if (turn > Math.PI) turn = 2 * Math.PI - turn;
      at.push(walked);
      turns.push(turn);
    }
    prev = angle;
    walked += len;
  }
  let best = 0;
  let sum = 0;
  let lo = 0;
  for (let hi = 0; hi < turns.length; hi++) {
    sum += turns[hi];
    while (at[hi] - at[lo] > span) sum -= turns[lo++];
    best = Math.max(best, sum);
  }
  return best;
}

/**
    The stretch of a polyline a label covers: `length` pixels long (or the
    whole polyline when it is shorter), centered `at` pixels along it as
    near as its ends allow, and shortened until it turns no more than
    `maxTurn` in all, and bends no tighter than a circle of `minRadius`.
    Upright: it runs left to right, or bottom to top when it runs straight
    up or down (see `uprightPoints`).
    @param points The polyline.
    @param at Where the stretch's middle goes, along the polyline.
    @param length The stretch's length.
    @param maxTurn The most the stretch may turn, in radians.
    @param minRadius The tightest bend the stretch may hold, in pixels.
*/
export function labelStretch(
  points: Pt[],
  at: number,
  length: number,
  maxTurn = LINK_LABEL_MAX_TURN,
  minRadius = 0,
): Pt[] {
  const total = polylineLength(points);
  let len = Math.max(0, Math.min(length, total));
  for (;;) {
    const mid = Math.max(len / 2, Math.min(total - len / 2, at));
    const stretch = trimPolyline(points, mid - len / 2, mid + len / 2);
    // Over a span as long as the radius (or the whole stretch, when it is
    // shorter), a bend that tight turns span / radius, and a vertex's worth more.
    const span = Math.min(minRadius, polylineLength(stretch));
    const smooth =
      curvature(stretch) <= maxTurn &&
      (!minRadius || sharpestTurn(stretch, span) <= (span + 2) / minRadius);
    if (len < 1 || smooth) return uprightPoints(stretch);
    len *= 0.9;
  }
}

/** Where a curved label goes: its centerline stretch and the points its text follows. */
export interface CurvedLabelSpot {
  /** The centerline stretch the label covers, pad included, upright. */
  stretch: Pt[];
  /** The path its text follows: the stretch less the pad at each end, its baseline dropped so the glyphs' middles sit on the centerline. */
  text: Pt[];
}

/**
    Where a label follows a curved link, or null when the stretch it would
    cover runs straight (a straight label reads the same there) or the link
    bends too tightly around the label's spot for a few letters to follow
    it (a small self-loop).
    @param path The link's centerline.
    @param at Where the label's middle goes, along the centerline.
    @param textWidth The text's width.
    @param fontSize The font size.
    @param pad The pad around the text.
*/
export function curvedLabelSpot(
  path: Pt[],
  at: number,
  textWidth: number,
  fontSize: number,
  pad: number,
): CurvedLabelSpot | null {
  if (path.length < 2) return null;
  // A font size of slack, as text along the inside of a bend has less room.
  const stretch = labelStretch(
    path,
    at,
    textWidth + fontSize + pad * 2,
    LINK_LABEL_MAX_TURN,
    LINK_LABEL_MIN_RADIUS * fontSize,
  );
  if (stretch.length < 2) return null;
  if (curvature(stretch) <= LINK_LABEL_STRAIGHT_TURN) return null;
  const length = polylineLength(stretch);
  if (length - pad * 2 < Math.min(textWidth, fontSize * 2)) return null;
  const run = trimPolyline(stretch, pad, length - pad);
  return {stretch, text: offsetPolyline(run, -BASELINE_DROP * fontSize)};
}

/**
    The centerline stretch a curved label's pad covers: its text, centered
    on the stretch, and `pad` past each end. The text's width along its
    baseline is scaled to the centerline, which runs longer outside a bend
    and shorter inside one.
    @param spot The label's spot.
    @param textWidth The width of the text drawn.
    @param pad The pad around the text.
*/
export function curvedLabelPad(
  spot: CurvedLabelSpot,
  textWidth: number,
  pad: number,
): Pt[] {
  const length = polylineLength(spot.stretch);
  const room = polylineLength(spot.text);
  const width = room ? (textWidth * Math.max(0, length - pad * 2)) / room : 0;
  const half = Math.min(length / 2, width / 2 + pad);
  return trimPolyline(spot.stretch, length / 2 - half, length / 2 + half);
}
