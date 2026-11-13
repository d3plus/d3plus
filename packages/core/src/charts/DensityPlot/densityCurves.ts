/**
    Pure helpers for DensityPlot: raw observation rows → one density curve per
    group, every curve smoothed with the same bandwidth and evaluated on the
    same grid, so curves overlay and stack point for point.
*/
import {tickStep} from "d3-array";

import type {DataPoint} from "@d3plus/data";
import {silvermanBandwidth} from "@d3plus/math";
import type {KernelDensityOptions} from "@d3plus/math";

import {
  densityGroups,
  type DensityGroup,
  type DensityScale,
} from "../helpers/densityData.js";

/** Options for `densityCurves`. */
export interface DensityCurveOptions {
  /** Numeric observation accessor. */
  value: (d: DataPoint, i: number) => unknown;
  /** Rows sharing a key share a curve. */
  key: (d: DataPoint, i: number) => string;
  /** Kernel, bandwidth, and grid options for every curve. */
  density?: KernelDensityOptions;
}

/** Every curve, and the bandwidth and grid they share. */
export interface DensityCurves {
  groups: DensityGroup[];
  /** The bandwidth every curve is smoothed with; NaN without observations. */
  bandwidth: number;
  /** The `[min, max]` every curve is evaluated across. */
  extent: [number, number] | undefined;
  /** The total number of observations. */
  n: number;
}

/** A row's observation as a number, NaN when missing or not numeric. */
function observation(raw: unknown): number {
  return raw === null || raw === undefined || raw === "" ? NaN : Number(raw);
}

/** The grid every curve is evaluated on. */
export interface DensityGrid {
  /** The first and last value evaluated. */
  extent: [number, number];
  /** How many values are evaluated. */
  points: number;
  /** The step's decimal places, which every grid value fits in. */
  decimals: number;
}

/**
    An evenly spaced grid covering `[lo, hi]` in round steps (1, 2, or 5 times
    a power of ten, near `(hi - lo) / (points - 1)`), so every value it
    evaluates reads cleanly in tooltips. It starts and ends on a multiple of
    the step, so it may hold a few more or fewer values than `points`.
    @param lo The smallest value to cover.
    @param hi The largest value to cover.
    @param points About how many values to evaluate (minimum 2).
*/
export function densityGrid(
  lo: number,
  hi: number,
  points: number,
): DensityGrid {
  const count = Math.max(2, Math.round(Number.isFinite(points) ? points : 2));
  const step = hi > lo ? tickStep(lo, hi, count - 1) : 0;
  if (!(step > 0)) return {extent: [lo, hi], points: count, decimals: 0};
  let decimals = 0;
  while (
    decimals < 15 &&
    Math.abs(step * 10 ** decimals - Math.round(step * 10 ** decimals)) > 1e-6
  )
    decimals++;
  const start = Math.floor(lo / step),
    end = Math.ceil(hi / step);
  const round = (v: number) => +v.toFixed(decimals);
  return {
    extent: [round(start * step), round(end * step)],
    points: end - start + 1,
    decimals,
  };
}

/**
    The bandwidth every curve shares: `density.bandwidth` when it is a positive
    number (or a function of the pooled values returning one), else Silverman's
    rule of thumb on the pooled values. NaN when there are no finite values.
    @param values Every group's observations, pooled.
    @param density The kernel density options.
*/
export function pooledBandwidth(
  values: readonly number[],
  density: KernelDensityOptions = {},
): number {
  const finite = values.filter(v => Number.isFinite(v));
  if (!finite.length) return NaN;
  const requested =
    typeof density.bandwidth === "function"
      ? density.bandwidth(finite)
      : density.bandwidth;
  return requested !== undefined && requested > 0 && Number.isFinite(requested)
    ? requested
    : silvermanBandwidth(finite);
}

/**
    Groups raw rows by `options.key` and estimates each group's density with
    one bandwidth (see `pooledBandwidth`) on one grid (see `densityGrid`):
    from `cut` bandwidths below the smallest pooled value to `cut` above the
    largest (or `density.extent`, evaluated at `density.points` values). Groups keep the order of their first row; rows without
    a finite value are dropped.
    @param rows The raw observation rows.
    @param options The value and key accessors, and the curve options.
*/
export function densityCurves(
  rows: readonly DataPoint[],
  options: DensityCurveOptions,
): DensityCurves {
  const density = options.density ?? {};
  const pooled: number[] = [];
  rows.forEach((d, i) => {
    if (!d) return;
    const v = observation(options.value(d, i));
    if (Number.isFinite(v)) pooled.push(v);
  });
  const bandwidth = pooledBandwidth(pooled, density);
  if (!pooled.length) return {groups: [], bandwidth, extent: undefined, n: 0};

  let extent = density.extent;
  let points = density.points;
  let decimals: number | undefined;
  if (!extent) {
    const cut = Math.max(0, density.cut ?? 3);
    let lo = Infinity,
      hi = -Infinity;
    pooled.forEach(v => {
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    });
    const grid = densityGrid(
      lo - cut * bandwidth,
      hi + cut * bandwidth,
      points ?? 100,
    );
    ({extent, points, decimals} = grid);
  }
  const groups = densityGroups(rows, {
    value: options.value,
    key: options.key,
    density: {...density, bandwidth, extent, points},
  });
  // Grid values drift off their round steps in floating point.
  if (decimals !== undefined)
    groups.forEach(g =>
      g.summary.curve.forEach(p => (p[0] = +p[0].toFixed(decimals))),
    );
  return {groups, bandwidth, extent, n: pooled.length};
}

/**
    A function giving the factor each group's densities are multiplied by:
    - `"area"`: 1, so every curve's area is 1.
    - `"count"`: the group's share of all observations, so areas are
      proportional to group sizes and the curves add up to the density of
      every observation together.
    - `"width"`: one over the group's own peak, so every curve peaks at 1.
    @param total The number of observations across every group.
    @param mode The scaling mode.
*/
export function densityHeightScale(
  total: number,
  mode: DensityScale = "area",
): (group: DensityGroup) => number {
  if (mode === "width")
    return g => (g.summary.peak > 0 ? 1 / g.summary.peak : 0);
  if (mode === "count") return g => (total > 0 ? g.summary.n / total : 0);
  return () => 1;
}

/**
    The scaling a DensityPlot draws with: `densityScale` when set to a known
    mode, else `"count"` when stacked (so the stack's top edge is the density
    of every observation) and `"area"` when overlaid.
    @param scale The configured `densityScale`.
    @param stacked Whether the curves are stacked.
*/
export function resolveDensityScale(
  scale: unknown,
  stacked: unknown,
): DensityScale {
  return scale === "area" || scale === "count" || scale === "width"
    ? scale
    : stacked
      ? "count"
      : "area";
}

/**
    The (untranslated) label for what a curve's height measures under a
    scaling mode, used as the default y-axis title.
    @param mode The scaling mode.
*/
export function densityHeightLabel(mode: DensityScale): string {
  return mode === "width" ? "Relative Density" : "Density";
}
