/**
    How Icicle rectangles enter outside a zoom: each grows out of the midpoint
    of its root-side edge (the left edge, or the top edge for a vertical
    Icicle), and each level of entering rectangles starts once the level it
    grows out of has finished, the draw's duration split into one window per
    level.
*/

import {cubicInOut, type EnterWindow} from "@d3plus/render";

import type {IcicleOrient, IcicleRect} from "./geometry.js";
import type {IcicleNode} from "./layout.js";

/** The zero-size rectangle at the midpoint of `rect`'s root-side edge. */
export function icicleRootEdge(
  rect: IcicleRect,
  orient: IcicleOrient,
): IcicleRect {
  return orient === "vertical"
    ? {x: rect.x + rect.width / 2, y: rect.y, width: 0, height: 0}
    : {x: rect.x, y: rect.y + rect.height / 2, width: 0, height: 0};
}

/** The enter start and window of every entering rectangle, by id. */
export interface IcicleStagger {
  rects: Map<string, IcicleRect>;
  windows: Map<string, EnterWindow>;
}

/**
    The enter start and window of each node `entering` names. A node's window
    follows those of its entering ancestors: one whose parent is drawn
    already takes the first window, its entering children the next, and so
    on, so the windows split the transition's time evenly between the levels
    of entering nodes. A window is a share of the transition's eased
    progress, so each level's share of the time is mapped through the
    renderers' easing.
    @param nodes This draw's nodes, parents before children.
    @param entering The ids of the nodes that enter this draw.
    @param orient Which way the levels run.
*/
export function icicleStagger(
  nodes: IcicleNode[],
  entering: Set<string>,
  orient: IcicleOrient,
): IcicleStagger {
  const step = new Map<string, number>();
  for (const node of nodes) {
    if (!entering.has(node.id)) continue;
    const parent = node.parent;
    step.set(node.id, parent ? (step.get(parent.id) ?? -1) + 1 : 0);
  }
  const levels = Math.max(0, ...step.values()) + 1;
  const rects = new Map<string, IcicleRect>();
  const windows = new Map<string, EnterWindow>();
  for (const node of nodes) {
    const k = step.get(node.id);
    if (k === undefined) continue;
    rects.set(node.id, icicleRootEdge(node, orient));
    windows.set(node.id, {
      start: cubicInOut(k / levels),
      end: cubicInOut((k + 1) / levels),
    });
  }
  return {rects, windows};
}
