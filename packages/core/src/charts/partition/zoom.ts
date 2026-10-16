/**
    Click-to-zoom state shared by the partition charts (Sunburst, Icicle): the
    focused node read from the drill-down history, and the bookkeeping that
    lets a zoom animate — the nodes a zoom-in removes, and the nodes a
    zoom-out brings back.
*/

import type {DataPoint} from "@d3plus/data";

import type {VizInstance} from "../viz/vizTypes.js";

import type {PartitionFields, PartitionKey} from "./hierarchy.js";

/** The drill-down focus: the `groupBy` level and key path of the node drawn at depth 0. */
export interface PartitionFocus {
  level: number;
  path: unknown[];
}

/**
    The node a click zoomed into, read from the drill-down history: the latest
    entry's `groupDepth` is the clicked node's `groupBy` level, and every drawn
    row shares that node's keys (the drill-down filtered to them). Level -1
    (an empty path) means the whole hierarchy is drawn, unfocused.
*/
export function partitionFocus(viz: VizInstance): PartitionFocus {
  const entry = viz._history?.[viz._history.length - 1];
  const data = (viz._filteredData ?? []) as DataPoint[];
  const groupBy = viz.schema.groupBy as PartitionKey[];
  if (!entry || entry.groupDepth === undefined || !data.length)
    return {level: -1, path: []};
  const level = Math.min(entry.groupDepth, viz._drawDepth - 1);
  if (level < 0) return {level: -1, path: []};
  const path = groupBy.slice(0, level + 1).map(g => g(data[0], 0));
  return {level, path};
}

/**
    The value a render animates from, taken once per render. A render can lay
    the chart out more than once (placing the legend inside the chart redraws
    it), so `read` runs on the first pass — recognized by a fresh
    `_filteredData` — and every later pass of the same render reuses its
    result, instead of animating from the pass before it.
    @param viz The chart.
    @param passKey The `viz.ctx` key that remembers this render's base.
    @param read Captures the base on the first pass.
*/
export function partitionRenderBase<B>(
  viz: VizInstance,
  passKey: string,
  read: () => B,
): B {
  const pass = viz.ctx[passKey] as {data: unknown; base: B} | undefined;
  if (pass && pass.data === viz._filteredData) return pass.base;
  const base = read();
  viz.ctx[passKey] = {data: viz._filteredData, base};
  return base;
}

/** The nodes of `previous` that `next` no longer draws. */
export function partitionRemoved<N extends Pick<PartitionFields, "id">>(
  previous: N[],
  next: N[],
): N[] {
  const kept = new Set(next.map(n => n.id));
  return previous.filter(n => !kept.has(n.id));
}

/**
    The node a zoom-out comes back through: the previous focus (drawn at depth
    0), now a node of the new layout (or, for a jump of several levels, its
    nearest drawn ancestor). Undefined for any other change of layout.
    @param previous The previous draw's nodes.
    @param next This draw's nodes.
*/
export function partitionZoomOutFocus<
  N extends Pick<PartitionFields, "depth" | "path">,
>(previous: N[], next: N[]): N | undefined {
  const center = previous.find(n => n.depth === 0);
  if (!center) return undefined;
  const isPrefix = (n: N) =>
    n.path.length <= center.path.length &&
    n.path.every((k, j) => k === center.path[j]);
  return next
    .filter(n => n.depth > 0 && isPrefix(n))
    .sort((a, b) => b.path.length - a.path.length)[0];
}

/**
    The start every node a zoom-out brings back enters from, keyed by id: each
    is collapsed through the zoom-out's focus (see `partitionZoomOutFocus`)
    into the previous (zoomed) layout — the mirror of a zoom-in. Empty for any
    other change of layout.
    @param previous The previous draw's nodes.
    @param next This draw's nodes.
    @param collapse Where a returning node starts, given the zoom-out's focus.
*/
export function partitionReturning<
  N extends Pick<PartitionFields, "id" | "depth" | "path">,
  G,
>(
  previous: N[],
  next: N[],
  collapse: (node: N, focus: N) => G,
): Map<string, G> {
  const enter = new Map<string, G>();
  const focus = partitionZoomOutFocus(previous, next);
  if (!focus) return enter;
  const drawn = new Set(previous.map(n => n.id));
  for (const n of next)
    if (!drawn.has(n.id)) enter.set(n.id, collapse(n, focus));
  return enter;
}
