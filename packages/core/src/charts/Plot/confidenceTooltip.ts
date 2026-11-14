/**
    Tooltip content for a Plot's `confidence` interval: a "Lower Bound" and
    "Upper Bound" row on a single mark's tooltip, and a compact range after
    each series' value in the shared tooltip. Bounds are read from the source
    row through the `confidence` accessors, so a stacked bar reports the
    user's own values rather than where its error bar is drawn. Nested bands
    list one range row per band on a single mark, and the first band's range
    in the shared tooltip.
    `confidenceConfig.tooltip: false` leaves them out.
*/
import type {DataPoint} from "@d3plus/data";
import {finite} from "@d3plus/math";

import type {VizInstance} from "../viz/vizTypes.js";
import type {ConfidenceBounds} from "./barConfidence.js";
import {confidenceBands, rowBands} from "./confidenceBands.js";
import {confidenceValueAxis, rowCrossConfidence} from "./confidenceAxes.js";
import {axisName, axisValue} from "./sharedTooltip.js";

/** Formats a bound the way the tooltip formats the value it bounds. */
type Format = (value: number) => string;

/** Whether tooltips list the confidence bounds (`confidenceConfig.tooltip`, default `true`). */
export function confidenceTooltipEnabled(viz: VizInstance): boolean {
  return (
    !!(viz._confidence || viz._confidenceCross) &&
    viz._confidenceConfig?.tooltip !== false
  );
}

/**
    A source row's finite confidence bounds, read through the `confidence`
    accessors. Empty when confidence is off or the row has no bounds.
    @param viz The chart.
    @param d The source data row.
    @param i The row's index.
*/
export function rowConfidence(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): ConfidenceBounds {
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
export function confidenceRows(
  viz: VizInstance,
  d: DataPoint,
  i: number,
  format: Format,
): string[][] {
  if (!confidenceTooltipEnabled(viz)) return [];
  if (confidenceBands(viz).length > 1) return bandRows(viz, d, i, format);
  if (viz._confidenceAxes) return axisBoundRows(viz, d, i, format);
  return boundRows(viz, rowConfidence(viz, d, i), format);
}

/** "Lower Bound" and "Upper Bound" rows for whichever bounds are finite, each label followed by `suffix`. */
function boundRows(
  viz: VizInstance,
  {lower, upper}: ConfidenceBounds,
  format: Format,
  suffix = "",
): string[][] {
  const rows: string[][] = [];
  if (finite(lower))
    rows.push([
      `${viz.schema.translate("Lower Bound")}${suffix}`,
      format(lower),
    ]);
  if (finite(upper))
    rows.push([
      `${viz.schema.translate("Upper Bound")}${suffix}`,
      format(upper),
    ]);
  return rows;
}

/**
    The bound rows of a `{x, y}` setting: each axis's bounds, x first, each
    labeled with its axis's name, as "Lower Bound (Weight)", and formatted
    like that axis's values.
    @param viz The chart.
    @param d The source data row.
    @param i The row's index.
    @param format Formats a value-axis bound.
*/
export function axisBoundRows(
  viz: VizInstance,
  d: DataPoint,
  i: number,
  format: Format,
): string[][] {
  const valueAxis = confidenceValueAxis(viz);
  return (["x", "y"] as const).flatMap(axis => {
    const value = axis === valueAxis;
    const bounds = value
      ? rowConfidence(viz, d, i)
      : rowCrossConfidence(viz, d, i);
    const name = axisName(viz, axis);
    return boundRows(
      viz,
      bounds,
      value ? format : v => axisValue(viz, axis, v),
      name ? ` (${name})` : "",
    );
  });
}

/**
    The single-mark tooltip rows for nested bands: `[label, range]` for each
    band with a bound, outermost first.
    @param viz The chart.
    @param d The source data row.
    @param i The row's index.
    @param format Formats a bound like the row's value.
*/
export function bandRows(
  viz: VizInstance,
  d: DataPoint,
  i: number,
  format: Format,
): string[][] {
  return rowBands(viz, d, i)
    .map(({label, lower, upper}) => [label, rangeText(lower, upper, format)])
    .filter(([, range]) => range);
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
export function confidenceSuffix(
  viz: VizInstance,
  d: DataPoint,
  i: number,
  format: Format,
): string {
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
export function rangeSuffix(
  lower: number | undefined,
  upper: number | undefined,
  format: Format,
): string {
  const text = rangeText(lower, upper, format);
  return text ? ` (${text})` : "";
}

/**
    "lower – upper", "≥ lower", "≤ upper", or empty, for whichever bounds
    are finite.
    @param lower The lower bound.
    @param upper The upper bound.
    @param format Formats each bound.
*/
export function rangeText(
  lower: number | undefined,
  upper: number | undefined,
  format: Format,
): string {
  const hasLower = finite(lower),
    hasUpper = finite(upper);
  if (hasLower && hasUpper) return `${format(lower)} – ${format(upper)}`;
  if (hasLower) return `≥ ${format(lower)}`;
  if (hasUpper) return `≤ ${format(upper)}`;
  return "";
}

/** The tooltip surface `appendPointConfidence` extends. */
interface TbodyHost {
  tbody(): unknown;
  tbody(_: (d: DataPoint, i: number) => unknown): unknown;
}

/**
    Adds a hovered point's bounds (see `confidenceRows`) after the rows its
    tooltip already lists, each formatted like its axis's values. Only a
    point mark (a Circle or Rect, or its error bar) takes them: bars and
    lines list theirs in Plot's snapped tooltips.
    @param tooltip The tooltip being rendered.
    @param viz The chart.
    @param d The hovered source row.
    @param i The row's index.
    @param shapeType The hovered mark's shape type.
*/
export function appendPointConfidence<T extends TbodyHost>(
  tooltip: T,
  viz: VizInstance,
  d: DataPoint,
  i: number,
  shapeType: string | undefined,
): T {
  if (!shapeType || !["Circle", "Rect"].includes(shapeType)) return tooltip;
  const axis = confidenceValueAxis(viz);
  const rows = confidenceRows(viz, d, i, v => axisValue(viz, axis, v));
  if (!rows.length) return tooltip;
  const base = tooltip.tbody();
  tooltip.tbody((dd: DataPoint, ii: number) => {
    const own =
      typeof base === "function"
        ? (base as (d: DataPoint, i: number) => unknown)(dd, ii)
        : base;
    return [...(Array.isArray(own) ? own : []), ...rows];
  });
  return tooltip;
}
