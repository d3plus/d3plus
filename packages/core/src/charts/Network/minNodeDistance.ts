/**
    The closest pair of Network nodes, which caps the largest node radius.

    @module
*/

import {min} from "d3-array";

import {pointDistance, pointDistanceSquared} from "@d3plus/math";

/** A positioned node; a missing coordinate counts as 0. */
export interface PositionedNode {
  x?: number;
  y?: number;
}

/** Every pairwise distance's minimum, pair by pair. */
function pairwiseMinimum(nodes: readonly PositionedNode[]): number | undefined {
  const distances: number[] = [];
  for (const n1 of nodes)
    for (const n2 of nodes)
      if (n1 !== n2)
        distances.push(
          pointDistance([n1.x ?? 0, n1.y ?? 0], [n2.x ?? 0, n2.y ?? 0]),
        );
  return min(distances);
}

/**
    The smallest `pointDistance` between two different nodes, or undefined
    when no pair has one (fewer than two nodes, or none with a numeric
    position). Distances that aren't numbers are skipped, as `d3.min` skips
    them. Sorts the nodes by x and sweeps, skipping pairs further apart in x
    than the closest pair found so far.
*/
export function minNodeDistance(
  nodes: readonly PositionedNode[],
): number | undefined {
  const points: {node: PositionedNode; p: [number, number]}[] = [];
  let other = false;
  for (const node of nodes) {
    const p: [number, number] = [node.x ?? 0, node.y ?? 0];
    if (Number.isFinite(p[0]) && Number.isFinite(p[1])) points.push({node, p});
    else if (!Number.isNaN(p[0]) && !Number.isNaN(p[1])) other = true;
  }
  points.sort((a, b) => a.p[0] - b.p[0]);
  let best = Infinity,
    found = false;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    for (let j = i + 1; j < points.length; j++) {
      const b = points[j];
      // Squared like `pointDistanceSquared`, so the cut-off is exact.
      if (pointDistanceSquared([a.p[0], 0], [b.p[0], 0]) > best) break;
      if (a.node === b.node) continue;
      const d = pointDistanceSquared(a.p, b.p);
      if (!found || d < best) {
        best = d;
        found = true;
      }
    }
  }
  if (found) return Math.sqrt(best);
  // Pairs with an infinite coordinate only decide the minimum when no two
  // finite points make a pair.
  return other ? pairwiseMinimum(nodes) : undefined;
}
