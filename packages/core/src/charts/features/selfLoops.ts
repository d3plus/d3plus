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
  /** The box the loop covers. */
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

/**
    How far a loop reaches past the edge of a node of radius `r`: a little
    more than the radius, at least 10 pixels, plus room for the loop's
    stroke so a heavy loop keeps its hole.
*/
export function selfLoopReach(r: number, strokeWidth = 1): number {
  const sw = Number.isFinite(strokeWidth) ? Math.max(0, strokeWidth) : 1;
  return Math.max((Number.isFinite(r) ? r : 0) * 1.25, 10) + sw * 1.5;
}

/** The loop's four Bézier points, pointing along `angle` from `node`. */
function loopPoints(
  node: LoopNode,
  angle: number,
  reach: number,
): [Point, Point, Point, Point] {
  const r = Math.max(0, node.r || 0);
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  // Across the loop: from its source side to its target side.
  const vx = -uy;
  const vy = ux;
  // The half-angle between the loop's two ends on the node's edge.
  const s =
    r > 0 ? Math.min(0.5, Math.asin(Math.min(1, (reach * 0.3) / r))) : 0;
  const along = r * Math.cos(s);
  const across = r * Math.sin(s);
  // Control points far enough out that the curve's middle is `reach` past the edge.
  const far = (8 * (r + reach) - 2 * along) / 6;
  const wide = reach * 0.8 + across;
  const at = (a: number, b: number): Point => [
    node.x + ux * a + vx * b,
    node.y + uy * a + vy * b,
  ];
  return [at(along, -across), at(far, -wide), at(far, wide), at(along, across)];
}

/**
    A loop on `node`, pointing out from it along `angle` (radians), whose far
    point sits `reach` pixels past the node's edge. The loop leaves the node
    on one side of `angle` and comes back on the other, clockwise on screen.
*/
export function selfLoopGeometry(
  node: LoopNode,
  angle: number,
  reach: number,
): SelfLoopGeometry {
  const [p0, p1, p2, p3] = loopPoints(node, angle, Math.max(0, reach));
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
      [Math.min(...xs), Math.min(...ys)],
      [Math.max(...xs), Math.max(...ys)],
    ],
    angle,
    points: [p0, p1, p2, p3],
  };
}

/** How far back along a loop from its end each arrow tip sits: a pixel off the node's edge. */
const LOOP_TIP_BACK = {source: 1, target: 1};

/**
    A loop's visible stroke: along the loop up to the base of the arrowhead
    at each end that has one (`trims`, see `edgeArrowTrims`), then straight
    along the head's axis to end inside it (see `cubicArrowEdge`). The full
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
    stroke included: how far apart two loops on the node point so they
    don't overlap.
*/
export function selfLoopSpread(
  node: LoopNode,
  reach: number,
  strokeWidth = 0,
): number {
  const local = {x: 0, y: 0, r: node.r};
  const [p0, p1, p2, p3] = loopPoints(local, 0, Math.max(0, reach));
  let half = 0;
  for (let k = 0; k <= 24; k++) {
    const [x, y] = cubicPoint(p0, p1, p2, p3, k / 24);
    half = Math.max(half, Math.abs(Math.atan2(y, x)));
  }
  const stroke = Math.atan2(
    Math.max(0, strokeWidth) / 2,
    Math.max(0, node.r) + reach / 2,
  );
  // A little air between neighbors.
  return (half + stroke) * 2 * 1.1;
}

/**
    The directions for `count` loops on one node: centered on `angle`,
    `spread` radians apart, or evenly around the node when they need more
    than a full turn.
*/
export function selfLoopAngles(
  angle: number,
  count: number,
  spread: number,
): number[] {
  if (count <= 0) return [];
  const step = Math.min(spread, (Math.PI * 2) / count);
  return Array.from(
    {length: count},
    (_, k) => angle + (k - (count - 1) / 2) * step,
  );
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
    Lays out a set of loops: every node's loops share one size (the largest
    `reach` among them), and fan out around the node's direction so they
    don't draw over each other, the heaviest in the middle.
    @param loops The loops, each a link from a node to itself.
    @param opts `node` gives a loop's node (with an `id`), `angle` the
    direction a node's loops point, `reach` how far a loop reaches, and
    `strokeWidth` (optional) its stroke.
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
    const stroke = Math.max(0, ...group.map(l => opts.strokeWidth?.(l) ?? 0));
    const angles = selfLoopAngles(
      opts.angle(node),
      group.length,
      selfLoopSpread(node, reach, stroke),
    );
    // The heaviest loop takes the middle of the fan, where the most room is.
    const heaviest = group
      .map((loop, k) => ({loop, k, w: opts.strokeWidth?.(loop) ?? 0}))
      .sort((a, b) => b.w - a.w || a.k - b.k);
    const slots = fanOrder(group.length);
    heaviest.forEach(({loop}, k) =>
      out.set(loop, selfLoopGeometry(node, angles[slots[k]], reach)),
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
