/**
    BoxWhisker's hidden outliers: a Box whose `outlier` setting is `false`
    draws no point past its whiskers, so the value axis leaves those values
    out and reaches only as far as the whisker ends.
*/

import {groups} from "d3-array";

import type {DataPoint} from "@d3plus/data";

import {drawsOutlier} from "../../shapes/boxOutlierShape.js";
import {boxStats} from "../../shapes/boxStats.js";
import {hasBoxStats} from "../../shapes/boxSummary.js";
import {shapeConfigFor} from "../features/emitHelpers.js";
import type {VizLike} from "../features/emitHelpers.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {chartWhiskerMode} from "./tooltip.js";

type Row = Record<string, unknown>;
type RowFn = (d: DataPoint, i: number) => unknown;

/** The axis a box's statistics run along: the one that isn't discrete. */
export const boxValueAxis = (viz: VizInstance): "x" | "y" =>
  viz.schema.discrete === "y" ? "x" : "y";

/**
    The `outlier` setting of BoxWhisker's boxes (`shapeConfig.Box.outlier`),
    as an accessor of a plotted row; null when every outlier draws a point.
*/
export function chartOutlierShape(viz: VizInstance): RowFn | null {
  const config = shapeConfigFor(viz as unknown as VizLike, "Box");
  const value = config.outlier;
  if (typeof value === "function") return value as RowFn;
  return value === undefined || drawsOutlier(value) ? null : () => value;
}

/** Whether each plotted row's box draws its outliers. */
export function drawsRowOutliers(viz: VizInstance): (row: Row) => boolean {
  const shape = chartOutlierShape(viz);
  return row =>
    !shape || drawsOutlier(shape(row as DataPoint, row.i as number));
}

/** A plotted row's value on `axis` as a number: NaN unless a number or Date. */
const valueOn = (row: Row, axis: string): number => {
  const v = row[axis];
  return typeof v === "number" || v instanceof Date ? +v : NaN;
};

/** The rows of each computed box: by category, within its facet panel. */
function boxGroups(viz: VizInstance, rows: Row[]): Row[][] {
  const discrete = viz.schema.discrete as string;
  const facet =
    typeof viz.schema.facet === "function"
      ? (viz.schema.facet as RowFn)
      : undefined;
  const key = (d: Row) =>
    facet
      ? `${d[discrete]}\u0000${facet(d.data as DataPoint, d.i as number)}`
      : `${d[discrete]}`;
  return groups(rows, key).map(([, members]) => members);
}

/**
    One computed box's rows on `axis`, without the outliers it draws no point
    for. When it hides any, its whisker ends join as rows, so the axis still
    reaches them.
*/
function visibleRows(
  viz: VizInstance,
  members: Row[],
  axis: string,
  shape: RowFn,
): Row[] {
  const values = members
    .map(d => valueOn(d, axis))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  if (!values.length) return members;
  const {lowerLimit, upperLimit} = boxStats(values, chartWhiskerMode(viz));
  const kept = members.filter(d => {
    const v = valueOn(d, axis);
    const outside = v < lowerLimit! || v > upperLimit!;
    return !outside || drawsOutlier(shape(d as DataPoint, d.i as number));
  });
  if (kept.length === members.length) return members;
  const date = members[0][axis] instanceof Date;
  const ends = [lowerLimit, upperLimit]
    .filter((v): v is number => Number.isFinite(v))
    .map(v => ({...members[0], [axis]: date ? new Date(v) : v}));
  return kept.concat(ends);
}

/**
    The rows that place `axis` (see `_plotAxisRows`): on the value axis of
    boxes computed from observations, each box's rows without the outliers
    its `outlier` setting hides, plus its whisker ends; otherwise `rows`.
*/
export function boxAxisRows(
  viz: VizInstance,
  rows: Row[],
  axis: string,
): Row[] {
  if (hasBoxStats(viz.schema) || axis.charAt(0) !== boxValueAxis(viz))
    return rows;
  const shape = chartOutlierShape(viz);
  if (!shape) return rows;
  return boxGroups(viz, rows).flatMap(members =>
    visibleRows(viz, members, axis, shape),
  );
}
