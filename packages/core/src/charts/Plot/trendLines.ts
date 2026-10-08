/**
    Automatic trend lines: fits a regression per series (or across all data)
    from the formatted Plot rows, samples it along the independent axis, and
    widens the dependent axis's values so the fitted line and its confidence
    band stay inside the plot. Painted by `trendScene.ts`.
*/
import {groups} from "d3-array";

import type {DataPoint} from "@d3plus/data";
import {linearConfidence, linearPrediction, regression} from "@d3plus/math";
import type {RegressionResult, RegressionType} from "@d3plus/math";

import type {TransformStage} from "../pipeline/stages.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {isSpanAxis} from "./discreteSpan.js";
import {projectionPositions} from "./trendProjection.js";

type Row = Record<string, unknown>;
type Axis = "x" | "y";

/** The regression types `trendLine` accepts. */
export const trendTypes: RegressionType[] = [
  "linear",
  "exponential",
  "logarithmic",
  "power",
  "polynomial",
];

/** Number of points sampled along a continuous independent axis. */
const SAMPLES = 50;

/** One point along a fitted trend line, in plot data space. */
export interface TrendSample {
  x: unknown;
  y: unknown;
  /** Lower confidence bound on the dependent axis. */
  lci?: number;
  /** Upper confidence bound on the dependent axis. */
  hci?: number;
  /** Whether the point lies in the projection past the fitted data. */
  projected?: boolean;
  /** Whether the point sits on one of the projection's axis positions (the ones hover snaps to). */
  step?: boolean;
}

/** A fitted trend line, ready to paint. */
export interface TrendFit {
  /** Stable key: the series id, or "all". */
  id: string;
  /** Tooltip title: the series label, or the translated "Trend Line". */
  label: string;
  /** Line stroke (and band fill). */
  color: string;
  /** The independent axis the fit runs along. */
  axis: Axis;
  fit: RegressionResult;
  samples: TrendSample[];
  /** A source row of the series, so hover dimming treats the line as part of it. */
  row?: DataPoint;
}

/** The values `trendLine` accepts: a regression type, `true` (linear), or `false` (off). */
export type TrendLineType = boolean | RegressionType;

/** The default `trendLineConfig`. */
export function trendLineDefaults(): Record<string, unknown> {
  return {
    confidence: false,
    confidenceConfig: {fillOpacity: 0.15},
    confidenceLevel: 0.95,
    group: "series",
    order: 2,
    projection: 0,
    projectionConfig: {strokeDasharray: "2 4"},
    strokeDasharray: "6 4",
    strokeWidth: 2,
    tooltip: true,
  };
}

/** Resolves the `trendLine` setting to a regression type, or null when off. */
export function resolveTrendType(value: unknown): RegressionType | null {
  if (value === true) return "linear";
  return trendTypes.includes(value as RegressionType) ? (value as RegressionType) : null;
}

/**
    The axis a trend line runs along: the discrete axis when one is set (so a
    horizontal bar chart fits along y), otherwise x.
*/
export function trendAxis(discrete: unknown): Axis {
  return discrete === "y" ? "y" : "x";
}

/**
    Maps independent-axis values to numbers for fitting, and back again for
    plotting: Dates by timestamp, numbers as-is, and anything else (category
    names) by its position in the axis's ordered values.
*/
export function trendNumberScale(order: unknown[]): {
  toNumber: (v: unknown) => number;
  fromNumber: (n: number) => unknown;
} {
  const keys = order.map(v => `${v}`);
  const categorical = order.some(v => !(v instanceof Date) && typeof v !== "number");
  const time = order.some(v => v instanceof Date);
  return {
    toNumber: v => {
      if (v instanceof Date) return +v;
      if (!categorical && typeof v === "number") return v;
      const index = keys.indexOf(`${v}`);
      return index < 0 ? NaN : index;
    },
    fromNumber: n => (categorical ? order[Math.round(n)] : time ? new Date(n) : n),
  };
}

/**
    The independent-axis positions to sample a fit at, within its extent: one
    per category on a point scale (in-between positions can't be placed), or
    evenly spaced points on a continuous axis.
*/
export function trendSamplePositions(
  extent: [number, number],
  categories: number[] | null,
  count = SAMPLES,
): number[] {
  const [lo, hi] = extent;
  if (categories) return categories.filter(n => n >= lo && n <= hi);
  if (lo === hi) return [lo];
  return Array.from({length: count}, (_, i) => lo + (hi - lo) * i / (count - 1));
}

/**
    The independent-axis positions to sample a fit's projection at, past the
    end of its data: each projected category on a point scale, or on a
    continuous axis evenly spaced points (as dense as the fitted stretch)
    together with every projected step. The first position is the fit's last
    value, where the projection starts.
    @param extent The fit's `[min, max]` independent values.
    @param steps The axis positions the projection passes through, as numbers.
    @param categories The point scale's positions, or null on a continuous axis.
*/
export function trendProjectionPositions(
  extent: [number, number],
  steps: number[],
  categories: number[] | null,
): number[] {
  const [lo, hi] = extent;
  const end = Math.max(...steps);
  if (!(end > hi)) return [];
  if (categories) return [hi, ...categories.filter(n => n > hi && n <= end)];
  const count = hi > lo ? Math.round(SAMPLES * (end - hi) / (hi - lo)) : SAMPLES;
  const even = trendSamplePositions([hi, end], null, Math.min(Math.max(count, 2), SAMPLES) + 1);
  return Array.from(new Set([...even, ...steps.filter(n => n > hi)])).sort((a, b) => a - b);
}

/** Whether an axis plots on a point (category) scale, matching `computePlotScales`. */
function isPointAxis(viz: VizInstance, axis: Axis): boolean {
  if (viz[`_${axis}Time`]) return false;
  return (viz.schema.discrete === axis && !isSpanAxis(viz, axis)) || !!viz.schema[`${axis}Sort`];
}

/** The id of the series a row belongs to at a `groupBy` depth. */
function seriesKey(viz: VizInstance, row: Row, depth: number): string {
  return viz._ids(row.data as DataPoint, row.i as number)
    .slice(0, depth + 1)
    .join("_");
}

/** A set of points to fit: its key, `[x, y]` points, a source row, and the depth labeling it. */
type FitGroup = [string, [number, number][], Row | undefined, number];

/**
    Groups rows into the sets to fit. A series is the drawn id when it spans
    several points (a line, or a series of bars); when every drawn id is a
    single point (a scatter plot), series come from the parent `groupBy`
    level, or all points fit together at the top level.
*/
function fitGroups(
  viz: VizInstance,
  rows: Row[],
  axis: Axis,
  toNumber: (v: unknown) => number,
): FitGroup[] {
  const dep = axis === "x" ? "y" : "x";
  const point = (r: Row): [number, number] => [toNumber(r[axis]), +(r[dep] as number)];
  // A stacked chart fits the stack totals, so the line follows the stack tops.
  if (viz.schema.stacked) {
    const totals = groups(rows, r => toNumber(r[axis]))
      .map(([n, rs]): [number, number] => [n, rs.reduce((s, r) => s + (+(r[dep] as number) || 0), 0)]);
    return [["all", totals, undefined, -1]];
  }
  const all: FitGroup[] = [["all", rows.map(point), undefined, -1]];
  if (viz._trendLineConfig?.group === "all") return all;
  const bySeries = (depth: number): FitGroup[] =>
    groups(rows, r => seriesKey(viz, r, depth)).map(([key, rs]) => [key, rs.map(point), rs[0], depth]);
  const depth = viz._drawDepth;
  const drawn = bySeries(depth);
  if (drawn.some(([, points]) => points.length > 1)) return drawn;
  return depth > 0 ? bySeries(depth - 1) : all;
}

/**
    Fits the trend lines for the current data; empty when `trendLine` is off.
    `projected` lists future independent-axis positions (from
    `projectionPositions`) each line extends to, past the end of its data.
*/
export function computeTrendFits(
  viz: VizInstance,
  rows: Row[],
  order: unknown[],
  projected: unknown[] = [],
): TrendFit[] {
  const type = resolveTrendType(viz._trendLine);
  if (!type || !rows.length) return [];
  const config = viz._trendLineConfig || {};
  const axis = trendAxis(viz.schema.discrete);
  const dep = axis === "x" ? "y" : "x";
  const {toNumber, fromNumber} = trendNumberScale(order.concat(projected));
  const categories = isPointAxis(viz, axis)
    ? order.concat(projected).map(toNumber).filter(Number.isFinite)
    : null;
  // With a projection on, a line projects through every axis position past
  // its data: the projected ones, and those other series still plot.
  const steps = projected.length
    ? order.concat(projected).map(toNumber).filter(Number.isFinite)
    : [];
  const logDep = `${viz[`_${dep}Config`]?.scale}`.toLowerCase() === "log";
  const fill = viz.schema.shapeConfig.fill;

  const fits: TrendFit[] = [];
  for (const [id, points, source, depth] of fitGroups(viz, rows, axis, toNumber)) {
    const fit = regression(points, type, {order: config.order as number | undefined});
    if (!fit) continue;
    const banded = config.confidence && type === "linear";
    const level = config.confidenceLevel as number | undefined;
    // The fitted stretch bands the mean response; the projection widens to
    // where a new observation could fall.
    const band = banded ? linearConfidence(points, level) : null;
    const fan = banded ? linearPrediction(points, level) : null;
    const samples: TrendSample[] = [];
    const sampleAt = (n: number, projectedRun: boolean) => {
      const value = fit.predict(n);
      if (!Number.isFinite(value) || (logDep && value <= 0)) return;
      const sample = {[axis]: fromNumber(n), [dep]: value} as unknown as TrendSample;
      const bounds = projectedRun ? fan : band;
      if (bounds) [sample.lci, sample.hci] = bounds(n);
      if (projectedRun) sample.projected = true;
      if (projectedRun && n > fit.extent[1] && steps.includes(n)) sample.step = true;
      samples.push(sample);
    };
    trendSamplePositions(fit.extent, categories).forEach(n => sampleAt(n, false));
    trendProjectionPositions(fit.extent, steps, categories).forEach(n => sampleAt(n, true));
    if (samples.length < 2) continue;
    const row = source ? (source.data as DataPoint) : undefined;
    const color = config.stroke
      ? config.stroke
      : row
        ? typeof fill === "function" ? fill(row, source!.i) : fill
        : "#444";
    const label = row
      ? viz._drawLabel(row, source!.i as number, depth)
      : viz.schema.translate("Trend Line");
    fits.push({id, label, color, axis, fit, samples, row});
  }
  return fits;
}

/** The dependent-axis values a set of fits plots, including band bounds. */
export function trendDomainValues(fits: TrendFit[]): number[] {
  const values: number[] = [];
  for (const {axis, samples} of fits) {
    const dep = axis === "x" ? "y" : "x";
    for (const s of samples) {
      values.push(s[dep] as number);
      if (s.lci !== undefined) values.push(s.lci, s.hci!);
    }
  }
  return values.filter(Number.isFinite);
}

/**
    `computePlotTrendFits` — runs after `computePlotAxisValues`: fits the
    trend lines onto `viz._trendFits` and appends their values to the
    dependent axis's values, so the non-stacked domain covers them (the
    stacked domain reads `viz._trendFits` directly). A projection's future
    positions join the independent axis's values, widening it to fit.
*/
export const computePlotTrendFits: TransformStage = ({viz, plotFormattedData, xData, yData}) => {
  const axis = trendAxis(viz.schema.discrete);
  const order = (axis === "x" ? xData : yData) || [];
  const projected = resolveTrendType(viz._trendLine)
    ? projectionPositions(order, viz._trendLineConfig?.projection)
    : [];
  const fits = (viz._trendFits = viz._swarm ? [] : computeTrendFits(viz, plotFormattedData || [], order, projected));
  if (!fits.length) return {};
  const extra = trendDomainValues(fits);
  const out = axis === "x"
    ? {yData: (yData || []).concat(extra)}
    : {xData: (xData || []).concat(extra)};
  if (!fits.some(f => f.samples.some(s => s.projected))) return out;
  return {...out, [`${axis}Data`]: order.concat(projected)};
};
