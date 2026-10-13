/**
    Variable bar widths (`barWidth`, #437). Each bar along the discrete axis
    is as wide as its own measure, and the bars are laid end to end from
    zero, so that axis becomes a continuous scale of cumulative width: bars
    fill their spans (see discreteSpan.ts), each category is labeled at its
    bar's center, and ticks mark the bar edges.
*/
import {merge} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate, formatDate} from "@d3plus/format";

import accessor from "../../utils/accessor.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** A formatted Plot row. */
type Row = Record<string, unknown>;
/** A `barWidth` accessor, read off each bar's merged datum. */
export type BarWidthAccessor = (d: DataPoint, i?: number) => unknown;
/** A d3plus `aggs` map. */
type Aggs = Parameters<typeof merge>[1];

/** One bar's extent along a variable-width discrete axis. */
export interface BarSpan {
  /** The bar's discrete-axis value (its category). */
  value: unknown;
  /** The bar's width measure. */
  size: number;
  start: number;
  end: number;
  /** The bar's center, where its rows are plotted and its label sits. */
  mid: number;
}

/** A bar before layout: its category, width measure, and merged datum. */
export interface MeasuredBar {
  value: unknown;
  size: number;
  data: DataPoint;
}

/** The variable-width layout of one draw. */
export interface BarSpanLayout {
  axis: "x" | "y";
  spans: BarSpan[];
  /** The sum of every bar's width. */
  total: number;
  /** Each plotted source datum's bar. */
  byDatum: WeakMap<object, BarSpan>;
}

/** Labels for `barWidth` accessors that aren't a plain data key. */
const accessorLabels = new WeakMap<object, {key?: string; text?: string}>();

/** `discreteExtent` functions installed by this module, so others are left alone. */
const ownExtents = new WeakSet<object>();

/** A discrete value's identity: dates by time, everything else by its string. */
export const barKey = (v: unknown): string => (v instanceof Date ? String(v.getTime()) : String(v));

/**
    Coerces a `barWidth` setter argument: a data key becomes an accessor that
    remembers its key (for tooltips), a function is kept, anything falsy
    turns variable widths off.
*/
export function barWidthAccessor(value: unknown): BarWidthAccessor | undefined {
  if (typeof value === "function") return value as BarWidthAccessor;
  if (typeof value === "string" && value) {
    const fn = accessor(value) as BarWidthAccessor;
    accessorLabels.set(fn, {key: value});
    return fn;
  }
  return undefined;
}

/** Names a `barWidth` accessor in tooltips with a translatable `text`. */
export function labelBarWidth(fn: BarWidthAccessor, text: string): BarWidthAccessor {
  accessorLabels.set(fn, {text});
  return fn;
}

/**
    Groups `rows` into bars by their `axis` value, in first-seen order, and
    measures each bar by calling `measure` on the merge of its rows' data
    (numbers sum unless `aggs` says otherwise).
*/
export function measureBars(
  rows: Row[],
  axis: "x" | "y",
  measure: BarWidthAccessor,
  aggs: Aggs = {},
): MeasuredBar[] {
  const bars = new Map<string, {value: unknown; data: DataPoint[]}>();
  for (const row of rows) {
    if (!row.data) continue;
    const key = barKey(row[axis]);
    const bar = bars.get(key);
    if (bar) bar.data.push(row.data as DataPoint);
    else bars.set(key, {value: row[axis], data: [row.data as DataPoint]});
  }
  return Array.from(bars.values(), ({value, data}) => {
    const merged = data.length === 1 ? data[0] : (merge(data, aggs) as DataPoint);
    return {value, size: Number(measure(merged, 0)), data: merged};
  });
}

/**
    Lays bars end to end from zero, in order. Bars without a positive, finite
    width are dropped.
*/
export function layoutBarSpans(bars: {value: unknown; size: number}[]): BarSpan[] {
  let start = 0;
  return bars
    .filter(b => Number.isFinite(b.size) && b.size > 0)
    .map(({value, size}) => {
      const end = start + size;
      const span = {value, size, start, end, mid: (start + end) / 2};
      start = end;
      return span;
    });
}

/** Clears a previous draw's variable-width layout. */
function clearBarSpans(viz: VizInstance): void {
  viz._barSpans = undefined;
  if (viz._discreteExtent && ownExtents.has(viz._discreteExtent)) viz._discreteExtent = undefined;
}

/**
    Applies `barWidth` to the formatted Plot rows: measures each bar over
    `axisData`, lays the bars out (in `xSort`/`ySort` order when set), moves
    every row to its bar's center, and drops rows whose bar has no width.
    Records the layout on `viz._barSpans` and spans the discrete axis with it.
    Returns the placed `[formattedData, axisData]`.
*/
export function applyBarWidths(viz: VizInstance, formattedData: Row[], axisData: Row[]): [Row[], Row[]] {
  const measure = viz.schema.barWidth as BarWidthAccessor | undefined;
  const axis = viz.schema.discrete;
  const foreignExtent = viz._discreteExtent && !ownExtents.has(viz._discreteExtent);
  if (typeof measure !== "function" || (axis !== "x" && axis !== "y") || foreignExtent) {
    clearBarSpans(viz);
    return [formattedData, axisData];
  }

  const bars = measureBars(axisData, axis, measure, viz.schema.aggs);
  const sort = viz.schema[`${axis}Sort`] as ((a: DataPoint, b: DataPoint) => number) | undefined;
  if (sort) bars.sort((a, b) => sort(a.data, b.data));
  const spans = layoutBarSpans(bars);
  const byKey = new Map(spans.map(s => [barKey(s.value), s]));
  const byDatum = new WeakMap<object, BarSpan>();
  const place = (rows: Row[]) =>
    rows.filter(row => {
      const span = byKey.get(barKey(row[axis]));
      if (!span) return false;
      if (row.data) byDatum.set(row.data as object, span);
      row[axis] = span.mid;
      return true;
    });
  const placed = place(formattedData);
  const placedAxis = axisData === formattedData ? placed : place(axisData);

  const layout: BarSpanLayout = {
    axis,
    spans,
    total: spans.length ? spans[spans.length - 1].end : 0,
    byDatum,
  };
  viz._barSpans = layout;
  // The axis is a linear scale of cumulative width, even for date categories.
  if (axis === "x") viz._xTime = false;
  else viz._yTime = false;
  const extent = (d: DataPoint): [number, number] => {
    const span = layout.byDatum.get(d);
    return span ? [span.start, span.end] : [0, 0];
  };
  ownExtents.add(extent);
  viz._discreteExtent = extent;
  return [placed, placedAxis];
}

/** A category's axis label. */
function categoryLabel(value: unknown): string {
  return value instanceof Date ? formatDate(value, [value]) : String(value);
}

/**
    Axis config for a variable-width discrete axis: each category labeled at
    its bar's center. Empty for any other axis.
*/
export function barSpanAxisConfig(viz: VizInstance, axis: "x" | "y"): Record<string, unknown> {
  const layout = viz._barSpans;
  if (!layout || layout.axis !== axis) return {};
  const labels = new Map(layout.spans.map(s => [s.mid, categoryLabel(s.value)]));
  return {
    labels: layout.spans.map(s => s.mid),
    tickFormat: (v: number) => labels.get(v) ?? "",
  };
}

/** The tooltip name of the current `barWidth` measure. */
export function barWidthLabel(viz: VizInstance): string {
  const fn = viz.schema.barWidth as BarWidthAccessor | undefined;
  const label = fn ? accessorLabels.get(fn) : undefined;
  if (label?.key) return label.key;
  return viz.schema.translate(label?.text ?? "Width");
}

/**
    The tooltip row for a variable-width bar's datum: its width measure and
    that width's share of every bar's combined width. Empty when `d` isn't a
    plotted bar datum.
*/
export function barWidthTooltipRows(viz: VizInstance, d: DataPoint): [string, string][] {
  const layout = viz._barSpans;
  const span = layout && d && typeof d === "object" ? layout.byDatum.get(d) : undefined;
  if (!layout || !span) return [];
  const locale = viz.schema.locale;
  const share = layout.total ? `${formatAbbreviate((span.size / layout.total) * 100, locale)}%` : "";
  return [[barWidthLabel(viz), `${formatAbbreviate(span.size, locale)}${share ? ` (${share})` : ""}`]];
}

/**
    The series that sit side by side within each bar: every row's `group`,
    in first-seen order, when any bar holds more than one (unstacked series);
    empty when every bar is a single shape or a single stack.
*/
export function barSeries(rows: Row[], axis: "x" | "y"): unknown[] {
  const perBar = new Map<string, Set<unknown>>();
  const series = new Set<unknown>();
  let split = false;
  for (const row of rows) {
    const key = barKey(row[axis]);
    const groups = perBar.get(key) ?? new Set<unknown>();
    groups.add(row.group);
    perBar.set(key, groups);
    series.add(row.group);
    if (groups.size > 1) split = true;
  }
  return split ? Array.from(series) : [];
}

/**
    One series' slot within a bar `space` pixels wide that `count` series
    share, the way grouped bars split a band: each is
    `(space - padding * count - 1) / count` wide (at least 1px), the first
    flush with the bar's start and the last with its end. Returns the slot's
    width and its center's offset from the bar's center.
*/
export function seriesSlot(
  space: number,
  count: number,
  index: number,
  padding: number,
): {size: number; offset: number} {
  const size = Math.max(1, (space - padding * count - 1) / count);
  if (count < 2) return {size, offset: 0};
  const reach = Math.max(0, space - size) / 2;
  return {size, offset: -reach + (index * reach * 2) / (count - 1)};
}
