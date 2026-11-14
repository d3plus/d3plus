/**
    With `arrows`, Dumbbell's points take neutral grays so only the arrows
    carry color: the first series a light gray, the last a dark one, mixed
    from the chart's background toward its text color, so a dark theme
    reads alike (faint to strong).

    @module
*/

import {interpolateRgb} from "d3-interpolate";
import type {DataPoint} from "@d3plus/data";

import {backgroundInk, chartBackground} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** How far from the background toward the text color the first and last series' grays sit. */
export const ARROW_GRAY_STRENGTHS: [number, number] = [0.35, 0.85];

/**
    A series' strength between the first series' and the last's, by its
    place among `count` series (the only series takes the last's).
    @param index The series' place, from 0.
    @param count The number of series.
*/
export function seriesStrength(index: number, count: number): number {
  const [light, dark] = ARROW_GRAY_STRENGTHS;
  if (count < 2 || index < 0) return dark;
  return light + ((dark - light) * Math.min(index, count - 1)) / (count - 1);
}

/**
    Each series key in the order it first appears among `rows`.
    @param rows The drawn rows.
    @param seriesOf Reads a row's series.
*/
export function seriesOrder(
  rows: DataPoint[],
  seriesOf: (d: DataPoint, i: number) => unknown,
): string[] {
  const seen = new Set<string>();
  rows.forEach((d, i) => seen.add(`${seriesOf(d, i)}`));
  return [...seen];
}

/**
    A row's gray with `arrows`: its series' place in the data, mixed from
    the chart's background toward its text color (see `seriesStrength`).
    @param viz The chart.
    @param d The row (or a legend entry's merged row).
    @param i Its index.
*/
export function arrowSeriesGray(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): string {
  const seriesOf = viz.schema.groupBy[0] as (
    d: DataPoint,
    i: number,
  ) => unknown;
  const order = seriesOrder((viz._filteredData ?? []) as DataPoint[], seriesOf);
  const t = seriesStrength(order.indexOf(`${seriesOf(d, i)}`), order.length);
  return interpolateRgb(chartBackground(viz), backgroundInk(viz))(t);
}
