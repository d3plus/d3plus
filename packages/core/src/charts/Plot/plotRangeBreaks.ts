/**
    A Plot's side of time-axis `rangeBreaks`: rows whose time the axis
    hides are left out of the drawing (with a warning), and the pipeline's
    own time scales hide the same time as the axes do, so shape padding is
    measured in the time that stays visible.
*/
import {extent} from "d3-array";

import {breakStyleOf} from "../../components/Axis/axisBreak.js";
import {brokenTimeScale} from "../../components/Axis/brokenTimeScale.js";
import {
  normalizeRangeBreaks,
  rangeBreakTest,
  rangeBreakTime,
  type RangeBreakRule,
} from "../../components/Axis/rangeBreaks.js";
import type {D3Scale} from "../../utils/index.js";
import {warnConfigOnce} from "../../utils/configWarnings.js";
import type {TransformStage} from "../pipeline/stages.js";

/** The viz a Plot pipeline stage reads. */
type PlotViz = Parameters<TransformStage>[0]["viz"];

/** The axes a Plot can draw time on. */
const AXES = ["x", "x2", "y", "y2"] as const;
/** One of a Plot's four axes. */
export type AxisName = (typeof AXES)[number];

/** An axis's `rangeBreaks` rules, from its axis config, when it plots time. */
export function plotRangeBreaks(
  viz: PlotViz,
  axis: AxisName,
): RangeBreakRule[] {
  const config = viz[`_${axis}Config`] as Record<string, unknown> | undefined;
  if (!viz[`_${axis}Time`] && config?.scale !== "time") return [];
  return normalizeRangeBreaks(config?.rangeBreaks);
}

/**
    Whether an axis's `rangeBreaks` make it a time axis without `time`: the
    axis config has rules, and `value` (the first row's) reads as a date — a
    Date, a timestamp, or a date string.
*/
export function rangeBreaksTimeAxis(
  viz: PlotViz,
  axis: AxisName,
  value: unknown,
): boolean {
  const config = viz[`_${axis}Config`] as Record<string, unknown> | undefined;
  if (!normalizeRangeBreaks(config?.rangeBreaks).length) return false;
  if (value instanceof Date) return !isNaN(+value);
  if (typeof value === "number" && String(Math.abs(value)).length <= 5)
    return false;
  return (
    (typeof value === "string" || typeof value === "number") &&
    Number.isFinite(rangeBreakTime(value))
  );
}

/**
    The `rangeBreaks` a chart's timeline takes by default: those of the axis
    that plots the chart's `time` values (the first row's time equals that
    axis's value), else none.
*/
export function timelineRangeBreaks(viz: PlotViz): RangeBreakRule[] {
  const row = viz._data?.[0];
  const time = viz.schema.time as
    ((d: unknown, i: number) => unknown) | undefined;
  if (!row || typeof time !== "function") return [];
  const value = time(row, 0);
  for (const axis of AXES) {
    const read = viz[`_${axis}`] as
      ((d: unknown, i: number) => unknown) | undefined;
    if (typeof read !== "function" || read(row, 0) !== value) continue;
    const config = viz[`_${axis}Config`] as Record<string, unknown> | undefined;
    const rules = normalizeRangeBreaks(config?.rangeBreaks);
    if (rules.length) return rules;
  }
  return [];
}

/** A plotted time value as a timestamp (`NaN` when it isn't one). */
const timeOf = (v: unknown): number =>
  v instanceof Date || typeof v === "number" ? +v : NaN;

/**
    The rows to draw: those whose time every time axis shows. Rows inside
    an axis's `rangeBreaks` are dropped, with a warning naming the axis.
*/
export function dropHiddenRows<T extends Record<string, unknown>>(
  viz: PlotViz,
  rows: T[],
): T[] {
  let out = rows;
  AXES.forEach(axis => {
    const rules = plotRangeBreaks(viz, axis);
    if (!rules.length || !out.length) return;
    const times = out.map(d => timeOf(d[axis])).filter(Number.isFinite);
    if (!times.length) return;
    const [lo, hi] = extent(times) as [number, number];
    const hidden = rangeBreakTest(rules, lo, hi);
    const kept = out.filter(d => !hidden(timeOf(d[axis])));
    if (kept.length < out.length)
      warnConfigOnce(
        viz,
        `rangeBreaks-${axis}`,
        `Some data falls inside ${axis}Config.rangeBreaks and is not drawn.`,
      );
    out = kept;
  });
  return out;
}

/**
    A Plot pipeline scale for `axis`: a broken time scale over the same
    domain and range when the axis plots time with `rangeBreaks`, else the
    scale as given.
*/
export function plotTimeScale(
  viz: PlotViz,
  axis: AxisName,
  scale: D3Scale,
): D3Scale {
  const rules = plotRangeBreaks(viz, axis);
  if (!rules.length) return scale;
  const config = viz[`_${axis}Config`] as Record<string, unknown> | undefined;
  const {space} = breakStyleOf(config?.breakConfig);
  const broken = brokenTimeScale(rules, {space});
  broken.domain(scale.domain() as Date[]);
  broken.range(scale.range());
  return broken;
}
