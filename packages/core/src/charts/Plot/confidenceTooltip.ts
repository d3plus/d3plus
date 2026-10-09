/**
    Tooltip content for a Plot's `confidence` interval: a "Lower Bound" and
    "Upper Bound" row on a single mark's tooltip, and a compact range after
    each series' value in the shared tooltip. Bounds are read from the source
    row through the `confidence` accessors, so a stacked bar reports the
    user's own values rather than where its error bar is drawn.
    `confidenceConfig.tooltip: false` leaves them out.
*/
import type {DataPoint} from "@d3plus/data";

import type {VizInstance} from "../viz/vizTypes.js";
import type {ConfidenceBounds} from "./barConfidence.js";

/** Formats a bound the way the tooltip formats the value it bounds. */
type Format = (value: number) => string;

const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** Whether tooltips list the confidence bounds (`confidenceConfig.tooltip`, default `true`). */
export function confidenceTooltipEnabled(viz: VizInstance): boolean {
  return !!viz._confidence && viz._confidenceConfig?.tooltip !== false;
}

/**
    A source row's finite confidence bounds, read through the `confidence`
    accessors. Empty when confidence is off or the row has no bounds.
    @param viz The chart.
    @param d The source data row.
    @param i The row's index.
*/
export function rowConfidence(viz: VizInstance, d: DataPoint, i: number): ConfidenceBounds {
  const out: ConfidenceBounds = {};
  const confidence = viz._confidence;
  if (!confidence || !d) return out;
  const [lower, upper] = confidence;
  const l = lower ? lower(d, i) : undefined;
  const u = upper ? upper(d, i) : undefined;
  if (finite(l)) out.lower = l;
  if (finite(u)) out.upper = u;
  return out;
}

/**
    The single-mark tooltip rows for a row's bounds: `[label, value]` for each
    bound it has, none when it has neither or tooltips leave them out.
    @param viz The chart.
    @param d The source data row.
    @param i The row's index.
    @param format Formats a bound like the row's value.
*/
export function confidenceRows(viz: VizInstance, d: DataPoint, i: number, format: Format): string[][] {
  if (!confidenceTooltipEnabled(viz)) return [];
  const {lower, upper} = rowConfidence(viz, d, i);
  const rows: string[][] = [];
  if (finite(lower)) rows.push([viz.schema.translate("Lower Bound"), format(lower)]);
  if (finite(upper)) rows.push([viz.schema.translate("Upper Bound"), format(upper)]);
  return rows;
}

/**
    The shared tooltip's range after a series' value: " (lower – upper)", or
    " (≥ lower)" / " (≤ upper)" for a one-sided interval. Empty when the row
    has no bounds or tooltips leave them out.
    @param viz The chart.
    @param d The source data row.
    @param i The row's index.
    @param format Formats a bound like the row's value.
*/
export function confidenceSuffix(viz: VizInstance, d: DataPoint, i: number, format: Format): string {
  if (!confidenceTooltipEnabled(viz)) return "";
  const {lower, upper} = rowConfidence(viz, d, i);
  return rangeSuffix(lower, upper, format);
}

/**
    " (lower – upper)", " (≥ lower)", " (≤ upper)", or empty, for whichever
    bounds are finite.
    @param lower The lower bound.
    @param upper The upper bound.
    @param format Formats each bound.
*/
export function rangeSuffix(lower: number | undefined, upper: number | undefined, format: Format): string {
  const hasLower = finite(lower), hasUpper = finite(upper);
  if (hasLower && hasUpper) return ` (${format(lower)} – ${format(upper)})`;
  if (hasLower) return ` (≥ ${format(lower)})`;
  if (hasUpper) return ` (≤ ${format(upper)})`;
  return "";
}
