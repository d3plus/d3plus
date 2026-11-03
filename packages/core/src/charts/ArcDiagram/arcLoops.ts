/**
    ArcDiagram's loops: a link from a node to itself draws as a small loop on
    the arcs' side of the line, pointing straight out from it.
*/

import {
  layoutSelfLoops,
  selfLoopExtent,
  selfLoopReach,
} from "../features/selfLoops.js";
import type {LinkDatum} from "../features/linkInteraction.js";
import type {ArcLink, ArcNode} from "./applyLayout.js";
import type {ArcOrient, ArcSide} from "./arcGeometry.js";

/** The side of the line a node's loops take: the arcs' side ("above" with `"both"`). */
export function loopSide(side: ArcSide): "above" | "below" {
  return side === "below" ? "below" : "above";
}

/**
    How far a hairline loop on a node of radius `r` reaches out from it: as
    a Network loop does (see `selfLoopReach`), and at least 30% of the
    `spacing` between nodes (up to 40 pixels), so it reads at a glance. Its
    stroke grows outward from there (see `selfLoopGeometry`).
*/
export function arcLoopReach(r: number, spacing: number): number {
  return Math.max(selfLoopReach(r), Math.min(Math.max(0, spacing) * 0.3, 40));
}

/** The direction (radians) loops point on `side` of a line running `orient`. */
export function loopAngle(side: "above" | "below", orient: ArcOrient): number {
  if (orient === "vertical") return side === "above" ? 0 : Math.PI;
  return side === "above" ? -Math.PI / 2 : Math.PI / 2;
}

/**
    The laid-out loops (links from a node to themselves), on the arcs' side
    of the line, pointing straight out from it. A node's loops fan out side
    by side.
*/
export function placeLoops(
  loops: {index: number; datum: LinkDatum; size: number; id: string}[],
  nodes: ArcNode[],
  geometry: {
    base: number;
    scale: number;
    orient: ArcOrient;
    side: "above" | "below";
    spacing: number;
  },
): ArcLink[] {
  const {spacing, ...arc} = geometry;
  const nodeById = new Map(nodes.map(n => [n.id, n]));
  const known = loops.filter(l => nodeById.has(l.id));
  const placed = layoutSelfLoops(known, {
    node: l => nodeById.get(l.id)!,
    angle: () => loopAngle(geometry.side, geometry.orient),
    reach: l => arcLoopReach(nodeById.get(l.id)!.r, spacing),
    strokeWidth: l => l.size,
  });
  return known.flatMap(l => {
    const node = nodeById.get(l.id)!;
    const loop = placed.get(l);
    if (!loop) return [];
    const at = geometry.orient === "horizontal" ? node.x : node.y;
    return [
      {
        datum: l.datum,
        source: node,
        target: node,
        size: l.size,
        index: l.index,
        arc: {...arc, from: at, to: at},
        d: loop.d,
        loop,
      },
    ];
  });
}

/**
    How far the loops reach out from the line, past their nodes' centers,
    on each side (all of them sit on `loopSide(side)`).
    @param loops Each loop's node id and stroke width.
    @param radii Each node's radius, by id.
*/
export function arcLoopRoom(
  loops: readonly {id: string; size: number}[],
  radii: ReadonlyMap<string, number>,
  spacing: number,
  side: ArcSide,
): {above: number; below: number} {
  let room = 0;
  for (const l of loops) {
    const r = radii.get(l.id) ?? 0;
    room = Math.max(room, r + selfLoopExtent(arcLoopReach(r, spacing), l.size));
  }
  return loopSide(side) === "above"
    ? {above: room, below: 0}
    : {above: 0, below: room};
}
