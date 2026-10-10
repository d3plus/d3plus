/**
    Period dates: parsing a row's period, formatting it for tooltips, and,
    for evenly spaced periods (`skipGaps`), the category axis's ticks, placed
    on the first period of each calendar day, week, month, quarter, or year
    (whichever is finest while still fitting the axis) and labeled for it.

    @module
*/

import {timeMonday} from "d3-time";
import {timeFormat} from "d3-time-format";

import type {DataPoint} from "@d3plus/data";
import {date} from "@d3plus/dom";

import type {VizInstance} from "../viz/vizTypes.js";

/** A calendar unit the axis can tick on. */
export type PeriodUnit = "day" | "week" | "month" | "quarter" | "year";

/** Units from finest to coarsest. */
export const PERIOD_UNITS: PeriodUnit[] = ["day", "week", "month", "quarter", "year"];

/** Year intervals tried, in order, when a tick per year is too many. */
const YEAR_STEPS = [2, 5, 10, 20, 50, 100, 200, 500, 1000];
/** The least room, in pixels, between two tick labels. */
const MIN_TICK_SPACING = 72;
/** Room, in pixels, set aside for the value axis when estimating the time axis's width. */
const VALUE_AXIS_ROOM = 60;

/**
    A period value as a Date: Dates pass through, and numbers and strings
    parse through d3plus's `date`. A value that doesn't parse comes back as
    given.
    @param value The row's period value.
*/
export function periodDate(value: unknown): unknown {
  if (value instanceof Date) return value;
  if (typeof value !== "string" && typeof value !== "number") return value;
  const parsed = date(value);
  return parsed instanceof Date && !isNaN(+parsed) ? parsed : value;
}

/**
    A period as a tooltip shows it: the full date (e.g. "Jan 3, 2023"), with
    the time of day when it isn't midnight.
    @param d The period's date.
*/
export function formatPeriod(d: Date): string {
  const midnight = !d.getHours() && !d.getMinutes() && !d.getSeconds();
  return timeFormat(midnight ? "%b %-d, %Y" : "%b %-d, %Y %-I:%M %p")(d);
}

/** The calendar `unit` a date falls in, as a comparable number. */
export function unitIndex(d: Date, unit: PeriodUnit): number {
  const year = d.getFullYear(), month = d.getMonth();
  switch (unit) {
    case "day": return (year * 12 + month) * 31 + d.getDate();
    case "week": return +timeMonday.floor(d);
    case "month": return year * 12 + month;
    case "quarter": return year * 4 + Math.floor(month / 3);
    default: return year;
  }
}

/**
    The first period of each calendar `unit` after the one the dates start
    in (a partial first unit gets no tick); just the first date when the
    dates span a single unit.
    @param dates The periods' dates, ascending.
    @param unit The calendar unit.
*/
export function periodBoundaries(dates: Date[], unit: PeriodUnit): Date[] {
  const out: Date[] = [];
  for (let k = 1; k < dates.length; k++)
    if (unitIndex(dates[k], unit) !== unitIndex(dates[k - 1], unit)) out.push(dates[k]);
  return out.length || !dates.length ? out : [dates[0]];
}

/**
    The ticks for evenly spaced periods: the boundaries of the finest
    calendar unit with at most `maxTicks` of them, thinning years to every
    2nd, 5th, 10th, 20th, … when even years are too many.
    @param dates The periods' dates, ascending.
    @param maxTicks The most ticks the axis has room for.
*/
export function periodTicks(dates: Date[], maxTicks: number): {unit: PeriodUnit; ticks: Date[]} {
  const most = Math.max(1, Math.floor(maxTicks));
  for (const unit of PERIOD_UNITS) {
    const ticks = periodBoundaries(dates, unit);
    if (ticks.length <= most) return {unit, ticks};
  }
  const years = periodBoundaries(dates, "year");
  let ticks = years;
  for (const step of YEAR_STEPS) {
    ticks = years.filter(d => d.getFullYear() % step === 0);
    if (ticks.length <= most) break;
  }
  return {unit: "year", ticks};
}

/**
    A tick's label for its calendar unit: a year on the first tick of a year
    (and on the first tick, when it isn't), else the month, or for day and
    week ticks the month and day.
    @param d The tick's date.
    @param prev The previous tick's date, if any.
    @param unit The calendar unit the ticks mark.
*/
export function periodLabel(d: Date, prev: Date | undefined, unit: PeriodUnit): string {
  const newYear = !prev || prev.getFullYear() !== d.getFullYear();
  if (unit === "year") return timeFormat("%Y")(d);
  if (unit === "day" || unit === "week") return timeFormat(newYear ? "%b %-d, %Y" : "%b %-d")(d);
  if (!prev) return timeFormat(d.getMonth() ? "%b %Y" : "%Y")(d);
  return timeFormat(newYear ? "%Y" : "%b")(d);
}

/** The current rows' period dates, ascending and distinct. */
function rowDates(viz: VizInstance): Date[] {
  const rows: DataPoint[] = viz._filteredData || [];
  const seen = new Map<number, Date>();
  rows.forEach((d, i) => {
    const v = viz._x ? viz._x(d, i) : undefined;
    if (v instanceof Date && !isNaN(+v) && !seen.has(+v)) seen.set(+v, v);
  });
  return Array.from(seen.values()).sort((a, b) => +a - +b);
}

/**
    The time-axis config evenly spaced periods draw with, beneath the user's
    `xConfig`: ticks and labels on calendar boundaries, as many as the plot's
    width has room for, and their labels.
    @param viz The chart, mid-draw (its margins hold the current chart area).
*/
export function bandAxisDefaults(viz: VizInstance): Record<string, unknown> {
  const dates = rowDates(viz);
  const width = viz.schema.width - viz._margin.left - viz._margin.right - VALUE_AXIS_ROOM;
  const {unit, ticks} = periodTicks(dates, width / MIN_TICK_SPACING);
  const labels = new Map<number, string>();
  ticks.forEach((d, k) => labels.set(+d, periodLabel(d, ticks[k - 1], unit)));
  return {
    labels: ticks,
    tickFormat: (d: unknown) => {
      const t = d instanceof Date ? +d : NaN;
      return labels.get(t) ?? (d instanceof Date ? formatPeriod(d) : String(d));
    },
    ticks,
  };
}
