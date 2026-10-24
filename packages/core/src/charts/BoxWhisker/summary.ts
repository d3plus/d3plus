/**
    BoxWhisker's precomputed boxes: with `boxMin`, `boxQ1`, `boxMedian`,
    `boxQ3`, and `boxMax` set, each row is one box drawn from its own
    statistics. These hooks place those statistics on the value axis, pad
    the axis around them, and hand them to the Box shape in pixels.
*/

import type {DataPoint} from "@d3plus/data";

import {
  boxStatKeys,
  boxSummaryValues,
  hasBoxStats,
} from "../../shapes/boxSummary.js";
import type {D3Scale} from "../../utils/index.js";
import {genericEmit} from "../features/shapeEmit.js";
import type {ShapeEmitter} from "../features/shapeEmit.js";
import type {PlotAxisFn} from "../features/plotPaint.js";
import boxBuffer from "../plotBuffers/Box.js";
import type Plot from "../Plot/index.js";
import {boxAxisRows, boxValueAxis, drawsRowOutliers} from "./outliers.js";
import {noteDrawnBoxes} from "./tooltip.js";
import type {VizInstance} from "../viz/vizTypes.js";

type Row = Record<string, unknown>;
type RowFn = (d: DataPoint, i: number) => unknown;

/** Whether the chart draws its boxes from precomputed statistics. */
export const precomputedBoxes = (viz: VizInstance): boolean =>
  hasBoxStats(viz.schema);

/**
    Every statistic value each plotted row places on the value axis: its
    outliers too, unless its `outlier` setting draws no point.
*/
function rowValues(viz: VizInstance): (row: Row) => number[] {
  const outliers = drawsRowOutliers(viz);
  return row =>
    boxSummaryValues(
      viz.schema,
      row.data as DataPoint,
      row.i as number,
      outliers(row),
    );
}

/**
    The values precomputed boxes add to `axis` (see `_plotAxisValues`): each
    row's statistics and drawn outliers, on the value axis only.
*/
export function boxAxisValues(
  viz: VizInstance,
  rows: Row[],
  axis: string,
): number[] {
  if (!precomputedBoxes(viz) || axis !== boxValueAxis(viz)) return [];
  return rows.flatMap(rowValues(viz));
}

/** The arguments Plot hands a shape's axis buffer. */
interface BufferArgs {
  data: Row[];
  x: D3Scale;
  y: D3Scale;
  x2?: unknown;
  [key: string]: unknown;
}

/**
    BoxWhisker's axis buffer: Box's own, which pads the value axis past each
    row's value. A precomputed box spans its statistics, so each row is
    buffered at every one of them; a computed box, at the rows that place
    the axis (see `boxAxisRows`).
*/
export function boxWhiskerBuffer(
  this: VizInstance,
  args: BufferArgs,
): [unknown, unknown] {
  const buffer = boxBuffer as unknown as (
    this: Plot,
    a: BufferArgs,
  ) => [unknown, unknown];
  const plot = this as unknown as Plot;
  const key = boxValueAxis(this);
  if (!precomputedBoxes(this)) {
    const data = boxAxisRows(this, args.data, args.x2 ? `${key}2` : key);
    return buffer.call(plot, {...args, data});
  }
  if (args.x2) return buffer.call(plot, args);
  const values = rowValues(this);
  const data = args.data.flatMap(row =>
    values(row).map(v => ({...row, [key]: v})),
  );
  return buffer.call(plot, {...args, data});
}

/** A statistic accessor of the source row, read through `scale` into pixels. */
function inPixels(fn: RowFn, scale: PlotAxisFn) {
  const px = (v: unknown): number =>
    typeof v === "number" || v instanceof Date ? scale(v) : NaN;
  return (d: Row): unknown => {
    const v = fn(d.data as DataPoint, d.i as number);
    return Array.isArray(v) ? v.map(px) : px(v);
  };
}

/**
    Draws Box rows: precomputed boxes take their statistics in pixels on the
    value axis; otherwise Plot's own Box path, noting each box it draws for
    the tooltip.
*/
export const boxWhiskerEmit: ShapeEmitter = (ctx, key) => {
  const {viz} = ctx;
  if (!precomputedBoxes(viz)) return noteDrawnBoxes(genericEmit(ctx, key));
  const scale = boxValueAxis(viz) === "y" ? ctx.y : ctx.x;
  const stats: Row = {};
  for (const stat of [...boxStatKeys, "boxOutliers"]) {
    const fn = viz.schema[stat];
    if (typeof fn === "function") stats[stat] = inPixels(fn as RowFn, scale);
  }
  return genericEmit(
    {...ctx, shapeConfig: {...ctx.shapeConfig, ...stats}},
    key,
  );
};
