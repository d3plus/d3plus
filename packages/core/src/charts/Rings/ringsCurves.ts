/**
    Rings' curved links between ring nodes: a link across rings bends
    through the gap between them, and a link along one ring arcs out to
    the middle of the gap outside it.

    @module
*/
import type {RingsEdge} from "./ringsGraph.js";
import type {RingGeometry} from "./ringsSizing.js";

type Point = [number, number];
type EndKey = "source" | "target";

/** The radius of ring `k` (1 innermost) in `geom`, also past the last ring. */
export const ringRadius = (geom: RingGeometry, k: number): number =>
  geom.primaryRing + geom.ringWidth * (k - 1);

/** The radius halfway between ring `k` and the ring (or spacing) outside it. */
export const gapMiddle = (geom: RingGeometry, k: number): number =>
  ringRadius(geom, k) + (ringRadius(geom, k + 1) - ringRadius(geom, k)) * 0.5;

/** How many points along a curve `cubicReach` measures. */
const REACH_STEPS = 128;

/** The farthest from `c` the cubic from `p0` to `p3` with control points `c1` and `c2` reaches. */
export function cubicReach(
  p0: Point,
  c1: Point,
  c2: Point,
  p3: Point,
  c: Point,
): number {
  let far = 0;
  for (let i = 0; i <= REACH_STEPS; i++) {
    const t = i / REACH_STEPS;
    const s = 1 - t;
    const a = s * s * s,
      b = 3 * s * s * t,
      d = 3 * s * t * t,
      e = t * t * t;
    const x = a * p0[0] + b * c1[0] + d * c2[0] + e * p3[0];
    const y = a * p0[1] + b * c1[1] + d * c2[1] + e * p3[1];
    far = Math.max(far, Math.hypot(x - c[0], y - c[1]));
  }
  return far;
}

/**
    How far from `c`, along the unit `u`, to put both control points of a
    cubic from `p0` to `p3` for it to reach `reach` from `c` at its
    farthest: a single arch toward `u`.
*/
export function archControl(
  p0: Point,
  p3: Point,
  u: Point,
  reach: number,
  c: Point,
): number {
  const at = (rho: number) => {
    const ctrl: Point = [c[0] + u[0] * rho, c[1] + u[1] * rho];
    return cubicReach(p0, ctrl, ctrl, p3, c);
  };
  let lo = 0;
  let hi = Math.max(1, reach);
  for (let i = 0; i < 30 && at(hi) < reach; i++) hi *= 2;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (at(mid) < reach) lo = mid;
    else hi = mid;
  }
  return hi;
}

/**
    Whether a link between two nodes on ring `ring` arcs out to the middle of
    the gap outside it. The two-ring chart's first-ring links keep their
    bend through that gap at the nodes' angles.
*/
const arcsOut = (geom: RingGeometry, ring: number) =>
  !(geom.rings.length === 2 && ring === 1);

/**
    Sets a link's curve between two ring nodes. Across rings, it leaves each
    node on the side facing the other's ring and bends through the middle of
    the gap between them. Along one ring, it leaves both nodes on their
    outer side and arches out over the arc between them, reaching at its
    farthest the middle of the gap outside that ring (half a spacing out
    past the last ring).
*/
export function curveRingsEdge(edge: RingsEdge, geom: RingGeometry): void {
  const {width, height} = geom;
  const inner = Math.min(edge.source.ring!, edge.target.ring!);
  const middleRing = gapMiddle(geom, inner);
  edge.spline = true;
  const ends: EndKey[] = ["source", "target"];
  ends.forEach(endKey => {
    const endNode = edge[endKey];
    const endRadians = endNode.radians as number;
    const rotated = endNode.ring! > inner ? endRadians + Math.PI : endRadians;
    const r = endNode.r as number;
    edge[`${endKey}X` as const] = (endNode.x as number) + Math.cos(rotated) * r;
    edge[`${endKey}Y` as const] = (endNode.y as number) + Math.sin(rotated) * r;
    edge[`${endKey}BisectX` as const] =
      width / 2 + middleRing * Math.cos(endRadians);
    edge[`${endKey}BisectY` as const] =
      height / 2 + middleRing * Math.sin(endRadians);
  });
  if (edge.source.ring !== edge.target.ring || !arcsOut(geom, inner)) return;

  // Both control points sit out along the middle of the shorter arc
  // between the nodes, as far as the arch needs to reach the gap's middle.
  const a = edge.source.radians as number;
  const turn = Math.atan2(
    Math.sin((edge.target.radians as number) - a),
    Math.cos((edge.target.radians as number) - a),
  );
  const mid = a + turn / 2;
  const u: Point = [Math.cos(mid), Math.sin(mid)];
  const c: Point = [width / 2, height / 2];
  const rho = archControl(
    [edge.sourceX!, edge.sourceY!],
    [edge.targetX!, edge.targetY!],
    u,
    middleRing,
    c,
  );
  edge.sourceBisectX = edge.targetBisectX = c[0] + u[0] * rho;
  edge.sourceBisectY = edge.targetBisectY = c[1] + u[1] * rho;
}
