/**
    Dragging Sankey nodes up and down their columns (see
    `features/nodeDrag.ts`). Each dropped node keeps its offset from where the
    layout puts it, as a share of the chart's height, so it stays put through
    redraws and resizes, until the data, `nodes`, or `links` change. Its links
    follow it, re-stacked at the nodes at their other ends.

    @module
*/

import type {SceneNode} from "@d3plus/render";

import type {NodeDrag} from "../features/nodeDrag.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {sankeyRelink} from "./sankeyLayout.js";
import type {SankeyLink, SankeyNode} from "./sankeyLayout.js";

/** The dragged nodes' offsets, and the inputs they were dragged on. */
export interface SankeyDragState {
  /** Each moved node's offset from its laid-out place, as a share of the extent's height. */
  offsets: Map<string, number>;
  /** The data, `nodes`, and `links` the offsets were made on. */
  inputs: unknown[];
  /** Each node's laid-out top and height, and the extent's top and bottom, before its offset. */
  laid: Map<string, {y0: number; height: number; top: number; bottom: number}>;
  /** The pending frame of a drag's redraw. */
  frame?: number;
  /** Re-runs the chart's layout and emit (set by the chart's `setup`). */
  relayout?: () => void;
}

/** A laid-out node with its id. */
export type DraggedNode = SankeyNode & {id: string | number};

/** The scene keys of a node's shape and label, which carry its id. */
const NODE_KEY = /^sankey-(?:Rect|Circle|label)-(.+)$/;

/**
    The id of the node a Sankey scene node draws (its shape or its label),
    or null for anything else.
    @param node The scene node.
    @param ids The ids of the chart's nodes.
*/
export function sankeyNodeId(
  node: Pick<SceneNode, "key">,
  ids: {has(id: string): boolean},
): string | null {
  const match = NODE_KEY.exec(String(node.key ?? ""));
  return match && ids.has(match[1]) ? match[1] : null;
}

/** The chart's drag state, created on first use. */
export function sankeyDragState(viz: VizInstance): SankeyDragState {
  let state = viz.ctx.sankeyDrag as SankeyDragState | undefined;
  if (!state)
    viz.ctx.sankeyDrag = state = {
      offsets: new Map(),
      inputs: [],
      laid: new Map(),
    };
  return state;
}

/**
    Moves each dragged node by its offset (kept inside `extent`), then
    re-stacks the links at every node. Forgets the offsets first when the
    data, `nodes`, or `links` aren't the ones they were made on.
    @param viz The chart.
    @param nodes The laid-out nodes.
    @param extent The box the layout fills.
*/
export function shiftSankeyNodes(
  viz: VizInstance,
  nodes: DraggedNode[],
  extent: [[number, number], [number, number]],
): void {
  const state = sankeyDragState(viz);
  const inputs = [viz._data, viz.schema.nodes, viz.schema.links];
  if (inputs.some((input, i) => input !== state.inputs[i])) {
    state.offsets.clear();
    state.inputs = inputs;
  }
  const [[, top], [, bottom]] = extent;
  for (const n of nodes)
    state.laid.set(String(n.id), {y0: n.y0, height: n.y1 - n.y0, top, bottom});
  if (!state.offsets.size) return;
  for (const n of nodes) {
    const share = state.offsets.get(String(n.id));
    if (share === undefined) continue;
    const height = n.y1 - n.y0;
    const y0 = clampTop(n.y0 + share * (bottom - top), height, top, bottom);
    n.y0 = y0;
    n.y1 = y0 + height;
  }
  sankeyRelink(
    nodes,
    viz.schema.linkSort as ((a: SankeyLink, b: SankeyLink) => number) | null,
  );
}

/**
    A node's top, kept so the node stays between `top` and `bottom`.
    @param y0 The top it would have.
    @param height Its height.
    @param top The extent's top.
    @param bottom The extent's bottom.
*/
export function clampTop(
  y0: number,
  height: number,
  top: number,
  bottom: number,
): number {
  return Math.max(top, Math.min(bottom - height, y0));
}

/**
    A dragged node's offset, as a share of the extent's height: where it
    started (`base`) moved by `dy` pixels, held so the node stays inside the
    extent.
    @param laid The node's laid-out top and height, and the extent's top and bottom.
    @param base The offset the drag started from.
    @param dy How far the pointer has moved.
*/
export function dragShare(
  laid: {y0: number; height: number; top: number; bottom: number},
  base: number,
  dy: number,
): number {
  const span = laid.bottom - laid.top || 1;
  const y0 = clampTop(
    laid.y0 + base * span + dy,
    laid.height,
    laid.top,
    laid.bottom,
  );
  return (y0 - laid.y0) / span;
}

/** Re-lays the chart out with the offsets and repaints it on the next frame. */
function scheduleRedraw(viz: VizInstance): void {
  const state = sankeyDragState(viz);
  const redraw = () => {
    state.frame = undefined;
    if (!state.relayout || !viz._sceneRenderer) return;
    state.relayout();
    viz._drawSceneToTarget(0);
  };
  if (typeof requestAnimationFrame !== "function") return redraw();
  if (state.frame === undefined) state.frame = requestAnimationFrame(redraw);
}

/** How a Sankey drags its nodes. */
export function sankeyNodeDrag(viz: VizInstance): NodeDrag {
  let from = 0;
  let base = 0;
  return {
    nodeAt(node) {
      const lookup = (viz.ctx.nodeLookup ?? {}) as Record<string, unknown>;
      return sankeyNodeId(node, {has: id => id in lookup});
    },
    start(id, at) {
      from = at[1];
      base = sankeyDragState(viz).offsets.get(id) ?? 0;
    },
    move(id, at) {
      const state = sankeyDragState(viz);
      const laid = state.laid.get(id);
      if (!laid) return;
      state.offsets.set(id, dragShare(laid, base, at[1] - from));
      scheduleRedraw(viz);
    },
    end() {},
  };
}

/** Cancels a pending drag redraw (chart teardown). */
export function stopSankeyDrag(viz: VizInstance): void {
  const state = viz.ctx.sankeyDrag as SankeyDragState | undefined;
  if (state?.frame === undefined) return;
  if (typeof cancelAnimationFrame === "function")
    cancelAnimationFrame(state.frame);
  state.frame = undefined;
}
