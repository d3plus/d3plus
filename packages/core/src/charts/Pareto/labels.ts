/**
    Pareto's text: the tooltip rows (a bar's value, its share of the total,
    and the running share through its category), the secondary axis's
    percentage ticks and title, and the reference line at the
    `paretoThreshold` share.

    @module
*/
import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";

import {fieldNameOf} from "../../utils/fieldAccessor.js";
import {autoTitle} from "../helpers/valueTitle.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {
  barRows,
  categoryAxis,
  lineLabel,
  lineStep,
  paretoState,
  percentFormat,
  shareAxis,
  stepOf,
  valueAxis,
  valueOf,
} from "./state.js";

/** Formats a value as the value axis does: its `tickFormat`, else abbreviated. */
export function valueFormat(viz: VizInstance): (n: number) => string {
  const config = viz[`_${valueAxis(viz)}Config`] as
    {tickFormat?: (d: number) => string} | undefined;
  if (config && typeof config.tickFormat === "function")
    return config.tickFormat;
  return (n: number) => formatAbbreviate(n, viz.schema.locale);
}

/** The value's name in tooltips: the value axis's data key, else "Value". */
export function valueName(viz: VizInstance): string {
  const accessor = paretoState(viz).accessors[valueAxis(viz)];
  return fieldNameOf(accessor) ?? viz.schema.translate("Value");
}

/** A number, or 0 when it isn't a finite one. */
const amount = (v: unknown): number =>
  typeof v === "number" && Number.isFinite(v) ? v : 0;

/**
    Tooltip rows for a bar or a point of the cumulative line: the value (the
    bar's own, or its category's total on the line), its share of every
    category's total, and the running share through its category.
    @param viz The chart.
    @param d The hovered row.
    @param i Its index.
*/
export function tooltipRows(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): string[][] {
  const step = stepOf(viz, d, i);
  if (!step) return [];
  const t = viz.schema.translate;
  const percent = percentFormat(viz);
  const value = lineStep(d) ? step.value : amount(valueOf(viz, d, i));
  const grand = step.share > 0 ? step.value / step.share : 0;
  return [
    [valueName(viz), valueFormat(viz)(value)],
    [t("Share"), percent(grand > 0 ? value / grand : 0)],
    [t("Cumulative Share"), percent(step.cumulativeShare)],
  ];
}

/** The tooltip title: a bar's label, or the category of a point on the line. */
export function tooltipTitle(viz: VizInstance, d: DataPoint, i: number) {
  const step = lineStep(d);
  return step ? `${step.category}` : viz._drawLabel(d, i);
}

/**
    The reference line at the `paretoThreshold` share, across the secondary
    axis and styled by `paretoThresholdConfig`: dashed, and labeled with the
    share (such as "80%") at the end of the line over the smallest bars.
    None when `paretoThreshold` isn't a number, or nothing is drawn.
    @param viz The chart.
*/
export function thresholdLines(viz: VizInstance): Record<string, unknown>[] {
  const at = viz.schema.paretoThreshold;
  if (typeof at !== "number" || !Number.isFinite(at)) return [];
  if (!barRows(viz._filteredData).length) return [];
  const config = (viz.schema.paretoThresholdConfig ?? {}) as Record<
    string,
    unknown
  >;
  return [
    {
      dash: true,
      label: percentFormat(viz)(at),
      // The label sits at the line's end over the smallest bars: the right
      // of upright bars, the bottom of horizontal ones.
      labelPosition: categoryAxis(viz) === "y" ? "start" : "end",
      ...config,
      [shareAxis(viz)]: at,
    },
  ];
}

/**
    Titles the secondary axis the line is drawn on after the line, unless
    the user has titled it, and takes the title back from the other one
    when the bars turn.
    @param viz The chart.
*/
export function titleShareAxis(viz: VizInstance): void {
  const state = paretoState(viz);
  const title = lineLabel(viz);
  const own = viz[`_${shareAxis(viz)}Config`] as Record<string, unknown>;
  const other = viz[
    `_${categoryAxis(viz) === "x" ? "x2" : "y2"}Config`
  ] as Record<string, unknown>;
  if (other && state.title !== undefined && other.title === state.title)
    other.title = undefined;
  autoTitle(own, state.title, title);
  state.title = title;
}
