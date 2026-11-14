/**
    Bubble cells for Matrix: a cell whose `shape` is `"Circle"` draws as a
    circle centered in its cell, sized by the absolute value of `size` so the
    largest fills the cell, or filling the cell when `size` is unset.
*/

import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";
import {max, min} from "d3-array";

import type {SizeLegendScale} from "../../components/SizeLegend/sizeLegendLayout.js";
import {colorScaleValueLabel} from "../features/colorScaleTooltip.js";
import {scaleConstructors} from "../Plot/pipelineScales.js";
import {zeroAnchoredRadius} from "../Plot/pipeline.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** A Matrix cell as `matrixData` builds it: its row, column, and source row. */
export interface MatrixCell extends Record<string, unknown> {
  row: unknown;
  column: unknown;
  data?: DataPoint;
  i?: number;
}

/**
    Whether a cell draws as a circle: its `shape` is `"Circle"`.
    @param viz The chart.
    @param d The cell.
    @param i Its index.
*/
export function matrixCellIsCircle(
  viz: VizInstance,
  d: MatrixCell,
  i: number,
): boolean {
  const shape = viz.schema.shape as
    ((d: DataPoint, i: number) => unknown) | undefined;
  return (
    typeof shape === "function" &&
    shape((d.data ?? d) as DataPoint, d.i ?? i) === "Circle"
  );
}

/**
    A row's size magnitude: the absolute value of its `size`, or NaN when it
    has none (or `size` is unset).
    @param viz The chart.
    @param d The source row.
    @param i Its index.
*/
export function matrixSizeValue(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): number {
  if (!viz._size) return NaN;
  const raw = viz._size(d, i) as unknown;
  if (raw === null || raw === undefined || raw === "") return NaN;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.abs(value) : NaN;
}

/**
    The radius a circle may reach in a cell: half the cell's shorter side,
    less the padding between cells.
    @param cellWidth The cell's width.
    @param cellHeight The cell's height.
    @param cellPadding The pixel gap between neighboring cells.
*/
export function matrixMaxRadius(
  cellWidth: number,
  cellHeight: number,
  cellPadding: number,
): number {
  const side = Math.min(cellWidth, cellHeight) - cellPadding;
  return Number.isFinite(side) ? Math.max(0, side / 2) : 0;
}

/**
    The value → radius scale for bubble cells, anchored at zero so the
    largest value draws at `maxRadius` and smaller ones draw as small as they
    are: with `"sqrt"`, a circle's area is proportional to its value, and
    with `"linear"`, its radius. Its domain is the extent of the values above
    zero (a zero draws no circle), which the size legend reads. Null when no
    value is above zero.
    @param scale The scale type (`"sqrt"`, `"linear"`, …).
    @param values The size magnitudes.
    @param maxRadius The largest radius.
*/
export function matrixRadiusScale(
  scale: string,
  values: number[],
  maxRadius: number,
): SizeLegendScale | null {
  const positive = values.filter(v => Number.isFinite(v) && v > 0);
  const hi = max(positive);
  if (hi === undefined || !(maxRadius > 0)) return null;
  const lo = min(positive)!;
  const name = `scale${scale.charAt(0).toUpperCase()}${scale.slice(1)}`;
  const make = scaleConstructors[name] ?? scaleConstructors.scaleSqrt;
  const anchored = zeroAnchoredRadius(make, [lo, hi], maxRadius);
  return make()
    .domain([lo, hi])
    .range([
      Number.isFinite(anchored) ? anchored : maxRadius / 4,
      maxRadius,
    ]) as unknown as SizeLegendScale;
}

/**
    Sizes a laid-out Matrix's circle cells against the cell size stashed on
    `viz.ctx` (`cellWidth`/`cellHeight`): stashes the largest radius as
    `maxRadius` and the value → radius scale as `radiusScale` (null without
    a `size`), which the size legend paints as `viz._sizeLegendFinal`.
    Small multiples size every panel's circles against every panel's values
    (`viz.ctx.sharedSizeValues`).
    @param viz The chart.
    @param cells The cells.
*/
export function layoutMatrixBubbles(
  viz: VizInstance,
  cells: MatrixCell[],
): void {
  const maxRadius = matrixMaxRadius(
    viz.ctx.cellWidth as number,
    viz.ctx.cellHeight as number,
    (viz.schema.cellPadding as number) ?? 0,
  );
  const circles = cells.filter((d, i) => matrixCellIsCircle(viz, d, i));
  const values =
    (viz.ctx.sharedSizeValues as number[] | undefined) ??
    circles
      .map((d, i) => matrixSizeValue(viz, (d.data ?? d) as DataPoint, d.i ?? i))
      .filter(Number.isFinite);
  const radiusScale =
    viz._size && circles.length
      ? matrixRadiusScale(viz.schema.sizeScale as string, values, maxRadius)
      : null;
  viz.ctx.maxRadius = maxRadius;
  viz.ctx.radiusScale = radiusScale;
  viz._sizeLegendFinal = radiusScale;
}

/**
    The size magnitudes of the rows a chart draws as circles.
    @param viz The chart.
    @param rows The rows.
*/
export function matrixSizeValues(
  viz: VizInstance,
  rows: DataPoint[],
): number[] {
  const shape = viz.schema.shape as
    ((d: DataPoint, i: number) => unknown) | undefined;
  return rows
    .filter((d, i) => !shape || shape(d, i) === "Circle")
    .map((d, i) => matrixSizeValue(viz, d, i))
    .filter(Number.isFinite);
}

/**
    The radius scale before layout, for the size legend to reserve room:
    each cell's share of `available`, before the axis labels take theirs.
    Null without a `size`, or when no row draws as a sized circle.
    @param viz The chart.
    @param available The chart area, in pixels.
*/
export function matrixSizeLegendScale(
  viz: VizInstance,
  available: {width: number; height: number},
): SizeLegendScale | null {
  if (!viz._size) return null;
  const rows = viz._filteredData ?? [];
  const values =
    (viz.ctx.sharedSizeValues as number[] | undefined) ??
    matrixSizeValues(viz, rows);
  if (!values.length) return null;
  const count = (key: "row" | "column") =>
    new Set(
      rows.map((d: DataPoint, i: number) =>
        (viz.schema[key] as (d: DataPoint, i: number) => unknown)(d, i),
      ),
    ).size || 1;
  const radius = matrixMaxRadius(
    available.width / count("column"),
    available.height / count("row"),
    (viz.schema.cellPadding as number) ?? 0,
  );
  return matrixRadiusScale(viz.schema.sizeScale as string, values, radius);
}

/**
    The tooltip row showing a sized circle's signed `size` value, named by
    the `size` key (or "Value"). None when the cell isn't a sized circle, or
    the colorScale already shows a row under the same name.
    @param viz The chart.
    @param d The hovered row.
    @param i Its index.
*/
export function matrixSizeTooltipRows(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): [string, string][] {
  if (!viz._size || !d || typeof d !== "object") return [];
  const shape = viz.schema.shape as
    ((d: DataPoint, i: number) => unknown) | undefined;
  if (shape && shape(d, i) !== "Circle") return [];
  if (!Number.isFinite(matrixSizeValue(viz, d, i))) return [];
  const label =
    viz._sizeKey ?? (viz.schema.translate("Value") as unknown as string);
  if (viz.schema.colorScale && colorScaleValueLabel(viz) === label) return [];
  const value = Number(viz._size(d, i));
  return [[label, formatAbbreviate(value, viz.schema.locale)]];
}
