/**
    `confidence` by axis: `{x: [lower, upper], y: [lower, upper]}` gives each
    axis its own bounds. At each draw, the bounds along the value axis (y,
    or x when `discrete` is `"y"`) become the chart's `confidence` pair,
    which lines and bars draw as before, and the bounds along the other axis
    become its cross bounds, which points draw as horizontal (or vertical)
    error bars and which widen that axis.
*/
import type {DataPoint} from "@d3plus/data";
import {finite} from "@d3plus/math";

import type {ConfidenceAccessor, VizInstance} from "../viz/vizTypes.js";
import type {ConfidenceBounds} from "./barConfidence.js";
import type {ConfidenceBand} from "./confidenceBands.js";
import {resolveConfidenceBands} from "./confidenceBands.js";

/** Each axis's bounds from a `{x, y}` setting; either may be absent. */
export interface ConfidenceAxes {
  x?: ConfidenceBand;
  y?: ConfidenceBand;
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype;

/**
    The bounds of a `{x: [lower, upper], y: [lower, upper]}` setting, by
    axis (each axis also takes `{lower, upper}`); null for any other
    setting, including `{lower, upper}` itself. An axis without a bound is
    left out.
    @param value The `confidence` setter's argument.
*/
export function resolveConfidenceAxes(value: unknown): ConfidenceAxes | null {
  if (!isPlainObject(value) || !("x" in value || "y" in value)) return null;
  if ("lower" in value || "upper" in value) return null;
  const out: ConfidenceAxes = {};
  for (const axis of ["x", "y"] as const) {
    const [band] = resolveConfidenceBands(value[axis]);
    if (band) out[axis] = band;
  }
  return out;
}

/** The axis a Plot's `confidence` pair bounds: y, or x when `discrete` is `"y"`. */
export const confidenceValueAxis = (viz: VizInstance): "x" | "y" =>
  viz.schema.discrete === "y" ? "x" : "y";

/** The other axis, which a `{x, y}` setting's cross bounds run along. */
export const confidenceCrossAxis = (viz: VizInstance): "x" | "y" =>
  confidenceValueAxis(viz) === "y" ? "x" : "y";

/** A band's bounds as a `[lower, upper]` pair. */
const pair = (
  band: ConfidenceBand | undefined,
): [ConfidenceAccessor | false, ConfidenceAccessor | false] | false =>
  band ? [band.lower, band.upper] : false;

/**
    Applies a `{x, y}` setting for one draw: the value axis's bounds become
    the chart's `confidence` pair and its cross axis's become
    `_confidenceCross`. Without a `{x, y}` setting there are no cross bounds.
    @param viz The chart.
*/
export function syncConfidenceAxes(viz: VizInstance): void {
  const axes = viz._confidenceAxes;
  if (!axes) {
    viz._confidenceCross = false;
    return;
  }
  const value = axes[confidenceValueAxis(viz)];
  viz._confidence = pair(value);
  viz._confidenceBands = value ? [value] : [];
  viz._confidenceCross = pair(axes[confidenceCrossAxis(viz)]);
}

/**
    A source row's finite cross bounds, read through `_confidenceCross`.
    Empty when there are none.
    @param viz The chart.
    @param d The source data row.
    @param i The row's index.
*/
export function rowCrossConfidence(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): ConfidenceBounds {
  const out: ConfidenceBounds = {};
  const cross = viz._confidenceCross;
  if (!cross || !d) return out;
  const [lower, upper] = cross;
  const l = lower ? lower(d, i) : undefined;
  const u = upper ? upper(d, i) : undefined;
  if (finite(l)) out.lower = l;
  if (finite(u)) out.upper = u;
  return out;
}

/**
    A row's cross bounds as the PlotDatum fields `clci` and `chci` (unset
    when the chart has none).
    @param viz The chart.
    @param d The source data row.
    @param i The row's index.
*/
export function crossBounds(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): {clci?: unknown; chci?: unknown} {
  const cross = viz._confidenceCross;
  if (!cross) return {};
  return {
    clci: cross[0] ? cross[0](d, i) : undefined,
    chci: cross[1] ? cross[1](d, i) : undefined,
  };
}

/**
    The cross bounds that widen `axis` (an `x`/`x2` or `y`/`y2` axis):
    every plotted row's `clci` and `chci` when `axis` is the cross axis.
    @param viz The chart.
    @param rows The plotted rows.
    @param axis The axis being measured.
*/
export function crossAxisValues(
  viz: VizInstance,
  rows: Record<string, unknown>[],
  axis: string,
): number[] {
  if (!viz._confidenceCross || axis.charAt(0) !== confidenceCrossAxis(viz))
    return [];
  const out: number[] = [];
  for (const d of rows)
    for (const v of [d.clci, d.chci]) if (finite(v)) out.push(v);
  return out;
}
