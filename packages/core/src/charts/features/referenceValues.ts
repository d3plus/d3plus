/**
    Computed reference positions: a reference line, band, or quadrant center
    given as a statistic of the drawn rows (`"mean"`, `"median"`, `"min"`,
    `"max"`) or as a function of them resolves to a value here, once over
    every drawn row or once per series.
*/
import type {DataPoint} from "@d3plus/data";

import {vizDiscrete} from "../viz/discrete.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {DRAG_SERIES} from "./referenceDragSource.js";
import type {AnnotationAxis} from "./annotationFrame.js";
import type {
  Annotation,
  AnnotationValue,
  ReferenceStatistic,
} from "./annotationTypes.js";

/** The English name of each statistic, which labels its line (translated). */
export const STATISTIC_NAMES: Record<ReferenceStatistic, string> = {
  mean: "Mean",
  median: "Median",
  min: "Minimum",
  max: "Maximum",
};

/** A row the Plot draws: its axis values, series, and the data row it came from. */
export interface DrawnRow {
  data: DataPoint;
  i: number;
  id: string;
  [key: string]: unknown;
}

/** Whether a value names a statistic. */
export function isStatistic(value: unknown): value is ReferenceStatistic {
  return typeof value === "string" && value in STATISTIC_NAMES;
}

/** A row value as a number: a number, a date's time, a numeric string, or NaN. */
export function numericValue(value: unknown): number {
  if (value instanceof Date) return +value;
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return NaN;
}

/**
    A statistic of a list of numbers (the finite ones), or NaN when it has
    none.
    @param stat The statistic.
    @param values The numbers.
*/
export function statisticOf(
  stat: ReferenceStatistic,
  values: number[],
): number {
  const nums = values.filter(Number.isFinite);
  if (!nums.length) return NaN;
  if (stat === "min") return Math.min(...nums);
  if (stat === "max") return Math.max(...nums);
  if (stat === "mean") return nums.reduce((a, b) => a + b, 0) / nums.length;
  const sorted = nums.slice().sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
    The rows the chart draws (none without data).
    @param viz The chart.
*/
export function drawnRows(viz: VizInstance): DrawnRow[] {
  if (!viz._filteredData?.length) return [];
  return (viz._formattedData ?? []) as unknown as DrawnRow[];
}

/**
    The rows of each series, in the order the series first appear.
    @param rows The drawn rows.
*/
export function seriesRows(rows: DrawnRow[]): DrawnRow[][] {
  const out = new Map<string, DrawnRow[]>();
  rows.forEach(d => {
    const list = out.get(d.id);
    if (list) list.push(d);
    else out.set(d.id, [d]);
  });
  return Array.from(out.values());
}

/** A comparable key for an axis value. */
const valueKey = (v: unknown): string => (v instanceof Date ? `${+v}` : `${v}`);

/**
    The numbers the rows draw on an axis: each row's own value, or, with
    `stackBy` (a stacked chart's value axis), the total of each stack (the
    rows sharing a value on the `stackBy` axis).
    @param rows The rows.
    @param axis The axis.
    @param stackBy The axis whose values group the stacks.
*/
export function axisNumbers(
  rows: DrawnRow[],
  axis: AnnotationAxis,
  stackBy?: AnnotationAxis,
): number[] {
  if (!stackBy) return rows.map(d => numericValue(d[axis]));
  const totals = new Map<string, number>();
  rows.forEach(d => {
    const v = numericValue(d[axis]);
    if (!Number.isFinite(v)) return;
    const key = valueKey(d[stackBy]);
    totals.set(key, (totals.get(key) ?? 0) + v);
  });
  return Array.from(totals.values());
}

/** Whether any row draws a value on an axis as a Date. */
const timeAxis = (rows: DrawnRow[], axis: AnnotationAxis): boolean =>
  rows.some(d => d[axis] instanceof Date);

/** Whether a statistic's name is a category the rows draw on an axis, so it reads as that category. */
const isCategory = (
  rows: DrawnRow[],
  axis: AnnotationAxis,
  value: unknown,
): boolean => rows.some(d => d[axis] === value);

/** Whether a reference value is computed from the rows: a statistic or a function. */
export function isComputed(
  value: unknown,
  rows: DrawnRow[],
  axis: AnnotationAxis,
): boolean {
  return (
    typeof value === "function" ||
    (isStatistic(value) && !isCategory(rows, axis, value))
  );
}

/**
    The axis whose values group a stacked chart's stacks, when `axis` is
    its stacked value axis.
    @param viz The chart.
    @param axis The axis a value is on.
*/
export function stackAxis(
  viz: VizInstance,
  axis: AnnotationAxis,
): AnnotationAxis | undefined {
  if (!viz.schema.stacked) return undefined;
  const discrete = vizDiscrete(viz) || "x";
  const value = discrete === "x" ? "y" : "x";
  return axis === value ? discrete : undefined;
}

/**
    A reference value resolved against rows: a statistic of their values on
    `axis` (a Date on a time axis), a function's result, or the value
    itself. Null when a statistic or function finds no value.
    @param value The reference value.
    @param rows The rows.
    @param axis The axis it is on.
    @param stackBy The axis grouping the stacks, on a stacked value axis.
*/
export function resolveValue(
  value: unknown,
  rows: DrawnRow[],
  axis: AnnotationAxis,
  stackBy?: AnnotationAxis,
): AnnotationValue | null {
  if (typeof value === "function") {
    const out = (value as (rows: DataPoint[]) => unknown)(
      rows.map(d => d.data),
    );
    return out === undefined || out === null || out === ""
      ? null
      : (out as AnnotationValue);
  }
  if (!isComputed(value, rows, axis)) return value as AnnotationValue;
  const n = statisticOf(
    value as ReferenceStatistic,
    axisNumbers(rows, axis, stackBy),
  );
  if (!Number.isFinite(n)) return null;
  return timeAxis(rows, axis) ? new Date(n) : n;
}

/** The color a series draws in: its first row's fill. */
export function seriesColor(
  viz: VizInstance,
  row: DrawnRow,
): string | undefined {
  const fill = viz.schema.shapeConfig?.fill;
  const c = typeof fill === "function" ? fill(row.data, row.i) : fill;
  return typeof c === "string" ? c : undefined;
}

/** The axis a reference line is on: the first of `x`, `y`, `x2`, `y2` it sets. */
const AXES: AnnotationAxis[] = ["x", "y", "x2", "y2"];
const lineAxis = (entry: Annotation): AnnotationAxis | undefined =>
  AXES.find(a => entry[a] !== undefined && entry[a] !== null);

/**
    A line's label: a function's result for its value and rows, the label
    it sets, else a computed line's default (the series' name for a
    per-series line, the statistic's translated name otherwise).
*/
function lineLabel(
  viz: VizInstance,
  entry: Annotation,
  value: AnnotationValue,
  rows: DrawnRow[],
  computed: {raw: unknown; series?: DrawnRow},
): unknown {
  const {label} = entry;
  if (typeof label === "function")
    return label(
      value,
      rows.map(d => d.data),
    );
  if (label !== undefined) return label;
  if (computed.series)
    return viz._drawLabel(computed.series.data, computed.series.i);
  return isStatistic(computed.raw)
    ? viz.schema.translate(STATISTIC_NAMES[computed.raw])
    : undefined;
}

/**
    Resolves one reference line against the drawn rows: a constant line
    stays one line; a statistic or function becomes one line over every row,
    or one per series (`perSeries`), each in its series' color. Each
    resolved line keeps the rows it concerns as `drawnRows`; lines with no
    value are dropped.
    @param viz The chart.
    @param entry The reference line.
    @param rows The drawn rows.
*/
export function resolveReferenceLine(
  viz: VizInstance,
  entry: Annotation,
  rows: DrawnRow[],
): Annotation[] {
  const axis = lineAxis(entry);
  if (!axis) return [entry];
  const raw = entry[axis];
  const make = (
    value: AnnotationValue | null,
    group: DrawnRow[],
    series?: DrawnRow,
  ): Annotation[] => {
    if (value === null) return [];
    const out: Annotation = {...entry, [axis]: value, drawnRows: group};
    const label = lineLabel(viz, entry, value, group, {raw, series});
    if (label === undefined) delete out.label;
    else out.label = label;
    if (series && entry.stroke === undefined) {
      const stroke = seriesColor(viz, series);
      if (stroke) out.stroke = stroke;
    }
    return [out];
  };
  if (!isComputed(raw, rows, axis)) return make(raw as AnnotationValue, rows);
  if (entry.perSeries) {
    // A series' line dragged to a value of its own keeps it.
    const own = (entry.seriesValues ?? {}) as Record<string, unknown>;
    return seriesRows(rows).flatMap(group => {
      const {id} = group[0];
      const value =
        own[id] !== undefined
          ? (own[id] as AnnotationValue)
          : resolveValue(raw, group, axis);
      return make(value, group, group[0]).map(d => ({...d, [DRAG_SERIES]: id}));
    });
  }
  return make(resolveValue(raw, rows, axis, stackAxis(viz, axis)), rows);
}

/**
    Resolves reference lines against the chart's drawn rows (see
    `resolveReferenceLine`).
    @param viz The chart.
    @param entries The reference line annotations.
*/
export function resolveReferenceLines(
  viz: VizInstance,
  entries: Annotation[],
): Annotation[] {
  const rows = drawnRows(viz);
  return entries.flatMap(entry => resolveReferenceLine(viz, entry, rows));
}

/**
    Resolves each end of a reference band (on every axis it sets) against
    the drawn rows, dropping a band with an end that finds no value.
    @param viz The chart.
    @param entries The reference band annotations.
*/
export function resolveReferenceBands(
  viz: VizInstance,
  entries: Annotation[],
): Annotation[] {
  const rows = drawnRows(viz);
  return entries.flatMap(entry => {
    const out: Annotation = {...entry};
    for (const axis of AXES) {
      const ends = entry[axis];
      if (!Array.isArray(ends)) continue;
      const stackBy = stackAxis(viz, axis);
      const resolved = ends
        .slice(0, 2)
        .map(v => resolveValue(v, rows, axis, stackBy));
      if (resolved.some(v => v === null)) return [];
      out[axis] = resolved;
    }
    return [out];
  });
}
