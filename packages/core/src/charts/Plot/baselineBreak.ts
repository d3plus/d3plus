/**
    Plot's side of the baseline axis break (see `components/Axis/axisBreak.ts`):
    which axis may break, the config handed to that axis, whether a
    user-supplied domain should stay clear of the baseline, and the clamp
    that keeps bars inside the plot area.
*/
import type {VizInstance} from "../viz/vizTypes.js";

/** The value (non-discrete) axis of a Plot. */
export const valueAxis = (viz: VizInstance): "x" | "y" =>
  viz.schema.discrete === "y" ? "x" : "y";

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
*/
export function userDomainBreaksBaseline(viz: VizInstance, axis: string, configScale: string): boolean {
  if (!viz.schema.baselineBreak || axis !== valueAxis(viz) || configScale !== "linear") return false;
  const {baseline} = viz.schema;
  const domain = viz.schema[`${axis}Domain`] as unknown[] | undefined;
  if (typeof baseline !== "number" || !Array.isArray(domain)) return false;
  const [lo, hi] = domain;
  return (typeof lo === "number" && lo > baseline) || (typeof hi === "number" && hi < baseline);
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
