/**
    Finds a Plot's outliers (`outlier`): the plotted rows whose value-axis
    value lies past the fences of the values it's compared with, by Tukey's
    interquartile-range rule, a z-score, or the median absolute deviation, or
    the rows a user predicate flags. Rows are compared within groups: each
    line or area series, and each discrete category's points or bars.
*/
import {deviation, groups, mean, median, quantile} from "d3-array";

import type {DataPoint} from "@d3plus/data";

import type {TransformStage} from "../pipeline/stages.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {vizDiscrete} from "../viz/discrete.js";

type Row = Record<string, unknown>;
type Predicate = (d: DataPoint, i: number) => boolean;

/** How outliers are found: past `k` interquartile ranges, standard deviations, or scaled median absolute deviations. */
export type OutlierMethod = "iqr" | "zscore" | "mad";

/** Which rows an outlier is measured against. */
export type OutlierGroup = "auto" | "series" | "discrete" | "all";

/** A resolved `outlier` rule. */
export interface OutlierRule {
  method: OutlierMethod;
  k: number;
  group: OutlierGroup;
}

/** Each method's default `k`. */
export const OUTLIER_K: Readonly<Record<OutlierMethod, number>> = {
  iqr: 1.5,
  zscore: 3,
  mad: 3.5,
};

/** The fewest values a group needs before any of them can be an outlier. */
export const OUTLIER_MIN_VALUES = 3;

/** The shapes whose rows are tested; a Box draws outliers of its own. */
export const OUTLIER_SHAPES = new Set([
  "Area",
  "Bar",
  "Circle",
  "Line",
  "Rect",
  "Tick",
]);

/** One flagged row. */
export interface PlotOutlier {
  /** The plotted row. */
  row: Row;
  /** The axis it was tested on. */
  axis: "x" | "y" | "x2" | "y2";
  /** Which fence it lies past; unset when a predicate flagged it. */
  side?: "high" | "low";
}

/**
    Resolves an `outlier` setting: `true` is Tukey's rule (1.5 interquartile
    ranges), an object picks `method`, `k`, and `group`, and a function flags
    rows itself. Null when off.
    @param setting The chart's `outlier` setting.
*/
export function resolveOutlier(
  setting: unknown,
): OutlierRule | Predicate | null {
  if (typeof setting === "function") return setting as Predicate;
  if (setting === true) return {method: "iqr", k: OUTLIER_K.iqr, group: "auto"};
  if (!setting || typeof setting !== "object") return null;
  const {method, k, group} = setting as Record<string, unknown>;
  const m: OutlierMethod =
    method === "zscore" || method === "mad" ? method : "iqr";
  const g = ["series", "discrete", "all"].includes(group as string)
    ? (group as OutlierGroup)
    : "auto";
  const kk = typeof k === "number" && k > 0 && Number.isFinite(k) ? k : null;
  return {method: m, k: kk ?? OUTLIER_K[m], group: g};
}

/**
    The `[low, high]` fences of `values` (any order): past them, a value is
    an outlier. `"iqr"` fences sit `k` interquartile ranges beyond the first
    and third quartiles (Tukey's rule, as BoxWhisker's whiskers reach);
    `"zscore"` `k` sample standard deviations from the mean; `"mad"` where
    the modified z-score, 0.6745 × (value − median) / MAD, reaches `k`
    (Iglewicz and Hoaglin). Null with fewer than three finite values, or no
    standard deviation or MAD to measure by. With no interquartile range,
    the `"iqr"` fences are the quartiles themselves, as BoxWhisker's
    whiskers are.
    @param values The values.
    @param method The rule.
    @param k How far the fences sit.
*/
export function outlierFences(
  values: number[],
  method: OutlierMethod,
  k: number,
): [number, number] | null {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (sorted.length < OUTLIER_MIN_VALUES) return null;
  if (method === "zscore") {
    const m = mean(sorted)!,
      sd = deviation(sorted)!;
    return sd > 0 ? [m - k * sd, m + k * sd] : null;
  }
  if (method === "mad") {
    const m = median(sorted)!;
    const mad = median(sorted.map(v => Math.abs(v - m)))!;
    const reach = (k * mad) / 0.6745;
    return mad > 0 ? [m - reach, m + reach] : null;
  }
  const q1 = quantile(sorted, 0.25)!,
    q3 = quantile(sorted, 0.75)!;
  const iqr = q3 - q1;
  return [q1 - k * iqr, q3 + k * iqr];
}

/** A value as a number: NaN unless a number or Date. */
const toNumber = (v: unknown): number =>
  typeof v === "number" || v instanceof Date ? +v : NaN;

/**
    The axis a row's value is tested on: the one opposite the discrete axis
    (`y` when there's none), or its secondary twin when only that one holds
    a value.
    @param discrete The chart's discrete axis.
    @param row The plotted row.
*/
export function outlierAxis(
  discrete: unknown,
  row: Row,
): "x" | "y" | "x2" | "y2" {
  const axis = discrete === "y" ? "x" : "y";
  const twin = `${axis}2` as "x2" | "y2";
  return Number.isFinite(toNumber(row[axis])) ||
    !Number.isFinite(toNumber(row[twin]))
    ? axis
    : twin;
}

/** The series key of a row at a `groupBy` depth. */
function seriesKey(viz: VizInstance, row: Row, depth: number): string {
  return viz
    ._ids(row.data as DataPoint, row.i as number)
    .slice(0, depth + 1)
    .join("_");
}

/**
    Splits rows into the sets compared with each other. `"series"` is each
    drawn id when it spans enough rows to test (a line), else the parent
    `groupBy` level's, else every row together (a scatter plot of single
    points), as trend lines group; `"discrete"` is each category of the
    discrete axis, falling back to every row when no category holds enough
    rows to test (see `OUTLIER_MIN_VALUES`); `"all"` is every row. `"auto"` compares a line or area along its series, and other marks
    within their category, or along their series without a discrete axis.
    @param viz The chart.
    @param rows Rows of one shape, all tested on one axis.
    @param group The grouping.
*/
export function outlierGroups(
  viz: VizInstance,
  rows: Row[],
  group: OutlierGroup,
): Row[][] {
  const discrete = vizDiscrete(viz) as string | undefined;
  const shape = rows[0]?.shape;
  const g =
    group !== "auto"
      ? group
      : shape === "Line" || shape === "Area" || !discrete
        ? "series"
        : "discrete";
  if (g === "all") return [rows];
  const several = (sets: Row[][]) =>
    sets.some(set => set.length >= OUTLIER_MIN_VALUES);
  if (g === "discrete" && discrete) {
    const sets = groups(rows, r => `${r[discrete]}`).map(([, s]) => s);
    return several(sets) ? sets : [rows];
  }
  for (let depth = viz._drawDepth; depth >= 0; depth--) {
    const sets = groups(rows, r => seriesKey(viz, r, depth)).map(([, s]) => s);
    if (several(sets)) return sets;
  }
  return [rows];
}

/**
    The outliers among `rows`, keyed by source row: by the chart's `outlier`
    setting, testing each supported mark's value-axis value against its
    group (see `outlierGroups`). Empty when `outlier` is off.
    @param viz The chart.
    @param rows The plotted rows.
*/
export function findOutliers(
  viz: VizInstance,
  rows: Row[],
): Map<DataPoint, PlotOutlier> {
  const out = new Map<DataPoint, PlotOutlier>();
  const rule = resolveOutlier(viz.schema.outlier);
  if (!rule) return out;
  const discrete = vizDiscrete(viz);
  const tested = rows.filter(r => OUTLIER_SHAPES.has(r.shape as string));
  if (typeof rule === "function") {
    for (const row of tested)
      if (rule(row.data as DataPoint, row.i as number))
        out.set(row.data as DataPoint, {
          row,
          axis: outlierAxis(discrete, row),
        });
    return out;
  }
  const sets = groups(
    tested,
    r => r.shape as string,
    r => outlierAxis(discrete, r),
  );
  for (const [, byAxis] of sets)
    for (const [axis, axisRows] of byAxis)
      for (const set of outlierGroups(viz, axisRows, rule.group)) {
        const value = (r: Row) => toNumber(r[axis]);
        const fences = outlierFences(set.map(value), rule.method, rule.k);
        if (!fences) continue;
        for (const row of set) {
          const v = value(row);
          const side = v < fences[0] ? "low" : v > fences[1] ? "high" : null;
          if (side) out.set(row.data as DataPoint, {row, axis, side});
        }
      }
  return out;
}

/**
    `computePlotOutliers` — runs after `formatPlotData`: finds the plotted
    rows' outliers onto `viz._plotOutliers`.
*/
export const computePlotOutliers: TransformStage = ({
  viz,
  plotFormattedData,
}) => {
  viz._plotOutliers = findOutliers(viz, (plotFormattedData || []) as Row[]);
  return {};
};
