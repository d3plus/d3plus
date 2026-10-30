/**
    Range break rules for time axes: the calendar stretches (weekends,
    daily hours, whole days, explicit ranges) a time axis hides so its data
    closes up around them. Rules read calendar time in the local time zone,
    as d3's `scaleTime` and d3plus's date labels do, or in UTC when asked.
*/
import {timeDay, utcDay} from "d3-time";

import {date} from "@d3plus/dom";

/** A time value a rule reads: a Date, a timestamp, or a date string. */
export type RangeBreakTime = Date | number | string;

/**
    One stretch of time a time axis hides:

    - `"weekends"`: every Saturday and Sunday.
    - `{days: [6, 0]}`: every day of the week listed (0 is Sunday, 6 is Saturday).
    - `{hours: [17, 9]}`: the same hours of every day, from the first hour to
      the second (fractions are minutes, so `9.5` is 9:30); a start after the
      end wraps past midnight, so `[17, 9]` hides 5pm to 9am.
    - `{values: [date, …]}`: each listed date's whole day, such as holidays.
    - `{bounds: [start, end]}`: one explicit range, from `start` up to `end`.

    An object rule's `marker` draws the axis's break marker where its time
    was removed, leaving a short gap there. It defaults to `true` for
    `bounds` and `false` for the others, which recur too often to mark.
*/
export type RangeBreakRule =
  | "weekends"
  | {days: number[]; marker?: boolean}
  | {hours: [number, number]; marker?: boolean}
  | {values: RangeBreakTime[]; marker?: boolean}
  | {bounds: [RangeBreakTime, RangeBreakTime]; marker?: boolean};

/** A hidden stretch of time, from `start` (hidden) up to `end` (shown), in ms. */
export interface TimeGap {
  start: number;
  end: number;
  /** Whether the gap draws a break marker. */
  marker: boolean;
}

const DAY = 864e5;

/** A rule value read as a timestamp, or `NaN` when it doesn't parse. */
export function rangeBreakTime(value: unknown): number {
  if (value instanceof Date) return +value;
  if (typeof value !== "number" && typeof value !== "string") return NaN;
  const parsed = date(value);
  return parsed instanceof Date ? +parsed : NaN;
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const validHours = (h: unknown): h is [number, number] =>
  Array.isArray(h) &&
  h.length === 2 &&
  h.every(n => typeof n === "number" && n >= 0 && n <= 24);

/** Whether `rule` is a rule a time axis can read. */
export function isRangeBreakRule(rule: unknown): rule is RangeBreakRule {
  if (rule === "weekends") return true;
  if (!isRecord(rule)) return false;
  if ("days" in rule)
    return (
      Array.isArray(rule.days) &&
      rule.days.every(d => Number.isInteger(d) && d >= 0 && d <= 6)
    );
  if ("hours" in rule) return validHours(rule.hours);
  if ("values" in rule) return Array.isArray(rule.values);
  if ("bounds" in rule)
    return (
      Array.isArray(rule.bounds) &&
      rule.bounds.length === 2 &&
      rule.bounds.every(b => Number.isFinite(rangeBreakTime(b)))
    );
  return false;
}

/**
    Reads a `rangeBreaks` setting — one rule, a list of them, or a falsy
    value — into the list of rules a time axis can use, dropping any it
    can't read.
*/
export function normalizeRangeBreaks(input: unknown): RangeBreakRule[] {
  if (!input) return [];
  const list = Array.isArray(input) ? input : [input];
  return list.filter(isRangeBreakRule);
}

/** Whether a rule draws a break marker (see `RangeBreakRule`). */
export const ruleMarker = (rule: RangeBreakRule): boolean =>
  typeof rule === "object" && typeof rule.marker === "boolean"
    ? rule.marker
    : typeof rule === "object" && "bounds" in rule;

/** The calendar days that touch `[lo, hi]`, each as its start and end. */
function eachDay(
  lo: number,
  hi: number,
  utc: boolean,
  fn: (start: Date, end: Date) => void,
): void {
  const interval = utc ? utcDay : timeDay;
  let day = interval.floor(new Date(lo));
  while (+day <= hi) {
    const next = interval.offset(day, 1);
    fn(day, next);
    day = next;
  }
}

/** A time `hours` into `day`, read on the wall clock (so DST shifts it). */
function atHour(day: Date, hours: number, utc: boolean): number {
  const out = new Date(+day);
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (utc) out.setUTCHours(h, m, 0, 0);
  else out.setHours(h, m, 0, 0);
  return +out;
}

/** The gaps one rule hides that overlap `[lo, hi]`, unsorted and unmerged. */
function ruleGaps(
  rule: RangeBreakRule,
  lo: number,
  hi: number,
  utc: boolean,
): [number, number][] {
  const out: [number, number][] = [];
  if (rule === "weekends" || "days" in rule) {
    const days = new Set(rule === "weekends" ? [0, 6] : rule.days);
    eachDay(lo, hi, utc, (start, end) => {
      if (days.has(utc ? start.getUTCDay() : start.getDay()))
        out.push([+start, +end]);
    });
  } else if ("hours" in rule) {
    const [from, to] = rule.hours;
    if (from === to) return out;
    // A wrapping window reaches into the day before `lo`.
    eachDay(lo - DAY, hi, utc, (start, end) => {
      const a = atHour(start, from, utc);
      const b = from < to ? atHour(start, to, utc) : atHour(end, to, utc);
      if (b > a) out.push([a, b]);
    });
  } else if ("values" in rule) {
    const interval = utc ? utcDay : timeDay;
    rule.values.forEach(v => {
      const t = rangeBreakTime(v);
      if (!Number.isFinite(t)) return;
      const day = interval.floor(new Date(t));
      out.push([+day, +interval.offset(day, 1)]);
    });
  } else {
    const [a, b] = rule.bounds.map(rangeBreakTime);
    if (a !== b) out.push(a < b ? [a, b] : [b, a]);
  }
  return out;
}

/**
    The stretches of time `rules` hide that overlap `[lo, hi]`: sorted,
    with overlapping and touching gaps merged (a merged gap draws a marker
    when any of its rules does). Gaps are not clipped to `[lo, hi]`.
    @param utc Read the calendar in UTC instead of local time.
*/
export function rangeBreakGaps(
  rules: RangeBreakRule[],
  lo: number,
  hi: number,
  utc = false,
): TimeGap[] {
  if (!(lo <= hi)) return [];
  const all = rules
    .flatMap(rule =>
      ruleGaps(rule, lo, hi, utc).map(([start, end]): TimeGap => ({
        start,
        end,
        marker: ruleMarker(rule),
      })),
    )
    .filter(g => g.end > lo && g.start <= hi)
    .sort((a, b) => a.start - b.start);
  const merged: TimeGap[] = [];
  for (const g of all) {
    const last = merged[merged.length - 1];
    if (last && g.start <= last.end) {
      last.end = Math.max(last.end, g.end);
      last.marker = last.marker || g.marker;
    } else merged.push({...g});
  }
  return merged;
}

/** The last gap starting at or before `t` (gaps sorted by start), or -1. */
export function gapIndex(gaps: TimeGap[], t: number): number {
  let lo = 0,
    hi = gaps.length - 1,
    found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (gaps[mid].start <= t) {
      found = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return found;
}

/**
    A test for whether a time between `lo` and `hi` is hidden by `rules`:
    the gaps are found once, so the test is cheap to run over many values.
    A time outside `[lo, hi]` is tested on its own.
*/
export function rangeBreakTest(
  rules: RangeBreakRule[],
  lo: number,
  hi: number,
  utc = false,
): (t: number | Date) => boolean {
  const gaps = rangeBreakGaps(rules, lo, hi, utc);
  return value => {
    const t = +value;
    if (!Number.isFinite(t)) return false;
    if (t < lo || t > hi) return isHiddenTime(rules, t, utc);
    const i = gapIndex(gaps, t);
    return i >= 0 && t < gaps[i].end;
  };
}

/** Whether `rules` hide the time `t`. */
export function isHiddenTime(
  rules: RangeBreakRule[],
  t: number | Date,
  utc = false,
): boolean {
  const n = +t;
  return rangeBreakGaps(rules, n, n, utc).some(g => g.start <= n && n < g.end);
}

/**
    The visible time between `a` and `b` (in ms, `a <= b`): their distance
    less every hidden stretch between them.
*/
export function visibleBetween(
  rules: RangeBreakRule[],
  a: number,
  b: number,
  utc = false,
): number {
  if (!(a < b)) return 0;
  const hidden = rangeBreakGaps(rules, a, b, utc).reduce(
    (s, g) => s + Math.max(0, Math.min(b, g.end) - Math.max(a, g.start)),
    0,
  );
  return b - a - hidden;
}

/**
    Whether `rules` hide all of time: a week (plus a day for DST) with no
    visible moment, which repeating rules then repeat forever.
*/
export function hidesAllTime(rules: RangeBreakRule[], utc = false): boolean {
  const t = Date.UTC(2001, 0, 1);
  return visibleBetween(rules, t, t + 8 * DAY, utc) <= 0;
}

/**
    The time `ms` of visible time after `t` (or before it, when `ms` is
    negative), stepping over every hidden stretch on the way. Rules that
    hide all of time leave `t` where it is.
*/
export function offsetVisible(
  rules: RangeBreakRule[],
  t: number,
  ms: number,
  utc = false,
): number {
  if (!ms || !Number.isFinite(ms) || hidesAllTime(rules, utc)) return t;
  const forward = ms > 0;
  let remaining = Math.abs(ms);
  let cur = t;
  let window = Math.max(remaining * 2, 7 * DAY);
  for (let pass = 0; pass < 32; pass++) {
    const lo = forward ? cur : cur - window;
    const hi = forward ? cur + window : cur;
    const gaps = rangeBreakGaps(rules, lo, hi, utc);
    for (const g of forward ? gaps : gaps.reverse()) {
      const free = forward ? g.start - cur : cur - g.end;
      // A step that ends where a gap starts lands on the gap's far side.
      if (free > 0 && (forward ? remaining < free : remaining <= free))
        return forward ? cur + remaining : cur - remaining;
      if (free > 0) remaining -= free;
      if (forward ? g.end > cur : g.start < cur)
        cur = forward ? g.end : g.start;
    }
    const free = forward ? hi - cur : cur - lo;
    if (free > 0 && remaining <= free)
      return forward ? cur + remaining : cur - remaining;
    if (free > 0) {
      remaining -= free;
      cur = forward ? hi : lo;
    }
    window *= 2;
  }
  return cur;
}
