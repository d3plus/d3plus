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
    The `data` values an Axis scale reads: valid Dates on a time scale (unparseable values dropped), otherwise `data` as given.
    @private
*/
export function axisScaleData(axis: Axis): unknown[] {
  return axis.schema.scale === "time"
    ? parseTimeValues(axis._data ?? [])
    : (axis._data ?? []);
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
    A date labeled to be read on its own (e.g. in a tooltip): the label interval the time axis uses for its ticks, always with the year, in the axis's time locale.
    @private
*/
export function axisDateLabel(axis: Axis, d: Date): string {
  const timeLocale = axisTimeLocale(axis);
  return formatDateFull(d, axisTimeReference(axis), timeFormatLocale(timeLocale).format)
    .replace(/^Q/, timeLocale.quarter);
}
