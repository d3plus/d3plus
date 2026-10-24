/**
    The data half of `vizPreDraw`: the synthesized time filter and the
    filter + rollup that produce a draw's `filteredData` and `legendData`.
    Small multiples run the same steps over each panel's rows.
*/

import {max, rollup} from "d3-array";

import {merge} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";
import {date} from "@d3plus/dom";

import {brushSpan} from "../../components/Timeline/brushSpan.js";
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
    The synthesized time filter of a chart whose discrete axis is its time:
    every period, or only the latest `timelineConfig.brushMax` of them when
    the timeline caps its selection.
*/
function latestPeriods(viz: Viz, dates: Date[]): TimeFilterFn {
  const config = (viz.schema.timelineConfig || {}) as Record<string, unknown>;
  const most = viz.schema.timeline
    ? brushSpan(config.brushMin, config.brushMax).max
    : Infinity;
  const periods = [...new Set(dates.map(Number))].sort((a, b) => a - b);
  if (periods.length <= most) return () => true;
  const from = periods[periods.length - most];
  const snapTime = viz.schema.time;
  return (d: DataPoint, i: number) => +date(snapTime(d, i))! >= from;
}

/**
    Computes a NEW timeFilter when `time` is set but `timeFilter` isn't and
    data exists; returns undefined otherwise.
*/
export function computeTimeFilter(viz: Viz): TimeFilterFn | undefined {
  let computedTimeFilter: TimeFilterFn | undefined;
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
      computedTimeFilter = latestPeriods(viz, dates as Date[]);
    } else {
      const latestTime = +max(dates as Date[])!;
      // Snapshot `viz.schema.time` into the closure. Without this, a user
      // changing `.time(...)` after the filter is constructed would
      // make the closure read the NEW accessor against the OLD
      // latestTime — nonsense results. Matches the snapGroupBy /
      // snapLabel pattern earlier in this file.
      const snapTime = viz.schema.time;
      computedTimeFilter = (dd: DataPoint, ii: number) =>
        +date(snapTime(dd, ii))! === latestTime;
    }
  }
  return computedTimeFilter;
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

    const tree = rollup(
      flatData,
      (leaves: DataPoint[]) => {
        const index = viz._data.indexOf(leaves[0]);
        const shape = viz.schema.shape(leaves[0], index);
        const localId = id(leaves[0], index) as string | number;

        const d = viz._mergeRows
          ? viz._mergeRows(leaves)
          : (merge(leaves, viz.schema.aggs) as DataPoint);

        if (
          !viz._hidden.includes(localId) &&
          (!viz._solo.length || viz._solo.includes(localId))
        ) {
          if (!viz.schema.discrete && shape === "Line")
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
