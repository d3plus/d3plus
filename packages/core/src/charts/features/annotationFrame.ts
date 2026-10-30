/**
    Where annotation positions land in a Plot's pixels: values in data units
    map through the axis scales (dates parsed, categories matched), and
    `"plot"` positions read as fractions of the plot area.
*/
import {date} from "@d3plus/dom";

import type Axis from "../../components/Axis/Axis.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {AnnotationRef} from "./annotationTypes.js";
import type {PlotAxisFn} from "./plotPaint.js";

/** A Plot axis an annotation can position against. */
export type AnnotationAxis = "x" | "y" | "x2" | "y2";

/** The plot area, in the chart's content pixels. */
export interface PlotRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** One axis's mapping from data values to pixels. */
export interface AxisFrame {
  /** Maps a (parsed) value to its pixel position. */
  scale: (value: unknown) => number;
  /** Whether the axis plots dates, so values parse as dates. */
  time?: boolean;
  /** A category axis's categories, which values must match (or fall between, when numeric). */
  categories?: unknown[];
  /** Whether each category fills a slot along the axis (bars), which spans take in whole. */
  slots?: boolean;
}

/** The plot area and its axes, as annotations position against them. */
export interface AnnotationFrame {
  plot: PlotRect;
  axes: Partial<Record<AnnotationAxis, AxisFrame>>;
}

/** Whether an axis runs vertically. */
export const isVertical = (axis: AnnotationAxis): boolean => axis[0] === "y";

/** A comparable key for an axis value: a date's time, or the value's string. */
const valueKey = (v: unknown): string => (v instanceof Date ? `${+v}` : `${v}`);

/**
    The pixel position of `value` on `axis`, or NaN when it has none: the
    axis is missing, the value is not one of a category axis's categories,
    or it does not parse. A `"plot"` value is a fraction of the plot area
    (`0` at the left or bottom edge, `1` at the right or top).
    @param frame The plot area and its axes.
    @param axis The axis the value is on.
    @param value The value, in data units or as a fraction.
    @param ref How the value is read.
*/
export function axisPixel(
  frame: AnnotationFrame,
  axis: AnnotationAxis,
  value: unknown,
  ref: AnnotationRef = "data",
): number {
  if (value === undefined || value === null || value === "") return NaN;
  const {plot} = frame;
  if (ref === "plot") {
    const f = Number(value);
    if (!Number.isFinite(f)) return NaN;
    return isVertical(axis)
      ? plot.y1 - f * (plot.y1 - plot.y0)
      : plot.x0 + f * (plot.x1 - plot.x0);
  }
  const a = frame.axes[axis];
  if (!a) return NaN;
  const v = a.time ? date(value as string | number) : value;
  if (v === false || v === undefined) return NaN;
  if (a.categories) {
    const key = valueKey(v);
    if (!a.categories.some(c => valueKey(c) === key))
      return betweenCategories(a, v);
  }
  const px = a.scale(v);
  return typeof px === "number" && Number.isFinite(px) ? px : NaN;
}

/** A number for a numeric category or date, or NaN. */
const numeric = (v: unknown): number =>
  v instanceof Date ? +v : typeof v === "number" ? v : NaN;

/**
    The pixel position of a number (or date) that is not itself a category
    on an axis of numeric categories: interpolated between the categories on
    either side of it, or NaN outside them or among non-numeric categories.
    @param a The axis.
    @param value The value.
*/
export function betweenCategories(a: AxisFrame, value: unknown): number {
  const v = numeric(value);
  const cats = a.categories || [];
  if (!Number.isFinite(v) || !cats.length) return NaN;
  const points = cats
    .map(c => [numeric(c), a.scale(c)])
    .sort((p, q) => p[0] - q[0]);
  if (points.some(([n, px]) => !Number.isFinite(n) || !Number.isFinite(px)))
    return NaN;
  for (let i = 1; i < points.length; i++) {
    const [n0, p0] = points[i - 1],
      [n1, p1] = points[i];
    if (v >= n0 && v <= n1) return p0 + ((v - n0) / (n1 - n0)) * (p1 - p0);
  }
  return NaN;
}

/**
    Half the pixel distance between neighboring categories on a category
    axis whose categories fill slots (bars; half the plot's extent along it
    when it has one category), or `0` on any other axis.
    @param frame The plot area and its axes.
    @param axis The axis.
*/
export function categoryHalfStep(
  frame: AnnotationFrame,
  axis: AnnotationAxis,
): number {
  const a = frame.axes[axis];
  if (!a || !a.slots || !a.categories || !a.categories.length) return 0;
  const pixels = a.categories
    .map(c => a.scale(c))
    .filter(p => Number.isFinite(p))
    .sort((p, q) => p - q);
  let gap = Infinity;
  for (let i = 1; i < pixels.length; i++) {
    const d = pixels[i] - pixels[i - 1];
    if (d > 0.5 && d < gap) gap = d;
  }
  if (Number.isFinite(gap)) return gap / 2;
  const {plot} = frame;
  return (isVertical(axis) ? plot.y1 - plot.y0 : plot.x1 - plot.x0) / 2;
}

/**
    The pixel extent `[lo, hi]` between two values on an axis, or null when
    either has no position. On a category axis of bars it takes in each end
    category's whole slot.
    @param frame The plot area and its axes.
    @param axis The axis the values are on.
    @param values The two values.
    @param ref How the values are read.
*/
export function axisSpan(
  frame: AnnotationFrame,
  axis: AnnotationAxis,
  values: [unknown, unknown],
  ref: AnnotationRef = "data",
): [number, number] | null {
  const a = axisPixel(frame, axis, values[0], ref);
  const b = axisPixel(frame, axis, values[1], ref);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  const half = ref === "data" ? categoryHalfStep(frame, axis) : 0;
  return [Math.min(a, b) - half, Math.max(a, b) + half];
}

/**
    Clips a pixel extent to `[min, max]`, or null when nothing of it is left.
    @param span The extent.
    @param min The lower bound.
    @param max The upper bound.
*/
export function clipSpan(
  span: [number, number],
  min: number,
  max: number,
): [number, number] | null {
  const lo = Math.max(span[0], min),
    hi = Math.min(span[1], max);
  return hi - lo >= 0.5 ? [lo, hi] : null;
}

/**
    Whether a pixel point lies in the plot area, give or take `tolerance`.
    @param point The point.
    @param plot The plot area.
    @param tolerance Pixels of slack on each side.
*/
export function inPlot(
  [x, y]: [number, number],
  plot: PlotRect,
  tolerance = 0.5,
): boolean {
  return (
    x >= plot.x0 - tolerance &&
    x <= plot.x1 + tolerance &&
    y >= plot.y0 - tolerance &&
    y <= plot.y1 + tolerance
  );
}

/**
    The pixel position of an annotation row's anchor: its `x` (or `x2`, on
    that axis) and `y` (or `y2`), or NaN coordinates when it has none.
    @param frame The plot area and its axes.
    @param d The row.
    @param xRef How its x value is read.
    @param yRef How its y value is read.
*/
export function anchorPoint(
  frame: AnnotationFrame,
  d: Record<string, unknown>,
  xRef: AnnotationRef = "data",
  yRef: AnnotationRef = "data",
): [number, number] {
  const xAxis = d.x === undefined && d.x2 !== undefined ? "x2" : "x";
  const yAxis = d.y === undefined && d.y2 !== undefined ? "y2" : "y";
  return [
    axisPixel(frame, xAxis, d[xAxis], xRef),
    axisPixel(frame, yAxis, d[yAxis], yRef),
  ];
}

/** Category-like axis scales, whose values must match a category. */
const CATEGORY_SCALES = new Set(["band", "ordinal", "point"]);

/** The mapping frame of one rendered axis. */
function axisFrame(
  axis: Axis | undefined,
  scale: (value: unknown) => number,
  time: boolean,
  slots: boolean,
): AxisFrame | undefined {
  if (!axis || !axis._d3Scale) return undefined;
  const type = axis.schema.scale as string;
  const frame: AxisFrame = {scale, time: time || type === "time"};
  if (CATEGORY_SCALES.has(type)) {
    frame.categories = axis._d3Scale.domain();
    if (slots) frame.slots = true;
  }
  return frame;
}

/**
    The annotation frame of a painted Plot: its plot area in content pixels
    and its rendered axes. `x2`/`y2` are present only when the chart plots
    on them, and `slots` marks a bar chart, whose categories fill slots
    along its discrete axis.
    @param viz The chart.
    @param measured The axis functions and ranges `renderAxes` solved.
*/
export function plotAnnotationFrame(
  viz: VizInstance,
  measured: {
    x: PlotAxisFn;
    y: PlotAxisFn;
    xRange: number[];
    yRange: number[];
    x2Height: number;
    x2Exists?: boolean;
    y2Exists?: boolean;
    slots?: boolean;
  },
): AnnotationFrame {
  const {x, y, xRange, yRange, x2Height} = measured;
  const ys = [yRange[0], yRange[1]].map(v => v - x2Height);
  const plot: PlotRect = {
    x0: Math.min(xRange[0], xRange[1]),
    y0: Math.min(ys[0], ys[1]),
    x1: Math.max(xRange[0], xRange[1]),
    y1: Math.max(ys[0], ys[1]),
  };
  const discrete = viz.schema.discrete || "x";
  const slots = (axis: string): boolean =>
    !!measured.slots && axis[0] === discrete;
  const axes: AnnotationFrame["axes"] = {
    x: axisFrame(viz._xAxis, v => x(v), !!viz._xTime, slots("x")),
    y: axisFrame(viz._yAxis, v => y(v), !!viz._yTime, slots("y")),
  };
  if (measured.x2Exists)
    axes.x2 = axisFrame(
      viz._x2Axis,
      v => x(v, "x2"),
      !!viz._x2Time,
      slots("x2"),
    );
  if (measured.y2Exists)
    axes.y2 = axisFrame(
      viz._y2Axis,
      v => y(v, "y2"),
      !!viz._y2Time,
      slots("y2"),
    );
  return {plot, axes};
}
