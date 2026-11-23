/**
    Callouts that pick their own anchors: a callout's `select` chooses rows
    the Plot draws (the largest or smallest value, the first or last point,
    or a function's pick), over every row or per series, and anchors a note
    at each.
*/
import type {DataPoint} from "@d3plus/data";

import {vizDiscrete} from "../viz/discrete.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {AnnotationAxis} from "./annotationFrame.js";
import type {Annotation} from "./annotationTypes.js";
import {
  drawnRows,
  numericValue,
  seriesRows,
  type DrawnRow,
} from "./referenceValues.js";

/** The keyword picks a callout's `select` takes. */
export type CalloutPick = "max" | "min" | "first" | "last";

/** The value of a row on an axis, or on its secondary twin when it plots there. */
const rowValue = (d: DrawnRow, axis: "x" | "y"): unknown =>
  d[axis] === undefined ? d[`${axis}2`] : d[axis];

/**
    The row with the largest (`"max"`) or smallest (`"min"`) value on the
    value axis, or the `"first"` or `"last"` along the other axis (by value
    where the rows draw numbers or dates there, else in the order they are
    drawn). Empty without rows.
    @param rows The rows to pick from.
    @param pick Which row.
    @param discrete The chart's discrete axis.
*/
export function pickRow(
  rows: DrawnRow[],
  pick: CalloutPick,
  discrete: "x" | "y" = "x",
): DrawnRow[] {
  if (!rows.length) return [];
  const value: "x" | "y" = discrete === "x" ? "y" : "x";
  const axis = pick === "max" || pick === "min" ? value : discrete;
  const nums = rows.map(d => numericValue(rowValue(d, axis)));
  const ordered = nums.some(Number.isFinite);
  const larger = pick === "max" || pick === "last";
  let best = -1;
  rows.forEach((_, k) => {
    if (ordered && !Number.isFinite(nums[k])) return;
    if (best < 0) best = k;
    else if (!ordered) best = larger ? k : best;
    else if (larger ? nums[k] > nums[best] : nums[k] < nums[best]) best = k;
  });
  return best < 0 ? [] : [rows[best]];
}

/**
    The anchor row of a drawn row: its `x`/`y` (or `x2`/`y2`), series `id`,
    and the data row it came from as `data` (with its index, `i`).
    @param d The drawn row.
*/
export function calloutAnchorRow(d: DrawnRow): Record<string, unknown> {
  const out: Record<string, unknown> = {data: d.data, i: d.i, id: d.id};
  (["x", "y", "x2", "y2"] as AnnotationAxis[]).forEach(axis => {
    if (d[axis] !== undefined) out[axis] = d[axis];
  });
  return out;
}

/**
    The rows a callout's `select` picks from `rows`: a keyword's row (see
    `pickRow`), or the drawn rows whose data rows a function returns.
    @param viz The chart.
    @param rows The rows to pick from.
    @param select The callout's `select`.
*/
export function selectRows(
  viz: VizInstance,
  rows: DrawnRow[],
  select: unknown,
): DrawnRow[] {
  if (typeof select === "function") {
    const picked = (select as (rows: DataPoint[]) => unknown)(
      rows.map(d => d.data),
    );
    if (!Array.isArray(picked)) return [];
    return picked.flatMap(p => rows.filter(d => d.data === p).slice(0, 1));
  }
  if (!["max", "min", "first", "last"].includes(select as string)) return [];
  const discrete = vizDiscrete(viz) === "y" ? "y" : "x";
  return pickRow(rows, select as CalloutPick, discrete);
}

/**
    A callout with a `select` anchored at the rows it picks (over every
    drawn row, or from each series with `perSeries`), labeled with each
    row's series label unless it sets a `label`. A callout without one is
    returned as is.
    @param viz The chart.
    @param annotation The callout annotation.
*/
export function resolveCalloutSelect(
  viz: VizInstance,
  annotation: Annotation,
): Annotation {
  const {select} = annotation;
  if (select === undefined || select === null || select === false)
    return annotation;
  const rows = drawnRows(viz);
  const groups = annotation.perSeries ? seriesRows(rows) : [rows];
  const data = groups
    .flatMap(group => selectRows(viz, group, select))
    .map(calloutAnchorRow);
  const out: Annotation = {...annotation, data};
  if (out.label === undefined)
    out.label = (d: {data: DataPoint; i: number}) =>
      viz._drawLabel(d.data, d.i);
  return out;
}
