/**
    Lollipop geometry, read off the bars the Plot lays out for each row: every
    lollipop sits where its bar would, so the category bands, series dodging,
    baseline (and baseline break), and axis clamping all come from the bar
    layout. The stem runs down the bar's center line from its base to its end,
    and the head sits at the end nearer the row's value.

    @module
*/

import type {DataPoint} from "@d3plus/data";
import {finite} from "@d3plus/math";

import type Plot from "../Plot/index.js";
import type {PlotDatum} from "../features/plotPaint.js";
import BarBuffer from "../plotBuffers/Bar.js";
import type {D3Scale} from "../../utils/index.js";

/** Key suffix of a lollipop's stem node (the head carries the bare key). */
export const STEM_KEY_SUFFIX = "::stem";

/** A lollipop's pixel layout: its head center and its stem's base. */
export interface StemLayout {
  /** Head center, x. */
  x: number;
  /** Head center, y. */
  y: number;
  /** Stem base, x. */
  x0: number;
  /** Stem base, y. */
  y0: number;
}

/** The parts of a bar's rect node the layout reads. */
export interface BarBox {
  x: number;
  y: number;
  width: number;
  height: number;
  transform?: {x?: number; y?: number};
}

/**
    One end of a lollipop's stem, fed to the Line shape. It wraps the row so
    style accessors unwrap to the row itself.
*/
export interface StemPoint {
  __d3plus__: true;
  data: PlotDatum;
  i: number;
  /** Whether this is the head end (else the base). */
  end: boolean;
}

/**
    The lollipop for a bar: its head at the bar's end nearer `valuePx` (the
    row's value in pixels along the value axis), its stem's base at the other
    end, both on the bar's center line. Without a usable `valuePx` the head
    sits at the bar's top (or right) end.
    @param bar The bar's rect node.
    @param discrete The category axis.
    @param valuePx The row's value, in pixels.
*/
export function stemFromBar(
  bar: BarBox,
  discrete: "x" | "y",
  valuePx: number,
): StemLayout {
  const left = (bar.transform?.x ?? 0) + bar.x;
  const top = (bar.transform?.y ?? 0) + bar.y;
  const right = left + bar.width;
  const bottom = top + bar.height;
  if (discrete === "x") {
    const x = left + bar.width / 2;
    const atTop =
      !finite(valuePx) || Math.abs(top - valuePx) <= Math.abs(bottom - valuePx);
    return atTop
      ? {x, y: top, x0: x, y0: bottom}
      : {x, y: bottom, x0: x, y0: top};
  }
  const y = top + bar.height / 2;
  const atRight =
    !finite(valuePx) || Math.abs(right - valuePx) <= Math.abs(left - valuePx);
  return atRight
    ? {x: right, y, x0: left, y0: y}
    : {x: left, y, x0: right, y0: y};
}

/**
    Both ends of each row's stem, base first, as the Line shape's data.
    @param rows The plotted rows.
*/
export function stemPoints(rows: PlotDatum[]): StemPoint[] {
  const out: StemPoint[] = [];
  for (const data of rows) {
    out.push({__d3plus__: true, data, i: data.i, end: false});
    out.push({__d3plus__: true, data, i: data.i, end: true});
  }
  return out;
}

/**
    The largest head radius across `rows`, for padding the value axis.
    @param rows The plotted rows.
    @param r The head radius: a number, or an accessor of the source row.
*/
export function largestRadius(rows: PlotDatum[], r: unknown): number {
  let out = 0;
  for (const d of rows) {
    const v =
      typeof r === "function"
        ? (r as (d: DataPoint, i: number) => unknown)(d.data, d.i)
        : r;
    if (finite(v) && v > out) out = v;
  }
  return out;
}

/** The arguments Plot hands an axis buffer. */
interface BufferArgs {
  data: Record<string, unknown>[];
  x: D3Scale;
  y: D3Scale;
  x2?: D3Scale;
  y2?: D3Scale;
}

/**
    Lollipop's value-axis buffer: the bar buffer, widened so the head drawn at
    each extreme value stays inside the plot.
*/
export function lollipopBuffer(
  this: Plot,
  args: BufferArgs,
): [unknown, unknown] {
  const circle = (
    this.schema.shapeConfig as Record<
      string,
      Record<string, unknown> | undefined
    >
  ).Circle;
  const r = largestRadius(args.data as unknown as PlotDatum[], circle?.r);
  return BarBuffer.call(this, {...args, buffer: r + 2});
}
