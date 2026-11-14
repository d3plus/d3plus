/**
    CyclePlot's periods: which season a date falls in (its panel), the
    cycle it belongs to (its place along the panel's x axis), and the
    panels' titles and order. Pure date math, in local time or UTC.

    @module
*/
import {
  timeDay,
  timeFriday,
  timeMonday,
  timeSaturday,
  timeSunday,
  timeThursday,
  timeTuesday,
  timeWednesday,
  timeYear,
  utcDay,
  utcFriday,
  utcMonday,
  utcSaturday,
  utcSunday,
  utcThursday,
  utcTuesday,
  utcWednesday,
  utcYear,
} from "d3-time";
import type {TimeInterval} from "d3-time";
import {timeFormatLocale} from "d3-time-format";
import type {TimeLocaleDefinition as D3TimeLocale} from "d3-time-format";
import type {TimeLocaleDefinition} from "@d3plus/locales";

/** The season each CyclePlot panel shows, and the cycle it repeats in. */
export type CyclePeriod = "month" | "quarter" | "weekday" | "hour";

/** Every period CyclePlot draws, in the order the docs list them. */
export const CYCLE_PERIODS: CyclePeriod[] = [
  "month",
  "quarter",
  "weekday",
  "hour",
];

/** A `period` setting as a CyclePlot period, defaulting to `"month"`. */
export function resolveCyclePeriod(value: unknown): CyclePeriod {
  return CYCLE_PERIODS.includes(value as CyclePeriod)
    ? (value as CyclePeriod)
    : "month";
}

/** How many seasons a period's cycle holds. */
export function cyclePeriodCount(period: CyclePeriod): number {
  return {month: 12, quarter: 4, weekday: 7, hour: 24}[period];
}

/**
    The season `date` falls in: its month (0–11), quarter (0–3), weekday
    (0 = Sunday … 6), or hour (0–23), read in UTC with `utc`.
*/
export function cyclePeriodOf(
  date: Date,
  period: CyclePeriod,
  utc = false,
): number {
  switch (period) {
    case "quarter":
      return Math.floor((utc ? date.getUTCMonth() : date.getMonth()) / 3);
    case "weekday":
      return utc ? date.getUTCDay() : date.getDay();
    case "hour":
      return utc ? date.getUTCHours() : date.getHours();
    default:
      return utc ? date.getUTCMonth() : date.getMonth();
  }
}

const LOCAL_WEEKS: TimeInterval[] = [
  timeSunday,
  timeMonday,
  timeTuesday,
  timeWednesday,
  timeThursday,
  timeFriday,
  timeSaturday,
];
const UTC_WEEKS: TimeInterval[] = [
  utcSunday,
  utcMonday,
  utcTuesday,
  utcWednesday,
  utcThursday,
  utcFriday,
  utcSaturday,
];

/**
    The start of the cycle `date` belongs to, which places it along its
    panel's x axis: its year (for months and quarters), its week starting on
    `weekStart` (0 = Sunday … 6, for weekdays), or its day (for hours).
*/
export function cycleStartOf(
  date: Date,
  period: CyclePeriod,
  utc = false,
  weekStart = 1,
): Date {
  if (period === "weekday")
    return (utc ? UTC_WEEKS : LOCAL_WEEKS)[((weekStart % 7) + 7) % 7].floor(
      date,
    );
  if (period === "hour") return (utc ? utcDay : timeDay).floor(date);
  return (utc ? utcYear : timeYear).floor(date);
}

/**
    The seasons in panel order: months, quarters, and hours from the first,
    weekdays from `weekStart` (0 = Sunday … 6).
*/
export function cyclePeriodOrder(period: CyclePeriod, weekStart = 1): number[] {
  const count = cyclePeriodCount(period);
  const start = period === "weekday" ? ((weekStart % 7) + 7) % 7 : 0;
  return Array.from({length: count}, (_, i) => (start + i) % count);
}

/**
    A season's short name, for a panel title, in a d3-time-format locale:
    `"Jan"`, `"Q1"`, `"Mon"`, or an hour (`"1 PM"` where the locale writes
    times with AM/PM, else `"13:00"`).
*/
export function cyclePeriodLabel(
  index: number,
  period: CyclePeriod,
  locale: TimeLocaleDefinition,
): string {
  if (period === "quarter") return `${locale.quarter}${index + 1}`;
  if (period === "weekday") return locale.shortDays[index] ?? `${index}`;
  if (period === "hour") {
    const format = timeFormatLocale(
      locale as unknown as D3TimeLocale,
    ).utcFormat(locale.time.includes("%p") ? "%-I %p" : "%-H:00");
    return format(new Date(Date.UTC(2000, 0, 1, index)));
  }
  return locale.shortMonths[index] ?? `${index}`;
}
