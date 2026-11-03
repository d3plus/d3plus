/**
    Rings' parallel links: several links between the same two nodes, in
    either direction. Each node takes one place on its ring however many
    links reach it, and the links fan out as curves bowed either side of
    the line between their nodes, so each stays its own mark.
*/

import {LINK_HIT_WIDTH} from "../features/linkInteraction.js";
import type {RingsEdge, RingsNode} from "./ringsGraph.js";

type Point = {x: number; y: number; r?: number};
type Placed = RingsNode & {x: number; y: number};

/** The node at the other end of `edge` from the node `id`. */
const otherEnd = (edge: RingsEdge, id: string): RingsNode =>
  edge.source.id === id ? edge.target : edge.source;

/** `edges` from the node `id`, keeping only the first to each other node. */
export function firstPerNeighbor(
  edges: readonly RingsEdge[],
  id: string,
): RingsEdge[] {
  const seen = new Set<string>();
  return edges.filter(edge => {
    const other = otherEnd(edge, id).id;
    if (seen.has(other)) return false;
    seen.add(other);
    return true;
  });
}

/** The edges among `edges` between the node `id` and the node `otherId`. */
export const edgesBetween = (
  edges: readonly RingsEdge[],
  id: string,
  otherId: string,
): RingsEdge[] => edges.filter(edge => otherEnd(edge, id).id === otherId);

/** How far apart, at their middles, `n` parallel links sit, centered on the line: `[-step/2, step/2]` for two. */
export const parallelOffsets = (n: number, step: number): number[] =>
  Array.from({length: n}, (_, k) => (k - (n - 1) / 2) * step);

/**
    The point on the rim of `node` (centered on `node`, through `p`) moved
    `e` pixels along the unit `normal`, keeping to the side of the center
    `p` is on. It slides at most 90% of the radius out, and a node with no
    radius keeps `p`.
*/
export function slideOnRim(
  node: Point,
  p: [number, number],
  normal: [number, number],
  e: number,
): [number, number] {
  const vx = p[0] - node.x;
  const vy = p[1] - node.y;
  const r = Math.hypot(vx, vy);
  if (!r) return p;
  const along: [number, number] = [normal[1], -normal[0]];
  const limit = r * 0.9;
  const a = Math.max(
    -limit,
    Math.min(limit, vx * normal[0] + vy * normal[1] + e),
  );
  const side = vx * along[0] + vy * along[1] < 0 ? -1 : 1;
  const b = side * Math.sqrt(r * r - a * a);
  return [
    node.x + normal[0] * a + along[0] * b,
    node.y + normal[1] * a + along[1] * b,
  ];
}

/** How far out, as a share of a parallel link's offset, its ends slide along their nodes' rims. */
const END_SHARE = 0.75;

/** How far `p` sits along the unit `normal` from `q`. */
const offsetAlong = (
  p: [number, number],
  q: [number, number],
  n: [number, number],
) => (p[0] - q[0]) * n[0] + (p[1] - q[1]) * n[1];

/**
    A straight link from `s` to `t` bowed `offset` pixels along the unit
    `normal` at its middle: a cubic across the gap between the two nodes,
    whose ends slide most of that way along each node's rim (see
    `END_SHARE`), and whose control points sit a third and two thirds of
    the way across, out as far as the rest of the bow needs.
*/
export function bowedEdge(
  s: Point,
  t: Point,
  normal: [number, number],
  offset: number,
): Required<
  Pick<
    RingsEdge,
    | "sourceX"
    | "sourceY"
    | "sourceBisectX"
    | "sourceBisectY"
    | "targetBisectX"
    | "targetBisectY"
    | "targetX"
    | "targetY"
  >
> {
  const len = Math.hypot(t.x - s.x, t.y - s.y) || 1;
  const ux = (t.x - s.x) / len;
  const uy = (t.y - s.y) / len;
  const rs = s.r ?? 0;
  const rt = t.r ?? 0;
  const e = offset * END_SHARE;
  const s0: [number, number] = [s.x + ux * rs, s.y + uy * rs];
  const t0: [number, number] = [t.x - ux * rt, t.y - uy * rt];
  const [sourceX, sourceY] = slideOnRim(s, s0, normal, e);
  const [targetX, targetY] = slideOnRim(t, t0, normal, e);
  // The middle sits halfway between the ends, plus 3/4 of the control
  // points' (equal) offset `h`.
  const ends =
    offsetAlong([sourceX, sourceY], s0, normal) +
    offsetAlong([targetX, targetY], t0, normal);
  const h = (offset - ends / 2) / 0.75;
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  return {
    sourceX,
    sourceY,
    sourceBisectX: sourceX + dx / 3 + normal[0] * h,
    sourceBisectY: sourceY + dy / 3 + normal[1] * h,
    targetBisectX: sourceX + (dx * 2) / 3 + normal[0] * h,
    targetBisectY: sourceY + (dy * 2) / 3 + normal[1] * h,
    targetX,
    targetY,
  };
}

/** Moves a curved link `offset` pixels along the unit `normal` at its middle: its ends most of that way along their rims (see `END_SHARE`), its control points the rest. */
function shiftSpline(
  edge: RingsEdge & {source: Placed; target: Placed},
  normal: [number, number],
  offset: number,
): void {
  const e = offset * END_SHARE;
  const s0: [number, number] = [edge.sourceX!, edge.sourceY!];
  const t0: [number, number] = [edge.targetX!, edge.targetY!];
  [edge.sourceX, edge.sourceY] = slideOnRim(edge.source, s0, normal, e);
  [edge.targetX, edge.targetY] = slideOnRim(edge.target, t0, normal, e);
  // Each end moves the middle an eighth as far, the control points 3/4 of `h`.
  const ends =
    offsetAlong([edge.sourceX, edge.sourceY], s0, normal) +
    offsetAlong([edge.targetX, edge.targetY], t0, normal);
  const h = (offset - ends / 8) / 0.75;
  edge.sourceBisectX! += normal[0] * h;
  edge.sourceBisectY! += normal[1] * h;
  edge.targetBisectX! += normal[0] * h;
  edge.targetBisectY! += normal[1] * h;
}

const isPlaced = (n: RingsNode): n is Placed =>
  typeof n.x === "number" && typeof n.y === "number";

/**
    Fans out each group of parallel links among `edges` (mutated in place),
    leaving a link with no parallel alone. Their middles sit a hit path's
    width (and a gap) apart, so each can be pointed at. A straight link
    becomes a bowed curve (see `bowedEdge`); a curved one moves to the side
    (see `shiftSpline`). The side follows the two nodes, not the link's
    direction, so links both ways between them fan apart too.
*/
export function fanParallelEdges(edges: readonly RingsEdge[]): void {
  const groups = new Map<string, RingsEdge[]>();
  for (const edge of edges) {
    if (edge.loop || edge.source.id === edge.target.id) continue;
    const ids = [String(edge.source.id), String(edge.target.id)].sort();
    const key = JSON.stringify(ids);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(edge);
  }
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const first = group[0];
    const [a, b] =
      String(first.source.id) < String(first.target.id)
        ? [first.source, first.target]
        : [first.target, first.source];
    if (!isPlaced(a) || !isPlaced(b)) continue;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (!len) continue;
    const normal: [number, number] = [-(b.y - a.y) / len, (b.x - a.x) / len];
    const widest = Math.max(...group.map(e => e.size ?? 1));
    const step = Math.max(LINK_HIT_WIDTH, widest + 4) + 4;
    parallelOffsets(group.length, step).forEach((offset, k) => {
      const edge = group[k] as RingsEdge & {source: Placed; target: Placed};
      if (edge.spline && edge.sourceX != null && edge.targetX != null)
        shiftSpline(edge, normal, offset);
      else {
        Object.assign(
          edge,
          bowedEdge(edge.source, edge.target, normal, offset),
        );
        edge.spline = true;
      }
    });
  }
}
