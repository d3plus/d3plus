import {extent} from "d3-array";
import {timeFormatLocale} from "d3-time-format";

import {date} from "@d3plus/dom";
import {dateFullFormatter, formatDateFull} from "@d3plus/format";
import {locale, type TimeLocaleDefinition} from "@d3plus/locales";

import type Axis from "./Axis.js";
import {normalizeRangeBreaks, rangeBreakTest} from "./rangeBreaks.js";

/**
    Parses a value (Date, timestamp, or date string) into a valid Date, or `undefined` when it does not parse.
    @private
*/
export function parseTime(d: unknown): Date | undefined {
  if (d === null || d === undefined) return undefined;
  const parsed = date(d as string | number | false);
  return parsed instanceof Date && !isNaN(+parsed) ? parsed : undefined;
}

/**
    Parses values into Dates, dropping any that do not parse to a valid date.
    @private
*/
export function parseTimeValues(values: readonly unknown[]): Date[] {
  return values.map(parseTime).filter((d): d is Date => d !== undefined);
}

/**
    The `data` values an Axis scale reads: on a time scale, the valid Dates (unparseable values dropped) that fall within its domain, otherwise `data` as given.
    @private
*/
export function axisScaleData(axis: Axis): unknown[] {
  if (axis.schema.scale !== "time") return axis._data ?? [];
  const data = visibleDates(axis, parseTimeValues(axis._data ?? []));
  const domain = ((axis.schema.domain ?? []) as unknown[]).map(parseTime);
  if (domain.length < 2 || domain.some(d => d === undefined)) return data;
  const [lo, hi] = extent(domain as Date[]) as [Date, Date];
  return data.filter(d => d >= lo && d <= hi);
}

/** Dates a time axis's `rangeBreaks` leave shown. */
function visibleDates(axis: Axis, dates: Date[]): Date[] {
  const rules = normalizeRangeBreaks(axis.schema.rangeBreaks);
  if (!rules.length || !dates.length) return dates;
  const [lo, hi] = extent(dates, Number) as [number, number];
  const hidden = rangeBreakTest(rules, lo, hi);
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
  return data.filter(d => +d >= lo && +d <= hi);
}

/**
    A time scale's domain as Dates. When an end does not parse, the extent of the parsed `data` stands in for the whole domain.
    @private
*/
export function axisTimeDomain(axis: Axis): Date[] {
  const domain = (axis.schema.domain as unknown[]).map(parseTime);
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
  // Every mark reads its date this way, so the interval is read once per set of dates.
  const label = dates.length
    ? axisMemo(axis, "dateLabel", [dates, timeLocale], () =>
        dateFullFormatter(dates, localeFormat(timeLocale)),
      )(d)
    : formatDateFull(d, [d], localeFormat(timeLocale));
  return label.replace(/^Q/, timeLocale.quarter);
}

/** The `format` of a time locale, built once per locale definition. */
function localeFormat(
  timeLocale: TimeLocaleDefinition,
): (specifier: string) => (date: Date) => string {
  let format = localeFormats.get(timeLocale);
  if (!format)
    localeFormats.set(
      timeLocale,
      (format = timeFormatLocale(timeLocale).format),
    );
  return format;
}

const localeFormats = new WeakMap<
  TimeLocaleDefinition,
  (specifier: string) => (date: Date) => string
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
  const dates = parseTimeValues(shown).sort((a, b) => +a - +b);
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
