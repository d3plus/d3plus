/**
    Self-loops on the node-link charts: a link whose source and target are
    the same node draws as a teardrop loop outside the node. Pure geometry
    (the loop's path, its far point, its ends, its box), the direction a
    node's loops point, the fan that keeps several loops on one node apart,
    and the loop's arrowheads.
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import {cubicPathD, edgeArrowTrims} from "./edgeArrows.js";
import type {ArrowValue, EdgeArrowTrims} from "./edgeArrows.js";
import {chordArrowNodes, cubicArrowEdge} from "./curvedArrows.js";
import type {FocusBox} from "./linkFocus.js";
import {linkMeta} from "./linkInteraction.js";
import {cubicPoint} from "./linkLabelGeometry.js";
import type {LinkAnchor} from "./linkLabelGeometry.js";

type Point = [number, number];

/** A node a loop is drawn on: its center and radius. */
export interface LoopNode {
  x: number;
  y: number;
  r: number;
}

/** A point on a loop and the direction (radians) the loop runs there. */
export interface LoopPoint {
  x: number;
  y: number;
  angle: number;
}

/** A drawn loop. */
export interface SelfLoopGeometry {
  /** The loop's SVG path, from its source end to its target end. */
  d: string;
  /** The loop's far point, where its label goes, running across the loop. */
  apex: LinkAnchor;
  /** Where the loop leaves the node, pointing back into it. */
  source: LoopPoint;
  /** Where the loop enters the node, pointing into it. */
  target: LoopPoint;
  /** The box the loop covers, stroke included. */
  box: FocusBox;
  /** The direction the loop points out from its node, in radians. */
  angle: number;
  /** The loop's Bézier points, from its source end to its target end. */
  points: [Point, Point, Point, Point];
}

/** Whether a link's two ends are the same node. */
export function isSelfLoop(link: {
  source?: {id?: unknown} | null;
  target?: {id?: unknown} | null;
}): boolean {
  return (
    !!link.source &&
    !!link.target &&
    (link.source === link.target || link.source.id === link.target.id)
  );
}

/**
    Whether a scene node draws a link from a node to itself (or is its hit
    path). Charts with nearest-point hover treat these as point marks: a
    loop lies within reach of its node, so it would otherwise always lose
    the pointer to it.
*/
export function isSelfLoopMark(node: {
  type?: string;
  datum?: unknown;
}): boolean {
  if (node.type !== "path") return false;
  const meta = linkMeta(node.datum);
  return !!meta && meta.source.id === meta.target.id;
}

/** A usable stroke width: finite and not negative, else none. */
const strokeWidthOf = (sw: number): number =>
  Number.isFinite(sw) ? Math.max(0, sw) : 0;

/**
    How far a hairline loop reaches past the edge of a node of radius `r`:
    a little more than the radius, and at least 10 pixels. A stroked loop
    is sized from it (see `selfLoopGeometry`).
*/
export function selfLoopReach(r: number): number {
  return Math.max((Number.isFinite(r) ? r : 0) * 1.25, 10);
}

/**
    How far a loop's outer edge reaches past its node's edge, for a loop of
    `reach` (see `selfLoopReach`) drawn with a `strokeWidth` stroke.
*/
export function selfLoopExtent(reach: number, strokeWidth = 0): number {
  return selfLoopOpening(reach, strokeWidth) + strokeWidthOf(strokeWidth);
}

/**
    How far a loop's opening (inside its stroke) reaches past its node's
    edge: a hairline loop's `reach`, plus one stroke width, so the opening
    grows with the stroke and the arrowhead (which grows with the stroke
    too) leaves it clear. The loop's line sits half a stroke further out.
*/
export function selfLoopOpening(reach: number, strokeWidth = 0): number {
  return Math.max(0, reach) + strokeWidthOf(strokeWidth);
}

/** The widest a loop's ends spread on its node, either side of its direction (radians). */
const MAX_END_ANGLE = 1.2;

/**
    The loop's four Bézier points, pointing along `angle` from `node`. The
    opening's edge is a hairline loop reaching `selfLoopOpening` past the
    node: its ends sit on the node's edge, close enough together for that
    reach, and its control points put its middle that far out. The loop's
    line runs half a stroke outside it all round (its ends further apart
    along the node's edge, its middle and sides further out), so the
    stroke's inner edge follows the opening rather than closing it.
*/
function loopPoints(
  node: LoopNode,
  angle: number,
  reach: number,
  strokeWidth = 0,
): [Point, Point, Point, Point] {
  const r = Math.max(0, node.r || 0);
  const half = strokeWidthOf(strokeWidth) / 2;
  const opening = selfLoopOpening(reach, strokeWidth);
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  // Across the loop: from its source side to its target side.
  const vx = -uy;
  const vy = ux;
  // The opening's half-angle between its two ends on the node's edge.
  const s =
    r > 0 ? Math.min(0.5, Math.asin(Math.min(1, (opening * 0.3) / r))) : 0;
  const hairAcross = r * Math.sin(s);
  // The line's ends, half a stroke further apart on each side.
  const end =
    r > 0
      ? Math.min(MAX_END_ANGLE, Math.asin(Math.min(1, (hairAcross + half) / r)))
      : 0;
  const along = r * Math.cos(end);
  const across = r * Math.sin(end);
  // Control points far enough out that the curve's middle is half a stroke past the opening.
  const far = (8 * (r + opening + half) - 2 * along) / 6;
  // 1.5× the offset at the control points moves the curve's sides out by about the offset.
  const wide = opening * 0.8 + hairAcross + half * 1.5;
  const at = (a: number, b: number): Point => [
    node.x + ux * a + vx * b,
    node.y + uy * a + vy * b,
  ];
  return [at(along, -across), at(far, -wide), at(far, wide), at(along, across)];
}

/**
    A loop on `node`, pointing out from it along `angle` (radians). A
    hairline loop's far point sits `reach` pixels past the node's edge. A
    loop with a `strokeWidth` stroke keeps an opening inside its stroke
    that grows with it (see `selfLoopOpening`), and its outer edge reaches
    `selfLoopExtent` past the node's edge. The loop leaves the node on one
    side of `angle` and comes back on the other, clockwise on screen.
*/
export function selfLoopGeometry(
  node: LoopNode,
  angle: number,
  reach: number,
  strokeWidth = 0,
): SelfLoopGeometry {
  const [p0, p1, p2, p3] = loopPoints(
    node,
    angle,
    Math.max(0, reach),
    strokeWidth,
  );
  const pad = strokeWidthOf(strokeWidth) / 2;
  const apexPoint = cubicPoint(p0, p1, p2, p3, 0.5);
  const end = (from: Point, to: Point): LoopPoint => {
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const len = Math.hypot(dx, dy) || 1;
    // A pixel outside the node's edge, as straight links' arrows sit.
    return {
      x: to[0] - dx / len,
      y: to[1] - dy / len,
      angle: Math.atan2(dy, dx),
    };
  };
  const samples = Array.from({length: 25}, (_, k) =>
    cubicPoint(p0, p1, p2, p3, k / 24),
  );
  const xs = samples.map(p => p[0]);
  const ys = samples.map(p => p[1]);
  return {
    d: cubicPathD([p0, p1, p2, p3]),
    apex: {x: apexPoint[0], y: apexPoint[1], angle: angle + Math.PI / 2},
    source: end(p1, p0),
    target: end(p2, p3),
    box: [
      [Math.min(...xs) - pad, Math.min(...ys) - pad],
      [Math.max(...xs) + pad, Math.max(...ys) + pad],
    ],
    angle,
    points: [p0, p1, p2, p3],
  };
}

/** How far back along a loop from its end each arrow tip sits: a pixel off the node's edge. */
const LOOP_TIP_BACK = {source: 1, target: 1};

/**
    A loop's visible stroke: along the loop to the axis of the arrowhead at
    each end that has one (`trims`, see `edgeArrowTrims`), then along the
    axis to end at the head's base (see `cubicArrowEdge`). The full
    loop stays its hit area.
*/
export function selfLoopD(
  loop: SelfLoopGeometry,
  trims: EdgeArrowTrims,
): string {
  if (!trims.ends.source && !trims.ends.target) return loop.d;
  return cubicArrowEdge(loop.points, trims, LOOP_TIP_BACK).d;
}

/**
    The angle (radians) a loop on `node` covers, seen from the node's center,
    stroke included, with a little air either side: how much of the turn
    around the node it takes in a fan.
*/
export function selfLoopSpread(
  node: LoopNode,
  reach: number,
  strokeWidth = 0,
): number {
  const local = {x: 0, y: 0, r: node.r};
  const sw = strokeWidthOf(strokeWidth);
  const [p0, p1, p2, p3] = loopPoints(local, 0, Math.max(0, reach), sw);
  let half = 0;
  for (let k = 0; k <= 24; k++) {
    const [x, y] = cubicPoint(p0, p1, p2, p3, k / 24);
    half = Math.max(half, Math.abs(Math.atan2(y, x)));
  }
  const stroke = Math.atan2(sw / 2, Math.max(0, node.r) + reach / 2);
  // A little air between neighbors.
  return (half + stroke) * 2 * 1.1;
}

/**
    The directions for a fan of loops on one node, one per entry in
    `spreads` (each the angle its loop covers, see `selfLoopSpread`), in
    order around the node: neighbors sit half of each one's spread apart,
    and the fan is centered on `angle`. When the fan needs more than a full
    turn, every gap shrinks in proportion so the fan closes into one turn.
*/
export function selfLoopAngles(
  angle: number,
  spreads: readonly number[],
): number[] {
  const count = spreads.length;
  if (!count) return [];
  const gaps = spreads.slice(1).map((s, k) => (spreads[k] + s) / 2);
  const span = gaps.reduce((sum, g) => sum + g, 0);
  // The whole turn the fan would take, closing back round to its first loop.
  const ring = span + (spreads[0] + spreads[count - 1]) / 2;
  const scale = count > 1 && ring > Math.PI * 2 ? (Math.PI * 2) / ring : 1;
  let at = angle - (span * scale) / 2;
  return spreads.map((_, k) => {
    if (k) at += gaps[k - 1] * scale;
    return at;
  });
}

/**
    The positions in a fan of `count`, from its middle outward: the middle
    first, then alternating to either side.
*/
export function fanOrder(count: number): number[] {
  const mid = Math.floor((count - 1) / 2);
  const out: number[] = [];
  for (let k = 0; out.length < count; k++) {
    const offset = k % 2 ? (k + 1) / 2 : -k / 2;
    const slot = mid + offset;
    if (slot >= 0 && slot < count) out.push(slot);
  }
  return out;
}

/**
    The direction (radians) out of `origin` with the most room: the middle of
    the widest gap between the directions to `points` (one point leaves the
    whole turn, so the loop points straight away from it). Points on `origin`
    are ignored; with none left, `fallback`.
*/
export function widestGapAngle(
  origin: [number, number],
  points: readonly [number, number][],
  fallback: number,
): number {
  const angles = points
    .filter(p => p[0] !== origin[0] || p[1] !== origin[1])
    .map(p => Math.atan2(p[1] - origin[1], p[0] - origin[0]))
    .sort((a, b) => a - b);
  if (!angles.length) return fallback;
  let best = Math.PI * 2 - (angles[angles.length - 1] - angles[0]);
  let start = angles[angles.length - 1];
  for (let k = 1; k < angles.length; k++) {
    const gap = angles[k] - angles[k - 1];
    if (gap > best + 1e-9) {
      best = gap;
      start = angles[k - 1];
    }
  }
  const mid = start + best / 2;
  return Math.atan2(Math.sin(mid), Math.cos(mid));
}

/**
    The direction (radians) pointing from `center` out through `point`, or
    `fallback` (straight up by default) when they coincide.
*/
export function awayFromAngle(
  point: [number, number],
  center: [number, number],
  fallback = -Math.PI / 2,
): number {
  const dx = point[0] - center[0];
  const dy = point[1] - center[1];
  return dx || dy ? Math.atan2(dy, dx) : fallback;
}

/**
    Lays out a set of loops: every node's loops share one hairline size (the
    largest `reach` among them), each stroked by its own `strokeWidth`, and
    fan out around the node's direction so they don't draw over each other,
    the heaviest in the middle. Each loop takes as much of the fan as its
    own stroke needs.
    @param loops The loops, each a link from a node to itself.
    @param opts `node` gives a loop's node (with an `id`), `angle` the
    direction a node's loops point, `reach` how far a hairline loop reaches,
    and `strokeWidth` (optional) its stroke.
*/
export function layoutSelfLoops<L>(
  loops: readonly L[],
  opts: {
    node: (loop: L) => LoopNode & {id: string};
    angle: (node: LoopNode & {id: string}) => number;
    reach: (loop: L) => number;
    strokeWidth?: (loop: L) => number;
  },
): Map<L, SelfLoopGeometry> {
  const byNode = new Map<string, L[]>();
  for (const loop of loops) {
    const id = opts.node(loop).id;
    if (!byNode.has(id)) byNode.set(id, []);
    byNode.get(id)!.push(loop);
  }
  const out = new Map<L, SelfLoopGeometry>();
  for (const group of byNode.values()) {
    const node = opts.node(group[0]);
    if (![node.x, node.y].every(Number.isFinite)) continue;
    const reach = Math.max(...group.map(l => opts.reach(l)));
    // The heaviest loop takes the middle of the fan, where the most room is.
    const heaviest = group
      .map((loop, k) => ({
        loop,
        k,
        w: strokeWidthOf(opts.strokeWidth?.(loop) ?? 0),
      }))
      .sort((a, b) => b.w - a.w || a.k - b.k);
    const slots = fanOrder(group.length);
    const bySlot = new Array<(typeof heaviest)[number]>(group.length);
    heaviest.forEach((entry, k) => (bySlot[slots[k]] = entry));
    const angles = selfLoopAngles(
      opts.angle(node),
      bySlot.map(({w}) => selfLoopSpread(node, reach, w)),
    );
    bySlot.forEach(({loop, w}, slot) =>
      out.set(loop, selfLoopGeometry(node, angles[slot], reach, w)),
    );
  }
  return out;
}

/** The union of two boxes. */
export function unionBox(a: FocusBox, b: FocusBox): FocusBox {
  return [
    [Math.min(a[0][0], b[0][0]), Math.min(a[0][1], b[0][1])],
    [Math.max(a[1][0], b[1][0]), Math.max(a[1][1], b[1][1])],
  ];
}

/**
    Arrowheads for a loop at the ends `arrows` selects: at its target end
    where it comes back into the node, at its source end where it leaves,
    each aimed along the loop's chord from its base to its tip.
*/
export function selfLoopArrows(opts: {
  arrows: ArrowValue;
  arrowSize: unknown;
  strokeWidth?: number;
  datum: DataPoint;
  i: number;
  keyPrefix: string;
  fill?: string;
  loop: SelfLoopGeometry;
}): SceneNode[] {
  const trims = edgeArrowTrims(opts);
  if (!trims.ends.source && !trims.ends.target) return [];
  return chordArrowNodes({
    ends: cubicArrowEdge(opts.loop.points, trims, LOOP_TIP_BACK),
    size: trims.size,
    datum: opts.datum,
    keyPrefix: opts.keyPrefix,
    fill: opts.fill,
  });
}
