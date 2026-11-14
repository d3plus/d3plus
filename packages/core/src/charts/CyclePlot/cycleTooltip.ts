/**
    CyclePlot's tooltips: a point's date in its season and cycle (rather
    than the cycle its panel's x axis places it at), and the mean of its
    series in its panel.

    @module
*/
import type {DataPoint} from "@d3plus/data";
import {timeFormatLocale} from "d3-time-format";
import type {TimeLocaleDefinition as D3TimeLocale} from "d3-time-format";
import type {TimeLocaleDefinition} from "@d3plus/locales";

import {unwrapRow} from "../features/shareKey.js";
import {axisValue} from "../Plot/sharedTooltip.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {cycleMeans} from "./cycleMeans.js";
import {cyclePeriodLabel, cyclePeriodOf} from "./cyclePeriods.js";
import type {CyclePeriod} from "./cyclePeriods.js";

/** A row accessor. */
type RowFn = (d: DataPoint, i: number) => unknown;

/**
    A date as its season in its cycle, in a d3-time-format locale: a month
    or quarter with its year (`"Jul 1955"`, `"Q3 1955"`), or a weekday or
    hour with its date (`"Mon 1/2/2023"`, `"1/2/2023 1 PM"`).
*/
export function cycleDateLabel(
  date: Date,
  period: CyclePeriod,
  locale: TimeLocaleDefinition,
  utc = false,
): string {
  const formats = timeFormatLocale(locale as unknown as D3TimeLocale);
  const format = (spec: string) =>
    (utc ? formats.utcFormat(spec) : formats.format(spec))(date);
  const season = cyclePeriodLabel(
    cyclePeriodOf(date, period, utc),
    period,
    locale,
  );
  if (period === "weekday") return `${season} ${format(locale.date)}`;
  if (period === "hour") return `${format(locale.date)} ${season}`;
  return `${season} ${format("%Y")}`;
}

/** What the tooltip reads from the chart. */
export interface CycleTooltipContext {
  /** Each row's date. */
  date: (d: DataPoint, i: number) => Date | undefined;
  /** Each row's season. */
  season: (d: DataPoint, i: number) => number | undefined;
  period: CyclePeriod;
  locale: TimeLocaleDefinition;
  utc: boolean;
}

/** Whether a row belongs to no series (data without `groupBy`). */
export function noSeries(viz: VizInstance, d: DataPoint, i: number): boolean {
  const id = viz._id(d, i);
  return id === undefined || id === null || `${id}` === "undefined";
}

/**
    The mean of `d`'s series over the rows of its panel (its season), or
    undefined without one.
*/
export function cycleRowMean(
  viz: VizInstance,
  ctx: Pick<CycleTooltipContext, "season">,
  d: DataPoint,
  i: number,
): number | undefined {
  const season = ctx.season(d, i);
  if (season === undefined || !viz._y) return undefined;
  const id = `${viz._id(d, i)}`;
  const rows = (viz._filteredData || []).filter(
    (r, k) => ctx.season(r, k) === season && `${viz._id(r, k)}` === id,
  );
  return cycleMeans(rows, viz._id as RowFn, viz._y as RowFn)[0]?.mean;
}

/** The tooltip's title: the series' name, or the point's date when the data has no series. */
export function cycleTooltipTitle(
  viz: VizInstance,
  ctx: CycleTooltipContext,
  datum: DataPoint,
  i: number,
): string {
  const d = unwrapRow(datum);
  if (!noSeries(viz, d, i)) return viz._drawLabel(d, i);
  const date = ctx.date(d, i);
  return date ? cycleDateLabel(date, ctx.period, ctx.locale, ctx.utc) : "";
}

/**
    The x value a tooltip shows for a row: its date in its season and cycle
    (see `cycleDateLabel`), or null for a row of no series, whose title is
    its date. Undefined for other axes, or a row without a date.
*/
export function cycleAxisLabel(
  viz: VizInstance,
  ctx: CycleTooltipContext,
  axis: "x" | "y",
  datum: DataPoint,
  i: number,
): string | null | undefined {
  if (axis !== "x") return undefined;
  const d = unwrapRow(datum);
  const date = ctx.date(d, i);
  if (!date) return undefined;
  return noSeries(viz, d, i)
    ? null
    : cycleDateLabel(date, ctx.period, ctx.locale, ctx.utc);
}

/**
    The rows a tooltip adds after the point's x and y values: its series'
    mean in its panel (none with `mean` off).
*/
export function cycleTooltipRows(
  viz: VizInstance,
  ctx: CycleTooltipContext,
  datum: DataPoint,
  i: number,
): [string, string][] {
  if (viz.schema.mean === false) return [];
  const mean = cycleRowMean(viz, ctx, unwrapRow(datum), i);
  return mean === undefined
    ? []
    : [[viz.schema.translate("Mean"), axisValue(viz, "y", mean)]];
}
