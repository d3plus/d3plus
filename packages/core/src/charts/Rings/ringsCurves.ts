/**
    Rings' curved links between ring nodes: a link across rings bends
    through the gap between them, and a link along one ring runs a little
    over a quarter of the way into the gap outside it, around that circle,
    and back in.

    @module
*/
import type {RingsEdge, RingsNode} from "./ringsGraph.js";
import type {RingGeometry} from "./ringsSizing.js";

type Point = [number, number];
/** A cubic Bézier curve: its start, two control points, and end. */
export type Cubic = [Point, Point, Point, Point];
type EndKey = "source" | "target";

/** How far a quarter circle's control points sit along its tangents, per unit of radius. */
const KAPPA = (4 / 3) * Math.tan(Math.PI / 8);

/** The radius of ring `k` (1 innermost) in `geom`, also past the last ring. */
export const ringRadius = (geom: RingGeometry, k: number): number =>
  geom.primaryRing + geom.ringWidth * (k - 1);

/** The radius halfway between ring `k` and the ring (or spacing) outside it. */
export const gapMiddle = (geom: RingGeometry, k: number): number =>
  ringRadius(geom, k) + (ringRadius(geom, k + 1) - ringRadius(geom, k)) * 0.5;

/**
    How far into the gap outside a ring a link along it runs: a little over
    a quarter, close enough to the ring that it usually turns inside the
    links leaving its nodes outward instead of crossing them.
*/
const RING_ARC_SHARE = 0.28;

/**
    The circle a link along ring `k` runs around: `RING_ARC_SHARE` of the
    way into the gap outside the ring, and clear of both nodes.
*/
export const ringArcRadius = (
  geom: RingGeometry,
  k: number,
  nodes: Pick<RingsNode, "r">[],
): number =>
  Math.max(
    ringRadius(geom, k) +
      (ringRadius(geom, k + 1) - ringRadius(geom, k)) * RING_ARC_SHARE,
    ringRadius(geom, k) + Math.max(...nodes.map(n => n.r ?? 0)) + 2,
  );

const unit = (a: number): Point => [Math.cos(a), Math.sin(a)];
const along = (p: Point, u: Point, d: number): Point => [
  p[0] + u[0] * d,
  p[1] + u[1] * d,
];

/**
    The cubics of a circular arc around `c` of `radius`, from angle `from`
    turning `sweep` radians (negative turns the other way), a quarter turn
    or less each.
*/
export function arcCubics(
  c: Point,
  radius: number,
  from: number,
  sweep: number,
): Cubic[] {
  const n = Math.max(1, Math.ceil(Math.abs(sweep) / (Math.PI / 2) - 1e-9));
  const step = sweep / n;
  const k = (4 / 3) * Math.tan(step / 4) * radius;
  return Array.from({length: n}, (_, i) => {
    const a0 = from + step * i;
    const a1 = a0 + step;
    const p0 = along(c, unit(a0), radius);
    const p3 = along(c, unit(a1), radius);
    return [
      p0,
      along(p0, unit(a0 + Math.PI / 2), k),
      along(p3, unit(a1 + Math.PI / 2), -k),
      p3,
    ];
  });
}

/**
    The curves of a link between two nodes on one ring, around the circle
    of `radius` about `c`: out from the source's outer side, turning onto
    the circle, along it the shorter way around, and back in to the
    target's outer side. Each turn takes as much of the circle as it rises
    to it (less when the nodes sit closer than that, where the two turns
    meet at the circle in a single arch).
*/
export function ringArcCubics(
  source: Pick<RingsNode, "x" | "y" | "r" | "radians">,
  target: Pick<RingsNode, "x" | "y" | "r" | "radians">,
  c: Point,
  radius: number,
): Cubic[] {
  const a = source.radians as number;
  const b = target.radians as number;
  const turn = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  const s = turn < 0 ? -1 : 1;
  const leg = (n: typeof source, angle: number) => {
    const start = along([n.x as number, n.y as number], unit(angle), n.r ?? 0);
    const rise = Math.max(
      1,
      radius - Math.hypot(start[0] - c[0], start[1] - c[1]),
    );
    const delta = Math.min(rise / radius, Math.abs(turn) / 2);
    return {start, rise, delta, side: radius * delta};
  };
  const out = leg(source, a);
  const back = leg(target, b);

  const qa = a + s * out.delta;
  const q0 = along(c, unit(qa), radius);
  const qb = b - s * back.delta;
  const curves: Cubic[] = [
    [
      out.start,
      along(out.start, unit(a), KAPPA * out.rise),
      along(q0, unit(qa + Math.PI / 2), -s * KAPPA * out.side),
      q0,
    ],
  ];
  const rest = turn - s * (out.delta + back.delta);
  if (Math.abs(rest) > 1e-6) curves.push(...arcCubics(c, radius, qa, rest));
  // The turn back in starts exactly where the path so far ends.
  const q1 = curves[curves.length - 1][3];
  curves.push([
    q1,
    along(q1, unit(qb + Math.PI / 2), s * KAPPA * back.side),
    along(back.start, unit(b), KAPPA * back.rise),
    back.start,
  ]);
  return curves;
}

/** Joined cubics as one path's `d`, unrounded like the other Rings links'. */
export const ringsSegmentsD = (curves: readonly Cubic[]): string =>
  curves
    .map(
      ([p0, c1, c2, p3], k) =>
        `${k ? "" : `M${p0[0]},${p0[1]}`}C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p3[0]},${p3[1]}`,
    )
    .join("");

/** Lays out a link along one ring around its `arc`: its `segments`, ends, and bisect points. */
export function applyRingArc(edge: RingsEdge): void {
  const {cx, cy, radius} = edge.arc!;
  const curves = ringArcCubics(edge.source, edge.target, [cx, cy], radius);
  const first = curves[0];
  const last = curves[curves.length - 1];
  edge.segments = curves;
  edge.spline = true;
  [edge.sourceX, edge.sourceY] = first[0];
  [edge.sourceBisectX, edge.sourceBisectY] = first[1];
  [edge.targetBisectX, edge.targetBisectY] = last[2];
  [edge.targetX, edge.targetY] = last[3];
}

/**
    Sets a link's curve between two ring nodes. Across rings, it leaves each
    node on the side facing the other's ring and bends through the middle of
    the gap between them. Along one ring, it runs a little over a quarter
    of the way into the gap outside that ring (or past the last ring),
    around it, and back in (see `ringArcCubics`).
*/
export function curveRingsEdge(edge: RingsEdge, geom: RingGeometry): void {
  const {width, height} = geom;
  const inner = Math.min(edge.source.ring!, edge.target.ring!);
  if (edge.source.ring === edge.target.ring) {
    const radius = ringArcRadius(geom, inner, [edge.source, edge.target]);
    edge.arc = {cx: width / 2, cy: height / 2, radius};
    applyRingArc(edge);
    return;
  }
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
}
