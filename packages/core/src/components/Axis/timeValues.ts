import {extent} from "d3-array";
import {timeFormat, timeFormatLocale, utcFormat} from "d3-time-format";

import {date} from "@d3plus/dom";
import {dateFullFormatter, formatDateFull} from "@d3plus/format";
import {locale, type TimeLocaleDefinition} from "@d3plus/locales";

import type Axis from "./Axis.js";
import {normalizeRangeBreaks, rangeBreakTest} from "./rangeBreaks.js";

/**
    Whether an axis config asks for its time in UTC: its `utc`, or
    `scale: "utc"`.
    @param config An axis config, such as a Plot's `xConfig`.
*/
export function configUtc(config: unknown): boolean {
  if (typeof config !== "object" || config === null) return false;
  const {utc, scale} = config as {utc?: unknown; scale?: unknown};
  return Boolean(utc) || scale === "utc";
}

/**
    Whether an axis places, labels, and parses its time in UTC (see `utc`).
    @param axis The axis.
*/
export const axisUtc = (axis: Axis): boolean => configUtc(axis.schema);

/**
    The d3 formatter dates are labeled with in the current default time
    locale: `utcFormat` in UTC, else `timeFormat`.
    @param utc Whether to write UTC.
*/
export const defaultTimeFormat = (utc: boolean): typeof timeFormat =>
  utc ? utcFormat : timeFormat;

/**
    Parses a value (Date, timestamp, or date string) into a valid Date, or `undefined` when it does not parse.
    @param d The value.
    @param utc Read a value that names no time zone (a year, or a date string) in UTC.
    @private
*/
export function parseTime(d: unknown, utc = false): Date | undefined {
  if (d === null || d === undefined) return undefined;
  const parsed = date(d as string | number | false, {utc});
  return parsed instanceof Date && !isNaN(+parsed) ? parsed : undefined;
}

/**
    Parses values into Dates, dropping any that do not parse to a valid date.
    @param values The values.
    @param utc Read values that name no time zone in UTC (see `parseTime`).
    @private
*/
export function parseTimeValues(
  values: readonly unknown[],
  utc = false,
): Date[] {
  return values
    .map(d => parseTime(d, utc))
    .filter((d): d is Date => d !== undefined);
}

/**
    The `data` values an Axis scale reads: on a time scale, the valid Dates (unparseable values dropped) that fall within its domain, otherwise `data` as given.
    @private
*/
export function axisScaleData(axis: Axis): unknown[] {
  if (axis.schema.scale !== "time") return axis._data ?? [];
  const utc = axisUtc(axis);
  const data = visibleDates(axis, parseTimeValues(axis._data ?? [], utc));
  const domain = ((axis.schema.domain ?? []) as unknown[]).map(d =>
    parseTime(d, utc),
  );
  if (domain.length < 2 || domain.some(d => d === undefined)) return data;
  const [lo, hi] = extent(domain as Date[]) as [Date, Date];
  return data.filter(d => d >= lo && d <= hi);
}

/** Dates a time axis's `rangeBreaks` leave shown. */
function visibleDates(axis: Axis, dates: Date[]): Date[] {
  const rules = normalizeRangeBreaks(axis.schema.rangeBreaks);
  if (!rules.length || !dates.length) return dates;
  const [lo, hi] = extent(dates, Number) as [number, number];
  const hidden = rangeBreakTest(rules, lo, hi, axisUtc(axis));
  return dates.filter(d => !hidden(d));
}

/**
    The dates of a time axis's `data` inside its scale's domain: what the axis ticks, so a domain narrower than the data (a zoomed view) ticks the window it shows.
    @private
*/
export function timeDataInDomain(
  data: Date[],
  scale: {domain(): unknown[]},
): Date[] {
  const [lo, hi] = (extent(scale.domain() as Date[]) as Date[]).map(Number);
  const cached = inDomain.get(data);
  if (cached && cached.lo === lo && cached.hi === hi) return cached.out;
  const out = data.filter(d => +d >= lo && +d <= hi);
  inDomain.set(data, {lo, hi, out});
  return out;
}

/** The last `timeDataInDomain` each data array answered, by array. */
const inDomain = new WeakMap<
  unknown[],
  {lo: number; hi: number; out: Date[]}
>();

/** Each data array's times as sorted milliseconds, by array. */
const sortedMs = new WeakMap<unknown[], Float64Array>();

/**
    Whether a time axis's data holds a time within `within` milliseconds of
    `t`. Reads the data's times once per array, then searches them.
    @param data The axis's data (Dates or millisecond numbers).
    @param t The time, in milliseconds.
    @param within How far from `t` a time may be.
    @private
*/
export function hasTimeNear(
  data: unknown[],
  t: number,
  within: number,
): boolean {
  let ms = sortedMs.get(data);
  if (!ms) {
    ms = Float64Array.from(data, Number).sort();
    sortedMs.set(data, ms);
  }
  let lo = 0,
    hi = ms.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (ms[mid] < t - within) lo = mid + 1;
    else hi = mid;
  }
  return lo < ms.length && ms[lo] <= t + within;
}

/** Each data array's extent and closest step, by array. */
const spacing = new WeakMap<unknown[], TimeSpacing>();

/** See {@link timeDataSpacing}. */
interface TimeSpacing {
  extent: [Date, Date];
  span: number;
  step: number;
}

/**
    A time axis's data's extent, its span (latest minus earliest), and the
    smallest gap between neighbors as listed, in milliseconds, read once per
    array.
    @param data The axis's data in its domain.
    @private
*/
export function timeDataSpacing(data: Date[]): TimeSpacing {
  const cached = spacing.get(data);
  if (cached) return cached;
  const [first, last] = extent(data) as [Date, Date];
  let step = Infinity;
  for (let i = 1; i < data.length; i++) {
    const gap = Math.abs(+data[i] - +data[i - 1]);
    if (gap < step) step = gap;
  }
  const out: TimeSpacing = {extent: [first, last], span: +last - +first, step};
  spacing.set(data, out);
  return out;
}

/**
    A time scale's domain as Dates. When an end does not parse, the extent of the parsed `data` stands in for the whole domain.
    @private
*/
export function axisTimeDomain(axis: Axis): Date[] {
  const utc = axisUtc(axis);
  const domain = (axis.schema.domain as unknown[]).map(d => parseTime(d, utc));
  const data = axis._scaleData as Date[];
  if (domain.some(d => d === undefined) && data.length)
    return extent(data) as [Date, Date];
  return domain as Date[];
}

/**
    The time locale an axis labels dates in: its `timeLocale`, else the one for its `locale`, else en-US.
    @private
*/
export function axisTimeLocale(axis: Axis): TimeLocaleDefinition {
  return (
    axis.schema.timeLocale || locale[axis.schema.locale] || locale["en-US"]
  );
}

/**
    The ordered Dates a time axis picks its label interval from: its parsed `data`, else the labels its scale offers (when two or more), else its domain.
    @private
*/
export function axisTimeReference(axis: Axis): Date[] {
  const {
    _scaleData: data,
    schema: {domain},
  } = axis;
  const scale = axis._d3Scale as {range?: () => unknown[]} | null;
  const range = scale?.range ? scale.range() : [];
  return axisMemo(
    axis,
    "timeReference",
    [data, domain, scale, ...range],
    () => {
      const offered = !data.length && scale ? axis._getLabels() : [];
      return parseTimeValues(
        data.length ? data : offered.length > 1 ? offered : domain,
        axisUtc(axis),
      ).sort((a: Date, b: Date) => +a - +b);
    },
  );
}

/**
    A date labeled to be read on its own (e.g. in a tooltip): the label interval the axis uses for its ticks (see `axisDateReference`), always with the year, in the axis's time locale.
    @private
*/
export function axisDateLabel(axis: Axis, d: Date): string {
  const timeLocale = axisTimeLocale(axis);
  const dates = axisDateReference(axis);
  const utc = axisUtc(axis);
  const format = localeFormat(timeLocale, utc);
  // Every mark reads its date this way, so the interval is read once per set of dates.
  const label = dates.length
    ? axisMemo(axis, "dateLabel", [dates, timeLocale, utc], () =>
        dateFullFormatter(dates, format, {utc}),
      )(d)
    : formatDateFull(d, [d], format, {utc});
  return label.replace(/^Q/, timeLocale.quarter);
}

type SpecifierFormat = (specifier: string) => (date: Date) => string;

/** The `format` (or, in UTC, `utcFormat`) of a time locale, built once per locale definition. */
function localeFormat(
  timeLocale: TimeLocaleDefinition,
  utc: boolean,
): SpecifierFormat {
  let formats = localeFormats.get(timeLocale);
  if (!formats) {
    const built = timeFormatLocale(timeLocale);
    localeFormats.set(
      timeLocale,
      (formats = {local: built.format, utc: built.utcFormat}),
    );
  }
  return utc ? formats.utc : formats.local;
}

const localeFormats = new WeakMap<
  TimeLocaleDefinition,
  {local: SpecifierFormat; utc: SpecifierFormat}
>();

/** Whether a value is a Date that holds a valid time. */
export const isValidDate = (d: unknown): d is Date =>
  d instanceof Date && !isNaN(+d);

/** Whether an axis places discrete categories (band, ordinal, or point scale) rather than a continuous range. */
export const isCategoryAxis = (axis: Axis): boolean =>
  ["band", "ordinal", "point"].includes(axis.schema.scale);

/**
    The Dates among an axis's values, unique and in time order: from its domain (a category axis's categories) when it holds any, else from its `data`. A category axis of Dates picks its label interval from these.
    @private
*/
export function axisDateCategories(axis: Axis): Date[] {
  const {
    _scaleData: data,
    schema: {domain: values},
  } = axis;
  return axisMemo(axis, "dateCategories", [values, data], () => {
    const pick = (values: unknown): Date[] =>
      Array.isArray(values) ? values.filter(isValidDate) : [];
    const domain = pick(values);
    const dates = domain.length ? domain : pick(data);
    const seen = new Set<number>();
    return dates
      .filter(d => !seen.has(+d) && !!seen.add(+d))
      .sort((a, b) => +a - +b);
  });
}

/**
    The ordered Dates an axis labels a date against: a time axis's tick reference, else the Dates among its values (empty when it holds none, and a date is then labeled against itself alone).
    @private
*/
function axisDateReference(axis: Axis): Date[] {
  return axis.schema.scale === "time"
    ? axisTimeReference(axis)
    : axisDateCategories(axis);
}

/**
    The Dates among the labels an axis draws (see `Axis._shownLabels`), parsed and in time order, or `undefined` before a layout pass has picked them. Date labels carry the year on the first of these and on the first after each change of year.
    @private
*/
export function axisShownDates(axis: Axis): Date[] | undefined {
  const shown = axis._shownLabels;
  if (!shown) return undefined;
  const cached = shownDatesCache.get(axis);
  if (cached && cached[0] === shown) return cached[1];
  const dates = parseTimeValues(shown, axisUtc(axis)).sort((a, b) => +a - +b);
  shownDatesCache.set(axis, [shown, dates]);
  return dates;
}

const shownDatesCache = new WeakMap<Axis, [unknown[], Date[]]>();

/**
    Reads `compute` once for an axis until any of `sources` changes (a new value, or an array of a new length) or `resetAxisDates` clears the axis, so a value read from all of an axis's dates (e.g. once per label or per mark) is read once per set of dates.
    @private
*/
function axisMemo<T>(
  axis: Axis,
  key: string,
  sources: unknown[],
  compute: () => T,
): T {
  const fingerprint = sources.flatMap(s =>
    Array.isArray(s) ? [s, s.length] : [s],
  );
  let memos = axisMemos.get(axis);
  if (!memos) axisMemos.set(axis, (memos = new Map()));
  const memo = memos.get(key) as AxisMemo<T> | undefined;
  if (
    memo &&
    memo.fingerprint.length === fingerprint.length &&
    memo.fingerprint.every((s, i) => s === fingerprint[i])
  )
    return memo.value;
  const value = compute();
  memos.set(key, {fingerprint, value});
  return value;
}

/**
    Clears an axis's memoized date reads (see `axisMemo`), so each layout pass reads its dates afresh.
    @private
*/
export function resetAxisDates(axis: Axis): void {
  axisMemos.delete(axis);
}

interface AxisMemo<T> {
  fingerprint: unknown[];
  value: T;
}

const axisMemos = new WeakMap<Axis, Map<string, AxisMemo<unknown>>>();
