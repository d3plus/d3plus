/**
    A Plot's fixed aspect ratio (`aspectRatio`): one unit of y is drawn
    `aspectRatio` times as long as one unit of x, so the plot area shrinks
    along one side, centered, while the axes keep their domains.
*/
import type Axis from "../../components/Axis/Axis.js";
import {warnConfig} from "../../utils/configWarnings.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** The scales whose units are even along the axis (see `axisUnits`). */
const EVEN_SCALES = ["linear", "log", "time"];

/** How far a plot area shrinks along each side, in pixels. */
export interface AspectInset {
  x: number;
  y: number;
}

/**
    How many units an axis's domain spans for its aspect ratio: the
    difference of its ends on a linear or time axis (in milliseconds), the
    powers of ten between them on a log axis (one decade is one unit), or
    `undefined` on an axis with no even unit (a category, pow, or sqrt
    axis, or a log axis spanning zero).
    @param scale The axis's scale (`"linear"`, `"log"`, `"time"`, …).
    @param domain The ends of its domain.
*/
export function axisUnits(
  scale: string,
  domain: unknown[],
): number | undefined {
  const [a, b] = [domain[0], domain[domain.length - 1]].map(Number);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a === b) return undefined;
  if (!EVEN_SCALES.includes(scale)) return undefined;
  if (scale !== "log") return Math.abs(b - a);
  return a * b > 0
    ? Math.abs(Math.log10(Math.abs(b)) - Math.log10(Math.abs(a)))
    : undefined;
}

/**
    How far to shrink a plot area along x or y so one unit of y is drawn
    `ratio` times as long as one unit of x: only the side that is too long
    shrinks, the other keeps its length.
    @param units The units each axis's domain spans (see `axisUnits`).
    @param lengths The plot area's width (x) and height (y), in pixels.
    @param ratio The length of one y unit over one x unit.
*/
export function aspectInset(
  units: {x: number; y: number},
  lengths: {x: number; y: number},
  ratio: number,
): AspectInset {
  const kx = lengths.x / units.x;
  const ky = lengths.y / units.y;
  if (!(kx > 0) || !(ky > 0)) return {x: 0, y: 0};
  return ky > ratio * kx
    ? {x: 0, y: lengths.y - ratio * kx * units.y}
    : {x: lengths.x - (ky / ratio) * units.x, y: 0};
}

/**
    A Plot's `aspectRatio` when it holds one: a positive number, and the x
    and y axes both measure in even units (see `axisUnits`). Otherwise
    `undefined`, with a warning for a ratio it can't hold.
    @param viz The Plot.
    @param scales Each axis's scale, a category axis's as `"point"`.
*/
export function plotAspectRatio(
  viz: VizInstance,
  scales: {x: string; y: string},
): number | undefined {
  const ratio = viz.schema.aspectRatio as unknown;
  if (ratio === undefined || ratio === false || ratio === null)
    return undefined;
  if (typeof ratio !== "number" || !(ratio > 0) || !Number.isFinite(ratio)) {
    warnConfig(
      `Plot aspectRatio must be a positive number; received ${String(ratio)}.`,
    );
    return undefined;
  }
  const uneven = (["x", "y"] as const).filter(
    k => !EVEN_SCALES.includes(scales[k]),
  );
  if (uneven.length) {
    warnConfig(
      `Plot aspectRatio is ignored: the ${uneven.join(" and ")} axis has no even unit (its scale is ${uneven.map(k => `"${scales[k]}"`).join(" and ")}).`,
    );
    return undefined;
  }
  return ratio;
}

/**
    The units the x and y axes' drawn domains span (see `axisUnits`), read
    from the measured test axes, or `undefined` when either has none.
    @param axes The x and y test axes, measured against their ranges.
    @param scales Each axis's scale.
    @param fallback The domains of axes not measured (hidden).
*/
export function plotAxisUnits(
  axes: {x: Axis; y: Axis},
  scales: {x: string; y: string},
  fallback: {x: unknown[]; y: unknown[]},
): {x: number; y: number} | undefined {
  const domain = (axis: Axis, given: unknown[]) =>
    axis._d3Scale || axis._d3ScaleNegative ? axis._getDomain() : given;
  const x = axisUnits(scales.x, domain(axes.x, fallback.x));
  const y = axisUnits(scales.y, domain(axes.y, fallback.y));
  if (x === undefined || y === undefined) {
    if (scales.x === "log" || scales.y === "log")
      warnConfig(
        "Plot aspectRatio is ignored: a log axis whose domain spans zero has no even unit.",
      );
    return undefined;
  }
  return {x, y};
}
