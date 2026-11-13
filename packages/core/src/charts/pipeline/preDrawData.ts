/**
    The data half of `vizPreDraw`: the synthesized time filter and the
    filter + rollup that produce a draw's `filteredData` and `legendData`.
    Small multiples run the same steps over each panel's rows.
*/

import {rollup} from "d3-array";

import {merge} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";
import {date} from "@d3plus/dom";

import {brushSpan} from "../../components/Timeline/brushSpan.js";
import type {BrushSpan} from "../../components/Timeline/brushSpan.js";
import {DATA_ORDER} from "../Plot/orderPath.js";
import {discreteNestKeys} from "./stages.js";
import type {VizInstance as Viz} from "../viz/vizTypes.js";

/** A time filter synthesized from the chart's `time` key. */
export type TimeFilterFn =
  ((d: DataPoint, i: number) => boolean) | (() => boolean);

/** The rows `computeFilteredData` collects for a draw. */
export interface VizPreDrawResult {
  /** The drawn rows, before the chart's threshold runs. */
  filteredData?: DataPoint[];
  /** One row per group, hidden groups included. */
  legendData?: DataPoint[];
  /** The d3-array `rollup` result `viz._thresholdFunction(data, tree)` walks. */
  _thresholdTree?: unknown;
}

/**
    The `filter` the pipeline runs over `viz._data`: the configured `filter`,
    passing the rows the chart has already filtered (see `_filterApplied`).
*/
export function dataFilter(
  viz: Viz,
): ((d: DataPoint, i: number) => boolean) | undefined {
  const filter = viz.schema.filter as
    ((d: DataPoint, i: number) => boolean) | undefined;
  const applied = viz._filterApplied;
  return filter && applied ? (d, i) => applied(d) || filter(d, i) : filter;
}

/**
    The span the chart's timeline holds its selection to (see `brushSpan`):
    any span without a timeline, and at least one period when it selects a
    single period (`brushing: false`).
*/
function timelineSpan(viz: Viz): BrushSpan {
  if (!viz.schema.timeline) return {min: 1, max: Infinity};
  const config = (viz.schema.timelineConfig || {}) as Record<string, unknown>;
  const span = brushSpan(config.brushMin, config.brushMax);
  return config.brushing === false ? {...span, min: 1} : span;
}

/** A filter keeping the latest `count` of `dates`' periods, or every row. */
function latestPeriods(viz: Viz, dates: Date[], count: number): TimeFilterFn {
  const periods = [...new Set(dates.map(Number))].sort((a, b) => a - b);
  if (periods.length <= count) return () => true;
  const from = periods[periods.length - count];
  const snapTime = viz.schema.time;
  return (d: DataPoint, i: number) => +date(snapTime(d, i))! >= from;
}

/**
    The period a chart's timeline starts on, earliest first: `timelineDefault`,
    else `timelineConfig.selection` (a date or a pair of dates), else
    undefined.
*/
export function startingSelection(viz: Viz): Date[] | undefined {
  const config = (viz.schema.timelineConfig || {}) as Record<string, unknown>;
  const start =
    viz.schema.timelineDefault && viz.schema.timelineDefault.length
      ? viz.schema.timelineDefault
      : config.selection;
  if (start === undefined || start === null || start === false) return;
  const dates = ([] as unknown[])
    .concat(start)
    .map(d => date(d as Parameters<typeof date>[0]))
    .filter((d): d is Date => d instanceof Date && !isNaN(+d))
    .sort((a, b) => +a - +b);
  return dates.length ? [dates[0], dates[dates.length - 1]] : undefined;
}

/**
    Computes a NEW timeFilter when `time` is set but `timeFilter` isn't and
    data exists; returns undefined otherwise. It keeps the timeline's
    `startingSelection`, or else the latest period(s).
*/
export function computeTimeFilter(viz: Viz): TimeFilterFn | undefined {
  let computedTimeFilter: TimeFilterFn | undefined;
  const time = viz.schema.time;
  const start = time && !viz.schema.timeFilter && startingSelection(viz);
  if (time && start && viz._data.length) {
    const [from, to] = start.map(Number);
    return (d: DataPoint, i: number) => {
      const ms = Number(date(time(d, i) as Parameters<typeof date>[0]));
      return ms >= from && ms <= to;
    };
  }
  if (viz.schema.time && !viz.schema.timeFilter && viz._data.length) {
    const dates = viz._data
      .map(viz.schema.time)
      .map(d => date(d as Parameters<typeof date>[0]));
    const d = viz._data[0],
      i = 0;
    if (
      viz.schema.discrete &&
      `_${viz.schema.discrete}` in viz &&
      (viz as unknown as Record<string, (d: DataPoint, i: number) => unknown>)[
        `_${viz.schema.discrete}`
      ](d, i) === viz.schema.time(d, i)
    ) {
      // Every period, or the latest `brushMax` of them.
      computedTimeFilter = latestPeriods(
        viz,
        dates as Date[],
        timelineSpan(viz).max,
      );
    } else {
      // The latest period, or the latest `brushMin` of them.
      computedTimeFilter = latestPeriods(
        viz,
        dates as Date[],
        Math.max(1, Math.ceil(timelineSpan(viz).min)),
      );
    }
  }
  return computedTimeFilter;
}

/**
    The raw rows a chart that turns observations into rows of its own
    (Histogram bins, DensityPlot curves) draws from: the rows in the selected
    time period (the configured `timeFilter`, else the one `computeTimeFilter`
    synthesizes) that pass `filter`, and the rows outside that period, which
    stay in the data as given so the timeline still lists their periods.
    @param viz The chart.
    @param rows The raw rows.
*/
export function drawnRawRows(
  viz: Viz,
  rows: DataPoint[],
): {drawn: DataPoint[]; offstage: DataPoint[]} {
  let timeFilter = viz.schema.timeFilter as TimeFilterFn | undefined;
  if (!timeFilter) {
    const data = viz._data;
    viz._data = rows;
    try {
      timeFilter = computeTimeFilter(viz);
    } finally {
      viz._data = data;
    }
  }
  const filter = viz.schema.filter as
    ((d: DataPoint, i: number) => boolean) | undefined;
  const period = timeFilter ? rows.filter(timeFilter) : rows;
  return {
    drawn: filter ? period.filter(filter) : period,
    offstage: timeFilter ? rows.filter((d, i) => !timeFilter(d, i)) : [],
  };
}

/**
    `rows.indexOf`, for looking up many rows: it scans like `indexOf` until
    the scans add up to the length of `rows`, then indexes every row (by its
    first position) and looks the rest up.
*/
export function rowIndex<T extends object>(
  rows: readonly T[],
): (row: T) => number {
  let scanned = 0;
  let index: Map<T, number> | undefined;
  return row => {
    if (index) return index.get(row) ?? -1;
    const i = rows.indexOf(row);
    scanned += i < 0 ? rows.length : i + 1;
    if (scanned >= rows.length) {
      index = new Map();
      for (let k = rows.length - 1; k >= 0; k--) index.set(rows[k], k);
    }
    return i;
  };
}

/**
    Filters + groups `data` (default: `viz._data`) into the result's
    `filteredData`, `legendData`, and (when data exists) `_thresholdTree`.
    Small multiples pass one panel's rows as `data`.
*/
export function computeFilteredData(
  viz: Viz,
  out: VizPreDrawResult,
  drawDepth: number,
  id: (d: DataPoint, i: number) => DataPoint[keyof DataPoint],
  computedTimeFilter: TimeFilterFn | undefined,
  data: DataPoint[] = viz._data,
): void {
  const filteredData: DataPoint[] = [];
  const legendData: DataPoint[] = [];
  if (data.length) {
    const effectiveTimeFilter = viz.schema.timeFilter || computedTimeFilter;
    let flatData = effectiveTimeFilter
      ? data.filter(effectiveTimeFilter)
      : data;
    const filter = dataFilter(viz);
    if (filter) flatData = flatData.filter(filter);

    const nestKeys: ((
      d: DataPoint,
      i: number,
    ) => DataPoint[keyof DataPoint])[] = [];
    for (let i = 0; i <= drawDepth; i++) nestKeys.push(viz.schema.groupBy[i]);
    nestKeys.push(...discreteNestKeys(viz));
    // A path's steps stay apart: rows merge only when they share an order
    // value, and rows joined as they come don't merge at all.
    const order = typeof viz.schema.order === "function" && viz.schema.order;
    const dataOrder = order === DATA_ORDER;
    if (order && !dataOrder) nestKeys.push(order);

    const indexOf = rowIndex(viz._data);
    const tree = rollup(
      flatData,
      (leaves: DataPoint[]) => {
        const index = indexOf(leaves[0]);
        const shape = viz.schema.shape(leaves[0], index);
        const localId = id(leaves[0], index) as string | number;

        const d = viz._mergeRows
          ? viz._mergeRows(leaves)
          : (merge(leaves, viz.schema.aggs) as DataPoint);

        if (
          !viz._hidden.includes(localId) &&
          (!viz._solo.length || viz._solo.includes(localId))
        ) {
          if (
            (!viz.schema.discrete && shape === "Line") ||
            dataOrder ||
            viz._unmergedShapes?.includes(shape)
          )
            filteredData.push(...leaves);
          else filteredData.push(d);
        }
        legendData.push(d);
      },
      ...nestKeys,
    );

    // The threshold is a chart instance method (Treemap/Pack override it),
    // so the caller runs it over these rows with the rollup tree.
    out.filteredData = filteredData;
    out._thresholdTree = tree;
  } else {
    out.filteredData = filteredData;
  }
  out.legendData = legendData;
}
