/**
    BoxWhisker's precomputed boxes: with `boxMin`, `boxQ1`, `boxMedian`,
    `boxQ3`, and `boxMax` set, each row is one box drawn from its own
    statistics. These hooks place those statistics on the value axis, pad
    the axis around them, hand them to the Box shape in pixels, and list
    them in the tooltip.
*/

import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";

import {
  boxStatKeys,
  boxSummaryValues,
  hasBoxStats,
  readBoxSummary,
} from "../../shapes/boxSummary.js";
import type {D3Scale} from "../../utils/index.js";
import {genericEmit} from "../features/shapeEmit.js";
import type {ShapeEmitter} from "../features/shapeEmit.js";
import type {PlotAxisFn} from "../features/plotPaint.js";
import boxBuffer from "../plotBuffers/Box.js";
import type Plot from "../Plot/index.js";
import type {VizInstance} from "../viz/vizTypes.js";

type Row = Record<string, unknown>;
type RowFn = (d: DataPoint, i: number) => unknown;

/** Whether the chart draws its boxes from precomputed statistics. */
export const precomputedBoxes = (viz: VizInstance): boolean =>
  hasBoxStats(viz.schema);

/** The axis a box's statistics run along: the one that isn't discrete. */
export const boxValueAxis = (viz: VizInstance): "x" | "y" =>
  viz.schema.discrete === "y" ? "x" : "y";

/** Every statistic value a plotted row places on the value axis. */
const rowValues = (viz: VizInstance, row: Row): number[] =>
  boxSummaryValues(viz.schema, row.data as DataPoint, row.i as number);

/**
    The values precomputed boxes add to `axis` (see `_plotAxisValues`): each
    row's statistics and outliers, on the value axis only.
*/
export function boxAxisValues(
  viz: VizInstance,
  rows: Row[],
  axis: string,
): number[] {
  if (!precomputedBoxes(viz) || axis !== boxValueAxis(viz)) return [];
  return rows.flatMap(row => rowValues(viz, row));
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
    buffered at every one of them.
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
  if (!precomputedBoxes(this) || args.x2) return buffer.call(plot, args);
  const key = boxValueAxis(this);
  const data = args.data.flatMap(row =>
    rowValues(this, row).map(v => ({...row, [key]: v})),
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
    value axis; otherwise Plot's own Box path.
*/
export const boxWhiskerEmit: ShapeEmitter = (ctx, key) => {
  const {viz} = ctx;
  if (!precomputedBoxes(viz)) return genericEmit(ctx, key);
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

/** A hovered datum's source row and its index, through Plot's and Box's wrappers. */
function sourceRow(d: DataPoint, i: number): [DataPoint, number] {
  while (d.__d3plus__ && d.data) {
    i = d.i as number;
    d = d.data as DataPoint;
  }
  return [d, i];
}

/** The tooltip rows of a precomputed box: its statistics, largest first. */
export function boxTooltipRows(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): [string, string][] {
  if (!d || !precomputedBoxes(viz)) return [];
  const s = readBoxSummary(viz.schema, ...sourceRow(d, i));
  if (!s) return [];
  const fmt = (n: number) => formatAbbreviate(n, viz.schema.locale);
  const t = (str: string) => viz.schema.translate(str) as string;
  return [
    [t("Maximum"), fmt(s.max)],
    [t("Upper Quartile"), fmt(s.q3)],
    [t("Median"), fmt(s.median)],
    [t("Lower Quartile"), fmt(s.q1)],
    [t("Minimum"), fmt(s.min)],
  ];
}
