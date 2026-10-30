/**
    `applyPieLayout` — Pie's chart-specific layout stage. Runs the d3-shape
    pie layout against `viz._filteredData` over the configured sweep, fits the
    ring's footprint to the chart area, tags each slice with `__d3plus__` +
    index, builds the arc generator from the current schema values, and
    stores `pieData`/`arcData`/`pieSweep`/`pieCenter`/`pieBox` on `viz.ctx`.
*/

import * as d3Shape from "d3-shape";
import type {PieArcDatum, Pie} from "d3-shape";

import type {DataPoint} from "@d3plus/data";

import type {TransformStage} from "../pipeline/stages.js";
import {chartBounds} from "../features/chartGeometry.js";
import {stampShare} from "../features/shareKey.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {fitRing, pieSweep, ringExtent} from "./arcFit.js";
import type {PieSweep} from "./arcFit.js";

type PieSlice = PieArcDatum<DataPoint> & {__d3plus__?: true; i?: number};
type InnerRadius = number | ((d: DataPoint, i: number) => number);

/** Pie's resolved sweep, from its `startAngle` and `endAngle` settings. */
export function pieSweepOf(viz: VizInstance): PieSweep {
  return pieSweep(viz.schema.startAngle, viz.schema.endAngle);
}

/**
    The outer radius a hole-less ring of this Pie's sweep gets in the chart
    area, before any room is kept for the hover stroke. Donut's default
    `innerRadius` is half of it.
*/
export function pieBaseRadius(viz: VizInstance): number {
  const {width, height} = chartBounds(viz);
  const {start, end} = pieSweepOf(viz);
  return fitRing(width, height, start, end).radius;
}

/** The width/height ratio of this Pie's hole-less footprint: 1 for a full circle, 2 for a half ring. */
export function pieAspect(viz: VizInstance): number {
  const {start, end} = pieSweepOf(viz);
  const b = ringExtent(start, end);
  const h = b.y1 - b.y0;
  return h > 0 ? (b.x1 - b.x0) / h : 1;
}

/**
    Reserves room for the hovered/active stroke emphasis (interactionOpacity.ts's
    emphasizeStroke, ×2 hover / ×3 active over the configured base width) so
    it never gets clipped by the chart's own edge — half of the WIDEST
    possible stroke (centered on the wedge's outline) overflows past the
    outer radius. A function-valued strokeWidth can't be resolved without a
    datum, so it falls back to Pie's own default (2) rather than guessing.
*/
function strokeBufferOf(viz: VizInstance): number {
  const sc = (viz.schema.shapeConfig ?? {}) as Record<string, unknown>;
  const baseStrokeWidth =
    typeof sc.strokeWidth === "number" ? sc.strokeWidth : 2;
  return (baseStrokeWidth * 3) / 2;
}

export const applyPieLayout: TransformStage = ({viz}) => {
  const {width, height} = chartBounds(viz);
  const strokeBuffer = strokeBufferOf(viz);
  const sweep = pieSweepOf(viz);

  type PieFn = Pie<unknown, DataPoint>;
  const pie = viz.ctx.pie as PieFn;
  const padAngle = (viz.schema.padAngle as number | undefined) ?? 0;
  const padPixel = (viz.schema.padPixel as number | undefined) ?? 0;
  const sortFn = viz.schema.sort as (a: DataPoint, b: DataPoint) => number;
  const valueFn = viz.schema.value as (d: DataPoint) => number;
  const layout = (radius: number) =>
    pie
      .startAngle(sweep.start)
      .endAngle(sweep.end)
      .padAngle(padAngle || padPixel / radius)
      .sort(sortFn)
      .value(valueFn)(viz._filteredData as DataPoint[]) as PieSlice[];

  const innerRadius = viz.schema.innerRadius as InnerRadius;
  const innerFn = (typeof innerRadius === "function"
    ? innerRadius
    : () => innerRadius) as unknown as (d: PieSlice, i: number) => number;

  // The hole-less fit sizes a first pass, whose slices resolve the inner
  // radius; a hole can let a partial ring grow, so the slices are laid out
  // again at the final radius when it does.
  const baseFit = fitRing(
    width,
    height,
    sweep.start,
    sweep.end,
    0,
    strokeBuffer,
  );
  let pieData = layout(baseFit.radius);
  const innerMin = pieData.reduce(
    (m, d, i) => Math.min(m, Number(innerFn(d, i)) || 0),
    Infinity,
  );
  const fit =
    Number.isFinite(innerMin) && innerMin > 0
      ? fitRing(width, height, sweep.start, sweep.end, innerMin, strokeBuffer)
      : baseFit;
  if (fit.radius !== baseFit.radius) pieData = layout(fit.radius);
  const outerRadius = fit.radius;

  const total = pieData.reduce((sum, d) => sum + d.value, 0);
  pieData.forEach((d, i) => {
    d.__d3plus__ = true;
    d.i = i;
    // The tooltip binds the unwrapped row, so the slice's share of the total
    // must live on the row for the tooltip accessor to read it.
    const share = total ? d.value / total : 0;
    (d as {share?: number}).share = share;
    stampShare(d.data, share);
  });

  viz.ctx.arcData = d3Shape
    .arc<PieArcDatum<DataPoint>>()
    .innerRadius(innerFn as (d: PieArcDatum<DataPoint>, i: number) => number)
    .outerRadius(outerRadius);

  viz.ctx.pieData = pieData;
  viz.ctx.pieSweep = sweep;
  // The ring's center within the chart area — chartTransform places the
  // origin here.
  viz.ctx.pieCenter = {x: fit.cx, y: fit.cy};
  // The ring's footprint around its center, at the actual (buffer-reduced)
  // radius wedges are drawn at — chartBodyRect (Pie/index.ts) reads this, so
  // the drill-morph's "whole pie" reference box matches the wedges' real
  // extent, not the looser available space.
  viz.ctx.pieBox = fit.box;

  return {shapeData: pieData};
};
