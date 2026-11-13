/**
    Pareto's per-instance state and the plumbing that lets one cumulative
    line ride along with the bars: the line's rows are added to each draw's
    rows, and the chart's accessors (axes, `groupBy`, labels) read them as
    one series on the secondary value axis.

    @module
*/
import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";

import {fieldNameOf, markField} from "../../utils/fieldAccessor.js";
import {INTERNAL_KEY_PREFIX} from "../features/shareKey.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {
  categoryKey,
  paretoComparator,
  paretoSteps,
  type ParetoStep,
  type RowAccessor,
} from "./paretoSteps.js";

/** The key a cumulative-line row keeps its step under. */
export const LINE_KEY = `${INTERNAL_KEY_PREFIX}ParetoLine`;

type Axis = "x" | "y" | "x2" | "y2";
const AXES: Axis[] = ["x", "y", "x2", "y2"];

/** Per-instance state kept on `viz.ctx.pareto`. */
export interface ParetoState {
  /** The user's axis accessors, behind the ones the chart reads. */
  accessors: Record<Axis, RowAccessor>;
  /** Each row array's steps, computed once. */
  steps: WeakMap<DataPoint[], ParetoStep[]>;
  /**
      The order every small-multiples panel shares when panels share
      scales: the categories of every panel's rows, largest total first.
  */
  pooled?: ParetoStep[];
  /** The category comparator the chart installed, and on which axis. */
  sort?: {axis: "x" | "y"; compare: (a: DataPoint, b: DataPoint) => number};
  /** The secondary axis title last set automatically. */
  title?: string;
}

export const paretoState = (viz: VizInstance): ParetoState =>
  viz.ctx.pareto as ParetoState;

/** The axis holding categories: "x" for upright bars, "y" for horizontal ones. */
export const categoryAxis = (viz: VizInstance): "x" | "y" =>
  viz.schema.discrete === "y" ? "y" : "x";

/** The axis holding the bars' values. */
export const valueAxis = (viz: VizInstance): "x" | "y" =>
  categoryAxis(viz) === "x" ? "y" : "x";

/** The secondary axis the cumulative line is drawn on: "y2" (right) or "x2" (top). */
export const shareAxis = (viz: VizInstance): "x2" | "y2" =>
  categoryAxis(viz) === "x" ? "y2" : "x2";

/** Unwraps Plot's shape, label, and legend wrappers down to the source row. */
export function sourceRow(d: DataPoint | undefined): DataPoint | undefined {
  while (d && (d.__d3plus__ || d.__d3plusShape__) && d.data)
    d = d.data as DataPoint;
  return d;
}

/** The step a cumulative-line row draws; undefined for any other row. */
export function lineStep(d: DataPoint | undefined): ParetoStep | undefined {
  return sourceRow(d)?.[LINE_KEY] as ParetoStep | undefined;
}

/** Whether a row (or a wrapper around one) is a point of the cumulative line. */
export const isLineRow = (d: DataPoint | undefined): boolean =>
  lineStep(d) !== undefined;

/** A cumulative-line row for a step. */
export const lineRow = (step: ParetoStep): DataPoint =>
  ({[LINE_KEY]: step}) as unknown as DataPoint;

/** A 0–1 share as a percentage, such as "42%". */
export function percentFormat(viz: VizInstance): (share: number) => string {
  return (share: number) =>
    `${formatAbbreviate(share * 100, viz.schema.locale)}%`;
}

/** The cumulative line's name, translated. */
export const lineLabel = (viz: VizInstance): string =>
  viz.schema.translate("Cumulative Share");

/**
    A row's category: the user's category accessor, except a `threshold`
    bucket, which is its own category named by its label.
*/
export function categoryOf(viz: VizInstance, d: DataPoint, i: number): unknown {
  const row = sourceRow(d)!;
  const step = lineStep(row);
  if (step) return step.category;
  if (row._isAggregation) return viz._drawLabel(row, i);
  return paretoState(viz).accessors[categoryAxis(viz)](row, i);
}

/** A bar row's value: the user's accessor on the value axis. */
export function valueOf(viz: VizInstance, d: DataPoint, i: number): unknown {
  return paretoState(viz).accessors[valueAxis(viz)](sourceRow(d)!, i);
}

/** The accessors `interceptAxes` installs, so installing again keeps the user's. */
const interceptors = new WeakSet<RowAccessor>();

/** What a chart axis reads for a row: categories and values for bars, the line's own points. */
function axisReader(viz: VizInstance, axis: Axis, user: RowAccessor) {
  const read: RowAccessor = (d, i) => {
    const step = lineStep(d);
    if (step) {
      if (axis === categoryAxis(viz)) return step.category;
      return axis === shareAxis(viz) ? step.cumulativeShare : undefined;
    }
    if (axis === categoryAxis(viz)) return categoryOf(viz, d, i);
    return user(d, i);
  };
  interceptors.add(read);
  // Missing-field warnings still name the user's field.
  const field = fieldNameOf(user);
  return field ? markField(read, field) : read;
}

/**
    Routes reads of `viz._x`, `_y`, `_x2`, and `_y2` through the chart: a
    cumulative-line row reports its category and its running share (on the
    secondary value axis), and a `threshold` bucket its own category. Writes
    (`x()`, `y2()`, …) keep replacing the user's accessor.
*/
export function interceptAxes(viz: VizInstance): void {
  const state = paretoState(viz);
  AXES.forEach(axis => {
    const key = `_${axis}` as "_x" | "_y" | "_x2" | "_y2";
    const current = viz[key] as RowAccessor;
    if (!interceptors.has(current)) state.accessors[axis] = current;
    let read = axisReader(viz, axis, state.accessors[axis]);
    Object.defineProperty(viz, key, {
      configurable: true,
      enumerable: true,
      get: () => read,
      set: (fn: RowAccessor) => {
        if (interceptors.has(fn)) return;
        state.accessors[axis] = fn;
        read = axisReader(viz, axis, fn);
      },
    });
  });
}

/** The `groupBy` accessors `wrapGroupBy` installed, by the user's accessor. */
const groupWrappers = new WeakMap<RowAccessor, RowAccessor>();
const wrappedGroups = new WeakSet<RowAccessor>();

/**
    Wraps each `groupBy` accessor so a cumulative-line row reads as one
    series, named after the line, at every level.
*/
export function wrapGroupBy(viz: VizInstance): void {
  const groupBy = (viz.schema.groupBy || []) as RowAccessor[];
  viz.schema.groupBy = groupBy.map(g => {
    if (wrappedGroups.has(g)) return g;
    let wrapped = groupWrappers.get(g);
    if (!wrapped) {
      wrapped = (d, i) => (isLineRow(d) ? lineLabel(viz) : g(d, i));
      const field = fieldNameOf(g);
      if (field) markField(wrapped, field);
      wrappedGroups.add(wrapped);
      groupWrappers.set(g, wrapped);
    }
    return wrapped;
  });
}

/** Names a cumulative-line row after the line in every label `_drawLabel` builds. */
export function wrapDrawLabel(viz: VizInstance): void {
  const base = viz._drawLabel;
  viz._drawLabel = (d: DataPoint, i: number, depth?: number) =>
    isLineRow(d) ? lineLabel(viz) : base(d, i, depth);
}

/** The rows that draw bars: every row but the cumulative line's. */
export const barRows = (rows: DataPoint[] | undefined): DataPoint[] =>
  (rows || []).filter(d => !isLineRow(d));

/**
    The steps for the bars among `rows`, computed once per array: in the
    category axis's own order when the user sorts it, in the order the
    small-multiples panels share when they share scales, else largest first.
*/
export function stepsFor(
  viz: VizInstance,
  rows: DataPoint[] | undefined,
): ParetoStep[] {
  const list = rows || [];
  const state = paretoState(viz);
  let steps = state.steps.get(list);
  if (!steps) {
    const axis = categoryAxis(viz);
    const sort = viz.schema[`${axis}Sort`];
    const userSort =
      typeof sort === "function" && sort !== state.sort?.compare
        ? (sort as (a: DataPoint, b: DataPoint) => number)
        : undefined;
    const category = (d: DataPoint, i: number) => categoryOf(viz, d, i);
    const pooled = state.pooled;
    steps = paretoSteps(barRows(list), {
      category,
      value: (d, i) => valueOf(viz, d, i),
      other: d => Boolean(d._isAggregation),
      order:
        userSort ??
        (pooled
          ? paretoComparator(
              () => pooled,
              d => category(d, 0),
            )
          : undefined),
    });
    state.steps.set(list, steps);
  }
  return steps;
}

/**
    The rows a draw paints: the bars among `rows`, then one cumulative-line
    row per category, in Pareto order.
*/
export function withLineRows(
  viz: VizInstance,
  rows: DataPoint[] | undefined,
): DataPoint[] {
  const bars = barRows(rows);
  return bars.length ? [...bars, ...stepsFor(viz, bars).map(lineRow)] : bars;
}

/** The step a bar or line point belongs to, in the rows being drawn. */
export function stepOf(
  viz: VizInstance,
  d: DataPoint | undefined,
  i = 0,
): ParetoStep | undefined {
  const own = lineStep(d);
  if (own) return own;
  const row = sourceRow(d);
  if (!row) return undefined;
  const key = categoryKey(categoryOf(viz, row, i));
  return stepsFor(viz, viz._filteredData).find(s => s.key === key);
}
