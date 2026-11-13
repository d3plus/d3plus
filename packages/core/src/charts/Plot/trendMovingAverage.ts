/**
    Moving-average trend lines (`trendLine("movingAverage")`): a rolling mean
    through each series' points over `trendLineConfig.window` (a number of
    points, or on a time axis a span of time such as `{days: 30}`), trailing
    or `center`ed, with bands `bands` standard deviations either side
    (Bollinger bands) unless `bands` is off. A moving average follows the
    data, so it draws no projection past it.
*/
import {movingAverage} from "@d3plus/math";
import type {MovingAverageOptions, MovingAverageResult} from "@d3plus/math";
import {
  timeDay,
  timeHour,
  timeMinute,
  timeMonth,
  timeSecond,
  timeWeek,
  timeYear,
} from "d3-time";
import type {CountableTimeInterval} from "d3-time";

import {warnConfigOnce} from "../../utils/configWarnings.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {TrendSample, TrendSampling} from "./trendLines.js";

/** How many points a moving average spans by default. */
export const DEFAULT_WINDOW = 7;

/** How many standard deviations wide the bands are by default (`bands: true`). */
export const DEFAULT_BANDS = 2;

/** The units a `window` span takes, and the calendar interval each steps by. */
export const WINDOW_UNITS: Record<string, CountableTimeInterval> = {
  years: timeYear,
  months: timeMonth,
  weeks: timeWeek,
  days: timeDay,
  hours: timeHour,
  minutes: timeMinute,
  seconds: timeSecond,
};

/**
    The span of time a `window` sets, as `[unit, count]` pairs (largest unit
    first, positive counts only); empty when the window is a number of
    points, or names no unit.
    @param window The `trendLineConfig.window` setting.
*/
export function windowSpan(window: unknown): [string, number][] {
  if (!window || typeof window !== "object") return [];
  const spec = window as Record<string, unknown>;
  return Object.keys(WINDOW_UNITS)
    .map((unit): [string, number] => [unit, Number(spec[unit])])
    .filter(([, count]) => Number.isFinite(count) && count > 0);
}

/**
    Where the span ending at a timestamp starts: the timestamp stepped back
    by each part of the span, on the calendar.
    @param span The span, from `windowSpan`.
*/
export function windowSpanStart(span: [string, number][]) {
  return (x: number): number =>
    +span.reduce(
      (date, [unit, count]) => WINDOW_UNITS[unit].offset(date, -count),
      new Date(x),
    );
}

/**
    The band width `bands` sets, in standard deviations: `true` (or unset)
    is 2, a positive number is itself, and anything else (`false`) is 0, no
    bands.
    @param bands The `trendLineConfig.bands` setting.
*/
export function bandDeviations(bands: unknown): number {
  if (bands === true || bands === undefined) return DEFAULT_BANDS;
  return typeof bands === "number" && bands > 0 ? bands : 0;
}

/**
    Warns, once per chart, when a `window` span of time is set on an axis
    that isn't a time axis, where the average falls back to the default
    number of points. Returns whether it applies.
    @param viz The chart.
    @param config The `trendLineConfig`.
    @param time Whether the axis the average runs along is a time axis.
*/
export function warnSpanOffTime(
  viz: object,
  config: Record<string, unknown>,
  time: boolean,
): boolean {
  if (time || !windowSpan(config.window).length) return false;
  warnConfigOnce(
    viz,
    "trendLineConfig.window span",
    `trendLineConfig.window: a span of time (such as {days: 30}) needs a time axis; averaging ${DEFAULT_WINDOW} points instead.`,
  );
  return true;
}

/**
    The `movingAverage` options a `trendLineConfig` asks for: its `window`
    (a span of time, on a time axis, or a number of points), `center`, and
    the band width.
    @param config The `trendLineConfig`.
    @param time Whether the axis it runs along is a time axis; a span on any
    other axis falls back to the default number of points.
*/
export function movingAverageOptions(
  config: Record<string, unknown>,
  time = false,
): MovingAverageOptions {
  const span = windowSpan(config.window);
  const points = Number(config.window);
  const options: MovingAverageOptions = {
    window: Number.isFinite(points) && points > 0 ? points : DEFAULT_WINDOW,
    center: Boolean(config.center),
    deviations: bandDeviations(config.bands),
  };
  if (time && span.length) options.span = windowSpanStart(span);
  return options;
}

/** A whole or fractional count in a locale, such as "30" or "1.5". */
export function countText(n: number, locale: unknown): string {
  try {
    return new Intl.NumberFormat(
      typeof locale === "string" ? locale : "en-US",
      {maximumFractionDigits: 2},
    ).format(n);
  } catch {
    return `${n}`;
  }
}

/**
    A moving average's window as text, translated: its number of points
    (such as "7"), or the span of time it covers (such as "30 days").
    @param viz The chart.
    @param fit The moving average.
*/
export function movingAverageWindowText(
  viz: Pick<VizInstance, "schema"> & {
    _trendLineConfig?: Record<string, unknown>;
  },
  fit: Pick<MovingAverageResult, "window" | "spanned">,
): string {
  const locale = viz.schema.locale;
  if (!fit.spanned) return countText(fit.window, locale);
  return windowSpan(viz._trendLineConfig?.window)
    .map(
      ([unit, count]) =>
        `${countText(count, locale)} ${viz.schema.translate(
          count === 1 ? unit.slice(0, -1) : unit,
        )}`,
    )
    .join(" ");
}

/**
    The samples a moving average draws: one at each point with a full window,
    with its band (`lci`/`hci`) when the bands have width. On a log axis,
    points at or below 0 drop out, and the bands do too if any would reach 0.
    @param fit The moving average.
    @param place The sampling axis and scale.
*/
export function movingAverageSamples(
  fit: MovingAverageResult,
  place: TrendSampling,
): TrendSample[] {
  const {axis, fromNumber, logDep} = place;
  const dep = axis === "x" ? "y" : "x";
  const points = fit.points.filter(p => !logDep || p.mean > 0);
  const banded =
    fit.deviations > 0 && !(logDep && points.some(p => p.lower <= 0));
  return points.map(p => {
    const sample = {
      [axis]: fromNumber(p.x),
      [dep]: p.mean,
    } as unknown as TrendSample;
    if (banded) [sample.lci, sample.hci] = [p.lower, p.upper];
    return sample;
  });
}

/**
    Fits a moving average to one set of points and samples it; null when no
    point has a full window.
    @param points The `[x, y]` points.
    @param config The `trendLineConfig`.
    @param place The sampling axis and scale.
*/
export function fitMovingAverage(
  points: [number, number][],
  config: Record<string, unknown>,
  place: TrendSampling,
): {fit: MovingAverageResult; samples: TrendSample[]} | null {
  const fit = movingAverage(
    points,
    movingAverageOptions(config, Boolean(place.time)),
  );
  return fit ? {fit, samples: movingAverageSamples(fit, place)} : null;
}
