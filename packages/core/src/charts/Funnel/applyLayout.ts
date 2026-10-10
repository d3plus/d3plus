/**
    `applyFunnelLayout` — Funnel's chart-specific layout stage. Reads each
    row of `viz._filteredData` as one stage, in data order, sizes its width
    by its value against the largest stage, and slices the funnel's width
    profile into one outline per stage and one neck per gap between stages.
    Each row gets its conversion rates (vs. the first and previous stage)
    stamped on it for the tooltip. Stores the frame on `viz.ctx.funnel` and
    returns one `FunnelStage` per row.
*/

import type {DataPoint} from "@d3plus/data";

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
import type {
  FunnelCurve,
  FunnelOrient,
  ProfilePoint,
} from "./funnelGeometry.js";

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
  orient: FunnelOrient;
  curve: FunnelCurve;
  /** The cross-axis position of the funnel's center line. */
  center: number;
  /** The widest a stage can be, across the stage order. */
  breadth: number;
  /** Where the cross axis starts, in chart-area coordinates. */
  offset: number;
}

/** Row keys the stage's conversion rates are stamped under. */
export const FIRST_KEY = "__d3plusFunnelFirst";
export const PREVIOUS_KEY = "__d3plusFunnelPrevious";

/**
    Room left around the funnel for the hovered stroke emphasis (up to 3× a
    1px stroke, centered on the outline), so it never clips at the edge.
*/
export const STROKE_BUFFER = 2;

/** The funnel's orientation, from the `orient` setting. */
export function funnelOrient(viz: VizInstance): FunnelOrient {
  return viz.schema.orient === "horizontal" ? "horizontal" : "vertical";
}

/** The profile curve, from the `curve` setting. */
export function funnelCurve(viz: VizInstance): FunnelCurve {
  return viz.schema.curve === "smooth" ? "smooth" : "linear";
}

export const applyFunnelLayout: TransformStage = ({viz}) => {
  const {width, height} = chartBounds(viz);
  const orient = funnelOrient(viz);
  const curve = funnelCurve(viz);
  const data = (viz._filteredData ?? []) as DataPoint[];
  const valueFn = viz.schema.value as (d: DataPoint, i: number) => unknown;
  const values = data.map((d, i) => Number(valueFn(d, i)));

  const vertical = orient === "vertical";
  const length = Math.max(0, (vertical ? height : width) - STROKE_BUFFER * 2);
  const breadth = Math.max(0, (vertical ? width : height) - STROKE_BUFFER * 2);
  const spans = stageSpans(
    data.length,
    length,
    Number(viz.schema.stagePadding),
  ).map(s => ({start: s.start + STROKE_BUFFER, end: s.end + STROKE_BUFFER}));
  const widths = stageWidths(values, breadth);
  const knots = profileKnots(spans, widths, !!viz.schema.taper);
  const rates = conversionRates(values);

  const stages: FunnelStage[] = data.map((d, i) => {
    const span = spans[i];
    const points = profileSlice(knots, span.start, span.end, curve);
    const neck = i
      ? profileSlice(knots, spans[i - 1].end, span.start, curve)
      : [];
    d[FIRST_KEY] = rates.first[i];
    d[PREVIOUS_KEY] = rates.previous[i];
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

  viz.ctx.funnel = {
    orient,
    curve,
    center: (vertical ? width : height) / 2,
    breadth,
    offset: STROKE_BUFFER,
  } satisfies FunnelShared;
  return {shapeData: stages as unknown as DataPoint[]};
};
