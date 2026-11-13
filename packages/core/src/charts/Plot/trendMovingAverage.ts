/**
    Moving-average trend lines (`trendLine("movingAverage")`): a rolling mean
    through each series' points over `trendLineConfig.window` points, trailing
    or `center`ed, with bands `bandDeviations` standard deviations either side
    (Bollinger bands) unless `bands` is off. A moving average follows the
    data, so it draws no projection past it.
*/
import {movingAverage} from "@d3plus/math";
import type {MovingAverageResult} from "@d3plus/math";

import type {TrendSample, TrendSampling} from "./trendLines.js";

/**
    The `movingAverage` options a `trendLineConfig` asks for: its `window`,
    `center`, and the band width (`bandDeviations`, or 0 with `bands` off).
    @param config The `trendLineConfig`.
*/
export function movingAverageOptions(config: Record<string, unknown>) {
  const deviations = Number(config.bandDeviations ?? 2);
  return {
    window: Number(config.window ?? 5),
    center: Boolean(config.center),
    deviations:
      config.bands === false || !Number.isFinite(deviations) ? 0 : deviations,
  };
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
  const fit = movingAverage(points, movingAverageOptions(config));
  return fit ? {fit, samples: movingAverageSamples(fit, place)} : null;
}
