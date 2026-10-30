/**
    BubbleChart's Circle emitter: Plot's own, with the bubbles repainted
    largest first, so smaller bubbles paint (and hit-test) over the larger
    ones they overlap.
*/

import type {SceneNode} from "@d3plus/render";

import {shapeEmitters, type ShapeEmitter} from "../features/shapeEmit.js";

/** The bubble a node belongs to: its key, without a `::hit`-style suffix. */
const ownerKey = (node: SceneNode): string => String(node.key).split("::")[0];

/**
    The nodes with each circle, and the nodes keyed to it (its hit area),
    reordered largest radius first. Circles of equal radius keep their
    order, and every other node (labels, …) keeps its place.
    @param nodes A Circle shape's scene nodes, in data order.
*/
export function largestFirst(nodes: SceneNode[]): SceneNode[] {
  const radius = new Map<string, number>();
  for (const n of nodes)
    if (n.type === "circle") radius.set(String(n.key), n.r);
  const slots: number[] = [];
  nodes.forEach((n, i) => {
    if (radius.has(ownerKey(n))) slots.push(i);
  });
  const sorted = slots
    .map(i => ({node: nodes[i], r: radius.get(ownerKey(nodes[i]))!}))
    .sort((a, b) => (a.r === b.r ? 0 : a.r < b.r ? 1 : -1));
  const out = nodes.slice();
  slots.forEach((slot, k) => (out[slot] = sorted[k].node));
  return out;
}

/**
    Plot's Circle emitter, drawing the bubbles largest first. The rows are
    emitted in data order, so each series takes the color it would in a
    Scatter; only the painted nodes are reordered.
*/
export const bubbleEmit: ShapeEmitter = (ctx, key) =>
  largestFirst(shapeEmitters.Circle(ctx, key));
