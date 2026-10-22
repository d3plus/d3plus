/**
    Waterfall's per-instance state: the user's axis accessors and each drawn
    row's step, laid out lazily for whichever rows Plot is drawing (the whole
    frame, or one small-multiples panel).
*/
import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";

import type {VizInstance} from "../viz/vizTypes.js";
import {
  compareCategories,
  finite,
  stepValue,
  waterfallSteps,
  type RowAccessor,
  type WaterfallKind,
  type WaterfallStep,
} from "./steps.js";

/** The key a legend entry stores its step kind under. */
export const KIND_KEY = "__d3plusWaterfallKind";

/** Per-instance state kept on `viz.ctx.waterfall`. */
export interface WaterfallState {
  /** The user's `x` and `y` accessors, before the value axis reads subtotals. */
  accessors: {x: RowAccessor; y: RowAccessor};
  /** Each laid-out row's step. */
  steps: WeakMap<DataPoint, WaterfallStep>;
  /** Row arrays already laid out. */
  laidOut: WeakSet<DataPoint[]>;
  /** The top-down category order the chart last gave a horizontal waterfall's `ySort`. */
  ySort?: (a: DataPoint, b: DataPoint) => number;
}

export const waterfallState = (viz: VizInstance): WaterfallState =>
  viz.ctx.waterfall as WaterfallState;

/** The axis holding categories: "x" for vertical bars, "y" for horizontal ones. */
export const categoryAxis = (viz: VizInstance): "x" | "y" =>
  viz.schema.discrete === "y" ? "y" : "x";

/** The axis holding values. */
export const valueAxis = (viz: VizInstance): "x" | "y" =>
  categoryAxis(viz) === "x" ? "y" : "x";

/** Unwraps Plot's shape, label, and legend wrappers down to the source row. */
export function sourceRow(d: DataPoint | undefined): DataPoint | undefined {
  while (d && (d.__d3plus__ || d.__d3plusShape__) && d.data)
    d = d.data as DataPoint;
  return d;
}

/**
    Which series a row's running total belongs to: its groupBy ids down to the
    drawn depth, within its small-multiples panel and, when every frame is
    laid out at once, its time frame.
*/
function seriesAccessor(
  viz: VizInstance,
  rows: DataPoint[],
  frames: boolean,
): RowAccessor {
  const facet =
    typeof viz.schema.facet === "function"
      ? (viz.schema.facet as RowAccessor)
      : undefined;
  const time =
    frames && typeof viz.schema.time === "function"
      ? (viz.schema.time as RowAccessor)
      : undefined;
  const category = waterfallState(viz).accessors[categoryAxis(viz)];
  // A time axis already orders the steps; it splits nothing.
  const byTime =
    time && rows.length && time(rows[0], 0) !== category(rows[0], 0)
      ? time
      : undefined;
  return (d, i) => {
    const parts = [
      viz
        ._ids(d, i)
        .slice(0, (viz._drawDepth ?? 0) + 1)
        .join("_"),
    ];
    if (facet) parts.unshift(`${facet(d, i)}`);
    if (byTime) parts.unshift(`${byTime(d, i)}`);
    return parts.join("|");
  };
}

/** The user's category sort, if any; the chart's own top-down order runs forward. */
function categorySort(
  viz: VizInstance,
): ((a: DataPoint, b: DataPoint) => number) | undefined {
  const sort = viz.schema[`${categoryAxis(viz)}Sort`];
  return typeof sort === "function" && sort !== waterfallState(viz).ySort
    ? sort
    : undefined;
}

/** A category's key: dates by time, everything else as text. */
const categoryKey = (c: unknown): string =>
  c instanceof Date ? `${+c}` : `${c}`;

/**
    Each category's position in waterfall order: first appearance in `rows`,
    with categories that read as numbers (or dates) in ascending order.
*/
export function categoryRanks(
  rows: DataPoint[],
  category: RowAccessor,
): Map<string, number> {
  const seen = new Map<string, unknown>();
  rows.forEach((d, i) => {
    const c = category(d, i);
    const key = categoryKey(c);
    if (!seen.has(key)) seen.set(key, c);
  });
  const ordered = Array.from(seen.entries()).sort((a, b) =>
    compareCategories(a[1], b[1]),
  );
  return new Map(ordered.map(([key], i) => [key, i]));
}

/**
    A `ySort` that lists categories bottom-up in reverse waterfall order, so a
    horizontal waterfall reads from the top down.
*/
export function topDownSort(ranks: Map<string, number>, category: RowAccessor) {
  const rank = (d: DataPoint) => ranks.get(categoryKey(category(d, 0))) ?? -1;
  return (a: DataPoint, b: DataPoint): number => rank(b) - rank(a);
}

/**
    Gives a horizontal waterfall a top-down `ySort` unless the user set one,
    and takes it back when the bars turn vertical.
*/
export function syncCategorySort(viz: VizInstance): void {
  const state = waterfallState(viz);
  const current = viz.schema.ySort;
  if (current !== undefined && current !== state.ySort) {
    state.ySort = undefined;
    return;
  }
  if (categoryAxis(viz) === "y") {
    viz.schema.ySort = state.ySort = topDownSort(
      categoryRanks(viz._data || [], state.accessors.y),
      state.accessors.y,
    );
  } else if (state.ySort) {
    viz.schema.ySort = state.ySort = undefined;
  }
}

/** Lays out `rows` as waterfall steps, once per array. */
function layOut(
  viz: VizInstance,
  rows: DataPoint[] | undefined,
  frames: boolean,
): void {
  const state = waterfallState(viz);
  if (!rows || !rows.length || state.laidOut.has(rows)) return;
  state.laidOut.add(rows);
  const steps = waterfallSteps(rows, {
    category: state.accessors[categoryAxis(viz)],
    series: seriesAccessor(viz, rows, frames),
    value: state.accessors[valueAxis(viz)],
    subtotal: viz.schema.subtotal as RowAccessor | undefined,
    sort: categorySort(viz),
  });
  steps.forEach((step, d) => state.steps.set(d, step));
}

/** Starts a fresh layout for a new draw. */
export function resetSteps(viz: VizInstance): void {
  const state = waterfallState(viz);
  state.steps = new WeakMap();
  state.laidOut = new WeakSet();
}

/** The step a row (or a wrapper around one) draws, if any. */
export function stepOf(
  viz: VizInstance,
  d: DataPoint | undefined,
): WaterfallStep | undefined {
  const row = sourceRow(d);
  if (!row) return undefined;
  layOut(viz, viz._filteredData, false);
  if (viz._axisPersist) layOut(viz, viz._data, true);
  return waterfallState(viz).steps.get(row);
}

/** The kind a bar or legend entry stands for. */
export function kindOf(
  viz: VizInstance,
  d: DataPoint | undefined,
): WaterfallKind | undefined {
  const row = sourceRow(d);
  if (!row) return undefined;
  const own = row[KIND_KEY];
  return typeof own === "string"
    ? (own as WaterfallKind)
    : stepOf(viz, row)?.kind;
}

/** A legend entry's kind; undefined for any other row. */
export function legendKind(
  d: DataPoint | undefined,
): WaterfallKind | undefined {
  const own = sourceRow(d)?.[KIND_KEY];
  return typeof own === "string" ? (own as WaterfallKind) : undefined;
}

/** Formats a value as the value axis does: its `tickFormat`, else abbreviated. */
export function valueFormat(viz: VizInstance): (n: number) => string {
  const config = viz[`_${valueAxis(viz)}Config`] as
    {tickFormat?: (d: number) => string} | undefined;
  if (config && typeof config.tickFormat === "function")
    return config.tickFormat;
  return (n: number) => formatAbbreviate(n, viz.schema.locale);
}

/** The accessors `interceptAxes` installs, so installing again keeps the user's. */
const interceptors = new WeakSet<RowAccessor>();

/**
    Routes reads of `viz._x` / `viz._y` through the waterfall: on the value
    axis, a subtotal row without its own value reports the running total it
    shows. Writes (`x()` / `y()`) keep replacing the user's accessor.
*/
export function interceptAxes(viz: VizInstance): void {
  const state = waterfallState(viz);
  (["x", "y"] as const).forEach(axis => {
    const key = `_${axis}` as "_x" | "_y";
    const current = viz[key] as RowAccessor;
    if (!interceptors.has(current)) state.accessors[axis] = current;
    const read: RowAccessor = (d, i) => {
      const raw = state.accessors[axis](d, i);
      if (valueAxis(viz) !== axis || finite(raw) !== undefined) return raw;
      return stepValue(raw, stepOf(viz, d));
    };
    interceptors.add(read);
    Object.defineProperty(viz, key, {
      configurable: true,
      enumerable: true,
      get: () => read,
      set: (fn: RowAccessor) => {
        if (!interceptors.has(fn)) state.accessors[axis] = fn;
      },
    });
  });
}
