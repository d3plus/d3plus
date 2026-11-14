/**
    Period labels (`tickLabelPosition: "period"`): a date label names a
    stretch of time ("March" names the month from Mar 1 to Apr 1), so it is
    drawn centered in that stretch while its tick stays on the boundary.
*/
import {extent} from "d3-array";
import {
  timeDay,
  timeHour,
  timeMinute,
  timeMonth,
  timeSecond,
  timeYear,
  utcDay,
  utcHour,
  utcMinute,
  utcMonth,
  utcSecond,
  utcYear,
} from "d3-time";
import type {TimeInterval} from "d3-time";

import {dateInterval} from "@d3plus/format";

import type Axis from "./Axis.js";
import {axisTimeReference, axisUtc} from "./timeValues.js";
import {axisIsYearLike, isYearLike} from "./yearValues.js";

/** The calendar unit a date label names. */
export type LabelPeriod =
  "year" | "quarter" | "month" | "day" | "hour" | "minute" | "second";

const localIntervals: Record<LabelPeriod, TimeInterval> = {
  year: timeYear,
  quarter: timeMonth.every(3)!,
  month: timeMonth,
  day: timeDay,
  hour: timeHour,
  minute: timeMinute,
  second: timeSecond,
};

const utcIntervals: Record<LabelPeriod, TimeInterval> = {
  year: utcYear,
  quarter: utcMonth.every(3)!,
  month: utcMonth,
  day: utcDay,
  hour: utcHour,
  minute: utcMinute,
  second: utcSecond,
};

/**
    The d3-time interval of a period, on the local or UTC calendar.
    @param period The period.
    @param utc Whether to read the calendar in UTC.
*/
export const periodInterval = (
  period: LabelPeriod,
  utc = false,
): TimeInterval => (utc ? utcIntervals : localIntervals)[period];

/**
    The calendar unit the labels of dates stepping like `dates` name: the
    interval they step by (see `dateInterval`), else the minute or second
    every date falls on, else `undefined`.
    @param dates The dates a time axis labels against, in order.
    @param utc Whether to read the calendar in UTC.
*/
export function labelPeriod(
  dates: Date[],
  utc = false,
): LabelPeriod | undefined {
  if (!dates.length) return undefined;
  const named = dateInterval(dates, {utc});
  if (named) return named;
  for (const period of ["minute", "second"] as const) {
    const interval = periodInterval(period, utc);
    if (dates.every(d => +interval.floor(d) === +d)) return period;
  }
  return undefined;
}

/**
    Where a label centers along the axis: the middle of the part of its
    period (`span`, start to end) inside `domain`, or, when the axis shows
    none of it (a last period, starting where the axis ends), the middle of
    the whole period.
    @param span The period's start and end values.
    @param domain The axis's domain, lowest value first.
    @param position Maps a value to its pixel position.
*/
export function periodCenter(
  span: [number, number],
  domain: [number, number],
  position: (value: number) => number,
): number {
  const lo = Math.max(span[0], domain[0]);
  const hi = Math.min(span[1], domain[1]);
  const [a, b] = hi > lo ? [lo, hi] : span;
  return (position(a) + position(b)) / 2;
}

/**
    The period that holds each value an axis labels, as `[start, end]`
    values: the calendar period the axis's dates name on a time axis (see
    `labelPeriod`), the year on an axis of whole-number years (a label
    between years names none), else `undefined` (the axis labels no
    periods).
*/
function periodSpans(
  axis: Axis,
): ((value: number) => [number, number] | undefined) | undefined {
  if (axis.schema.scale === "time") {
    const utc = axisUtc(axis);
    const period = labelPeriod(axisTimeReference(axis), utc);
    if (!period) return undefined;
    const interval = periodInterval(period, utc);
    return value => {
      const start = interval.floor(new Date(value));
      return [+start, +interval.offset(start, 1)];
    };
  }
  if (axis.schema.scale === "linear" && axisIsYearLike(axis))
    return value => (Number.isInteger(value) ? [value, value + 1] : undefined);
  return undefined;
}

/** Whether a value names a period on a category axis: a Date, or a whole-number year. */
const namesPeriod = (d: unknown): boolean =>
  d instanceof Date ? !isNaN(+d) : isYearLike([d]);

/**
    Period label positions on a point axis of dates (or whole-number years),
    such as a line chart's: each date stands for the period up to the next
    one, so its label centers half a step after its point.
*/
function categoryPeriods(
  axis: Axis,
  labels: unknown[],
): Map<number, number> | undefined {
  const scale = axis._d3Scale!;
  if (!labels.length || !labels.every(namesPeriod) || !scale.step)
    return undefined;
  const range = scale.range() as number[];
  const half = (scale.step() / 2) * (range[1] < range[0] ? -1 : 1);
  return new Map(
    labels.map(d => [Number(d), axis._getPosition(d) + half] as const),
  );
}

/**
    The positions an axis's labels center on when it centers them in the
    periods they name (`tickLabelPosition: "period"`), keyed by label value,
    or `undefined` when it draws each label at its tick: by default, and on
    an axis whose labels name no periods (any axis but a time axis, one of
    whole-number years, or a point axis of either).
    @param axis The axis, its scale built for this layout pass.
    @param labels The values it labels (numbers, as a time axis's are).
*/
export function periodLabelPositions(
  axis: Axis,
  labels: unknown[],
): Map<number, number> | undefined {
  if (axis.schema.tickLabelPosition !== "period" || !axis._d3Scale)
    return undefined;
  if (axis.schema.scale === "point") return categoryPeriods(axis, labels);
  const spans = periodSpans(axis);
  if (!spans) return undefined;
  const domain = extent(
    (axis._d3Scale.domain() as (number | Date)[]).map(Number),
  ) as [number, number];
  const position = (value: number) => axis._getPosition(value);
  const positions = new Map<number, number>();
  for (const label of labels) {
    const value = Number(label);
    const span = isNaN(value) ? undefined : spans(value);
    if (span) positions.set(value, periodCenter(span, domain, position));
  }
  return positions;
}

/**
    Where an axis draws a label: centered in its period (see
    `periodLabelPositions`), else at its tick.
    @param axis The axis.
    @param d The labeled value.
*/
export function axisLabelPosition(axis: Axis, d: unknown): number {
  return axis._periodPositions?.get(Number(d)) ?? axis._getPosition(d);
}
