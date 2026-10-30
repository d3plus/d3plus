/**
    A time axis's `rangeBreaks`: the axis swaps its time scale for a broken
    one that hides the rules' time, keeps hidden times out of its ticks and
    labels, and records each marked gap as an axis break so it draws the
    break marker (and, in a Plot, the break lines) like `break` does.
*/
import {timeDay} from "d3-time";
import {timeFormat} from "d3-time-format";

import {dateFormatter} from "@d3plus/format";

import type Axis from "./Axis.js";
import {breakStyle} from "./axisBreak.js";
import {brokenTimeScale, isBrokenTimeScale} from "./brokenTimeScale.js";
import {normalizeRangeBreaks} from "./rangeBreaks.js";
import {axisShownDates, axisTimeReference} from "./timeValues.js";

/**
    Replaces a time axis's scale with a broken time scale when it has
    `rangeBreaks`, and adds each marked gap inside the domain to
    `axis._breaks`. Marked gaps take `breakConfig.space` pixels each.
*/
export function applyAxisRangeBreaks(axis: Axis): void {
  const current = axis._d3Scale;
  if (axis.schema.scale !== "time" || !current) return;
  const rules = normalizeRangeBreaks(axis.schema.rangeBreaks);
  if (!rules.length) return;
  const {space, mask} = breakStyle(axis);
  const scale = brokenTimeScale(rules, {space});
  scale.domain(current.domain() as Date[]);
  scale.range(current.range());
  axis._d3Scale = scale;
  scale
    .gaps()
    .filter(g => g.space > 0)
    .forEach(g =>
      axis._breaks.push({
        start: g.start,
        end: g.end,
        startPosition: scale(g.start),
        endPosition: scale(g.end),
        baseline: false,
        mask,
      }),
    );
}

/** Drops the values a broken time axis hides (from its ticks or labels). */
export function visibleTimeValues(axis: Axis, values: unknown[]): unknown[] {
  const scale = axis._d3Scale;
  return isBrokenTimeScale(scale)
    ? values.filter(v => !scale.isHidden(Number(v)))
    : values;
}

/**
    The day a broken time axis's tick opens: when the tick is the first
    shown time of its day (everything from midnight up to it hidden, such
    as by an `hours` rule), that day's midnight, so the tick can be labeled
    as the day it starts. Otherwise `undefined`.
*/
export function rangeBreakOpenedDay(
  axis: Axis,
  value: unknown,
): Date | undefined {
  const scale = axis._d3Scale;
  const t = Number(value instanceof Date ? +value : value);
  if (!isBrokenTimeScale(scale) || !Number.isFinite(t)) return undefined;
  const start = timeDay.floor(new Date(t));
  if (+start === t) return undefined;
  return scale.visible(start, t) === 0 ? start : undefined;
}

/** The distinct days (as midnights, ascending) of a list of dates. */
export function datesDays(dates: Date[]): Date[] {
  const seen = new Set<number>();
  return dates
    .map(d => timeDay.floor(d))
    .filter(d => !seen.has(+d) && !!seen.add(+d))
    .sort((a, b) => +a - +b);
}

/**
    The day label for a broken time axis's ticks: given a tick that opens
    its day (see `rangeBreakOpenedDay`), the day, labeled among the axis's
    days in the current default time locale; given any other tick,
    `undefined`. The day formatter is built once per set of axis dates.
*/
export function rangeBreakDayLabel(
  axis: Axis,
): (value: unknown) => string | undefined {
  let memo:
    | {
        dates: Date[];
        format: typeof timeFormat;
        label: (d: Date, shown?: Date[]) => string;
      }
    | undefined;
  return value => {
    const day = rangeBreakOpenedDay(axis, value);
    if (!day) return undefined;
    const dates = axisTimeReference(axis);
    if (!memo || memo.dates !== dates || memo.format !== timeFormat)
      memo = {
        dates,
        format: timeFormat,
        label: dateFormatter(datesDays(dates), timeFormat),
      };
    return memo.label(day, axisShownDates(axis));
  };
}
