/**
    Pure density helpers shared by Violin and Ridgeline: raw observation rows
    → one summary per group (quartiles plus a kernel density curve), and the
    scale that turns a curve's densities into widths.
*/
import {mean, quantileSorted} from "d3-array";

import type {DataPoint} from "@d3plus/data";
import {kernelDensity} from "@d3plus/math";
import type {DensityPoint, KernelDensityOptions} from "@d3plus/math";

/** The distribution of one group of observations. */
export interface DensitySummary {
  /** The group's rows that have a finite value, in data order. */
  rows: DataPoint[];
  /** Each row's value, aligned with `rows`. */
  observed: number[];
  /** Their values, ascending. */
  values: number[];
  n: number;
  min: number;
  /** First quartile. */
  q1: number;
  median: number;
  /** Third quartile. */
  q3: number;
  max: number;
  mean: number;
  /** The `[value, density]` curve, ascending by value. */
  curve: DensityPoint[];
  /** The curve's highest density. */
  peak: number;
}

/** One group of raw rows and its distribution. */
export interface DensityGroup {
  key: string;
  /** The group's first row, whose fields the summary row copies. */
  first: DataPoint;
  summary: DensitySummary;
}

/** Options for `densityGroups`. */
export interface DensityGroupOptions {
  /** Numeric observation accessor. */
  value: (d: DataPoint, i: number) => unknown;
  /** Rows sharing a key are summarized together. */
  key: (d: DataPoint, i: number) => string;
  /** Kernel, bandwidth, and grid options for every group's curve. */
  density?: KernelDensityOptions;
}

/** How density curves are scaled to widths across groups. */
export type DensityScale = "area" | "count" | "width";

/** How groups are ordered. */
export type MedianSort = false | "ascending" | "descending";

/**
    The quartiles (computed the way `Box` computes them), extent, mean, and
    density curve of `values`. Returns null when none are finite.
    @param values The observations.
    @param density Kernel, bandwidth, and grid options for the curve.
*/
export function densityStats(
  values: readonly number[],
  density: KernelDensityOptions = {},
): Omit<DensitySummary, "rows" | "observed"> | null {
  const sorted = values.filter(v => Number.isFinite(v)).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const curve = kernelDensity(sorted, density);
  return {
    values: sorted,
    n: sorted.length,
    min: sorted[0],
    q1: quantileSorted(sorted, 0.25) as number,
    median: quantileSorted(sorted, 0.5) as number,
    q3: quantileSorted(sorted, 0.75) as number,
    max: sorted[sorted.length - 1],
    mean: mean(sorted) as number,
    curve,
    peak: curve.reduce((m, p) => Math.max(m, p[1]), 0),
  };
}

/**
    Groups raw rows by `options.key` and summarizes each group's values, in
    order of each group's first appearance. Rows without a finite value are
    dropped, and so are groups left without any.
    @param rows The raw observation rows.
    @param options The value and key accessors, and the curve options.
*/
export function densityGroups(rows: readonly DataPoint[], options: DensityGroupOptions): DensityGroup[] {
  const groups = new Map<string, {first: DataPoint; rows: DataPoint[]; values: number[]}>();
  rows.forEach((d, i) => {
    if (!d) return;
    const raw = options.value(d, i);
    const v = raw === null || raw === undefined || raw === "" ? NaN : Number(raw);
    if (!Number.isFinite(v)) return;
    const key = options.key(d, i);
    let group = groups.get(key);
    if (!group) groups.set(key, (group = {first: d, rows: [], values: []}));
    group.rows.push(d);
    group.values.push(v);
  });
  const out: DensityGroup[] = [];
  groups.forEach((group, key) => {
    const stats = densityStats(group.values, options.density);
    if (stats) out.push({key, first: group.first, summary: {...stats, rows: group.rows, observed: group.values}});
  });
  return out;
}

/**
    A function giving the factor that maps each summary's densities onto
    `[0, 1]` widths:
    - `"area"`: one factor for every curve (the widest peak spans the full
      width), so every shape has the same area, as each curve integrates to 1.
    - `"count"`: like `"area"`, with each curve weighted by its observations,
      so areas are proportional to group sizes.
    - `"width"`: each curve scaled to its own peak, so every shape spans the
      full width.
    @param summaries Every summary drawn on the same scale.
    @param mode The scaling mode.
*/
export function densityWidthScale(
  summaries: readonly DensitySummary[],
  mode: DensityScale = "area",
): (s: DensitySummary) => number {
  if (mode === "width") return s => (s.peak > 0 ? 1 / s.peak : 0);
  if (mode === "count") {
    const top = summaries.reduce((m, s) => Math.max(m, s.peak * s.n), 0);
    return s => (top > 0 ? s.n / top : 0);
  }
  const top = summaries.reduce((m, s) => Math.max(m, s.peak), 0);
  return () => (top > 0 ? 1 / top : 0);
}

/**
    The groups in drawing order: data order, or sorted by median (ties keep
    data order).
    @param groups The groups, in data order.
    @param sort `false` for data order, or the median direction.
*/
export function sortByMedian<T extends {summary: Pick<DensitySummary, "median">}>(
  groups: readonly T[],
  sort: MedianSort,
): T[] {
  const list = groups.slice();
  if (sort !== "ascending" && sort !== "descending") return list;
  const dir = sort === "ascending" ? 1 : -1;
  return list
    .map((g, i) => ({g, i}))
    .sort((a, b) => dir * (a.g.summary.median - b.g.summary.median) || a.i - b.i)
    .map(({g}) => g);
}

/**
    The density at `value` on a curve, linearly interpolated between its
    points; 0 outside it.
    @param curve The `[value, density]` points, ascending by value.
    @param value The value to read.
*/
export function densityAt(curve: readonly DensityPoint[], value: number): number {
  if (!curve.length || value < curve[0][0] || value > curve[curve.length - 1][0]) return 0;
  let lo = 0, hi = curve.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (curve[mid][0] <= value) lo = mid;
    else hi = mid;
  }
  const [x0, y0] = curve[lo], [x1, y1] = curve[hi];
  return x1 === x0 ? Math.max(y0, y1) : y0 + ((y1 - y0) * (value - x0)) / (x1 - x0);
}
