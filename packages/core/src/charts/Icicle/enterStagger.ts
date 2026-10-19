/**
    How Icicle rectangles enter outside a zoom: each grows out of the midpoint
    of its root-side edge (the left edge, or the top edge for a vertical
    Icicle), and each level of entering rectangles starts once the level it
    grows out of has finished, the draw's duration split into one window per
    level. The groups wrapping the rectangles show at once rather than
    fading in, so the first levels read at full strength.
*/

import type {EnterWindow, GroupNode, Scene} from "@d3plus/render";

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
    on, so the windows split the transition evenly between the levels of
    entering nodes.
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
    windows.set(node.id, {start: k / levels, end: (k + 1) / levels});
  }
  return {rects, windows};
}

/** The enter window of a node that shows at once, at its own opacity. */
const AT_ONCE: EnterWindow = {start: 0, end: 0};

/** Marks `group` and the wrapper groups (those without a datum) inside it to show at once. */
function showWrappers(group: GroupNode): void {
  group.enterWindow ??= AT_ONCE;
  for (const child of group.children)
    if (child.type === "group" && !child.datum) showWrappers(child);
}

/**
    Shows the groups wrapping the chart's rectangles at once when they enter,
    instead of fading them in over the whole draw, so the first draw's
    staggered levels read at full strength from the first window on.
    @param scene The chart's finished scene.
*/
export function icicleShowWrappers(scene: Scene): Scene {
  const cells = scene.root.children.find(n => n.key === "viz-chart-cells");
  if (cells?.type === "group") showWrappers(cells);
  return scene;
}
