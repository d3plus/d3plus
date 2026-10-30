/**
    What each Alluvial datum stands for. The chart draws merged rows (a node's
    rows, a band's rows) and groups rows by origin for its legend; this keeps,
    beside each of those datums, which node, band, or origin it is, and the
    rows it holds. The chart's default `groupBy` reads it, so every datum
    reports its origin (or node) as its id and takes its color from it.
*/

import type {DataPoint} from "@d3plus/data";

import type {VizInstance} from "../viz/vizTypes.js";

import type {AlluvialBand, AlluvialNode} from "./aggregate.js";
import {resolveAlluvialDimensions, resolveColorBy} from "./dimensions.js";
import type {AlluvialDimension} from "./dimensions.js";

/** A datum's role in the chart. */
export type AlluvialMeta =
  | {kind: "group"; id: unknown; rows: DataPoint[]}
  | {kind: "path"; id: unknown; rows: DataPoint[]}
  | {kind: "node"; id: unknown; node: AlluvialNode}
  | {kind: "band"; id: unknown; band: AlluvialBand};

const metas = new WeakMap<object, AlluvialMeta>();

/** The role recorded for `d`, if any. */
export function alluvialMeta(d: unknown): AlluvialMeta | undefined {
  return d && typeof d === "object" ? metas.get(d) : undefined;
}

/** Records `d`'s role, and returns `d`. */
export function setAlluvialMeta<T extends object>(d: T, meta: AlluvialMeta): T {
  metas.set(d, meta);
  return d;
}

/**
    The source rows a drawn row stands for: a group's or a path row's rows,
    or the row itself.
    @param d A row from the chart's drawn rows.
*/
export function sourceRows(d: DataPoint): DataPoint[] {
  const meta = alluvialMeta(d);
  return meta && (meta.kind === "group" || meta.kind === "path")
    ? meta.rows
    : [d];
}

const dimensionCache = new WeakMap<
  VizInstance,
  {input: unknown; colorBy: unknown; dims: AlluvialDimension[]; k: number}
>();

/**
    The chart's dimensions and its `colorBy` column, resolved once per change
    to `dimensions` or `colorBy`.
    @param viz The chart.
*/
export function alluvialDimensions(viz: VizInstance): {
  dims: AlluvialDimension[];
  k: number;
} {
  const input = viz.schema.dimensions;
  const colorBy = viz.schema.colorBy;
  const cached = dimensionCache.get(viz);
  if (cached && cached.input === input && cached.colorBy === colorBy)
    return cached;
  const dims = resolveAlluvialDimensions(input);
  const entry = {input, colorBy, dims, k: resolveColorBy(colorBy, dims)};
  dimensionCache.set(viz, entry);
  return entry;
}

/**
    The chart's default `groupBy`: a datum's recorded id, or for a plain data
    row its category in the `colorBy` column.
    @param viz The chart.
*/
export function alluvialGroupBy(
  viz: VizInstance,
): (d: DataPoint, i: number) => DataPoint[keyof DataPoint] {
  return (d, i) => {
    const meta = alluvialMeta(d);
    const {dims, k} = alluvialDimensions(viz);
    const id = meta ? meta.id : dims[k]?.accessor(d, i);
    return id as DataPoint[keyof DataPoint];
  };
}
