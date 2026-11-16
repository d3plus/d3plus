/**
    Dragging Sankey nodes up and down their columns (see
    `features/nodeDrag.ts`), or nudging a focused one with Shift and the up
    and down arrow keys. A moved node pushes the nodes above or below it in
    its column aside, keeping their order and the gap between nodes, so no
    two nodes overlap and the column stays inside the chart. Each node keeps
    its offset from where the layout puts it, as a share of the chart's
    height, so the column stays as it was left through redraws and resizes,
    until the data, `nodes`, or `links` change. Links follow their nodes,
    re-stacked at the nodes at their other ends.

    @module
*/

import type {SceneNode} from "@d3plus/render";

import type {NodeDrag} from "../features/nodeDrag.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {sankeyRelink} from "./sankeyLayout.js";
import type {SankeyLink, SankeyNode} from "./sankeyLayout.js";

/** Where the layout put a node, before its offset. */
export interface LaidNode {
  /** Its top. */
  y0: number;
  height: number;
  /** Its column. */
  column: number;
  /** The extent's top and bottom. */
  top: number;
  bottom: number;
}

/** A node in a column, by its top and height. */
export interface ColumnNode {
  id: string;
  y0: number;
  height: number;
}

/** The dragged nodes' offsets, and the inputs they were dragged on. */
export interface SankeyDragState {
  /** Each moved node's offset from its laid-out place, as a share of the extent's height. */
  offsets: Map<string, number>;
  /** The data, `nodes`, and `links` the offsets were made on. */
  inputs: unknown[];
  /** Where the layout put each node, before its offset. */
  laid: Map<string, LaidNode>;
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
    state.laid.set(String(n.id), {
      y0: n.y0,
      height: n.y1 - n.y0,
      column: n.layer ?? n.x0,
      top,
      bottom,
    });
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
    The tops of a column's nodes once `id` moves to `y0`: the moved node
    takes its place among the others by its center (the others keep their
    order), and the nodes it would overlap are pushed up or down, `padding`
    apart (less when the column is too full for it). The moved node stops
    where the nodes it pushes reach `top` or `bottom`.
    @param column The column's nodes, at their tops before the move.
    @param id The moved node.
    @param y0 The top it moves to.
    @param top The extent's top.
    @param bottom The extent's bottom.
    @param padding The gap kept between nodes.
*/
export function pushColumn(
  column: readonly ColumnNode[],
  id: string,
  y0: number,
  top: number,
  bottom: number,
  padding: number,
): Map<string, number> {
  const out = new Map<string, number>();
  const self = column.find(n => n.id === id);
  if (!self) return out;
  const others = column.filter(n => n.id !== id).sort((a, b) => a.y0 - b.y0);
  const center = y0 + self.height / 2;
  const split = others.findIndex(n => n.y0 + n.height / 2 > center);
  const above = split < 0 ? others : others.slice(0, split);
  const below = split < 0 ? [] : others.slice(split);
  const heights = column.reduce((sum, n) => sum + n.height, 0);
  const gaps = column.length - 1;
  const pad = gaps
    ? Math.max(0, Math.min(padding, (bottom - top - heights) / gaps))
    : 0;
  const reach = (nodes: ColumnNode[]) =>
    nodes.reduce((sum, n) => sum + n.height + pad, 0);
  const lo = top + reach(above);
  const hi = bottom - self.height - reach(below);
  const y = lo > hi ? lo : Math.max(lo, Math.min(hi, y0));
  out.set(id, y);
  let edge = y - pad;
  for (let i = above.length - 1; i >= 0; i--) {
    const n = above[i];
    const ny = Math.min(n.y0, edge - n.height);
    out.set(n.id, ny);
    edge = ny - pad;
  }
  edge = y + self.height + pad;
  for (const n of below) {
    const ny = Math.max(n.y0, edge);
    out.set(n.id, ny);
    edge = ny + n.height + pad;
  }
  return out;
}

/** The nodes in `id`'s column, at their tops now (laid out, then offset). */
function columnOf(state: SankeyDragState, id: string): ColumnNode[] {
  const own = state.laid.get(id);
  if (!own) return [];
  const span = own.bottom - own.top;
  return [...state.laid].flatMap(([nid, laid]) =>
    laid.column === own.column
      ? [
          {
            id: nid,
            y0: laid.y0 + (state.offsets.get(nid) ?? 0) * span,
            height: laid.height,
          },
        ]
      : [],
  );
}

/**
    Moves `id` to `y0` in a column of nodes at `column`'s tops, pushing the
    others aside (see `pushColumn`), and keeps each node's new offset.
*/
function placeInColumn(
  viz: VizInstance,
  column: readonly ColumnNode[],
  id: string,
  y0: number,
): void {
  const state = sankeyDragState(viz);
  const own = state.laid.get(id);
  if (!own) return;
  const span = own.bottom - own.top || 1;
  const tops = pushColumn(
    column,
    id,
    y0,
    own.top,
    own.bottom,
    Number(viz.schema.nodePadding) || 0,
  );
  for (const [nid, top] of tops) {
    const offset = (top - state.laid.get(nid)!.y0) / span;
    if (Math.abs(offset) < 1e-9) state.offsets.delete(nid);
    else state.offsets.set(nid, offset);
  }
}

/**
    Nudges a node `dy` pixels up or down its column, pushing the others
    aside, and repaints. Returns whether the node moved.
    @param viz The chart.
    @param id The node.
    @param dy How far to move it.
*/
export function nudgeSankeyNode(
  viz: VizInstance,
  id: string,
  dy: number,
): boolean {
  const state = sankeyDragState(viz);
  const column = columnOf(state, id);
  const self = column.find(n => n.id === id);
  if (!self) return false;
  const before = self.y0;
  placeInColumn(viz, column, id, before + dy);
  const after = columnOf(state, id).find(n => n.id === id)!.y0;
  scheduleRedraw(viz);
  return Math.abs(after - before) > 1e-9;
}

/**
    Puts a node back where the layout puts it, pushing the others in its
    column aside, and repaints. Returns whether it had moved.
    @param viz The chart.
    @param id The node.
*/
export function resetSankeyNode(viz: VizInstance, id: string): boolean {
  const state = sankeyDragState(viz);
  const laid = state.laid.get(id);
  if (!laid || !state.offsets.has(id)) return false;
  placeInColumn(viz, columnOf(state, id), id, laid.y0);
  scheduleRedraw(viz);
  return true;
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
  // The column as the drag found it: each move pushes from there, so
  // dragging back lets the pushed nodes return.
  let column: ColumnNode[] = [];
  return {
    nodeAt(node) {
      const lookup = (viz.ctx.nodeLookup ?? {}) as Record<string, unknown>;
      return sankeyNodeId(node, {has: id => id in lookup});
    },
    start(id, at) {
      from = at[1];
      column = columnOf(sankeyDragState(viz), id);
    },
    move(id, at) {
      const self = column.find(n => n.id === id);
      if (!self) return;
      placeInColumn(viz, column, id, self.y0 + at[1] - from);
      scheduleRedraw(viz);
    },
    end() {
      column = [];
    },
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
