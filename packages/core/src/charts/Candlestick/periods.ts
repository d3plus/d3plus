/**
    Period dates: parsing a row's period, formatting it for tooltips, and,
    for evenly spaced periods (`skipGaps`), the category axis's ticks: the
    first period, then the first period of each calendar day, week, month,
    quarter, or year (whichever is finest while its labels fit the axis),
    labeled for it.

    @module
*/

import {timeMonday} from "d3-time";
import {timeFormat} from "d3-time-format";

import type {DataPoint} from "@d3plus/data";
import {date} from "@d3plus/dom";

import type Axis from "../../components/Axis/Axis.js";
import {axisShownDates} from "../../components/Axis/timeValues.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** A calendar unit the axis can tick on. */
export type PeriodUnit = "day" | "week" | "month" | "quarter" | "year";

/** Units from finest to coarsest. */
export const PERIOD_UNITS: PeriodUnit[] = [
  "day",
  "week",
  "month",
  "quarter",
  "year",
];

/** Year intervals tried, in order, when a tick per year is too many. */
const YEAR_STEPS = [2, 5, 10, 20, 50, 100, 200, 500, 1000];
/** The least room, in pixels, the tick lists offered leave between two ticks. */
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
  const year = d.getFullYear(),
    month = d.getMonth();
  switch (unit) {
    case "day":
      return (year * 12 + month) * 31 + d.getDate();
    case "week":
      return +timeMonday.floor(d);
    case "month":
      return year * 12 + month;
    case "quarter":
      return year * 4 + Math.floor(month / 3);
    default:
      return year;
  }
}

/**
    The first period of each calendar `unit` after the one the dates start
    in.
    @param dates The periods' dates, ascending.
    @param unit The calendar unit.
*/
export function periodBoundaries(dates: Date[], unit: PeriodUnit): Date[] {
  const out: Date[] = [];
  for (let k = 1; k < dates.length; k++)
    if (unitIndex(dates[k], unit) !== unitIndex(dates[k - 1], unit))
      out.push(dates[k]);
  return out;
}

/**
    The tick lists evenly spaced periods choose among, from the most ticks
    to the fewest. For each calendar day, week, month, quarter, and year (then
    every 2nd, 5th, 10th, … year): the first period and the first period of
    each unit after it, then the same without the first period, for when it
    crowds the next, as long as two remain. The axis draws the first list
    whose labels all fit (see the axis `labels`), and its first label names
    the year. Units with more than `maxTicks` boundaries are left out, unless
    none has fewer, as are repeats.
    @param dates The periods' dates, ascending.
    @param maxTicks The most boundary ticks to offer.
*/
export function periodTickSets(dates: Date[], maxTicks: number): Date[][] {
  if (!dates.length) return [];
  const most = Math.max(1, Math.floor(maxTicks));
  const units = PERIOD_UNITS.map(unit => periodBoundaries(dates, unit));
  const years = units[units.length - 1];
  const lists = units
    .concat(
      YEAR_STEPS.map(step => years.filter(d => d.getFullYear() % step === 0)),
    )
    .filter(
      (list, k, all) => list.length && !(k && sameDates(list, all[k - 1])),
    );
  const fitting = lists.filter(list => list.length <= most);
  const offered = fitting.length ? fitting : lists.slice(-1);
  if (!offered.length) return [[dates[0]]];
  return offered.flatMap(list =>
    list.length > 1 ? [[dates[0], ...list], list] : [[dates[0], ...list]],
  );
}

/** Whether two lists hold the same dates. */
function sameDates(a: Date[], b: Date[]): boolean {
  return a.length === b.length && a.every((d, k) => +d === +b[k]);
}

/**
    A tick's label for its calendar unit: on the first tick, the date with
    its year; on the first tick of a year, the year (or, for day and week
    ticks, the date with its year); else the month, or for day and week ticks
    the month and day.
    @param d The tick's date.
    @param prev The previous tick's date, if any.
    @param unit The calendar unit the ticks mark.
*/
export function periodLabel(
  d: Date,
  prev: Date | undefined,
  unit: PeriodUnit,
): string {
  const newYear = !prev || prev.getFullYear() !== d.getFullYear();
  if (unit === "year") return timeFormat("%Y")(d);
  if (unit === "day" || unit === "week")
    return timeFormat(newYear ? "%b %-d, %Y" : "%b %-d")(d);
  if (!prev) return timeFormat("%b %Y")(d);
  return timeFormat(newYear ? "%Y" : "%b")(d);
}

/**
    The coarsest calendar unit every shown tick after the first opens: the
    unit the shown ticks mark.
    @param shown The shown ticks' dates, ascending.
    @param opens Whether a date is the first period of its unit.
*/
export function shownUnit(
  shown: Date[],
  opens: (d: Date, unit: PeriodUnit) => boolean,
): PeriodUnit {
  const units = PERIOD_UNITS.slice().reverse();
  return units.find(unit => shown.slice(1).every(d => opens(d, unit))) ?? "day";
}

/**
    The tick formatter for evenly spaced periods. Called by an axis (as
    `this`), it labels a tick for the unit the axis's shown ticks mark (see
    `shownUnit`), with the year on the first shown tick and on the first
    shown tick of each year (see `formatDate`'s `shown`); called on its own,
    it formats the period in full.
    @param dates The periods' dates, ascending.
*/
export function periodTickFormat(
  dates: Date[],
): (this: Axis | void, d: unknown) => string {
  const index = new Map(dates.map((d, k) => [+d, k]));
  const opens = (d: Date, unit: PeriodUnit) => {
    const k = index.get(+d);
    return (
      Boolean(k) &&
      unitIndex(dates[k!], unit) !== unitIndex(dates[k! - 1], unit)
    );
  };
  const units = new WeakMap<Date[], PeriodUnit>();
  return function (this: Axis | void, d: unknown): string {
    if (!(d instanceof Date)) return String(d);
    const shown = this ? axisShownDates(this) : undefined;
    if (!shown?.length) return formatPeriod(d);
    let unit = units.get(shown);
    if (!unit) units.set(shown, (unit = shownUnit(shown, opens)));
    let prev: Date | undefined;
    for (const s of shown) if (+s < +d) prev = s;
    return periodLabel(d, prev, unit);
  };
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
    `xConfig`: tick lists on calendar boundaries for the axis to choose
    among, no more of them than the plot's width has room for, and their
    labels.
    @param viz The chart, mid-draw (its margins hold the current chart area).
*/
export function bandAxisDefaults(viz: VizInstance): Record<string, unknown> {
  const dates = rowDates(viz);
  const width =
    viz.schema.width - viz._margin.left - viz._margin.right - VALUE_AXIS_ROOM;
  return {
    labels: periodTickSets(dates, width / MIN_TICK_SPACING),
    tickFormat: periodTickFormat(dates),
  };
}
