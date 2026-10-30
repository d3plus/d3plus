/**
    What a Gantt task reads as in its tooltip and aria label: its start,
    end, duration, and progress (or a milestone's date), in the chart's
    locale and translated.
*/

import {timeFormatLocale} from "d3-time-format";
import type {TimeLocaleDefinition as D3TimeLocale} from "d3-time-format";

import type {DataPoint} from "@d3plus/data";
import {dateFullFormatter, formatAbbreviate} from "@d3plus/format";

import {calendarTimeLocale} from "../Calendar/calendarFormat.js";
import {isTimeAxis, parseTime, rowTime} from "../Priestley/timeAxis.js";
import type {TimeValue} from "../Priestley/timeAxis.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {isMilestone, normalizeProgress} from "./ganttRows.js";

type RowFn = ((d: DataPoint, i: number) => unknown) | false | undefined;

/** A day, in milliseconds. */
const DAY = 864e5;

/**
    Formats starts and ends: dates in the chart's locale, at the precision
    the given dates step by (see `formatDateFull`), or numbers abbreviated.
    @param viz The chart.
    @param values The dates the chart draws, which set the precision.
*/
export function timeFormatter(
  viz: VizInstance,
  values: TimeValue[],
): (v: TimeValue) => string {
  if (!isTimeAxis(viz))
    return v => formatAbbreviate(Number(v), viz.schema.locale);
  const dates = Array.from(new Set(values.map(Number)))
    .sort((a, b) => a - b)
    .map(t => new Date(t));
  const locale = timeFormatLocale(
    calendarTimeLocale(viz.schema.locale) as unknown as D3TimeLocale,
  );
  const format = dateFullFormatter(dates, locale.format);
  return v => format(v instanceof Date ? v : new Date(v));
}

/**
    A task's duration: whole (or tenths of) days on a time axis, translated
    ("12 days"), else the difference of its end and start.
*/
export function ganttDuration(
  viz: VizInstance,
  start: TimeValue,
  end: TimeValue,
): string {
  const span = +end - +start;
  if (!isTimeAxis(viz)) return formatAbbreviate(span, viz.schema.locale);
  const days = Math.round((span / DAY) * 10) / 10;
  const unit = viz.schema.translate(days === 1 ? "day" : "days");
  return `${dayCount(days, viz.schema.locale)} ${unit}`;
}

/** A day count in a locale, with at most one decimal. */
export function dayCount(days: number, locale: unknown): string {
  try {
    return new Intl.NumberFormat(
      typeof locale === "string" ? locale : "en-US",
      {
        maximumFractionDigits: 1,
      },
    ).format(days);
  } catch {
    return `${days}`;
  }
}

/** A share from 0 to 1 as a whole percent. */
export const percent = (share: number): string => `${Math.round(share * 100)}%`;

/** A task's times, milestone flag, and progress. */
export interface TaskTimes {
  start: TimeValue;
  end: TimeValue;
  milestone: boolean;
  progress: number | undefined;
}

/**
    Reads a row's start, end, milestone flag, and progress. A missing start
    or end takes the other's value, and reversed times are swapped; null
    when both are missing.
*/
export function taskTimes(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): TaskTimes | null {
  const time = isTimeAxis(viz);
  let start = parseTime(rowTime(viz, "start", d, i), time);
  let end = parseTime(rowTime(viz, "end", d, i), time);
  if (start === null && end === null) return null;
  start ??= end;
  end ??= start;
  if (+end! < +start!) [start, end] = [end, start];
  const milestoneFn = viz.schema.milestone as RowFn;
  const progressFn = viz.schema.progress as RowFn;
  return {
    start: start!,
    end: end!,
    milestone: isMilestone(
      start!,
      end!,
      typeof milestoneFn === "function" ? milestoneFn(d, i) : undefined,
    ),
    progress: normalizeProgress(
      typeof progressFn === "function" ? progressFn(d, i) : undefined,
    ),
  };
}

/** The layout's start/end formatter, or one built from this row alone. */
function formatFor(
  viz: VizInstance,
  values: TimeValue[],
): (v: TimeValue) => string {
  const layout = viz.ctx.gantt as
    {format?: (v: TimeValue) => string} | undefined;
  return layout?.format ?? timeFormatter(viz, values);
}

/**
    The tooltip rows for a task: Start, End, Duration, and Progress, or a
    milestone's date and Progress, each label translated.
*/
export function ganttTooltipRows(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): [string, string][] {
  const task = taskTimes(viz, d, i);
  if (!task) return [];
  const t = (s: string) => viz.schema.translate(s);
  const format = formatFor(viz, [task.start, task.end]);
  const rows: [string, string][] = task.milestone
    ? [[t("Milestone"), format(task.end)]]
    : [
        [t("Start"), format(task.start)],
        [t("End"), format(task.end)],
        [t("Duration"), ganttDuration(viz, task.start, task.end)],
      ];
  if (task.progress !== undefined)
    rows.push([t("Progress"), percent(task.progress)]);
  return rows;
}

/**
    A task's aria label: its name and span (or a milestone's date), and its
    progress, such as `"Design, Jan 8, 2024 - Jan 19, 2024, Progress 60%."`.
*/
export function ganttAriaLabel(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): string {
  const name = `${viz._drawLabel(d, i) ?? ""}`;
  const task = taskTimes(viz, d, i);
  if (!task) return `${name}.`;
  const format = formatFor(viz, [task.start, task.end]);
  const when = task.milestone
    ? `${viz.schema.translate("Milestone")} ${format(task.end)}`
    : `${format(task.start)} - ${format(task.end)}`;
  const progress =
    task.progress === undefined
      ? ""
      : `, ${viz.schema.translate("Progress")} ${percent(task.progress)}`;
  return `${name}, ${when}${progress}.`;
}
