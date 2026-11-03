/**
    Pure geometry for Sankey's circular links: the links that loop back into
    a node they left (see `sankeyAcyclicLinks`), drawn as bands that leave
    the source's right side, turn up (or down), run along a lane above (or
    below) every node, and turn back into the target's left side.
*/

import {segmentMidpoint} from "../features/linkLabelGeometry.js";
import type {LinkAnchor} from "../features/linkLabelGeometry.js";

/** Which side of the nodes a circular link's lane runs along. */
export type CircularSide = "top" | "bottom";

/** A laid-out node, as the circular layout reads it. */
export interface CircularNode {
  layer: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** A circular link, as the circular layout reads it. */
export interface CircularLinkInput {
  index: number;
  source: CircularNode;
  target: CircularNode;
  value: number;
  /** The band's width, in pixels. */
  width: number;
}

/** Where a circular link's lane and legs sit, from `circularLanes`. */
export interface CircularLane {
  /** The total width of the lanes between this one and the nodes. */
  depth: number;
  /** The radius of the band's turns at its source, past the bands inside it. */
  arcSource: number;
  arcTarget: number;
  /** How far right of the source's right edge the band's leg runs. */
  legSource: number;
  /** How far left of the target's left edge the band's leg runs. */
  legTarget: number;
}

/** A circular link's drawn band, from `circularLinkShape`. */
export interface CircularShape {
  side: CircularSide;
  /** The source's right edge, and where the band leaves it. */
  xs: number;
  sy: number;
  /** The target's left edge, and where the band enters it. */
  xt: number;
  ty: number;
  /** The lane's center line. */
  laneY: number;
  /** The x of the band's leg past the source, and the radius of its turns. */
  xr: number;
  rs: number;
  /** The x of the band's leg before the target, and the radius of its turns. */
  xl: number;
  rt: number;
}

/** The corner radius of the innermost band's turns, past half its width. */
export const CIRCULAR_RADIUS = 8;
/** The gap between the nodes and the innermost lane, in pixels. */
export const CIRCULAR_CLEARANCE = 12;

/**
    Which side a circular link's lane runs along: above the nodes when the
    middle of its two ends sits in the upper half of the nodes' extent
    (`top` to `bottom`), else below. Each return band stays on the half of
    the chart its ends are on, so its legs are short and it crosses as few
    other bands as it can.
*/
export function circularLinkSide(
  link: Pick<CircularLinkInput, "source" | "target">,
  top: number,
  bottom: number,
): CircularSide {
  const {source: s, target: t} = link;
  const middle = (s.y0 + s.y1 + t.y0 + t.y1) / 4;
  return middle <= (top + bottom) / 2 ? "top" : "bottom";
}

/** How many columns a circular link's lane spans (0 for a link to itself). */
const span = (l: CircularLinkInput): number =>
  Math.abs(l.source.layer - l.target.layer);

/**
    Orders one side's circular links from the innermost lane (closest to the
    nodes) outward: shorter spans first, so short loops nest inside long
    ones; then links nearer that side (higher, for the top) first, so a
    band never turns across the bands that leave above it; then heavier
    first, then in the order given. The order is the links' stacking at
    each node too: an inner band attaches closer to the node's edge.
*/
export function circularLinkOrder<L extends CircularLinkInput>(
  links: readonly L[],
  side: CircularSide,
): L[] {
  const near = side === "top" ? 1 : -1;
  const edge = (n: CircularNode) => (side === "top" ? n.y0 : n.y1);
  return links
    .slice()
    .sort(
      (a, b) =>
        span(a) - span(b) ||
        near * (edge(a.source) - edge(b.source)) ||
        near * (edge(a.target) - edge(b.target)) ||
        b.value - a.value ||
        a.index - b.index,
    );
}

/**
    Each circular link's lane and legs, for one side's links in the order of
    `circularLinkOrder`. The legs leaving (or entering) one column nest,
    each turning around the ones inside it. A lane sits outside every
    earlier lane it would run into: one whose band, legs included, spans
    some of the same width of the chart.
    @param links One side's links, innermost first.
    @param stub How far each band runs straight from its node before it
    turns, to hold an arrowhead.
    @param columnX Where a column's nodes sit across: their left and right
    edges.
*/
export function circularLanes(
  links: readonly CircularLinkInput[],
  stub: number,
  columnX: (layer: number) => readonly [number, number],
): CircularLane[] {
  const inside = {source: new Map<number, number>(), target: new Map()};
  const arc = (end: "source" | "target", l: CircularLinkInput) => {
    const layer = l[end].layer;
    const before = inside[end].get(layer) ?? 0;
    inside[end].set(layer, before + l.width);
    return CIRCULAR_RADIUS + before + l.width / 2;
  };
  const lanes: CircularLane[] = links.map(l => {
    const arcSource = arc("source", l);
    const arcTarget = arc("target", l);
    return {
      depth: 0,
      arcSource,
      arcTarget,
      legSource: stub + arcSource,
      legTarget: stub + arcTarget,
    };
  });
  // Where each band reaches across, from its target's leg to its source's.
  const spans = links.map((l, k) => {
    const right = columnX(l.source.layer)[1] + lanes[k].legSource;
    const left = columnX(l.target.layer)[0] - lanes[k].legTarget;
    const half = l.width / 2;
    return [Math.min(left, right) - half, Math.max(left, right) + half];
  });
  links.forEach((l, k) => {
    for (let j = 0; j < k; j++)
      if (spans[j][0] < spans[k][1] && spans[k][0] < spans[j][1])
        lanes[k].depth = Math.max(
          lanes[k].depth,
          lanes[j].depth + links[j].width,
        );
  });
  return lanes;
}

/** The margins the circular links' lanes and legs need around the nodes. */
export interface CircularReserve {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
    The space the circular links need outside the nodes: above and below
    for their lanes, and beside the first and last columns for their legs.
    @param sides Each side's links (in the order of `circularLinkOrder`)
    and their lanes.
    @param lastLayer The index of the last column.
*/
export function circularReserve(
  sides: readonly {
    side: CircularSide;
    links: readonly CircularLinkInput[];
    lanes: readonly CircularLane[];
  }[],
  lastLayer: number,
): CircularReserve {
  const out = {top: 0, right: 0, bottom: 0, left: 0};
  for (const {side, links, lanes} of sides) {
    links.forEach((l, k) => {
      const lane = lanes[k];
      const reach = CIRCULAR_CLEARANCE + lane.depth + l.width;
      out[side] = Math.max(out[side], reach);
      if (l.source.layer === lastLayer)
        out.right = Math.max(out.right, lane.legSource + l.width / 2);
      if (l.target.layer === 0)
        out.left = Math.max(out.left, lane.legTarget + l.width / 2);
    });
  }
  return out;
}

/**
    A circular link's band: where it leaves its source (`y0`) and enters
    its target (`y1`), its legs, and its lane, which runs `CIRCULAR_CLEARANCE`
    plus its lane's `depth` outside `edge` (the top of the highest node, or
    the bottom of the lowest). Each turn's radius is its arc, or less where
    the band's leg is too short for two.
*/
export function circularLinkShape(
  link: CircularLinkInput & {y0: number; y1: number},
  lane: CircularLane,
  side: CircularSide,
  edge: number,
): CircularShape {
  const dir = side === "top" ? -1 : 1;
  const laneY = edge + dir * (CIRCULAR_CLEARANCE + lane.depth + link.width / 2);
  const sy = link.y0;
  const ty = link.y1;
  return {
    side,
    xs: link.source.x1,
    sy,
    xt: link.target.x0,
    ty,
    laneY,
    xr: link.source.x1 + lane.legSource,
    rs: Math.max(0, Math.min(lane.arcSource, Math.abs(sy - laneY) / 2)),
    xl: link.target.x0 - lane.legTarget,
    rt: Math.max(0, Math.min(lane.arcTarget, Math.abs(ty - laneY) / 2)),
  };
}

/** The cubic Bézier curve's share of a quarter circle's radius at its handles. */
const kappa = 0.5523;
const round = (n: number): number => Math.round(n * 100) / 100;

/**
    A circular link's band as a path from its source to its target, made of
    straight runs and quarter turns. `trimSource` and `trimTarget` start and
    end it that far from the nodes, along its straight ends.
*/
export function circularLinkD(
  shape: CircularShape,
  trimSource = 0,
  trimTarget = 0,
): string {
  const {xs, sy, xt, ty, laneY, xr, rs, xl, rt} = shape;
  const dir = shape.side === "top" ? -1 : 1;
  const at = (x: number, y: number) => `${round(x)},${round(y)}`;
  /** A quarter turn from `a`, heading `u`, to `b`, heading `v`. */
  const turn = (
    a: [number, number],
    u: [number, number],
    b: [number, number],
    v: [number, number],
    r: number,
  ) =>
    `L${at(...a)}C${at(a[0] + u[0] * kappa * r, a[1] + u[1] * kappa * r)} ${at(
      b[0] - v[0] * kappa * r,
      b[1] - v[1] * kappa * r,
    )} ${at(...b)}`;
  return [
    `M${at(xs + trimSource, sy)}`,
    turn([xr - rs, sy], [1, 0], [xr, sy + dir * rs], [0, dir], rs),
    turn([xr, laneY - dir * rs], [0, dir], [xr - rs, laneY], [-1, 0], rs),
    turn([xl + rt, laneY], [-1, 0], [xl, laneY - dir * rt], [0, -dir], rt),
    turn([xl, ty + dir * rt], [0, -dir], [xl + rt, ty], [1, 0], rt),
    `L${at(xt - trimTarget, ty)}`,
  ].join("");
}

/** The middle of a circular link's lane, where its label goes. */
export function circularLinkAnchor(shape: CircularShape): LinkAnchor {
  return segmentMidpoint(
    [shape.xr - shape.rs, shape.laneY],
    [shape.xl + shape.rt, shape.laneY],
  );
}

/**
    The value a node is sized by: the larger of the flow leaving it and the
    flow entering it, counting circular links too.
    @param i The node's index.
    @param links Every link Sankey draws, with node indices for ends.
*/
export function sankeyNodeValue(
  i: number,
  links: readonly {source: number; target: number; value: number}[],
): number {
  let out = 0;
  let into = 0;
  for (const l of links) {
    const v = Number.isFinite(l.value) ? l.value : 0;
    if (l.source === i) out += v;
    if (l.target === i) into += v;
  }
  return Math.max(out, into);
}

/**
    Moves where links meet each node to make room for its circular links:
    those whose lanes run above stack down from the node's top (innermost
    first), the node's other links follow below them, and those whose lanes
    run below stack up from its bottom. Sets each circular link's `y0`
    (where it leaves its source) and `y1` (where it enters its target), and
    shifts the other links' ends down past the circular links above them.
    @param sides Each side's circular links, in the order of `circularLinkOrder`.
    @param links The other links, with the ends the layout gave them.
*/
export function stackCircularEnds<
  N extends {y0: number; y1: number},
  C extends {source: N; target: N; width: number; y0?: number; y1?: number},
>(
  sides: readonly {side: CircularSide; links: readonly C[]}[],
  links: readonly {source: N; target: N; y0: number; y1: number}[],
): void {
  const above = {source: new Map<N, number>(), target: new Map<N, number>()};
  const below = {source: new Map<N, number>(), target: new Map<N, number>()};
  for (const {side, links: circular} of sides) {
    const taken = side === "top" ? above : below;
    for (const l of circular) {
      for (const end of ["source", "target"] as const) {
        const node = l[end];
        const before = taken[end].get(node) ?? 0;
        taken[end].set(node, before + l.width);
        const {y0, y1} = node;
        const y =
          side === "top"
            ? y0 + before + l.width / 2
            : y1 - before - l.width / 2;
        if (end === "source") l.y0 = y;
        else l.y1 = y;
      }
    }
  }
  for (const l of links) {
    l.y0 += above.source.get(l.source) ?? 0;
    l.y1 += above.target.get(l.target) ?? 0;
  }
}
