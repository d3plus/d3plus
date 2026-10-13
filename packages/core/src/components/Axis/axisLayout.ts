/**
    Standalone axis layout function. Given an `Axis`-shaped object (or any
    plain object with the same fields), computes the axis's scale, tick
    layout, label sizing, and `outerBounds` with **zero DOM access**. Used by
    both `Axis.render()` (which then runs a paint phase against the result)
    and `Axis.measure()` (which returns immediately).

    Config is read from `axis.schema.<key>` (the `installFluent` storage);
    scratch state (`_d3Scale`, `_margin`, `_position`, etc.) reads and writes
    `axis._<key>` directly.

    The function mutates the input `axis` to populate `_d3Scale`,
    `_d3ScaleNegative`, `_outerBounds`, `_margin`, `_availableTicks`,
    `_visibleTicks`, `_labelRotation`, `_tickUnit`, `_labelFormat` — matching
    the side effects the original inline `Axis.render` body had. It also
    returns the local layout artifacts the paint phase consumes (`ticks`,
    `labels`, `range`, `textData`, `tickFormat`, `hBuff`, `wBuff`, `tickGet`,
    `labelHeight`, `bounds`) so callers can destructure those without
    re-reading them off the instance.

    This is the canonical v4 chart-as-data shape — Plot's test axes and any
    future "how much room does this axis need?" caller drives layout via
    pure data, no Axis class instance required (any object satisfying the
    duck-typed AxisLike shape works).
*/
import {max} from "d3-array";
import {timeFormatDefaultLocale} from "d3-time-format";

import type Axis from "./Axis.js";
import {
  applyTitleMargin,
  computeAxisBounds,
  computeBuffers,
  createTextData,
  isDiscreteScale,
} from "./axisLayoutLabels.js";
import type {AxisTextDatum, TickGet} from "./axisLayoutLabels.js";
import {buildTickFormat, setAxisScale} from "./axisLayoutScale.js";
import {axisScaleData, axisTimeLocale} from "./timeValues.js";

/**
    Result of `measureAxis()`. Holds layout artifacts the paint phase of
    `Axis.render()` (and any caller that wants to construct a paint loop)
    needs to consume. Most layout state also mutates onto the input `axis`
    (`_d3Scale`, `_outerBounds`, `_margin`, etc.) so instance methods and
    callers reading those slots stay in sync.
*/
export interface AxisLayoutResult {
  ticks: unknown[];
  labels: unknown[];
  range: number[];
  textData: AxisTextDatum[];
  tickFormat: (d: unknown) => string;
  hBuff: number;
  wBuff: number;
  tickGet: TickGet;
  labelHeight: number;
  bounds: Record<string, number>;
}

/**
    The standalone axis layout pass. Accepts any object satisfying the
    Axis-instance shape (the production `Axis` class is the canonical input).
    Pure compute — no DOM, no rendering. Mutates the input to set
    `_d3Scale`/`_outerBounds`/`_margin`/etc. for callers that read those off
    the instance afterward.
*/
export function measureAxis(axis: Axis): AxisLayoutResult {
  const timeLocaleObj = axisTimeLocale(axis);
  timeFormatDefaultLocale(
    timeLocaleObj as Parameters<typeof timeFormatDefaultLocale>[0],
  );

  const {width, height, x, y, horizontal, opposite} = axis._position,
    p = axis.schema.padding,
    rangeOuter = [p, (axis.schema[width] as number) - p];

  const tickValue =
    axis.schema.shape === "Circle"
      ? axis.schema.shapeConfig.r
      : axis.schema.shape === "Rect"
        ? axis.schema.shapeConfig[width]
        : axis.schema.shapeConfig.strokeWidth;
  const tickGet =
    typeof tickValue !== "function" ? () => tickValue : tickValue;

  const margin: Record<string, number> = (axis._margin = {top: 0, right: 0, bottom: 0, left: 0});
  axis._scaleData = axisScaleData(axis);

  let labels: unknown[] = [], range: number[] = [], ticks: unknown[] = [];

  const tickFormat = buildTickFormat(axis, timeLocaleObj, () => ticks);
  axis._labelFormat = tickFormat;

  // Rebuilds the scale (over `newRange`, else the configured range) and
  // keeps the ticks the formatter reads in step with it.
  const rescale = (newRange?: number[]) =>
    ({range, ticks, labels} = setAxisScale(axis, rangeOuter, tickGet, newRange));
  rescale();

  applyTitleMargin(axis, {range, p, height, margin});

  const {hBuff, wBuff} = computeBuffers(axis, ticks, tickGet, height);

  const labelCtx = {rangeOuter, horizontal, hBuff, p, tickFormat, rescale};
  const setting = axis._labelRotationSetting;
  axis._labelRotation = setting ?? false;
  let textData = layoutLabels(axis, {range, labels}, labelCtx);

  // Left to decide, a horizontal axis of categories rotates its labels when
  // that leaves fewer of them cut short or hidden.
  if (setting === undefined && horizontal && rotatesLabels(axis, labels, tickFormat)) {
    const misses = labelMisses(textData);
    if (misses) {
      axis._labelRotation = true;
      textData = layoutLabels(axis, rescale(), labelCtx);
      if (labelMisses(textData) >= misses) {
        axis._labelRotation = false;
        textData = layoutLabels(axis, rescale(), labelCtx);
      }
    }
  }

  // The ticks whose labels the layout hides no longer count as visible.
  const hidden = new Set(textData.filter((t: AxisTextDatum) => t.truncated).map((t: AxisTextDatum) => t.d));
  if (hidden.size) axis._visibleTicks = ticks.filter((t: unknown) => !hidden.has(t));

  const labelHeight = max(textData, (t: AxisTextDatum) => t.height) || 0;

  const globalOffset = axis.schema.labelOffset
    ? max(textData, (d: AxisTextDatum) => d.offset || 0)
    : 0;
  textData.forEach(
    (datum: AxisTextDatum) => (datum.offset = datum.offset ? globalOffset : 0),
  );

  const bounds = computeAxisBounds(axis, {textData, rangeOuter, hBuff, horizontal, p, width, height, x, y, opposite, margin});

  return {
    ticks,
    labels,
    range,
    textData,
    tickFormat,
    hBuff,
    wBuff,
    tickGet,
    labelHeight,
    bounds,
  };
}

/**
    Measures every label against the axis and narrows the range by however
    far the first and last labels reach past its ends, rebuilding the scale
    over the narrowed range and measuring again. Reads `axis._labelRotation`
    for the labels' orientation.
*/
function layoutLabels(
  axis: Axis,
  scale: {range: number[]; labels: unknown[]},
  ctx: {
    rangeOuter: number[];
    horizontal: boolean;
    hBuff: number;
    p: number;
    tickFormat: (d: unknown) => string;
    rescale: (newRange?: number[]) => {range: number[]; labels: unknown[]};
  },
): AxisTextDatum[] {
  const {rangeOuter, horizontal, hBuff, p, tickFormat, rescale} = ctx;
  let {labels} = scale;

  let textData = createTextData(axis, {labels, rangeOuter, horizontal, hBuff, p, tickFormat});
  const offsetEnabled =
    axis.schema.labelOffset && textData.some((d: AxisTextDatum) => d.truncated);
  if (offsetEnabled)
    textData = createTextData(axis, {labels, rangeOuter, horizontal, hBuff, p, tickFormat, offset: 2});

  const spillovers = [0, 1].map((index: number) => {
    const datum = textData[index ? textData.length - 1 : 0];
    if (!datum) return 0;
    const {height: dHeight, position, rotate, width: dWidth} = datum;
    const compPosition = index ? rangeOuter[1] : rangeOuter[0];
    const halfSpace = (rotate || !horizontal ? dHeight : dWidth) / 2;
    // Room between the label's tick and the end of the range it faces.
    const room = index ? compPosition - position : position - compPosition;
    return room >= halfSpace ? 0 : halfSpace - room;
  });

  const [first, last] = scale.range;
  const newRange = [first + spillovers[0], last - spillovers[1]];
  if (axis.schema.range) {
    if (axis.schema.range[0] !== undefined) newRange[0] = axis.schema.range[0];
    if (axis.schema.range[axis.schema.range.length - 1] !== undefined)
      newRange[1] = axis.schema.range[axis.schema.range.length - 1];
  }

  if (newRange[0] !== first || newRange[1] !== last) {
    ({labels} = rescale(newRange));
    textData = createTextData(axis, {labels, rangeOuter, horizontal, hBuff, p, tickFormat, offset: offsetEnabled ? 2 : 1});
  }

  return textData;
}

/**
    Whether the axis may rotate its labels on its own: one label per category
    naming things rather than numbers or dates, which read in sequence even
    with every other one left out. That's a discrete scale's values, or a
    continuous axis labeled at a given list of values whose formatted text
    names them (a variable-width bar axis, see `Plot/barWidth.ts`).
*/
export function rotatesLabels(
  axis: Axis,
  labels: unknown[],
  tickFormat?: (d: unknown) => string,
): boolean {
  const named = (d: unknown) => !(d instanceof Date) && isNaN(d as number);
  if (isDiscreteScale(axis.schema.scale)) return labels.some(named);
  return Array.isArray(axis.schema.labels) && !!tickFormat &&
    labels.some((d: unknown) => named(tickFormat(d)));
}

/** How many labels don't fit whole, or are hidden to make room for others. */
export function labelMisses(textData: AxisTextDatum[]): number {
  return textData.filter((t: AxisTextDatum) => !t.fits || t.truncated).length;
}
