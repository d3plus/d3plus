/**
    ScatterMatrix's diagonal histograms: each bin row drawn as a Rect from
    the panel's floor, its height a share of the panel's height (the tallest
    bin reaching `BIN_FILL` of it), stacked by group. The y axis the panel
    shares with its row reads the row's dimension, not the counts, so bars
    are sized in pixels rather than on it.

    @module
*/
import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import {
  collectComputed,
  makeShape,
  shapeConfigFor,
} from "../features/emitHelpers.js";
import type {PlotAxisFn} from "../features/plotPaint.js";
import type {ShapeEmitContext, ShapeEmitter} from "../features/shapeEmit.js";
import {matrixMeta} from "./matrixData.js";
import type {MatrixBin} from "./matrixData.js";

/** The shape key bin rows draw under. */
export const MATRIX_BIN = "MatrixBin";

/** How much of a diagonal panel's height its tallest bin takes. */
export const BIN_FILL = 0.9;

/** The gap between neighboring bins, in pixels. */
export const BIN_GAP = 1;

/** A bin row's bar, in pixels: its center and size. */
export interface BinRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
    Where a bin's bar draws: across its edges on the x axis, stacked on the
    groups below it from the panel's `floor` toward its `top` (pixels).
*/
export function binRect(
  bin: Pick<MatrixBin, "x0" | "x1" | "count" | "y0" | "max">,
  x: (v: number) => number,
  floor: number,
  top: number,
): BinRect {
  const left = x(bin.x0),
    right = x(bin.x1);
  const span = (floor - top) * BIN_FILL;
  const unit = bin.max > 0 ? span / bin.max : 0;
  const height = bin.count * unit;
  const base = floor - bin.y0 * unit;
  return {
    x: (left + right) / 2,
    y: base - height / 2,
    width: Math.max(0, Math.abs(right - left) - BIN_GAP),
    height,
  };
}

/** Draws a diagonal panel's bin rows as Rects, wired for hover and tooltips. */
export const matrixBinEmit: ShapeEmitter = (ctx: ShapeEmitContext) => {
  const {viz} = ctx;
  const rows = ctx.values;
  if (!rows.length) return [];
  const x = ctx.x as PlotAxisFn;
  const floor = Math.max(...ctx.yRange),
    top = Math.min(...ctx.yRange);
  const rect = (d: DataPoint): BinRect => {
    const meta = matrixMeta(d);
    return meta && meta.kind === "bin"
      ? binRect(meta, v => x(v), floor, top)
      : {x: 0, y: 0, width: 0, height: 0};
  };
  const shape = makeShape("Rect")
    .renderMode("compute")
    .config(shapeConfigFor(viz, "Rect"))
    .config({
      height: (d: DataPoint) => rect(d).height,
      id: (d: DataPoint) => d.id,
      label: false,
      trail: false,
      width: (d: DataPoint) => rect(d).width,
      x: (d: DataPoint) => rect(d).x,
      y: (d: DataPoint) => rect(d).y,
    })
    .data(rows);
  viz._wirePlotShapeEvents!(shape, MATRIX_BIN, ctx.events);
  return collectComputed(shape).map(
    node => ({...node, shapeType: MATRIX_BIN}) as SceneNode,
  );
};
