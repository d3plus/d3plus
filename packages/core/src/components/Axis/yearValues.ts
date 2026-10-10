/**
    Year detection for default number labels. A numeric year column (1970,
    1990, 2024, …) would otherwise abbreviate like any thousand ("1.97k"), so
    labels for values that read as calendar years print the number in full.
*/
import {formatAbbreviate} from "@d3plus/format";
import type {FormatLocaleDefinition} from "@d3plus/locales";

import type Axis from "./Axis.js";

const YEAR_MIN = 1000;
const YEAR_MAX = 2999;

const inYearRange = (d: unknown): d is number =>
  typeof d === "number" && d >= YEAR_MIN && d <= YEAR_MAX;

/**
    Whether a set of values reads as calendar years: it is non-empty and every
    value is a whole number from 1000 through 2999.
    @private
*/
export function isYearLike(values: readonly unknown[]): boolean {
  return (
    values.length > 0 &&
    values.every(d => inYearRange(d) && Number.isInteger(d))
  );
}

/**
    Whether an axis plots years: its data (or, with no data, its domain) is
    year-like, and its domain stays within the year range. A value axis whose
    domain reaches a zero baseline is not.
    @private
*/
export function axisIsYearLike(
  axis: Pick<Axis, "_scaleData" | "schema">,
): boolean {
  const domain = (axis.schema.domain ?? []) as unknown[];
  if (!domain.length || !domain.every(inYearRange)) return false;
  return isYearLike(axis._scaleData.length ? axis._scaleData : domain);
}

/**
    Formats a year in full, with no thousands separator or suffix ("1990").
    A fractional value keeps its decimals ("2019.5").
    @private
*/
export function formatYear(
  d: number,
  locale: string | FormatLocaleDefinition = "en-US",
): string {
  return formatAbbreviate(d, locale, "~f");
}
