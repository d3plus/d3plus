/**
    ScatterMatrix's tooltips: a point names its observation and lists its
    value on every dimension; a histogram bar names its bin's range and
    counts its group's observations there.

    @module
*/
import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";

import type {VizInstance} from "../viz/vizTypes.js";
import {matrixMeta} from "./matrixData.js";
import type {RowFn} from "./matrixData.js";

/** What the tooltip reads from the chart. */
export interface MatrixTooltipContext {
  /** Each dimension's accessor and title. */
  dims: {accessor: RowFn; title: string}[];
  /** How many `groupBy` levels the user's data groups by (0 without groups). */
  groupDepth: number;
}

/** Walks Plot's `__d3plus__` wrappers down to the panel row. */
export function unwrapMatrixRow(d: DataPoint): DataPoint {
  let row = d;
  while (row && row.__d3plus__ && row.data) row = row.data as DataPoint;
  return row;
}

/**
    The tooltip's title: a bar's bin, as its dimension and range; a point's
    `label` when one is set, else its group, else its row ("Row 4").
*/
export function matrixTooltipTitle(
  viz: VizInstance,
  ctx: MatrixTooltipContext,
  datum: DataPoint,
  i: number,
): string {
  const d = unwrapMatrixRow(datum);
  const meta = matrixMeta(d);
  const fmt = (v: number) => formatAbbreviate(v, viz.schema.locale);
  if (meta?.kind === "bin") {
    const title = ctx.dims[meta.i]?.title ?? "";
    return `${title}: ${fmt(meta.x0)} – ${fmt(meta.x1)}`;
  }
  if (!viz.schema.label && ctx.groupDepth)
    return viz._drawLabel(d, i, ctx.groupDepth - 1);
  return viz._drawLabel(d, i);
}

/**
    The tooltip's rows: a point's value on every dimension; a bar's count
    of observations, under its group's name when the data has groups.
*/
export function matrixTooltipRows(
  viz: VizInstance,
  ctx: MatrixTooltipContext,
  datum: DataPoint,
  i: number,
): [string, string][] {
  const d = unwrapMatrixRow(datum);
  const meta = matrixMeta(d);
  const fmt = (v: unknown) =>
    typeof v === "number" ? formatAbbreviate(v, viz.schema.locale) : "";
  if (meta?.kind === "bin")
    return [
      [
        ctx.groupDepth
          ? viz._drawLabel(d, i, ctx.groupDepth - 1)
          : viz.schema.translate("Count"),
        fmt(meta.count),
      ],
    ];
  return ctx.dims.map(dim => [dim.title, fmt(dim.accessor(d, i))]);
}
