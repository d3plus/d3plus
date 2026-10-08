/**
    `applyPieLayout` — Pie's chart-specific layout stage. Runs the d3-shape
    pie layout against `viz._filteredData`, tags each slice with `__d3plus__`
    + index, builds the arc generator from the current schema values, and
    stores `pieData`/`arcData`/`pieWidth`/`pieHeight` on `viz.ctx`.
*/

import * as d3Shape from "d3-shape";
import type {PieArcDatum, Pie} from "d3-shape";

import type {DataPoint} from "@d3plus/data";

import type {TransformStage} from "../pipeline/stages.js";
import {chartBounds} from "../features/chartGeometry.js";
import {stampShare} from "../features/shareKey.js";

export const applyPieLayout: TransformStage = ({viz}) => {
  const {width, height} = chartBounds(viz);
  const sc = (viz.schema.shapeConfig ?? {}) as Record<string, unknown>;
  // Reserves room for the hovered/active stroke emphasis (interactionOpacity.ts's
  // emphasizeStroke, ×2 hover / ×3 active over the configured base width) so
  // it never gets clipped by the chart's own edge — half of the WIDEST
  // possible stroke (centered on the wedge's outline) overflows past the
  // outer radius. A function-valued strokeWidth can't be resolved without a
  // datum, so it falls back to Pie's own default (2) rather than guessing.
  const baseStrokeWidth = typeof sc.strokeWidth === "number" ? sc.strokeWidth : 2;
  const strokeBuffer = (baseStrokeWidth * 3) / 2;
  const outerRadius = Math.max(0, Math.min(width, height) / 2 - strokeBuffer);

  type PieFn = Pie<unknown, DataPoint>;
  const pie = viz.ctx.pie as PieFn;
  const padAngle = (viz.schema.padAngle as number | undefined) ?? 0;
  const padPixel = (viz.schema.padPixel as number | undefined) ?? 0;
  const sortFn = viz.schema.sort as (a: DataPoint, b: DataPoint) => number;
  const valueFn = viz.schema.value as (d: DataPoint) => number;

  const pieData = pie
    .padAngle(padAngle || padPixel / outerRadius)
    .sort(sortFn)
    .value(valueFn)(viz._filteredData as DataPoint[]) as (PieArcDatum<DataPoint> & {
      __d3plus__?: true;
      i?: number;
    })[];

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

  const innerRadius = viz.schema.innerRadius as
    | number
    | ((d: DataPoint, i: number) => number);

  viz.ctx.arcData = d3Shape.arc<PieArcDatum<DataPoint>>()
    .innerRadius(
      (typeof innerRadius === "function"
        ? innerRadius
        : () => innerRadius) as unknown as (d: PieArcDatum<DataPoint>, i: number) => number,
    )
    .outerRadius(outerRadius);

  viz.ctx.pieData = pieData;
  // pieWidth/pieHeight stay the FULL available space (not reduced by
  // strokeBuffer) — centerChartTransform centers the origin against these,
  // and shrinking them would pull the circle off-center toward the
  // top-left instead of leaving equal buffer space on every side.
  viz.ctx.pieWidth = width;
  viz.ctx.pieHeight = height;
  // The actual (buffer-reduced) radius wedges are drawn at — chartBodyRect
  // (Pie/index.ts) reads this instead of deriving a radius from
  // pieWidth/pieHeight, so the drill-morph's "whole pie" reference box
  // matches the wedges' real size, not the looser available space.
  viz.ctx.pieOuterRadius = outerRadius;

  return {shapeData: pieData};
};
