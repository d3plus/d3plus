/**
 * Reading single cells: whether a value is empty, a number, a boolean, or a
 * date, forgiving the ways spreadsheets and exports write them.
 */

/** Cell text that means "no value". */
const EMPTY = new Set([
  "",
  "na",
  "n/a",
  "nan",
  "null",
  "none",
  "-",
  "—",
  "#n/a",
]);

/** Whether a cell holds no value. */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "number") return Number.isNaN(value);
  if (typeof value === "string") return EMPTY.has(value.trim().toLowerCase());
  return false;
}

/**
 * The number a cell holds, or undefined: a JSON number, or text such as
 * `1,234.5`, `$12`, `45%`, `-3e2`, or `(12)` (an accounting negative).
 * A percentage keeps its written number (`45%` is 45).
 */
export function toNumber(value: unknown): number | undefined {
  if (typeof value === "number")
    return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string") return undefined;
  let s = value.trim();
  let sign = 1;
  if (/^\(.*\)$/.test(s)) {
    sign = -1;
    s = s.slice(1, -1).trim();
  }
  s = s.replace(/^([-+]?)\s*[$€£¥]\s*/, "$1").replace(/\s*%$/, "");
  if (/^[-+]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, "");
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return undefined;
  return sign * Number(s);
}

/** The boolean a cell holds, or undefined. */
export function toBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return undefined;
  const s = value.trim().toLowerCase();
  if (s === "true" || s === "yes") return true;
  if (s === "false" || s === "no") return false;
  return undefined;
}

/** How finely a date column's values name a point in time. */
export type DateKind = "year" | "quarter" | "month" | "day" | "time";

/** A date read from a cell: its kind, and the moment it starts (ms, UTC). */
export interface DateValue {
  kind: DateKind;
  time: number;
  /** Whether it was written in ISO order (`2024-03`, `2024-03-01`). */
  iso: boolean;
}

const utc = (y: number, m = 1, d = 1) => Date.UTC(y, m - 1, d);

const validDay = (y: number, m: number, d: number) => {
  const t = new Date(utc(y, m, d));
  return t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
};

/**
 * The date a text cell holds, in a form d3plus reads too: ISO dates and
 * date-times (`2024-03-01`, `2024-03-01T09:30`), months (`2024-03`), quarters
 * (`2024 Q1`, `Q1 2024`), and US-style days (`3/1/2024`). A bare year is a
 * number; see `yearColumn`.
 */
export function toDate(value: unknown): DateValue | undefined {
  if (typeof value !== "string") return undefined;
  const s = value.trim();
  let m =
    /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})([T ]\d{1,2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/.exec(
      s,
    );
  if (m) {
    const [y, mo, d] = [+m[1], +m[2], +m[3]];
    if (!validDay(y, mo, d)) return undefined;
    const time = m[4] ? Date.parse(s.replace(" ", "T")) : utc(y, mo, d);
    if (Number.isNaN(time)) return undefined;
    return {kind: m[4] ? "time" : "day", time, iso: true};
  }
  m = /^(\d{4})-(\d{1,2})$/.exec(s);
  if (m && +m[2] >= 1 && +m[2] <= 12)
    return {kind: "month", time: utc(+m[1], +m[2]), iso: true};
  m =
    /^(\d{4})[\s-]?[qQ]([1-4])$/.exec(s) ??
    /^[qQ]([1-4])[\s-]?(\d{4})$/.exec(s);
  if (m) {
    const [y, q] = /^\d{4}$/.test(m[1]) ? [+m[1], +m[2]] : [+m[2], +m[1]];
    return {kind: "quarter", time: utc(y, q * 3 - 2), iso: false};
  }
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (m && validDay(+m[3], +m[1], +m[2]))
    return {kind: "day", time: utc(+m[3], +m[1], +m[2]), iso: false};
  return undefined;
}

/** Column names that mark a column of whole numbers as years. */
const YEAR_NAME = /year|\b(yr|fy|season|period)s?\b/i;

/**
 * Whether a column of numbers is a column of years: its name says so and
 * every value is a whole number from 1000 to 2999.
 */
export function yearColumn(key: string, numbers: number[]): boolean {
  return (
    YEAR_NAME.test(key) &&
    numbers.length > 0 &&
    numbers.every(n => Number.isInteger(n) && n >= 1000 && n <= 2999)
  );
}
