/**
    `applyFunnelLayout` — Funnel's chart-specific layout stage. Reads each
    row of `viz._filteredData` as one stage, in data order or `sort`'s,
    sizes its width by its value against the largest stage (or a scale
    shared across small multiples), and slices the funnel's width profile
    into one outline per stage and one neck per gap between stages. Each
    row's conversion rates (vs. the first and previous stage, in that
    order) are kept in `stageRates` for the tooltip. Stores the frame on
    `viz.ctx.funnel` and returns one `FunnelStage` per row.
*/

import type {DataPoint} from "@d3plus/data";

import type {Orient} from "../../shapes/shapeConfig.js";
import type {TransformStage} from "../pipeline/stages.js";
import {chartBounds} from "../features/chartGeometry.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {
  conversionRates,
  profileKnots,
  profileSlice,
  sliceExtent,
  stageSpans,
  stageWidths,
} from "./funnelGeometry.js";
import type {FunnelCurve, ProfilePoint} from "./funnelGeometry.js";

/** One laid-out stage. */
export interface FunnelStage {
  __d3plus__: true;
  data: DataPoint;
  i: number;
  value: number;
  /** The stage's value as a fraction of the first stage's. */
  first: number;
  /** The stage's value as a fraction of the previous stage's (NaN for the first). */
  previous: number;
  /** The stage's span along the stage order. */
  start: number;
  end: number;
  /** The stage's outline, sampled along the stage order. */
  points: ProfilePoint[];
  /** The neck leading into this stage from the previous one, if any. */
  neck: ProfilePoint[];
  /** The stage's narrowest and widest widths. */
  min: number;
  max: number;
}

/** The frame every stage is drawn in, stored on `viz.ctx.funnel`. */
export interface FunnelShared {
  orient: Orient;
  curve: FunnelCurve;
  /** The cross-axis position of the funnel's center line. */
  center: number;
  /** The widest a stage can be, across the stage order. */
  breadth: number;
  /** Where the cross axis starts, in chart-area coordinates. */
  offset: number;
}

/** A stage's conversion rates: its share of the first stage and of the previous one. */
export interface StageRates {
  first: number;
  previous: number;
}

/**
    Each laid-out row's conversion rates, for the tooltip. Kept on the chart
    rather than written onto the user's rows.
*/
export function stageRates(viz: VizInstance): WeakMap<DataPoint, StageRates> {
  return (viz.ctx.funnelRates ??= new WeakMap<DataPoint, StageRates>()) as WeakMap<DataPoint, StageRates>;
}

/**
    Room left around the funnel for the hovered stroke emphasis (up to 3× a
    1px stroke, centered on the outline), so it never clips at the edge.
*/
export const STROKE_BUFFER = 2;

/**
    The stages in drawing order: data order, or sorted by the `sort`
    comparator (a stable sort, so ties keep their data order).
*/
export function funnelOrder(viz: VizInstance, data: DataPoint[]): DataPoint[] {
  const sort = viz.schema.sort;
  return typeof sort === "function"
    ? data.slice().sort(sort as (a: DataPoint, b: DataPoint) => number)
    : data;
}

/**
    The value a width scale shared across small multiples measures against
    (see `funnelFacet.ts`), or 0 when this funnel sizes to its own stages.
*/
export function sharedScaleMax(viz: VizInstance): number {
  const max = Number(viz.ctx.funnelScaleMax);
  return Number.isFinite(max) && max > 0 ? max : 0;
}

/** The funnel's orientation, from the `orient` setting. */
export function funnelOrient(viz: VizInstance): Orient {
  return viz.schema.orient === "horizontal" ? "horizontal" : "vertical";
}

/** The profile curve, from the `curve` setting. */
export function funnelCurve(viz: VizInstance): FunnelCurve {
  return viz.schema.curve === "smooth" ? "smooth" : "linear";
}

/**
    Lays out `rows` (already in drawing order) as one funnel in a chart area
    of `width` × `height`, measuring stage widths against `scaleMax` (0 for
    the largest of these stages). Pure: stores nothing on the chart.
*/
export function funnelStages(
  viz: VizInstance,
  rows: DataPoint[],
  {width, height}: {width: number; height: number},
  scaleMax: number,
): {stages: FunnelStage[]; shared: FunnelShared} {
  const orient = funnelOrient(viz);
  const curve = funnelCurve(viz);
  const valueFn = viz.schema.value as (d: DataPoint, i: number) => unknown;
  const values = rows.map((d, i) => Number(valueFn(d, i)));

  const vertical = orient === "vertical";
  const length = Math.max(0, (vertical ? height : width) - STROKE_BUFFER * 2);
  const breadth = Math.max(0, (vertical ? width : height) - STROKE_BUFFER * 2);
  const spans = stageSpans(
    rows.length,
    length,
    Number(viz.schema.stagePadding),
  ).map(s => ({start: s.start + STROKE_BUFFER, end: s.end + STROKE_BUFFER}));
  const widths = stageWidths(values, breadth, scaleMax);
  const knots = profileKnots(spans, widths, !!viz.schema.taper);
  const rates = conversionRates(values);

  const stages: FunnelStage[] = rows.map((d, i) => {
    const span = spans[i];
    const points = profileSlice(knots, span.start, span.end, curve);
    const neck = i
      ? profileSlice(knots, spans[i - 1].end, span.start, curve)
      : [];
    return {
      __d3plus__: true,
      data: d,
      i,
      value: values[i],
      first: rates.first[i],
      previous: rates.previous[i],
      start: span.start,
      end: span.end,
      points,
      neck,
      ...sliceExtent(points),
    };
  });
  const shared: FunnelShared = {
    orient,
    curve,
    center: (vertical ? width : height) / 2,
    breadth,
    offset: STROKE_BUFFER,
  };
  return {stages, shared};
}

export const applyFunnelLayout: TransformStage = ({viz}) => {
  const rows = funnelOrder(viz, (viz._filteredData ?? []) as DataPoint[]);
  const {stages, shared} = funnelStages(
    viz,
    rows,
    chartBounds(viz),
    sharedScaleMax(viz),
  );
  const rateMap = stageRates(viz);
  for (const s of stages)
    rateMap.set(s.data, {first: s.first, previous: s.previous});
  viz.ctx.funnel = shared;
  return {shapeData: stages as unknown as DataPoint[]};
};
