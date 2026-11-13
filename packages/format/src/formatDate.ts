import {
  timeYear,
  timeMonth,
  timeDay,
  timeHour,
  timeMinute,
  timeSecond,
  utcYear,
  utcMonth,
  utcDay,
  utcHour,
  utcMinute,
  utcSecond,
} from "d3-time";
import type {TimeInterval} from "d3-time";
import {timeFormat, utcFormat} from "d3-time-format";

type DateFormatter = (specifier: string) => (date: Date) => string;
type DateIntervalName =
  "year" | "quarter" | "month" | "day" | "hour" | undefined;

/** The calendar dates are read in: local time, or UTC. */
interface Calendar {
  year: TimeInterval;
  month: TimeInterval;
  day: TimeInterval;
  hour: TimeInterval;
  minute: TimeInterval;
  second: TimeInterval;
  fullYear: (d: Date) => number;
  monthOf: (d: Date) => number;
}

const localCalendar: Calendar = {
  year: timeYear,
  month: timeMonth,
  day: timeDay,
  hour: timeHour,
  minute: timeMinute,
  second: timeSecond,
  fullYear: d => d.getFullYear(),
  monthOf: d => d.getMonth(),
};

const utcCalendar: Calendar = {
  year: utcYear,
  month: utcMonth,
  day: utcDay,
  hour: utcHour,
  minute: utcMinute,
  second: utcSecond,
  fullYear: d => d.getUTCFullYear(),
  monthOf: d => d.getUTCMonth(),
};

const calendarOf = (utc: boolean): Calendar =>
  utc ? utcCalendar : localCalendar;

/** The formatter dates are written with by default: d3's `utcFormat` in UTC, else `timeFormat`. */
const defaultFormatter = (utc: boolean): DateFormatter =>
  utc ? utcFormat : timeFormat;

/**
    A default set of date formatters, which takes into account both the interval in between in each data point but also the start/end data points.

    Without `shown`, the year rides on the first and last dates and on each January 1st. Given `shown` (the dates actually drawn, such as the axis labels left after thinning), it rides on the first shown date and on the first shown date after each change of year instead, so the year stays readable however the labels are thinned; at hourly and finer steps, the date rides with the time on the first shown date of each day. A label carrying the year at these steps reads its date, year, and time. Times of day follow the formatter's locale: "3 PM" and "3:30 PM" on a 12-hour clock, "15:00" and "15:30" on a 24-hour one.
    @param d The date to format.
    @param dataArray The full array of ordered Date Objects.
    @param formatter Optional custom format string or function.
    @param shown Optional dates drawn alongside `d`, which decide which labels carry the year (and, at hourly and finer steps, the date).
    @param utc Read the dates' calendar in UTC instead of local time. The default formatter is then d3's `utcFormat`; a custom one should write UTC too (such as a locale's `utcFormat`).
*/
export default function formatDate(
  d: Date,
  dataArray: Date[],
  formatter?: DateFormatter,
  shown?: Date[],
  utc = false,
): string {
  const cal = calendarOf(utc);
  const format = formatter ?? defaultFormatter(utc);
  const {withYear, withDay} = shown
    ? shownBoundaries(d, shown, cal)
    : arrayBoundaries(d, dataArray, cal);
  return pickFormat(
    d,
    dateInterval(dataArray, cal),
    withYear || dataArray.length <= 5,
    withDay,
    !!shown,
    format,
    uses24Hour(format, utc),
    cal,
  )(d);
}

/**
    Returns a function that labels any date in `dataArray` exactly as [formatDate](#formatDate) would, reading the interval and position of every date once up front, so labeling all of them takes linear time. Pass the returned function the date to format and, optionally, the dates `shown` alongside it (sorted once for each new array it is given).
    @param dataArray The full array of ordered Date Objects.
    @param formatter Optional custom format string or function.
    @param utc Read the dates' calendar in UTC instead of local time (see [formatDate](#formatDate)).
*/
export function dateFormatter(
  dataArray: Date[],
  formatter?: DateFormatter,
  utc = false,
): (d: Date, shown?: Date[]) => string {
  const cal = calendarOf(utc);
  const base = formatter ?? defaultFormatter(utc);
  const interval = dateInterval(dataArray, cal);
  const smallArray = dataArray.length <= 5;
  const last = dataArray.length - 1;
  const firstIndex = new Map<number, number>();
  dataArray.forEach((a, i) => {
    const t = +a;
    if (!isNaN(t) && !firstIndex.has(t)) firstIndex.set(t, i);
  });
  const format = cachedFormatter(base);
  const hour24 = uses24Hour(base, utc);
  // The shown dates in time order, and the one before each of them.
  let shownArray: Date[] | undefined,
    shownSorted: Date[] = [];
  const shownPrev = new Map<number, Date | undefined>();
  const prevShown = (d: Date): Date | undefined => {
    const t = +new Date(+d);
    return shownPrev.has(t) ? shownPrev.get(t) : latestBefore(t, shownSorted);
  };
  return (d: Date, shown?: Date[]): string => {
    if (shown && shown !== shownArray) {
      shownArray = shown;
      shownSorted = shown.filter(s => !isNaN(+s)).sort((a, b) => +a - +b);
      shownPrev.clear();
      shownSorted.forEach((s, k) => {
        const t = +s;
        if (!shownPrev.has(t))
          shownPrev.set(t, k ? shownSorted[k - 1] : undefined);
      });
    }
    const {withYear, withDay} = shown
      ? prevBoundaries(d, prevShown(d), cal)
      : indexBoundaries(d, firstIndex.get(+d) ?? -1, last, cal);
    return pickFormat(
      d,
      interval,
      withYear || smallArray,
      withDay,
      !!shown,
      format,
      hour24,
      cal,
    )(d);
  };
}

/**
    The formatter [formatDate](#formatDate) labels `d` with, given the interval its dates step by and the boundaries `d` opens.
    @private
*/
function pickFormat(
  d: Date,
  interval: DateIntervalName,
  year: boolean,
  withDay: boolean,
  shown: boolean,
  formatter: DateFormatter,
  hour24: boolean,
  cal: Calendar,
): (date: Date) => string {
  const day = year ? "%b %-d, %Y" : "%b %-d";
  // A time of day, with the date when it opens the year or (among shown dates) the day.
  const time = (t: string) =>
    year ? `${day}, ${t}` : withDay && shown ? `${day}, ${t}` : t;
  const hour = hour24 ? "%H:%M" : "%-I %p";
  const minute = hour24 ? "%H:%M" : "%-I:%M %p";
  return formatter(
    interval === "year"
      ? "%Y"
      : interval === "quarter"
        ? year
          ? "Q%q %Y"
          : "Q%q"
        : interval === "month"
          ? year
            ? "%b %Y"
            : "%b"
          : interval === "day"
            ? day
            : interval === "hour"
              ? !year && withDay && !shown
                ? day
                : time(hour)
              : cal.second(d) < d
                ? ".%L"
                : cal.minute(d) < d
                  ? ":%S"
                  : cal.hour(d) < d
                    ? time(minute)
                    : cal.day(d) < d
                      ? time(hour)
                      : day,
  );
}

const hourCycles = new WeakMap<DateFormatter, boolean>();
const utcHourCycles = new WeakMap<DateFormatter, boolean>();

/**
    Whether `formatter` writes the time of day on a 24-hour clock, read from how its locale's time format (`%X`) writes 3 PM. Formatters that fail to format it read as 12-hour.
    @param formatter A function that turns a specifier into a formatter, such as d3's `timeFormat` or a locale's `format`.
    @param utc Whether `formatter` writes UTC (such as d3's `utcFormat`), so 3 PM is read in UTC.
    @private
*/
export function uses24Hour(formatter: DateFormatter, utc = false): boolean {
  const cycles = utc ? utcHourCycles : hourCycles;
  let hour24 = cycles.get(formatter);
  if (hour24 === undefined) {
    const threePm = utc
      ? new Date(Date.UTC(2000, 0, 1, 15))
      : new Date(2000, 0, 1, 15);
    try {
      hour24 = String(formatter("%X")(threePm)).includes("15");
    } catch {
      hour24 = false;
    }
    cycles.set(formatter, hour24);
  }
  return hour24;
}

/**
    Which boundaries `d` opens among the full set of dates: the year on the first and last dates and on January 1st, the day on the first of each month.
    @private
*/
function arrayBoundaries(
  d: Date,
  dataArray: Date[],
  cal: Calendar,
): {withYear: boolean; withDay: boolean} {
  return indexBoundaries(
    d,
    dataArray.findIndex(a => +a === +d),
    dataArray.length - 1,
    cal,
  );
}

/**
    The boundaries `d` opens at `labelIndex` (-1 when absent) among dates whose last index is `last` (see `arrayBoundaries`).
    @private
*/
function indexBoundaries(
  d: Date,
  labelIndex: number,
  last: number,
  cal: Calendar,
): {withYear: boolean; withDay: boolean} {
  const firstOrLast = labelIndex === 0 || labelIndex === last;
  return {
    withYear: firstOrLast || +cal.year(d) === +d,
    withDay: +cal.month(d) === +d,
  };
}

/**
    Which boundaries `d` opens among the shown dates: the year when no shown date comes before it or the one just before it falls in another year, and likewise the day.
    @private
*/
function shownBoundaries(
  d: Date,
  shown: Date[],
  cal: Calendar,
): {withYear: boolean; withDay: boolean} {
  const t = +new Date(+d);
  let prev: Date | undefined;
  for (const s of shown) if (+s < t && (!prev || +s > +prev)) prev = s;
  return prevBoundaries(d, prev, cal);
}

/**
    The latest of `sorted` (valid dates in time order) before the time `t`, found by binary search.
    @private
*/
function latestBefore(t: number, sorted: Date[]): Date | undefined {
  if (isNaN(t)) return undefined;
  let lo = 0,
    hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (+sorted[mid] < t) lo = mid + 1;
    else hi = mid;
  }
  return lo ? sorted[lo - 1] : undefined;
}

/**
    The boundaries `d` opens after the shown date `prev` before it (see `shownBoundaries`).
    @private
*/
function prevBoundaries(
  d: Date,
  prev: Date | undefined,
  cal: Calendar,
): {withYear: boolean; withDay: boolean} {
  // Axes may pass timestamps for `d`.
  const date = new Date(+d);
  return {
    withYear: !prev || cal.fullYear(prev) !== cal.fullYear(date),
    withDay: !prev || +cal.day(prev) !== +cal.day(date),
  };
}

/**
    Formats a date to be read on its own, such as in a tooltip: the same interval as [formatDate](#formatDate) picks from `dataArray` (year, quarter, month, day, hour, or finer), always with the year and, below a day, the time of day.
    @param d The date to format.
    @param dataArray The full array of ordered Date Objects.
    @param formatter Optional custom format string or function.
    @param utc Read the dates' calendar in UTC instead of local time (see [formatDate](#formatDate)).
*/
export function formatDateFull(
  d: Date,
  dataArray: Date[],
  formatter?: DateFormatter,
  utc = false,
): string {
  const cal = calendarOf(utc);
  const format = formatter ?? defaultFormatter(utc);
  return format(
    fullSpecifier(
      d,
      dateInterval(dataArray, cal),
      uses24Hour(format, utc),
      cal,
    ),
  )(d);
}

/**
    Returns a function that labels any date exactly as [formatDateFull](#formatDateFull) would against `dataArray`, reading the interval its dates step by once up front.
    @param dataArray The full array of ordered Date Objects.
    @param formatter Optional custom format string or function.
    @param utc Read the dates' calendar in UTC instead of local time (see [formatDate](#formatDate)).
*/
export function dateFullFormatter(
  dataArray: Date[],
  formatter?: DateFormatter,
  utc = false,
): (d: Date) => string {
  const cal = calendarOf(utc);
  const base = formatter ?? defaultFormatter(utc);
  const interval = dateInterval(dataArray, cal);
  const format = cachedFormatter(base);
  const hour24 = uses24Hour(base, utc);
  return (d: Date): string =>
    format(fullSpecifier(d, interval, hour24, cal))(d);
}

/**
    Wraps `formatter` to build each specifier's format function once.
    @private
*/
function cachedFormatter(formatter: DateFormatter): DateFormatter {
  const formats = new Map<string, (date: Date) => string>();
  return (specifier: string) => {
    let f = formats.get(specifier);
    if (!f) formats.set(specifier, (f = formatter(specifier)));
    return f;
  };
}

/**
    The format specifier [formatDateFull](#formatDateFull) labels `d` with at the given interval.
    @private
*/
function fullSpecifier(
  d: Date,
  interval: DateIntervalName,
  hour24: boolean,
  cal: Calendar,
): string {
  const time = (t: string) =>
    `%b %-d, %Y ${hour24 ? `%H:${t}` : `%-I${t ? `:${t}` : ""} %p`}`;
  return interval === "year"
    ? "%Y"
    : interval === "quarter"
      ? "Q%q %Y"
      : interval === "month"
        ? "%b %Y"
        : interval === "day"
          ? "%b %-d, %Y"
          : interval === "hour"
            ? time(hour24 ? "%M" : "")
            : cal.second(d) < d
              ? time("%M:%S.%L")
              : cal.minute(d) < d
                ? time("%M:%S")
                : time("%M");
}

/**
    The coarsest interval every step between consecutive dates is a whole multiple of: "year", "quarter", "month", "day", or "hour", else undefined for finer steps.
    @param dataArray The full array of ordered Date Objects.
    @param cal The calendar the dates are read in.
    @private
*/
function dateInterval(dataArray: Date[], cal: Calendar): DateIntervalName {
  const [yearlySteps, monthlySteps, dailySteps, hourlySteps] = dataArray.reduce<
    [number[], number[], number[], number[]]
  >(
    (arr, d, i) => {
      if (i) {
        arr[0].push(cal.fullYear(d) - cal.fullYear(dataArray[i - 1]));
        arr[1].push(monthDiff(dataArray[i - 1], d, cal));
        arr[2].push(
          Math.round((+d - +dataArray[i - 1]) / (1000 * 60 * 60 * 24)),
        );
        // Unrounded: an hour is a fixed span, so a half-hour step is not hourly.
        arr[3].push((+d - +dataArray[i - 1]) / (1000 * 60 * 60));
      }
      return arr;
    },
    [[], [], [], []],
  );
  const whole = (steps: number[], size = 1) =>
    steps.every(s => s >= size && !(s % size));
  return whole(yearlySteps)
    ? "year"
    : whole(monthlySteps, 3)
      ? "quarter"
      : whole(monthlySteps)
        ? "month"
        : whole(dailySteps)
          ? "day"
          : whole(hourlySteps)
            ? "hour"
            : undefined;
}

/**
    Returns the number of months between two Date objects

    @returns {Number} the number of months between the two Date objects
    @private
*/
function monthDiff(d1: Date, d2: Date, cal: Calendar): number {
  let months: number;
  months = (cal.fullYear(d2) - cal.fullYear(d1)) * 12;
  months -= cal.monthOf(d1);
  months += cal.monthOf(d2);
  return months <= 0 ? 0 : months;
}
