/**
    Minor ticks (`minorTicks`): short, unlabeled marks between an axis's
    ticks, and the fainter `minorGrid` lines across the chart from them. A
    log axis draws them by default at 2 through 9 times each power of ten;
    any other continuous axis draws them when asked. Minor ticks that would
    sit closer than a few pixels are thinned out, as a whole level at once.
*/
import {extent} from "d3-array";
import {
  timeDay,
  timeHour,
  timeMinute,
  timeMonth,
  timeSecond,
  utcDay,
  utcHour,
  utcMinute,
  utcMonth,
  utcSecond,
} from "d3-time";
import type {CountableTimeInterval} from "d3-time";

import type Axis from "./Axis.js";
import {breakTickValues} from "./axisBreak.js";
import {labelPeriod} from "./axisPeriods.js";
import type {LabelPeriod} from "./axisPeriods.js";
import {visibleTimeValues} from "./axisRangeBreaks.js";
import {axisTimeReference, axisUtc} from "./timeValues.js";

/** The fewest pixels between neighboring ticks a level of minor ticks may leave. */
export const MINOR_TICK_GAP = 4;

/** The minor ticks each subdivision of a major interval falls back to when crowded. */
const SUBDIVISIONS = [5, 2];

/** The multiples of each power of ten a log axis marks, richest first. */
const LOG_LEVELS = [
  [2, 3, 4, 5, 6, 7, 8, 9],
  [2, 5],
];

/** Rounds away floating-point noise (`0.30000000000000004`). */
const clean = (d: number): number => +d.toPrecision(12);

/**
    How many minor ticks an axis draws between its ticks: its `minorTicks`
    count, 4 for `true`, or 0 when off. Unset, a log axis draws them (see
    `logMinorValues`) and any other axis doesn't. Category axes never do.
    @param axis The axis.
*/
export function minorTickCount(axis: Axis): number {
  const {minorTicks, scale} = axis.schema;
  if (["band", "ordinal", "point"].includes(scale)) return 0;
  const setting = minorTicks ?? scale === "log";
  if (setting === true) return 4;
  return typeof setting === "number" && setting > 0 ? Math.floor(setting) : 0;
}

/**
    The values `multiples` times each power of ten between the ends of a
    log axis's domain (both ends on one side of zero), ascending.
    @param domain The domain, in either order.
    @param multiples The multiples of each power of ten to mark (default 2 through 9).
*/
export function logMinorValues(
  domain: number[],
  multiples: number[] = LOG_LEVELS[0],
): number[] {
  const [lo, hi] = extent(domain) as [number, number];
  if (!(lo < hi) || lo * hi <= 0) return [];
  const sign = lo < 0 ? -1 : 1;
  const [a, b] = [Math.abs(lo), Math.abs(hi)].sort((x, y) => x - y);
  const out: number[] = [];
  for (let p = Math.floor(Math.log10(a)); p <= Math.ceil(Math.log10(b)); p++)
    for (const k of multiples) {
      const v = clean(k * Math.pow(10, p));
      if (v > a && v < b) out.push(sign * v);
    }
  return out.sort((x, y) => x - y);
}

/**
    Evenly spaced values splitting each step between `majors` into
    `subdivisions` parts, across the whole `domain`: the step is the one
    the majors most often take, so an uneven last step (a domain end) is
    split on the same grid. Values on a major are left out.
    @param majors The axis's ticks, as numbers.
    @param domain The axis's domain, in either order.
    @param subdivisions How many parts to split each step into.
*/
export function linearMinorValues(
  majors: number[],
  domain: number[],
  subdivisions: number,
): number[] {
  const sorted = majors.filter(Number.isFinite).sort((a, b) => a - b);
  if (sorted.length < 2 || subdivisions < 2) return [];
  const counts = new Map<number, number>();
  for (let i = 1; i < sorted.length; i++) {
    const gap = clean(sorted[i] - sorted[i - 1]);
    if (gap > 0) counts.set(gap, (counts.get(gap) ?? 0) + 1);
  }
  if (!counts.size) return [];
  const gap = [...counts].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
  const step = gap / subdivisions;
  const [lo, hi] = extent(domain) as [number, number];
  const near = (v: number) =>
    sorted.some(m => Math.abs(m - v) < Math.abs(step) * 1e-6);
  const out: number[] = [];
  const origin = sorted[0];
  const first = Math.ceil((lo - origin) / step);
  const last = Math.floor((hi - origin) / step);
  // A domain far wider than its ticks (a mistake) draws no minor ticks.
  if (last - first > 5000) return [];
  for (let i = first; i <= last; i++) {
    const v = clean(origin + i * step);
    if (v > lo && v < hi && !near(v)) out.push(v);
  }
  return out;
}

/** The calendar intervals a time axis's minor ticks fall on, by the period its labels name, richest first. */
const timeLevels = (
  period: LabelPeriod,
  utc: boolean,
): CountableTimeInterval[] => {
  const [month, day, hour, minute, second] = utc
    ? [utcMonth, utcDay, utcHour, utcMinute, utcSecond]
    : [timeMonth, timeDay, timeHour, timeMinute, timeSecond];
  const every = (interval: CountableTimeInterval, steps: number[]) =>
    steps.map(s =>
      s === 1 ? interval : (interval.every(s) as CountableTimeInterval),
    );
  switch (period) {
    case "year":
      return every(month, [1, 3, 6]);
    case "quarter":
      return [month];
    case "month":
      return every(day, [1, 7]);
    case "day":
      return every(hour, [1, 3, 6, 12]);
    case "hour":
      return every(minute, [1, 5, 15, 30]);
    case "minute":
      return every(second, [1, 5, 15, 30]);
    default:
      return [];
  }
};

/**
    The calendar dates (as timestamps) a time axis's minor ticks fall on
    at each level, richest first: the months of a yearly axis, the days of
    a monthly one, the hours of a daily one, and so on (see `timeLevels`).
    Values on a major are left out.
    @param majors The axis's ticks, as timestamps.
    @param domain The axis's domain.
    @param period The calendar unit its labels name.
    @param utc Whether to read the calendar in UTC.
*/
export function timeMinorLevels(
  majors: number[],
  domain: number[],
  period: LabelPeriod | undefined,
  utc = false,
): number[][] {
  if (!period) return [];
  const [lo, hi] = extent(domain) as [number, number];
  const taken = new Set(majors);
  return timeLevels(period, utc).map(interval =>
    interval
      .range(new Date(lo + 1), new Date(hi))
      .map(Number)
      .filter(v => !taken.has(v)),
  );
}

/**
    The richest of `levels` (each a list of minor tick values, richest
    first) whose ticks, among `majors`, sit no closer than `gap` pixels
    apart; none when every level is that crowded.
    @param levels The candidate minor tick values, richest first.
    @param majors The axis's ticks.
    @param position Maps a value to its pixel position.
    @param gap The fewest pixels allowed between neighboring ticks.
*/
export function pickMinorLevel(
  levels: number[][],
  majors: number[],
  position: (value: number) => number,
  gap = MINOR_TICK_GAP,
): number[] {
  const majorPixels = majors.map(position);
  for (const level of levels) {
    if (!level.length) continue;
    const pixels = level
      .map(position)
      .concat(majorPixels)
      .filter(Number.isFinite)
      .sort((a, b) => a - b);
    let fits = true;
    for (let i = 1; i < pixels.length && fits; i++)
      fits = pixels[i] - pixels[i - 1] >= gap;
    if (fits) return level;
  }
  return [];
}

/** The ends of each of an axis's scales (both, for a log axis split around zero). */
function scaleDomains(axis: Axis): number[][] {
  return [axis._d3ScaleNegative, axis._d3Scale]
    .filter(s => s !== null)
    .map(s => (s!.domain() as (number | Date)[]).map(Number));
}

/**
    The minor tick candidates of a log axis, richest level first: the
    multiples of each power of ten (see `logMinorValues`) its ticks don't
    already mark.
*/
function logLevels(axis: Axis, majors: number[]): number[][] {
  const taken = new Set(majors);
  return LOG_LEVELS.map(multiples =>
    scaleDomains(axis)
      .flatMap(domain => logMinorValues(domain, multiples))
      .filter(v => !taken.has(v)),
  );
}

/**
    Splits a log axis's ticks into its major ticks (its labels and the
    powers of ten) and the multiples between them, which it draws as minor
    ticks. Other axes keep their ticks.
    @param axis The axis.
    @param ticks The axis's ticks.
    @param labels The values it labels.
*/
export function majorTicks(
  axis: Axis,
  ticks: unknown[],
  labels: unknown[],
): unknown[] {
  if (axis.schema.scale !== "log" || axis.schema.ticks) return ticks;
  const labeled = new Set(labels.map(Number));
  return ticks.filter(d => {
    const n = Number(d);
    return labeled.has(n) || Math.log10(Math.abs(n)) % 1 === 0;
  });
}

/**
    An axis's minor tick values, thinned so neighbors sit at least
    `MINOR_TICK_GAP` pixels apart: the multiples of each power of ten on a
    log axis, calendar dates between a time axis's ticks (or, given a
    count, evenly spaced times), and `minorTicks` evenly spaced values
    between any other continuous axis's ticks. A log axis lists them for
    `gridLog` even with `minorTicks` off, when `all` is set.
    @param axis The axis, its scale built for this layout pass.
    @param majors Its major ticks.
    @param all Whether to list a log axis's minor ticks even when it doesn't draw them.
*/
export function minorTickValues(
  axis: Axis,
  majors: unknown[],
  all = false,
): number[] {
  const count = minorTickCount(axis);
  const {scale} = axis.schema;
  if (!count && !(all && scale === "log")) return [];
  const numbers = majors.map(Number);
  const domain = scaleDomains(axis).flat();
  if (!domain.length) return [];
  let levels: number[][];
  if (scale === "log") levels = logLevels(axis, numbers);
  else if (scale === "time" && axis.schema.minorTicks === true)
    levels = timeMinorLevels(
      numbers,
      domain,
      labelPeriod(axisTimeReference(axis), axisUtc(axis)),
      axisUtc(axis),
    );
  else
    levels = [count + 1, ...SUBDIVISIONS.filter(s => s < count + 1)].map(s =>
      linearMinorValues(numbers, domain, s),
    );
  const shown = (values: number[]) =>
    (axis._breaks.length
      ? breakTickValues(axis._breaks, visibleTimeValues(axis, values), false)
      : visibleTimeValues(axis, values)
    ).map(Number);
  return pickMinorLevel(levels.map(shown), numbers, v => axis._getPosition(v));
}

/**
    The values an axis draws grid lines at: its labels, or on a log axis
    with `gridLog`, every tick and minor tick (else just its labels); and,
    with `minorGrid`, the minor ticks it draws that no grid line marks
    yet. None at a `gridSize` of 0.
    @param axis The axis, laid out.
    @param ticks Its ticks.
    @param labels The values it labels.
*/
export function gridValues(
  axis: Axis,
  ticks: unknown[],
  labels: unknown[],
): {major: unknown[]; minor: number[]} {
  if (axis.schema.gridSize === 0) return {major: [], minor: []};
  const log = axis.schema.scale === "log";
  const minors = axis._minorTickValues;
  const major =
    axis.schema.grid || (log && !axis.schema.gridLog)
      ? labels
      : log
        ? [...ticks, ...minors]
        : ticks;
  if (!axis.schema.minorGrid || !minorTickCount(axis))
    return {major, minor: []};
  const marked = new Set(major.map(Number));
  return {major, minor: minors.filter(v => !marked.has(v))};
}
