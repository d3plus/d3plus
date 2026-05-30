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
    `_visibleTicks`, `_labelRotation`, `_tickUnit` — matching the side effects
    the original inline `Axis.render` body had. It also returns the local
    layout artifacts the paint phase consumes (`ticks`, `labels`, `range`,
    `textData`, `tickFormat`, `hBuff`, `wBuff`, `tickGet`, `labelHeight`,
    `bounds`) so callers can destructure those without re-reading them off
    the instance.

    This is the canonical v4 chart-as-data shape — Plot's test axes and any
    future "how much room does this axis need?" caller drives layout via
    pure data, no Axis class instance required (any object satisfying the
    duck-typed AxisLike shape works).
*/
/* eslint-disable @typescript-eslint/no-explicit-any */
import {max} from "d3-array";
import {timeFormatDefaultLocale} from "d3-time-format";

import {locale} from "@d3plus/locales";

import {
  applyTitleMargin,
  computeAxisBounds,
  computeBuffers,
  createTextData,
} from "./axisLayoutLabels.js";
import {buildTickFormat, setAxisScale} from "./axisLayoutScale.js";

/**
    Result of `measureAxis()`. Holds layout artifacts the paint phase of
    `Axis.render()` (and any caller that wants to construct a paint loop)
    needs to consume. Most layout state also mutates onto the input `axis`
    (`_d3Scale`, `_outerBounds`, `_margin`, etc.) so instance methods and
    callers reading those slots stay in sync.
*/
export interface AxisLayoutResult {
  ticks: any[];
  labels: any[];
  range: number[];
  textData: any[];
  tickFormat: (d: any) => string;
  hBuff: number;
  wBuff: number;
  tickGet: (d: any, i?: number) => any;
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
export function measureAxis(axis: any): AxisLayoutResult {
  const timeLocaleObj =
    axis.schema.timeLocale || locale[axis.schema.locale] || locale["en-US"];
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

  let labels: any[] = [], range: any[] = [], ticks: any[] = [];

  const tickFormat = buildTickFormat(axis, timeLocaleObj, () => ticks);

  ({range, ticks, labels} = setAxisScale(axis, rangeOuter, tickGet));

  applyTitleMargin(axis, {range, p, height, margin});

  const {hBuff, wBuff} = computeBuffers(axis, ticks, tickGet, height);

  let textData = createTextData(axis, {labels, rangeOuter, horizontal, hBuff, p, tickFormat});
  const offsetEnabled =
    axis.schema.labelOffset && textData.some((d: any) => d.truncated);
  if (offsetEnabled)
    textData = createTextData(axis, {labels, rangeOuter, horizontal, hBuff, p, tickFormat, offset: 2});

  const spillovers = [0, 1].map((index: number) => {
    const datum = textData[index ? textData.length - 1 : 0];
    if (!datum) return 0;
    const {height: dHeight, position, rotate, width: dWidth} = datum;
    const compPosition = index ? rangeOuter[1] : rangeOuter[0];
    const halfSpace = (rotate || !horizontal ? dHeight : dWidth) / 2;
    if (Math.abs(position - compPosition) >= halfSpace) return 0;
    const spill = halfSpace - (position - compPosition);
    return Math.abs(spill);
  });

  const [first, last] = range;
  const newRange = [first + spillovers[0], last - spillovers[1]];
  if (axis.schema.range) {
    if (axis.schema.range[0] !== undefined) newRange[0] = axis.schema.range[0];
    if (axis.schema.range[axis.schema.range.length - 1] !== undefined)
      newRange[1] = axis.schema.range[axis.schema.range.length - 1];
  }

  if (newRange[0] !== first || newRange[1] !== last) {
    ({range, ticks, labels} = setAxisScale(axis, rangeOuter, tickGet, newRange));
    textData = createTextData(axis, {labels, rangeOuter, horizontal, hBuff, p, tickFormat, offset: offsetEnabled ? 2 : 1});
  }

  const labelHeight = max(textData, (t: any) => t.height) || 0;
  axis._labelRotation =
    horizontal && axis._labelRotation === undefined
      ? textData.some((datum: any) => {
          const {i, height: dH, position, truncated} = datum;
          const prev = textData[i - 1];
          return (
            truncated ||
            (i && prev.position + prev.height / 2 > position - dH / 2)
          );
        })
      : axis._labelRotation;

  const globalOffset = axis.schema.labelOffset
    ? max(textData, (d: any) => d.offset || 0)
    : 0;
  textData.forEach(
    (datum: any) => (datum.offset = datum.offset ? globalOffset : 0),
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
