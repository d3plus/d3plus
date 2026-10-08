/**
    Sunburst interaction: hovering an arc highlights it with its ancestor path,
    clicking an arc zooms into it (it becomes the center disc and its
    descendants fill the full circle), and clicking the center disc zooms back
    out. Zooming rides the shared drill-down history, so the Back control steps
    out too.
*/

import {formatAbbreviate} from "@d3plus/format";
import type {DataPoint} from "@d3plus/data";

import {leadTitleWithSwatch, pickSwatch} from "../features/tooltipSwatch.js";
import type {DrillDownHistoryEntry, VizInstance} from "../viz/vizTypes.js";

import {sunburstFocus} from "./applyLayout.js";
import {sunburstLineage} from "./partition.js";
import type {SunburstKey, SunburstNode} from "./partition.js";

type Handler = (d: DataPoint, i: number, x?: unknown, event?: Event) => void;
type HoverFn = (fn: ((h: DataPoint, i?: number) => boolean) | false) => unknown;
type Configurable = VizInstance & {
  config: (c: Record<string, unknown>) => {render: () => unknown};
};

/** The laid-out node an event datum (a row, or a label wrapping one) belongs to. */
export function sunburstNodeOf(
  viz: VizInstance,
  d: unknown,
): SunburstNode | undefined {
  let row = d as
    (DataPoint & {__d3plus__?: boolean; data?: DataPoint}) | undefined;
  while (row && row.__d3plus__ && row.data) row = row.data as typeof row;
  const lookup = viz.ctx.sunburstNodes as
    Map<DataPoint, SunburstNode> | undefined;
  return row && lookup ? lookup.get(row) : undefined;
}

/** Whether clicking `node` zooms into it: it has children, or deeper `groupBy` levels sit beyond the drawn ones. */
export function sunburstDrillable(
  viz: VizInstance,
  node: SunburstNode,
): boolean {
  if (node.depth === 0 || node.datum._isAggregation) return false;
  const deepest = viz.schema.groupBy.length - 1;
  return (
    node.hasChildren || (node.level === viz._drawDepth && node.level < deepest)
  );
}

/** Whether clicking `node` does anything: zooms in, or (the center disc) zooms out. */
export function sunburstClickable(
  viz: VizInstance,
  node: SunburstNode,
): boolean {
  return node.depth === 0
    ? Boolean(viz._history?.length)
    : sunburstDrillable(viz, node);
}

/** The rows `node`'s hover keeps bright: the node and every drawn ancestor. */
export function sunburstHoverRows(node: SunburstNode): Set<DataPoint> {
  return new Set(sunburstLineage(node).map(n => n.datum));
}

/** Clears the hover and tooltip before a zoom moves arcs out from under the pointer. */
function clearInteraction(viz: VizInstance): void {
  (viz as VizInstance & {hover: HoverFn}).hover(false);
  viz._tooltipClass?.data([]).render();
}

/**
    Zooms into `node`: filters the data to its key path, records the previous
    view on the drill-down history, and re-renders. A `depth` the user limited
    slides outward with the zoom, so the same number of rings stays visible.
*/
export function sunburstZoomIn(viz: VizInstance, node: SunburstNode): void {
  const groupBy = viz.schema.groupBy as SunburstKey[];
  const focus = sunburstFocus(viz);
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
  viz.ctx.sunburstZoomOrigin = {
    startAngle: node.startAngle,
    endAngle: node.endAngle,
    depth: node.depth,
  };
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
export function sunburstZoomOut(viz: VizInstance): void {
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
    The tooltip row giving a node's share of its parent arc, for arcs beyond the
    first ring (a first-ring arc's parent is the whole, which "Share" covers).
*/
export function sunburstParentShareRow(
  viz: VizInstance,
  node: SunburstNode | undefined,
): [string, string] | undefined {
  if (!node || !node.parent || node.parent.depth === 0) return undefined;
  return [
    viz.schema.translate("Share of Parent"),
    percent(viz, node.parentShare),
  ];
}

/**
    Fills in what the shared shape tooltip can't know about an arc — its label
    at its own level, the click hint, and its share of the parent arc — leaving
    any of them the user configured through `tooltipConfig` alone.
*/
function sunburstTooltip(
  viz: VizInstance,
  node: SunburstNode,
  defaultTbody: unknown,
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
    const hint = !sunburstClickable(viz, node)
      ? false
      : viz.schema.translate(
          sunburstDrillable(viz, node)
            ? "Click to Expand"
            : "Click to Zoom Out",
        );
    tooltip.footer(hint);
  }
  const extra = sunburstParentShareRow(viz, node);
  if (extra && config.tbody === defaultTbody)
    tooltip.tbody([...(defaultTbody as unknown[]), extra]);
  if (config.title === undefined || config.footer === undefined || extra)
    tooltip.render();
}

/**
    The Sunburst's `on` handlers, wrapping the Viz defaults: hover dims every
    arc outside the hovered node's ancestor path, the tooltip gains a
    label, click hint, and share-of-parent row for its arc, and a click zooms
    in or out.
*/
export function sunburstHandlers(
  viz: VizInstance,
  defaultTbody: unknown,
): Record<string, Handler> {
  const on = viz.schema.on as Record<string, Handler>;
  const baseEnter = on.mouseenter;
  const baseMove = on["mousemove.shape"];
  const hover = (fn: ((h: DataPoint) => boolean) | false) =>
    (viz as VizInstance & {hover: HoverFn}).hover(fn);

  // A zoom keeps the clicked arc's key for the center disc, so the pointer
  // can land on a new node without a fresh mouseenter; mousemove catches up.
  const hoverNode = (node: SunburstNode) => {
    viz.ctx.sunburstHovered = node;
    if (viz.schema.shapeConfig.hoverOpacity === 1) return;
    const rows = sunburstHoverRows(node);
    hover(h => rows.has(h));
  };

  return {
    mouseenter: (d, i, x, event) => {
      const node = sunburstNodeOf(viz, d);
      if (node) hoverNode(node);
      else baseEnter.call(viz, d, i, x, event);
    },
    "mousemove.shape": (d, i, x, event) => {
      baseMove.call(viz, d, i, x, event);
      const node = sunburstNodeOf(viz, d);
      if (!node) return;
      if (viz.ctx.sunburstHovered !== node) hoverNode(node);
      const userClick = Boolean(viz.schema.on.click);
      viz._select?.style(
        "cursor",
        userClick || sunburstClickable(viz, node) ? "pointer" : "auto",
      );
      if (viz._tooltipClass && viz.schema.tooltip(d, i))
        sunburstTooltip(viz, node, defaultTbody);
    },
    "click.shape": (d, _i, _x, event) => {
      (event as Event | undefined)?.stopPropagation?.();
      const node = sunburstNodeOf(viz, d);
      if (!node) return;
      if (node.depth === 0) sunburstZoomOut(viz);
      else if (sunburstDrillable(viz, node)) sunburstZoomIn(viz, node);
    },
  };
}
