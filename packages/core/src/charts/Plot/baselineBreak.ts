/**
    Plot's side of axis breaks (see `components/Axis/axisBreak.ts`): the
    `xBreak`/`yBreak` and baseline-break config handed to each axis, whether a
    user-supplied domain should stay clear of the baseline, and the clamp
    that keeps bars inside the plot area.
*/
import {mergeConfig} from "../../fluent.js";
import {barSpanAxisConfig} from "./barWidth.js";
import {openEndAxisConfig, valueAxis} from "./baselineDomain.js";
import type {VizInstance} from "../viz/vizTypes.js";

/**
    A primary axis's user config (`xConfig`/`yConfig`) with the Plot's
    `xBreak`/`yBreak` folded in as the axis `break`, over any axis config the
    chart itself supplies (`_plotAxisDefaults`, and a variable-width axis's
    category labels). The break is always set, so
    clearing `yBreak` clears it from a reused axis; a `break` inside `yConfig`
    wins. When the user's domain leaves an end open, Plot hands the axis the
    domain with that end filled and rounded (see `openDomainEnds.ts`), so the
    axis gets no `rounding` or one-sided `domain` of the user's.
*/
export function plotAxisConfig(viz: VizInstance, axis: "x" | "y"): Record<string, unknown> {
  const brk = viz.schema[`${axis}Break`];
  const base = {break: brk === undefined ? false : brk};
  const user = openEndAxisConfig(viz, axis);
  const own = {...barSpanAxisConfig(viz, axis), ...viz._plotAxisDefaults?.[axis]};
  if (!Object.keys(own).length) return {...base, ...user};
  // The user's config deep-merges over the chart's, so a nested key keeps its
  // siblings; an unset (undefined) user key leaves the chart's value in place.
  const set = Object.fromEntries(Object.entries(user).filter(([, v]) => v !== undefined));
  return mergeConfig({...base, ...own}, set);
}

export {valueAxis};

/**
    The baseline-break settings for one of Plot's primary axes. Only the value
    axis can break; every other axis is told explicitly not to, so a reused
    axis instance never keeps a stale setting.
*/
export function baselineBreakAxisConfig(viz: VizInstance, axis: "x" | "y"): Record<string, unknown> {
  const on = Boolean(viz.schema.baselineBreak) && valueAxis(viz) === axis;
  const {baseline} = viz.schema;
  return typeof baseline === "number" ? {baseline, baselineBreak: on} : {baselineBreak: on};
}

/**
    Whether a user-supplied `xDomain`/`yDomain` deliberately stops short of the
    baseline on a breaking value axis. Plot then leaves the domain as given
    (rather than stretching it to the baseline) and the axis draws a break.
    `domain` is the user's domain once a set `baseline` has filled it in (see
    `userAxisDomain`); it defaults to the `xDomain`/`yDomain` as given.
*/
export function userDomainBreaksBaseline(
  viz: VizInstance,
  axis: string,
  configScale: string,
  domain: unknown[] | undefined = viz.schema[`${axis}Domain`],
): boolean {
  if (!viz.schema.baselineBreak || axis !== valueAxis(viz) || configScale !== "linear") return false;
  const {baseline} = viz.schema;
  if (typeof baseline !== "number" || !Array.isArray(domain)) return false;
  const [lo, hi] = domain;
  return (typeof lo === "number" && lo > baseline) || (typeof hi === "number" && hi < baseline);
}

/**
    `points` (in shape coordinates) with every value-axis coordinate that
    falls inside the value axis's baseline break moved onto the break's
    domain edge, so a label fitted to them sits in the plotted domain rather
    than across the break. Returns `points` itself when there's no baseline
    break.
*/
export function outsideBaselineBreak(viz: VizInstance, points: [number, number][]): [number, number][] {
  const vertical = valueAxis(viz) === "y";
  const brk = (vertical ? viz._yAxis : viz._xAxis)?._baselineBreak;
  const position = (vertical ? viz._yFunc : viz._xFunc) as ((v: unknown) => number) | undefined;
  if (!brk || !position) return points;
  const edge = position(brk.edge);
  const base = position(brk.value);
  if (!Number.isFinite(edge) || !Number.isFinite(base)) return points;
  const i = vertical ? 1 : 0;
  return points.map(p => {
    if ((p[i] - edge) * (base - edge) <= 0) return p;
    return vertical ? [p[0], edge] : [edge, p[1]];
  });
}

/**
    The pixel span of a Plot's value axis in shape coordinates, for clamping
    bars. Vertical positions carry the same `x2Height` shift the shape
    accessors apply.
*/
export function valueAxisExtent(
  viz: VizInstance,
  offsets: {x2Height: number; yOffset: number},
): [number, number] | undefined {
  const vertical = valueAxis(viz) === "y";
  const axis = vertical ? viz._yAxis : viz._xAxis;
  if (!axis || typeof axis._getRange !== "function") return undefined;
  const range = (axis._getRange() as number[]).map(Number);
  if (range.length < 2 || range.some(r => !Number.isFinite(r))) return undefined;
  // Bars nudge their ends up by `yOffset` (half the x-axis stroke) while
  // stacked segments don't, so the span allows both.
  const shift = vertical ? offsets.x2Height : 0;
  const nudge = vertical ? offsets.yOffset : 0;
  const lo = Math.min(range[0], range[range.length - 1]) - shift - nudge;
  const hi = Math.max(range[0], range[range.length - 1]) - shift;
  return [lo, hi];
}

type Accessor = (...args: unknown[]) => unknown;

/**
    Wraps a bar config's value-axis position accessors (`y`/`y0`/`y1`, or
    `x`/`x0`/`x1` for horizontal bars) so every position is clamped into
    `extent`. A domain that stops short of the data or the baseline then cuts
    bars off at the axis instead of painting them past it.
*/
export function clampBarConfig(
  config: Record<string, unknown>,
  axis: "x" | "y",
  extent: [number, number] | undefined,
): Record<string, unknown> {
  if (!extent) return config;
  const [lo, hi] = extent;
  const clamp = (v: unknown): unknown =>
    typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : v;
  const out = Object.assign({}, config);
  for (const key of [axis, `${axis}0`, `${axis}1`]) {
    const value = out[key];
    if (typeof value === "function") {
      const fn = value as Accessor;
      out[key] = function (this: unknown, ...args: unknown[]) {
        return clamp(fn.apply(this, args));
      };
    } else if (typeof value === "number") out[key] = clamp(value);
  }
  return out;
}
