/**
    Localized date labels for Calendar: weekday, month, year, and day names
    come from the chart locale's d3-time-format definition, so every label
    follows `locale` (or a `timeLocale` override).
*/

import {timeFormatLocale} from "d3-time-format";
import type {TimeLocaleDefinition as D3TimeLocale} from "d3-time-format";
import {locale as timeLocales} from "@d3plus/locales";
import type {TimeLocaleDefinition} from "@d3plus/locales";

import type {CalendarFormat} from "./calendarLayout.js";

/** The d3-time-format definition for a locale code, falling back to `"en-US"`. */
export function calendarTimeLocale(code: unknown): TimeLocaleDefinition {
  return (
    (typeof code === "string" && timeLocales[code]) || timeLocales["en-US"]
  );
}

/**
    A label formatter from a format config: a d3-time-format specifier string
    (`"%b"`) read in the locale, a function of the date, or `false` for none.
    `undefined` takes `fallback`.
*/
export function calendarFormatter(
  spec: unknown,
  definition: TimeLocaleDefinition,
  fallback: string | false,
): CalendarFormat {
  const value = spec === undefined ? fallback : spec;
  if (typeof value === "function") {
    const fn = value as (date: Date) => unknown;
    return (date: Date) => `${fn(date) ?? ""}`;
  }
  if (typeof value !== "string" || !value) return null;
  return timeFormatLocale(definition as unknown as D3TimeLocale).format(value);
}

/**
    The specifier for a full date in a locale, with the weekday: its
    `dateTime` pattern without the time of day or the day number's padding,
    led by the weekday name when the pattern has none (`"%A, %x"` for
    `"en-US"`).
*/
export function calendarDateSpecifier(
  definition: TimeLocaleDefinition,
): string {
  const datePart = definition.dateTime
    .replace(/[,.]?\s*%X/g, "")
    .replace(/[\s,.]+$/, "")
    .replace(/%e/g, "%-d")
    .trim();
  const pattern = datePart || definition.date;
  return /%[aA]/.test(pattern) ? pattern : `%A, ${pattern}`;
}

/** A weekday name's shortest form: its first character, upper-cased in the locale. */
export function narrowName(text: string, locale?: string): string {
  const [first = ""] = Array.from(text.trim());
  try {
    return first.toLocaleUpperCase(locale);
  } catch {
    return first.toUpperCase();
  }
}
