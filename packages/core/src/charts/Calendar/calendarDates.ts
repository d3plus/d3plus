/**
    Pure date math for Calendar: parsing day values, the week a day falls in,
    and the year or month blocks a date range spans. Every day is a local
    calendar day (midnight in the viewer's time zone), and day counts come
    from calendar fields rather than elapsed milliseconds, so daylight-saving
    shifts never move a day into the wrong cell.
*/

/** A block of consecutive days drawn as one grid: a whole year or a whole month. */
export interface CalendarBlock {
  /** `"2024"` for a year block, `"2024-03"` for a month block. */
  key: string;
  /** The block's first day. */
  start: Date;
  /** The block's last day. */
  end: Date;
}

/** One day of a block, placed in its week and weekday slot. */
export interface CalendarDay {
  date: Date;
  /** `"YYYY-MM-DD"`. */
  key: string;
  /** Week index within the block, from 0. */
  week: number;
  /** Weekday slot within the week, from 0 (the week's first day). */
  day: number;
}

/** Whether a calendar is laid out one block per year or per month. */
export type CalendarPeriod = "year" | "month";

const MS_PER_DAY = 864e5;
const isoDay = /^(\d{4})-(\d{2})-(\d{2})$/;

/** The local midnight of `date`'s calendar day. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
    Reads a day from a data value: a `Date`, a millisecond timestamp, or a
    date string. A bare `"YYYY-MM-DD"` string is that local calendar day (the
    `Date` constructor would read it as UTC midnight, the previous day west of
    Greenwich). An array (the value a merged row carries when its rows
    disagree) reads its first entry. Returns `null` for anything unparseable.
*/
export function parseCalendarDate(value: unknown): Date | null {
  if (Array.isArray(value))
    return value.length ? parseCalendarDate(value[0]) : null;
  if (value instanceof Date) return isNaN(+value) ? null : startOfDay(value);
  if (typeof value === "number") {
    return Number.isFinite(value) ? startOfDay(new Date(value)) : null;
  }
  if (typeof value !== "string" || !value.trim()) return null;
  const match = isoDay.exec(value.trim());
  if (match) {
    const [y, m, d] = [+match[1], +match[2] - 1, +match[3]];
    const date = new Date(y, m, d);
    date.setFullYear(y);
    return date.getMonth() === m && date.getDate() === d ? date : null;
  }
  const parsed = new Date(value);
  return isNaN(+parsed) ? null : startOfDay(parsed);
}

/** A day's `"YYYY-MM-DD"` key, from its local calendar fields. */
export function calendarDayKey(date: Date): string {
  const y = `${date.getFullYear()}`.padStart(4, "0");
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Whole calendar days from `a` to `b` (negative when `b` is earlier), immune to DST. */
export function daysBetween(a: Date, b: Date): number {
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ub - ua) / MS_PER_DAY);
}

/** The day `n` calendar days after `date` (local midnight). */
export function addDays(date: Date, n: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
}

/** `date`'s slot in a week starting on `weekStart` (0 = Sunday … 6 = Saturday). */
export function weekdaySlot(date: Date, weekStart: number): number {
  return (((date.getDay() - weekStart) % 7) + 7) % 7;
}

/** The week of the block starting at `origin` that `date` falls in (week 0 holds `origin`). */
export function weekIndex(date: Date, origin: Date, weekStart: number): number {
  return Math.floor(
    (daysBetween(origin, date) + weekdaySlot(origin, weekStart)) / 7,
  );
}

const dayNames = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

// CLDR week data: regions whose weeks start on Sunday or Saturday; every
// other region starts on Monday.
const sundayRegions = new Set(
  (
    "AG AS BD BR BS BT BW BZ CA CN CO DM DO ET GT GU HK HN ID IL IN JM JP KE " +
    "KH KR LA MH MM MO MT MX MZ NI NP PA PE PH PK PR PT PY SA SG SV TH TT TW " +
    "UM US VE VI WS YE ZA ZW"
  ).split(" "),
);
const saturdayRegions = new Set(
  "AE AF BH DJ DZ EG IQ IR JO KW LY OM QA SD SY".split(" "),
);

/**
    The first day of the week (0 = Sunday … 6 = Saturday) in a locale's
    region, per CLDR: `"en-US"` → 0, `"de-DE"` → 1, `"ar-EG"` → 6. A locale
    without a region starts on Monday.
*/
export function localeWeekStart(locale: unknown): number {
  const tag = typeof locale === "string" ? locale : "";
  const region = tag
    .split(/[-_]/)
    .slice(1)
    .find(part => /^[A-Za-z]{2}$/.test(part))
    ?.toUpperCase();
  if (!region) return 1;
  if (sundayRegions.has(region)) return 0;
  if (saturdayRegions.has(region)) return 6;
  return 1;
}

/**
    Resolves the `weekStart` config to a weekday number (0 = Sunday …
    6 = Saturday): a number, or an English day name (`"sunday"`, `"Mon"`).
    Anything else falls back to the locale's first day of the week.
*/
export function resolveWeekStart(weekStart: unknown, locale: unknown): number {
  if (typeof weekStart === "number" && Number.isFinite(weekStart)) {
    return ((Math.round(weekStart) % 7) + 7) % 7;
  }
  if (typeof weekStart === "string" && weekStart.length >= 2) {
    const name = weekStart.toLowerCase();
    const index = dayNames.findIndex(d => d.startsWith(name));
    if (index >= 0) return index;
  }
  return localeWeekStart(locale);
}

/** The earliest and latest of `dates`, or `null` when there are none. */
export function dateExtent(dates: Date[]): [Date, Date] | null {
  if (!dates.length) return null;
  let lo = dates[0];
  let hi = dates[0];
  for (const d of dates) {
    if (+d < +lo) lo = d;
    if (+d > +hi) hi = d;
  }
  return [lo, hi];
}

/**
    The blocks covering `start` through `end`: every whole calendar year
    (`"year"`) or every whole month (`"month"`) the range touches.
*/
export function calendarBlocks(
  start: Date,
  end: Date,
  period: CalendarPeriod,
): CalendarBlock[] {
  const blocks: CalendarBlock[] = [];
  if (+end < +start) return blocks;
  if (period === "month") {
    let y = start.getFullYear();
    let m = start.getMonth();
    const last = end.getFullYear() * 12 + end.getMonth();
    while (y * 12 + m <= last) {
      blocks.push({
        key: `${calendarDayKey(new Date(y, m, 1)).slice(0, 7)}`,
        start: new Date(y, m, 1),
        end: new Date(y, m + 1, 0),
      });
      m += 1;
      if (m > 11) [y, m] = [y + 1, 0];
    }
    return blocks;
  }
  for (let y = start.getFullYear(); y <= end.getFullYear(); y++) {
    blocks.push({
      key: `${y}`,
      start: new Date(y, 0, 1),
      end: new Date(y, 11, 31),
    });
  }
  return blocks;
}

/** How many week columns (or rows) a block spans. */
export function blockWeeks(block: CalendarBlock, weekStart: number): number {
  return weekIndex(block.end, block.start, weekStart) + 1;
}

/** Every day of `block`, in order, with its week and weekday slot. */
export function blockDays(
  block: CalendarBlock,
  weekStart: number,
): CalendarDay[] {
  const count = daysBetween(block.start, block.end) + 1;
  const offset = weekdaySlot(block.start, weekStart);
  const days: CalendarDay[] = [];
  for (let n = 0; n < count; n++) {
    const date = addDays(block.start, n);
    days.push({
      date,
      key: calendarDayKey(date),
      week: Math.floor((n + offset) / 7),
      day: (n + offset) % 7,
    });
  }
  return days;
}

/** The months of a year block, each as its own block. */
export function blockMonths(block: CalendarBlock): CalendarBlock[] {
  return calendarBlocks(block.start, block.end, "month");
}
