import {extent} from "d3-array";
import {timeFormatLocale} from "d3-time-format";

import {date} from "@d3plus/dom";
import {formatDateFull} from "@d3plus/format";
import {locale, type TimeLocaleDefinition} from "@d3plus/locales";

import type Axis from "./Axis.js";

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
  const data = parseTimeValues(axis._data ?? []);
  const domain = ((axis.schema.domain ?? []) as unknown[]).map(parseTime);
  if (domain.length < 2 || domain.some(d => d === undefined)) return data;
  const [lo, hi] = extent(domain as Date[]) as [Date, Date];
  return data.filter(d => d >= lo && d <= hi);
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
  return axis.schema.timeLocale || locale[axis.schema.locale] || locale["en-US"];
}

/**
    The ordered Dates a time axis picks its label interval from: its parsed `data`, else its domain.
    @private
*/
export function axisTimeReference(axis: Axis): Date[] {
  return parseTimeValues(
    axis._scaleData.length ? axis._scaleData : axis.schema.domain,
  ).sort((a: Date, b: Date) => +a - +b);
}

/**
    A date labeled to be read on its own (e.g. in a tooltip): the label interval the axis uses for its ticks (see `axisDateReference`), always with the year, in the axis's time locale.
    @private
*/
export function axisDateLabel(axis: Axis, d: Date): string {
  const timeLocale = axisTimeLocale(axis);
  return formatDateFull(d, axisDateReference(axis, d), timeFormatLocale(timeLocale).format)
    .replace(/^Q/, timeLocale.quarter);
}

/** Whether a value is a Date that holds a valid time. */
export const isValidDate = (d: unknown): d is Date => d instanceof Date && !isNaN(+d);

/** Whether an axis places discrete categories (band, ordinal, or point scale) rather than a continuous range. */
export const isCategoryAxis = (axis: Axis): boolean =>
  ["band", "ordinal", "point"].includes(axis.schema.scale);

/**
    The Dates among an axis's values, unique and in time order: from its domain (a category axis's categories) when it holds any, else from its `data`. A category axis of Dates picks its label interval from these.
    @private
*/
export function axisDateCategories(axis: Axis): Date[] {
  const pick = (values: unknown): Date[] =>
    Array.isArray(values) ? values.filter(isValidDate) : [];
  const domain = pick(axis.schema.domain);
  const dates = domain.length ? domain : pick(axis._scaleData);
  const seen = new Set<number>();
  return dates
    .filter(d => !seen.has(+d) && !!seen.add(+d))
    .sort((a, b) => +a - +b);
}

/**
    The ordered Dates an axis labels `d` against: a time axis's tick reference, else the Dates among its values, else `d` alone.
    @private
*/
function axisDateReference(axis: Axis, d: Date): Date[] {
  const dates = axis.schema.scale === "time" ? axisTimeReference(axis) : axisDateCategories(axis);
  return dates.length ? dates : [d];
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
