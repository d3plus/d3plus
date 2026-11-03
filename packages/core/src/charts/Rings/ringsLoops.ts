/**
    Rings' loops: each placed node's links to itself, drawn as loops into the
    widest gap between its drawn links and, on the rings, its label.
*/

import {
  isSelfLoop,
  layoutSelfLoops,
  selfLoopReach,
  widestGapAngle,
} from "../features/selfLoops.js";
import type {RingsEdge, RingsNode} from "./ringsGraph.js";
import type {RingGeometry} from "./ringsSizing.js";

type Placed = RingsNode & {x: number; y: number; r: number};

const isPlaced = (n: RingsNode | undefined): n is Placed =>
  !!n &&
  typeof n.x === "number" &&
  typeof n.y === "number" &&
  typeof n.r === "number";

/**
    The loops on the placed `nodes`, as edges carrying their `loop`: a
    node's loops point into the widest gap between the nodes its drawn
    `edges` reach and, for a ring node, its label (which runs out from the
    center). The center's loops stay inside the first ring.
*/
export function ringsLoops(
  links: readonly RingsEdge[],
  nodes: readonly RingsNode[],
  edges: readonly RingsEdge[],
  center: RingsNode,
  geom: RingGeometry,
): RingsEdge[] {
  const placed = new Map(
    nodes.filter(isPlaced).map(n => [n.id, n] as [string, Placed]),
  );
  const loops = links.filter(l => isSelfLoop(l) && placed.has(l.source.id));
  if (!loops.length) return [];
  const occupied = new Map<string, [number, number][]>();
  const add = (id: string, p: [number, number]) => {
    if (!occupied.has(id)) occupied.set(id, []);
    occupied.get(id)!.push(p);
  };
  for (const e of edges) {
    const s = placed.get(e.source.id);
    const t = placed.get(e.target.id);
    if (!s || !t || s === t) continue;
    add(s.id, [t.x, t.y]);
    add(t.id, [s.x, s.y]);
  }
  for (const n of placed.values()) {
    if (n.id === center.id || typeof n.radians !== "number") continue;
    add(n.id, [
      n.x + Math.cos(n.radians) * (n.r + 10),
      n.y + Math.sin(n.radians) * (n.r + 10),
    ]);
  }
  const centerRoom = Math.max(8, (geom.primaryRing - (center.r ?? 0)) * 0.6);
  // The center's loops keep their line within its room (a stroke's line
  // runs a stroke and a half past its hairline reach, see `selfLoopOpening`).
  const centerStroke = Math.max(
    0,
    ...loops.filter(l => l.source.id === center.id).map(l => l.size ?? 1),
  );
  const centerReach = Math.max(0, centerRoom - centerStroke * 1.5);
  const layout = layoutSelfLoops(loops, {
    node: l => placed.get(l.source.id)!,
    angle: n =>
      widestGapAngle([n.x, n.y], occupied.get(n.id) ?? [], -Math.PI / 2),
    strokeWidth: l => l.size ?? 1,
    reach: l => {
      const n = placed.get(l.source.id)!;
      const reach = selfLoopReach(n.r);
      return n.id === center.id ? Math.min(reach, centerReach) : reach;
    },
  });
  return loops.flatMap(l => {
    const loop = layout.get(l);
    const node = placed.get(l.source.id)!;
    return loop ? [{...l, source: node, target: node, loop}] : [];
  });
}
