/**
    What a Gantt task reads as in its tooltip and aria label: its start,
    end, duration, and progress (or a milestone's date), in the chart's
    locale and translated.
*/

import {timeFormatLocale} from "d3-time-format";
import type {TimeLocaleDefinition as D3TimeLocale} from "d3-time-format";

import type {DataPoint} from "@d3plus/data";
import {dateFullFormatter, formatAbbreviate} from "@d3plus/format";

import {
  normalizeRangeBreaks,
  visibleBetween,
} from "../../components/Axis/rangeBreaks.js";
import type {RangeBreakRule} from "../../components/Axis/rangeBreaks.js";
import {calendarTimeLocale} from "../Calendar/calendarFormat.js";
import {
  isTimeAxis,
  isUtcAxis,
  parseTime,
  rowTime,
} from "../Priestley/timeAxis.js";
import type {TimeValue} from "../Priestley/timeAxis.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {isMilestone, normalizeProgress} from "./ganttRows.js";
import {taskSlack} from "./ganttSlack.js";

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
  const utc = isUtcAxis(viz);
  const format = dateFullFormatter(
    dates,
    utc ? locale.utcFormat : locale.format,
    {utc},
  );
  return v => format(v instanceof Date ? v : new Date(v));
}

/**
    The time axis's `rangeBreaks` rules (from `axisConfig`) when they hide
    whole days (weekends, weekdays, dates, or explicit ranges), else none: a
    rule hiding hours of every day leaves no whole days to count.
    @param viz The chart.
*/
export function ganttDayBreaks(viz: VizInstance): RangeBreakRule[] {
  const config = viz.schema.axisConfig as {rangeBreaks?: unknown} | undefined;
  const rules = normalizeRangeBreaks(config?.rangeBreaks);
  return rules.some(r => typeof r === "object" && "hours" in r) ? [] : rules;
}

/**
    A task's duration: whole (or tenths of) days on a time axis, translated
    ("12 days"), else the difference of its end and start. When the axis's
    `rangeBreaks` hide whole days (see `ganttDayBreaks`), only the days left
    showing count ("8 working days").
*/
export function ganttDuration(
  viz: VizInstance,
  start: TimeValue,
  end: TimeValue,
): string {
  const span = +end - +start;
  if (!isTimeAxis(viz)) return formatAbbreviate(span, viz.schema.locale);
  const rules = ganttDayBreaks(viz);
  const shown = rules.length
    ? visibleBetween(rules, +start, +end, isUtcAxis(viz))
    : span;
  return daysLabel(viz, shown, rules.length > 0);
}

/**
    A span of time in whole (or tenths of) days, translated ("3 days", or
    "3 working days" when `working`); negative spans keep their sign.
    @param viz The chart.
    @param ms The span, in milliseconds.
    @param working Whether the span counts only working days.
*/
export function daysLabel(
  viz: VizInstance,
  ms: number,
  working: boolean,
): string {
  const days = Math.round((ms / DAY) * 10) / 10 || 0;
  const unit = viz.schema.translate(
    `${working ? "working " : ""}${Math.abs(days) === 1 ? "day" : "days"}`,
  );
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
  const utc = isUtcAxis(viz);
  let start = parseTime(rowTime(viz, "start", d, i), time, utc);
  let end = parseTime(rowTime(viz, "end", d, i), time, utc);
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
    milestone's date and Progress, then its slack (see `slackRows`), each
    label translated.
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
  return [...rows, ...slackRows(viz, d, format)];
}

/**
    A task's Slack and, when it has any, its Latest start, while the chart
    draws a critical path; else none. Slack reads in working days unless
    `criticalPathConfig.workingDays` is false and the axis hides no days.
    @param viz The chart.
    @param d The task's data row.
    @param format Formats a start or end.
*/
export function slackRows(
  viz: VizInstance,
  d: DataPoint,
  format: (v: TimeValue) => string,
): [string, string][] {
  const info = taskSlack(viz, d);
  if (!info) return [];
  const t = (s: string) => viz.schema.translate(s);
  const slack = isTimeAxis(viz)
    ? daysLabel(viz, info.slack, info.working)
    : formatAbbreviate(info.slack, viz.schema.locale);
  const rows: [string, string][] = [[t("Slack"), slack]];
  if (info.slack !== 0)
    rows.push([t("Latest start"), format(info.latestStart)]);
  return rows;
}

/**
    A task's aria label: its name and span (or a milestone's date), its
    progress, and whether it's on the critical path, such as
    `"Design, Jan 8, 2024 - Jan 19, 2024, Progress 60%, Critical path."`.
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
  const critical = taskSlack(viz, d)?.critical
    ? `, ${viz.schema.translate("Critical path")}`
    : "";
  return `${name}, ${when}${progress}${critical}.`;
}
