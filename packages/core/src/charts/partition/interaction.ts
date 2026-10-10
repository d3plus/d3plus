/**
    Interaction shared by the partition charts (Sunburst, Icicle): hovering a
    node highlights it with its ancestor path, clicking a node zooms into it
    (it moves to depth 0 and its descendants fill the whole breadth), and
    clicking the depth-0 node zooms back out. Zooming rides the shared
    drill-down history, so the Back control steps out too.
*/

import {formatAbbreviate} from "@d3plus/format";
import type {DataPoint} from "@d3plus/data";

import {leadTitleWithSwatch, pickSwatch} from "../features/tooltipSwatch.js";
import type {DrillDownHistoryEntry, VizInstance} from "../viz/vizTypes.js";

import {partitionLineage} from "./hierarchy.js";
import type {PartitionKey, PartitionNode} from "./hierarchy.js";
import {partitionFocus} from "./zoom.js";

type Handler = (d: DataPoint, i: number, x?: unknown, event?: Event) => void;
type HoverFn = (fn: ((h: DataPoint, i?: number) => boolean) | false) => unknown;
type Configurable = VizInstance & {
  config: (c: Record<string, unknown>) => {render: () => unknown};
};

/** How a partition chart keeps its interaction state. */
export interface PartitionInteraction<N extends PartitionNode> {
  /**
      The `viz.ctx` key prefix the chart keeps its state under: `<prefix>Nodes`
      (laid-out nodes by row), `<prefix>Hovered`, and `<prefix>ZoomOrigin`.
  */
  prefix: string;
  /** What a zoom-in records about the clicked node, for the next layout to animate from. */
  origin: (node: N) => unknown;
}

/** The laid-out node an event datum (a row, or a label wrapping one) belongs to. */
export function partitionNodeOf<N extends PartitionNode>(
  viz: VizInstance,
  d: unknown,
  prefix: string,
): N | undefined {
  let row = d as
    (DataPoint & {__d3plus__?: boolean; data?: DataPoint}) | undefined;
  while (row && row.__d3plus__ && row.data) row = row.data as typeof row;
  const lookup = viz.ctx[`${prefix}Nodes`] as Map<DataPoint, N> | undefined;
  return row && lookup ? lookup.get(row) : undefined;
}

/** Whether clicking `node` zooms into it: it has children, or deeper `groupBy` levels sit beyond the drawn ones. */
export function partitionDrillable(
  viz: VizInstance,
  node: PartitionNode,
): boolean {
  if (node.depth === 0 || node.datum._isAggregation) return false;
  const deepest = viz.schema.groupBy.length - 1;
  return (
    node.hasChildren || (node.level === viz._drawDepth && node.level < deepest)
  );
}

/** Whether clicking `node` does anything: zooms in, or (the depth-0 focus) zooms out. */
export function partitionClickable(
  viz: VizInstance,
  node: PartitionNode,
): boolean {
  return node.depth === 0
    ? Boolean(viz._history?.length)
    : partitionDrillable(viz, node);
}

/** The rows `node`'s hover keeps bright: the node and every drawn ancestor. */
export function partitionHoverRows(node: PartitionNode): Set<DataPoint> {
  return new Set(partitionLineage(node).map(n => n.datum));
}

/** Clears the hover and tooltip before a zoom moves nodes out from under the pointer. */
function clearInteraction(viz: VizInstance): void {
  (viz as VizInstance & {hover: HoverFn}).hover(false);
  viz._tooltipClass?.data([]).render();
}

/**
    Zooms into `node`: filters the data to its key path, records the previous
    view on the drill-down history, and re-renders. A `depth` the user limited
    slides outward with the zoom, so the same number of levels stays visible.
*/
export function partitionZoomIn<N extends PartitionNode>(
  viz: VizInstance,
  node: N,
  options: PartitionInteraction<N>,
): void {
  const groupBy = viz.schema.groupBy as PartitionKey[];
  const focus = partitionFocus(viz);
  const oldFilter = viz.schema.filter as
    ((d: DataPoint, i: number) => boolean) | undefined;
  const keys = groupBy.slice(0, node.level + 1);
  const path = node.path;
  clearInteraction(viz);
  const entry: DrillDownHistoryEntry = {
    depth: viz.schema.depth,
    filter: oldFilter,
    groupId: path[node.level],
    groupDepth: node.level,
  };
  (viz._history ??= []).push(entry);
  viz.ctx[`${options.prefix}ZoomOrigin`] = options.origin(node);
  const config: Record<string, unknown> = {
    filter: (f: DataPoint, x: number) =>
      (!oldFilter || oldFilter(f, x)) &&
      keys.every((g, j) => g(f, x) === path[j]),
  };
  if (viz.schema.depth !== undefined) {
    const shift = node.level - focus.level;
    config.depth = Math.min(groupBy.length - 1, viz._drawDepth + shift);
  }
  (viz as Configurable).config(config).render();
}

/** Zooms out one step, restoring the view recorded before the last zoom. */
export function partitionZoomOut(viz: VizInstance): void {
  const entry = viz._history?.pop();
  if (!entry) return;
  clearInteraction(viz);
  const config: Record<string, unknown> = {
    depth: entry.depth,
    filter: entry.filter,
  };
  (viz as Configurable).config(config).render();
}

/** Formats a 0–1 share as a percentage in the chart's locale. */
function percent(viz: VizInstance, share: number): string {
  return `${formatAbbreviate(share * 100, viz.schema.locale)}%`;
}

/**
    The tooltip row giving a node's share of its parent, for nodes below the
    first level (a first-level node's parent is the whole, which "Share"
    covers).
*/
export function partitionParentShareRow(
  viz: VizInstance,
  node: PartitionNode | undefined,
): [string, string] | undefined {
  if (!node || !node.parent || node.parent.depth === 0) return undefined;
  return [
    viz.schema.translate("Share of Parent"),
    percent(viz, node.parentShare),
  ];
}

/**
    Whether `tbody` is still the chart's own: just its Share row. Matched by
    the row's cell functions, which every config merge or copy carries over by
    reference, unlike the arrays around them.
*/
export function partitionDefaultTbody(
  tbody: unknown,
  shareRow: unknown[],
): boolean {
  if (!Array.isArray(tbody) || tbody.length !== 1 || !Array.isArray(tbody[0]))
    return false;
  const row = tbody[0] as unknown[];
  return (
    row.length === shareRow.length &&
    row.every((cell, i) => cell === shareRow[i])
  );
}

/**
    Fills in what the shared shape tooltip can't know about a node — its label
    at its own level, the click hint, and its share of the parent — leaving
    any of them the user configured through `tooltipConfig` alone.
*/
function partitionTooltip(
  viz: VizInstance,
  node: PartitionNode,
  shareRow: unknown[],
): void {
  const tooltip = viz._tooltipClass!;
  const config = viz.schema.tooltipConfig as Record<string, unknown>;
  if (config.title === undefined) {
    const label = viz._drawLabel(node.datum, node.i ?? 0, node.level);
    leadTitleWithSwatch(
      tooltip.title(() => label),
      pickSwatch(
        viz,
        (
          viz as VizInstance & {
            _lastScenePick?: Parameters<typeof pickSwatch>[1];
          }
        )._lastScenePick,
      ),
    );
  }
  if (config.footer === undefined) {
    const hint = !partitionClickable(viz, node)
      ? false
      : viz.schema.translate(
          partitionDrillable(viz, node)
            ? "Click to Expand"
            : "Click to Zoom Out",
        );
    tooltip.footer(hint);
  }
  const extra = partitionParentShareRow(viz, node);
  if (extra && partitionDefaultTbody(config.tbody, shareRow))
    tooltip.tbody([...(config.tbody as unknown[]), extra]);
  if (config.title === undefined || config.footer === undefined || extra)
    tooltip.render();
}

/**
    The chart's `on` handlers, wrapping the Viz defaults: hover dims every
    node outside the hovered node's ancestor path, the tooltip gains a label,
    click hint, and share-of-parent row for its node, and a click zooms in or
    out.
*/
export function partitionHandlers<N extends PartitionNode>(
  viz: VizInstance,
  shareRow: unknown[],
  options: PartitionInteraction<N>,
): Record<string, Handler> {
  const {prefix} = options;
  const on = viz.schema.on as Record<string, Handler>;
  const baseEnter = on.mouseenter;
  const baseMove = on["mousemove.shape"];
  const hover = (fn: ((h: DataPoint) => boolean) | false) =>
    (viz as VizInstance & {hover: HoverFn}).hover(fn);
  const nodeOf = (d: unknown) => partitionNodeOf<N>(viz, d, prefix);

  // A zoom keeps the clicked node's key for the depth-0 node, so the pointer
  // can land on a new node without a fresh mouseenter; mousemove catches up.
  const hoverNode = (node: N) => {
    viz.ctx[`${prefix}Hovered`] = node;
    if (viz.schema.shapeConfig.hoverOpacity === 1) return;
    const rows = partitionHoverRows(node);
    hover(h => rows.has(h));
  };

  return {
    mouseenter: (d, i, x, event) => {
      const node = nodeOf(d);
      if (node) hoverNode(node);
      else baseEnter.call(viz, d, i, x, event);
    },
    "mousemove.shape": (d, i, x, event) => {
      baseMove.call(viz, d, i, x, event);
      const node = nodeOf(d);
      if (!node) return;
      if (viz.ctx[`${prefix}Hovered`] !== node) hoverNode(node);
      const userClick = Boolean(viz.schema.on.click);
      viz._select?.style(
        "cursor",
        userClick || partitionClickable(viz, node) ? "pointer" : "auto",
      );
      if (viz._tooltipClass && viz.schema.tooltip(d, i))
        partitionTooltip(viz, node, shareRow);
    },
    "click.shape": (d, _i, _x, event) => {
      (event as Event | undefined)?.stopPropagation?.();
      const node = nodeOf(d);
      if (!node) return;
      if (node.depth === 0) partitionZoomOut(viz);
      else if (partitionDrillable(viz, node))
        partitionZoomIn(viz, node, options);
    },
  };
}
