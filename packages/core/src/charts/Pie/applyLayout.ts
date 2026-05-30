/**
    `applyPieLayout` — Pie's chart-specific layout stage. Runs the d3-shape
    pie layout against `viz._filteredData`, tags each slice with `__d3plus__`
    + index, builds the arc generator from the current schema values, and
    stores `pieData`/`arcData`/`pieWidth`/`pieHeight` on `viz.ctx`.
*/

import * as d3Shape from "d3-shape";
import type {PieArcDatum, Pie} from "d3-shape";

import type {DataPoint} from "@d3plus/data";

import type {TransformStage} from "../stages.js";
import {chartBounds} from "../chartGeometry.js";

export const applyPieLayout: TransformStage = ({viz}) => {
  const {width, height} = chartBounds(viz);
  const outerRadius = Math.min(width, height) / 2;

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

  pieData.forEach((d, i) => {
    d.__d3plus__ = true;
    d.i = i;
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
  viz.ctx.pieWidth = width;
  viz.ctx.pieHeight = height;

  return {shapeData: pieData};
};
