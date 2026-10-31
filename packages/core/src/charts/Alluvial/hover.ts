/**
    Alluvial hover and tooltips. Hovering a band or a node highlights the
    rows it carries, through every column: each band and node they pass
    through. Tooltips title a band with its path and a node
    with its category, then list the value and its share of the total.
*/

import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";

import {shapeHoverEnabled} from "../viz/shapeHover.js";
import type {VizInstance} from "../viz/vizTypes.js";

import type {AlluvialGraph, AlluvialNode} from "./aggregate.js";
import {alluvialPathText} from "./aggregate.js";
import type {AlluvialCtx} from "./applyLayout.js";
import {alluvialValueTitle} from "./applyLayout.js";
import {formatAlluvialValue} from "./emit.js";
import {alluvialMeta} from "./meta.js";

/** Whether two sets share a member. */
function intersects<T>(a: Set<T>, b: Set<T>): boolean {
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const x of small) if (large.has(x)) return true;
  return false;
}

/**
    The ids of the bands and nodes a hovered datum highlights, or null when
    the datum is not one of the chart's bands or nodes: every band and node
    that the hovered band's or node's rows pass through, in every column.
    @param graph The chart's graph.
    @param d The hovered datum.
*/
export function alluvialHighlight(
  graph: AlluvialGraph,
  d: unknown,
): Set<string> | null {
  const meta = alluvialMeta(d);
  const paths =
    meta?.kind === "band"
      ? meta.band.paths
      : meta?.kind === "node"
        ? meta.node.paths
        : null;
  if (!paths) return null;
  const ids = new Set<string>();
  for (const band of graph.bands)
    if (intersects(band.paths, paths)) ids.add(band.id);
  for (const node of graph.columns.flat())
    if (intersects(node.paths, paths)) ids.add(node.id);
  return ids;
}

/** The band or node id a drawn datum stands for, if any. */
function markId(d: unknown): string | undefined {
  const meta = alluvialMeta(d);
  if (meta?.kind === "band") return meta.band.id;
  if (meta?.kind === "node") return meta.node.id;
  return undefined;
}

/**
    Replaces the chart's `mouseenter` handler: over a band or node it
    highlights what `alluvialHighlight` names, and over anything else (a
    color scale swatch) it falls back to the default handler.
    @param viz The chart.
*/
export function installAlluvialHover(viz: VizInstance): void {
  const base = viz.schema.on.mouseenter as (
    d: DataPoint,
    i: number,
    ...rest: unknown[]
  ) => void;
  viz.schema.on.mouseenter = function (
    d: DataPoint,
    i: number,
    ...rest: unknown[]
  ) {
    const c = viz.ctx.alluvial as AlluvialCtx | undefined;
    const ids = c ? alluvialHighlight(c.graph, d) : null;
    if (!ids) return base(d, i, ...rest);
    if (!shapeHoverEnabled(viz)) return;
    viz._hoverBucket = false;
    (viz.hover as (p: unknown) => unknown)((h: DataPoint) => {
      const id = markId(h);
      return id !== undefined && ids.has(id);
    });
  };
}

/** A tooltip's title: a band's path, or a node's category. */
export function alluvialTooltipTitle(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): string {
  const meta = alluvialMeta(d);
  const c = viz.ctx.alluvial as AlluvialCtx | undefined;
  if (meta?.kind === "band")
    return alluvialPathText(meta.band, c ? c.dims.length : 0);
  if (meta?.kind === "node") return meta.node.label;
  return viz._drawLabel(d, i);
}

/** A node's column title, if it has one. */
function columnTitle(viz: VizInstance, node: AlluvialNode): string {
  const c = viz.ctx.alluvial as AlluvialCtx | undefined;
  return c?.dims[node.column]?.title ?? "";
}

/**
    A tooltip's rows for a band or node: its column's title (for a node), its
    value, and its share of the chart's total. Other datums get none.
*/
export function alluvialTooltipRows(
  viz: VizInstance,
  d: DataPoint,
): [string, string][] {
  const meta = alluvialMeta(d);
  if (meta?.kind !== "band" && meta?.kind !== "node") return [];
  const c = viz.ctx.alluvial as AlluvialCtx | undefined;
  const value = meta.kind === "band" ? meta.band.value : meta.node.value;
  const translate = viz.schema.translate as (s: string) => string;
  const rows: [string, string][] = [];
  if (meta.kind === "node") {
    const title = columnTitle(viz, meta.node);
    if (title) rows.push([title, meta.node.label]);
  }
  rows.push([alluvialValueTitle(viz), formatAlluvialValue(viz, value)]);
  const total = c?.graph.total ?? 0;
  if (total > 0)
    rows.push([
      translate("Share"),
      `${formatAbbreviate((value / total) * 100, viz.schema.locale as string)}%`,
    ]);
  return rows;
}
