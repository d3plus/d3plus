/**
    Trend line projections: the future independent-axis positions a fitted
    trend line extends to (`trendLineConfig.projection`), stepping past the
    last plotted value at the data's own spacing.
*/
import {timeDay, timeHour, timeMinute, timeMonth, timeSecond, timeYear} from "d3-time";
import type {CountableTimeInterval} from "d3-time";

import {date} from "@d3plus/dom";

/**
    The `projection` setting: a number of steps past the last value, or an
    end value to step up to (a number, or on a time axis a Date or anything
    `date` parses, such as a year).
*/
export type TrendProjection = number | {to: number | string | Date};

/** Steps `k` intervals past a value along the independent axis. */
export type TrendOffset = (value: unknown, k: number) => unknown;

/** The calendar intervals a time axis is checked against, coarsest first. */
const intervals: CountableTimeInterval[] = [timeYear, timeMonth, timeDay, timeHour, timeMinute, timeSecond];

/** The median of a non-empty list of numbers. */
function median(values: number[]): number {
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Drops floating point noise from a stepped number (0.1 + 0.2 → 0.3). */
const clean = (n: number): number => +n.toPrecision(12);

/**
    How to step along an independent axis: numbers by the median gap between
    distinct values; dates by the coarsest calendar interval every date lands
    on (years, months, days, …) times the median number of those intervals
    between dates, falling back to the median gap in milliseconds. Null for a
    category axis or fewer than two distinct values.
    @param order The independent axis's values.
*/
export function trendStep(order: unknown[]): TrendOffset | null {
  const time = order.some(v => v instanceof Date);
  if (order.some(v => !(v instanceof Date) && typeof v !== "number")) return null;
  const values = Array.from(new Set(order.map(Number).filter(Number.isFinite))).sort((a, b) => a - b);
  if (values.length < 2) return null;
  const gaps = values.slice(1).map((v, i) => v - values[i]);

  if (!time) {
    const step = median(gaps);
    return (v, k) => clean((v as number) + step * k);
  }

  const dates = values.map(v => new Date(v));
  const interval = intervals.find(t => dates.every(d => +t.floor(d) === +d));
  if (interval) {
    const step = Math.round(median(dates.slice(1).map((d, i) => interval.count(dates[i], d))));
    if (step > 0) return (v, k) => interval.offset(v as Date, step * k);
  }
  const step = median(gaps);
  return (v, k) => new Date(+(v as Date) + step * k);
}

/** Most steps a `{to}` projection will add, so a far-off end can't run away. */
const MAX_STEPS = 1000;

/**
    The future independent-axis positions a projection adds after the last
    value of `order`: `projection` steps, or every step up to and including
    `projection.to`. Empty when off, on a category axis, or when the end
    isn't past the last value.
    @param order The independent axis's values.
    @param projection The `trendLineConfig.projection` setting.
*/
export function projectionPositions(order: unknown[], projection: unknown): unknown[] {
  if (!projection) return [];
  const offset = trendStep(order);
  if (!offset) return [];
  const time = order.some(v => v instanceof Date);
  const last = order.reduce<unknown>((a, b) => (+(b as number) > +(a as number) ? b : a), order[0]);

  if (typeof projection === "number") {
    const count = Math.min(Math.floor(projection), MAX_STEPS);
    return Array.from({length: Math.max(count, 0)}, (_, i) => offset(last, i + 1));
  }

  const to = (projection as {to?: unknown}).to;
  if (to === undefined || to === null) return [];
  const end = time ? date(to as string | number) : +(to as number);
  if (!Number.isFinite(+(end as number))) return [];
  const out: unknown[] = [];
  for (let k = 1; k <= MAX_STEPS; k++) {
    const next = offset(last, k);
    if (+(next as number) > +(end as number)) break;
    out.push(next);
  }
  return out;
}
