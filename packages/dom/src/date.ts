/**
    The same wall-clock time as `local` (read in local time), in UTC.
    @private
*/
function wallClockUtc(local: Date): Date {
  const out = new Date(0);
  out.setUTCFullYear(local.getFullYear(), local.getMonth(), local.getDate());
  out.setUTCHours(
    local.getHours(),
    local.getMinutes(),
    local.getSeconds(),
    local.getMilliseconds(),
  );
  return out;
}

/** Whether a number reads as a timestamp (in milliseconds) rather than a year. */
const isTimestamp = (d: number): boolean => `${d}`.length > 5 && d % 1 === 0;

/** A string that names its own time zone, such as a trailing `Z`, `GMT`, or `+05:30`. */
const zoned = /\d:\d{2}.*(?:Z|GMT|UTC|[+-]\d{2}:?\d{2})(?:\s*\([^)]*\))?$/i;

/**
    Parses numbers and strings into valid JavaScript Date objects, supporting years, quarters, months, and ISO 8601 formats.
    @param d The date value to parse (number, string, or Date).
    @param utc Read a value that names no time zone (a year, a quarter, a month, or a date string without one) in UTC instead of local time. Only `true` turns it on, so `values.map(date)` (which passes each index here) reads local time.
*/
export default function (
  d: number | string | false | undefined,
  utc?: boolean,
): Date | false | undefined {
  const parsed = parseLocal(d);
  if (utc !== true || !(parsed instanceof Date) || parsed === (d as unknown))
    return parsed;
  const ownZone = typeof d === "number" ? isTimestamp(d) : zoned.test(`${d}`);
  return ownZone ? parsed : wallClockUtc(parsed);
}

/**
    Parses `d` the way `date` does in local time.
    @private
*/
function parseLocal(
  d: number | string | false | undefined,
): Date | false | undefined {
  // returns if falsey or already Date object
  if (
    [false, undefined, NaN].includes(d as never) ||
    (d as unknown as {constructor: unknown}).constructor === Date
  )
    return d as Date | false | undefined;
  // detects if milliseconds
  else if (
    (d as unknown as {constructor: unknown}).constructor === Number &&
    isTimestamp(d as number)
  )
    return new Date(d as number);

  let s = `${d}`;

  // tests for MM/DD/YYYY and MM-DD-YYYY format
  const dayFormat = new RegExp(/^\d{1,2}[./-]\d{1,2}[./-](-*\d{1,4})$/g).exec(
    s,
  );
  if (dayFormat) {
    const year = dayFormat[1];
    if (year.indexOf("-") === 0) s = s.replace(year, year.substring(1));
    const date = new Date(s);
    date.setFullYear(year as unknown as number);
    return date;
  }

  // tests for full Date object string format
  const strFormat = new RegExp(
    /^[A-z]{1,3} [A-z]{1,3} \d{1,2} (-*\d{1,4}) \d{1,2}:\d{1,2}:\d{1,2} [A-z]{1,3}-*\d{1,4} \([A-z]{1,3}\)/g,
  ).exec(s);
  if (strFormat) {
    const year = strFormat[1];
    if (year.indexOf("-") === 0) s = s.replace(year, year.substring(1));
    const date = new Date(s);
    date.setFullYear(year as unknown as number);
    return date;
  }

  // tests for quarterly formats (ie. "QX YYYY" and "YYYY QX")
  const quarterPrefix = new RegExp(
    /^([qQ]{1}[1-4]{1}|[1-4]{1}[qQ]{1})[\s|-]{0,1}(-*\d{1,4})$/g,
  ).exec(s);
  const quarterSuffix = new RegExp(
    /^(-*\d{1,4})[\s|-]{0,1}([qQ]{1}[1-4]{1}|[1-4]{1}[qQ]{1})$/g,
  ).exec(s);
  if (quarterPrefix || quarterSuffix) {
    const quarter = +(quarterPrefix ? quarterPrefix[1] : quarterSuffix![2])
      .toLowerCase()
      .replace("q", "");
    const year = +(quarterPrefix ? quarterPrefix[2] : quarterSuffix![1]);
    const date = new Date(year, quarter * 3 - 3, 1);
    date.setFullYear(year);
    return date;
  }

  // tests for monthly formats (ie. "MM-YYYY" and "YYYY-MM")
  const monthPrefix = new RegExp(/^([-*\d]{1,2})-(-*\d{1,4})$/g).exec(s);
  const monthSuffix = new RegExp(/^(-*\d{1,4})-([-*\d]{1,2})$/g).exec(s);
  if (monthPrefix || monthSuffix) {
    const month = +(monthPrefix ? monthPrefix[1] : monthSuffix![2]);
    const year = +(monthPrefix ? monthPrefix[2] : monthSuffix![1]);
    const date = new Date(year, month - 1, 1);
    date.setFullYear(year);
    return date;
  }

  // detects if only passing a year value
  if (
    !s.includes("/") &&
    !s.includes(" ") &&
    (!s.includes("-") || !s.indexOf("-"))
  ) {
    const date = new Date(+s, 0, 1);
    date.setFullYear(d as number);
    return date;
  }

  const iso8601 = new RegExp(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/g,
  ).exec(s);
  if (iso8601) return new Date(s);

  // falls back to Date object, replacing hyphens with slashes
  return new Date(s.replace(/-/g, "/"));
}
