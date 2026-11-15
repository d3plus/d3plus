/**
    The Gantt's calendar: which days count as working time (the locale's
    weekend and the days the time axis hides), and which `end` values name a
    whole day, so a task runs through the end of it.
*/

import {timeDay, utcDay} from "d3-time";

import {findWeekend} from "@d3plus/locales";

import {normalizeRangeBreaks} from "../../components/Axis/rangeBreaks.js";
import type {RangeBreakRule} from "../../components/Axis/rangeBreaks.js";
import {isTimeAxis} from "../Priestley/timeAxis.js";
import type {TimeValue} from "../Priestley/timeAxis.js";
import type {VizInstance} from "../viz/vizTypes.js";

const DATE_ONLY = /^\s*\d{4}([-/])\d{1,2}\1\d{1,2}\s*$/;

/**
    Whether a raw start or end names a whole day and no time of it: a string
    such as `"2024-03-08"` or `"2024/03/08"`. Dates and numbers don't, even
    at midnight.
    @param value The raw value.
*/
export function isDateOnly(value: unknown): boolean {
  return typeof value === "string" && DATE_ONLY.test(value);
}

/**
    The time `days` whole days after (or before, when negative) `t`, in
    local days or UTC days.
*/
export function offsetDays(t: TimeValue, days: number, utc = false): Date {
  return (utc ? utcDay : timeDay).offset(new Date(+t), days);
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

/** The chart locale's weekend as a range break rule (see `findWeekend`). */
export function weekendRule(viz: VizInstance): RangeBreakRule {
  const locale = viz.schema.locale;
  return {days: findWeekend(typeof locale === "string" ? locale : "en-US")};
}

/**
    The days a task's Duration and slack count as no time: the locale's
    weekend (unless `criticalPathConfig.workingDays` is false) and every
    whole day the time axis's `rangeBreaks` hide, such as holidays; none on
    a numeric axis.
    @param viz The chart.
*/
export function workingBreaks(viz: VizInstance): RangeBreakRule[] {
  if (!isTimeAxis(viz)) return [];
  const cfg = (viz.schema.criticalPathConfig ?? {}) as {workingDays?: unknown};
  const days = ganttDayBreaks(viz);
  return cfg.workingDays === false ? days : [weekendRule(viz), ...days];
}
