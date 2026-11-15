/**
    Keeps a Plot's rows apart along its time axes: rows that share a group
    but sit at different times stay separate points, since times don't add
    up the way the values of a numeric axis do.
*/
import type {DataPoint} from "@d3plus/data";

import {
  rangeBreaksTimeAxis,
  timeValueAxes,
  type AxisName,
} from "./plotRangeBreaks.js";
import {vizDiscrete} from "../viz/discrete.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** A row accessor, such as a Plot's `_x` or `_y`. */
type RowAccessor = (d: DataPoint, i: number) => DataPoint[keyof DataPoint];

const AXES: AxisName[] = ["x", "x2", "y", "y2"];

/**
    The accessors of a Plot's time axes, for the rollup to nest rows by (see
    `_nestKeys`). A time axis is one with a `"time"` or `"utc"` scale, or
    one that plots the chart's `time` values, holds Dates, or reads its
    values as dates through `rangeBreaks`, judged by the first row. The
    discrete axis (and its `2` partner) nests its rows already, so it is
    left out.
    @param viz The Plot.
*/
export function timeNestKeys(viz: VizInstance): RowAccessor[] {
  const row = viz._data?.[0];
  if (!row) return [];
  const discrete = vizDiscrete(viz);
  const timeAxes = timeValueAxes(viz);
  return AXES.flatMap(axis => {
    if (discrete && axis.startsWith(discrete)) return [];
    const read = viz[`_${axis}`] as RowAccessor | undefined;
    if (typeof read !== "function") return [];
    const value = read(row, 0);
    const scale = (viz[`_${axis}Config`] as {scale?: unknown} | undefined)
      ?.scale;
    const time =
      timeAxes.includes(axis) ||
      scale === "time" ||
      scale === "utc" ||
      (value instanceof Date && !isNaN(+value)) ||
      rangeBreaksTimeAxis(viz, axis, value);
    return time ? [read] : [];
  });
}
