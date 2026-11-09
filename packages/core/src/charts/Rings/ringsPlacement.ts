/**
    Rings' node placement: which ring each node sits on, its angle and
    position, and the curves of the links between the rings.

    @module
*/
import {max, min} from "d3-array";

import type {VizInstance} from "../viz/vizTypes.js";
import type {SizeLegendScale} from "../../components/SizeLegend/sizeLegendLayout.js";

import type {RingsEdge, RingsNode} from "./ringsGraph.js";
import {edgesBetween, firstPerNeighbor} from "./ringsParallel.js";
import {sizeRingsNodes} from "./ringsSizing.js";
import type {RingGeometry} from "./ringsSizing.js";

/** The node at the other end of `edge` from the node `id`. */
const otherEnd = (edge: RingsEdge, id: string): RingsNode =>
  edge.source.id === id ? edge.target : edge.source;

/** The center's rings, innermost first, and each ring node's children on the ring outside it. */
export interface RingsTree {
  rings: RingsNode[][];
  children: Map<RingsNode, RingsNode[]>;
}

/**
    Claims the nodes on each of `depth` rings around `center`, breadth-first,
    so a node reachable by several paths sits once, on its shallowest ring.
    The first ring is the center's neighbors, fewest links first; each later
    ring is, in order, the unclaimed neighbors of each node on the ring
    inside it, which become that node's children.
*/
export function claimRings(
  linkMap: Record<string, RingsEdge[]>,
  center: RingsNode,
  depth: number,
): RingsTree {
  const claimed = new Set<RingsNode>([center]);
  const children = new Map<RingsNode, RingsNode[]>();
  const first: RingsNode[] = [];
  (linkMap[center.id] || []).forEach(edge => {
    const node = otherEnd(edge, center.id);
    // A node takes one place however many center links reach it.
    if (claimed.has(node)) return;
    claimed.add(node);
    first.push(node);
  });
  first.sort(
    (a, b) => (linkMap[a.id] || []).length - (linkMap[b.id] || []).length,
  );

  const rings = [first];
  while (rings.length < depth) {
    const inner = rings[rings.length - 1];
    const ring: RingsNode[] = [];
    inner.forEach(p => {
      const kids = firstPerNeighbor(
        (linkMap[p.id] || []).filter(
          edge => !claimed.has(otherEnd(edge, p.id)),
        ),
        p.id,
      ).map(edge => otherEnd(edge, p.id));
      kids.forEach(k => claimed.add(k));
      children.set(p, kids);
      ring.push(...kids);
    });
    rings.push(ring);
  }
  return {rings, children};
}

/**
    How many outer-ring slots each node spans: one on the outermost ring (or
    with no children), else the sum of its children's.
*/
export function ringWeights(tree: RingsTree): Map<RingsNode, number> {
  const weights = new Map<RingsNode, number>();
  for (let k = tree.rings.length - 1; k >= 0; k--) {
    tree.rings[k].forEach(n => {
      const kids = tree.children.get(n) ?? [];
      const sum = kids.reduce((total, c) => total + weights.get(c)!, 0);
      weights.set(n, sum || 1);
    });
  }
  return weights;
}

/**
    Sets each ring node's angle (`radians`) and position on its ring. The
    circle splits into one slot per outer-ring position (`ringWeights`): the
    first ring's nodes take arcs as wide as their slots, the first centered
    at the top, and each node's children split its arc the same way. Returns
    the number of slots.
*/
export function placeRings(tree: RingsTree, geom: RingGeometry): number {
  const {width, height, rings: radii} = geom;
  const weights = ringWeights(tree);
  const total = tree.rings[0].reduce((sum, n) => sum + weights.get(n)!, 0);
  const tau = Math.PI * 2;
  const s = tau / total;

  const place = (node: RingsNode, angle: number, ring: number) => {
    node.radians = angle;
    node.x = width / 2 + radii[ring] * Math.cos(angle);
    node.y = height / 2 + radii[ring] * Math.sin(angle);
    const kids = tree.children.get(node) ?? [];
    const span = weights.get(node)!;
    let before = 0;
    kids.forEach(kid => {
      const w = weights.get(kid)!;
      place(kid, angle - (s * span) / 2 + (s * w) / 2 + s * before, ring + 1);
      before += w;
    });
  };

  let offset = 0;
  tree.rings[0].forEach((p, i) => {
    const space = (tau / total) * weights.get(p)!;
    if (i === 0) offset -= space / 2;
    place(p, offset + space / 2 - tau / 4, 0);
    offset += space;
  });
  return total;
}

/**
    Places the center node and `geom.rings.length` rings around it, and sizes
    every node. Returns the placed `nodes` (center first, then ring by ring),
    the `rings`, and the size scale (null when unsized).
*/
export function placeRingsNodes(
  v: VizInstance,
  linkMap: Record<string, RingsEdge[]>,
  center: RingsNode,
  geom: RingGeometry,
): {
  nodes: RingsNode[];
  rings: RingsNode[][];
  radius: SizeLegendScale | null;
} {
  const {width, height, primaryRing} = geom;

  center.x = width / 2;
  center.y = height / 2;
  center.r = v.schema.sizeMin
    ? max([v.schema.sizeMin, primaryRing * 0.65])
    : v.schema.sizeMax
      ? min([v.schema.sizeMax, primaryRing * 0.65])
      : primaryRing * 0.65;

  const tree = claimRings(linkMap, center, geom.rings.length);
  const slots = placeRings(tree, geom);
  const radius = sizeRingsNodes(v, center, geom, slots, tree.rings);
  const nodes = [center, ...tree.rings.flat()];
  return {nodes, rings: tree.rings, radius};
}

type EndKey = "source" | "target";

/**
    Sets a link's curve between two ring nodes: it leaves each node on the
    side facing the other's ring (both outward for nodes on the same ring)
    and bends through the middle of the gap outside the inner one.
*/
export function curveRingsEdge(edge: RingsEdge, geom: RingGeometry): void {
  const {width, height, ringWidth} = geom;
  const inner = Math.min(edge.source.ring!, edge.target.ring!);
  const ringRadius = (k: number) => ringWidth * k;
  const middleRing =
    ringRadius(inner) + (ringRadius(inner + 1) - ringRadius(inner)) * 0.5;
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

/**
    The links drawn between placed nodes, each once: every link from the
    center to the first ring, and every link from a node on a ring inside the
    outermost to another ring node (curved, see `curveRingsEdge`).
*/
export function buildRingsEdges(
  rings: RingsNode[][],
  linkMap: Record<string, RingsEdge[]>,
  center: RingsNode,
  geom: RingGeometry,
): RingsEdge[] {
  const edges: RingsEdge[] = [];
  const placed = new Set(rings.flat().map(n => n.id));
  rings.forEach((ring, k) => {
    ring.forEach(p => {
      if (k === 0)
        edgesBetween(linkMap[p.id], p.id, center.id).forEach(edge => {
          if (!edges.includes(edge)) edges.push(edge);
        });
      if (k === rings.length - 1) return;
      linkMap[p.id].forEach(edge => {
        const other = otherEnd(edge, p.id);
        if (other.id === center.id || !placed.has(other.id)) return;
        curveRingsEdge(edge, geom);
        if (!edges.includes(edge)) edges.push(edge);
      });
    });
  });
  return edges;
}
