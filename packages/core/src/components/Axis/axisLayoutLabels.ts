/**
    Label/text layout helpers for `measureAxis` (see `axisLayout.ts`). Pure
    compute — no DOM. `createTextData` measures every label via `textWrap`,
    resolves truncation/offset, and returns the `textData` array the paint
    phase consumes; `computeAxisBounds` derives `_outerBounds` + margins.
*/
import {max} from "d3-array";

import {fontFamily as d3plusFontFamily} from "@d3plus/text";

import type Axis from "./Axis.js";
import {labelLineHeight} from "./axisLabelLineHeight.js";
import {titleRoom} from "./axisTitle.js";
import {fitLabelRoom} from "./axisLabelRoom.js";
import {slantedDepth, slantedWrapSize} from "./axisLabelAngle.js";
import {
  isDiscreteScale,
  ownLabelSpaces,
  wholeLineLabels,
} from "./axisLabelKinds.js";
import {calculateLabelSize, labelRoom} from "./axisLabelSize.js";
import type {LabelLayoutCtx, LabelSize} from "./axisLabelSize.js";
import {slantedLineWidth, slantedLines} from "./axisSlantWrap.js";
import {
  fitOwnSpaces,
  regrowShown,
  thinEvenly,
  thinGreedily,
  thinGreedilyShown,
} from "./axisLabelThinning.js";

export {
  isDiscreteScale,
  ownLabelSpaces,
  wholeLineLabels,
} from "./axisLabelKinds.js";

/** Resolves a tick's pixel size from the shape config (or a constant). */
export type TickGet = (
  d?: {tick?: boolean; id?: unknown},
  i?: number,
) => number;

/**
    One measured axis label. Built incrementally: the base fields come from the
    label-mapping pass, `space`/`lines`/`widths`/`width`/`height` are filled by
    `calculateLabelSize`, and `truncated`/`offset` by the collision passes.
*/
export interface AxisTextDatum {
  d: unknown;
  i: number;
  fF: string;
  fP: number;
  fS: number;
  /** The label's line height, measured and painted (see `labelLineHeight`). */
  lineHeight: number;
  position: number;
  rotate?: boolean;
  /** The degrees a rotated label turns (see `labelRotation`), 0 when flat. */
  angle?: number;
  /** Whether the label is laid out at its angle (see `settingTurn`). */
  slant?: boolean;
  space: number;
  lines: string[];
  widths: number[];
  width: number;
  height: number;
  /**
      Whether the whole label fits its share of the axis: no word dropped or
      cut off, and none broken across lines with a hyphen.
  */
  fits: boolean;
  /** Whether the label is drawn cut short mid-word (see `cutLabel`). */
  cut?: boolean;
  /** Whether the overlap pass hides the label to make room for its neighbors. */
  truncated?: boolean;
  offset?: number;
  /**
      The width a flat label on a vertical axis wraps in, and is painted in
      (see `fitLabelRoom`); unset, it wraps in all the room the axis allows.
  */
  room?: number;
}

/**
    Applies the axis title's wrapped height to the orient-side margin, as
    the title TextBox draws it across `range` (see `titleRoom`). Given the
    range it was `measured` across before, it measures again only when the
    range has changed. Returns the range measured across.
*/
export function applyTitleMargin(
  axis: Axis,
  ctx: {
    range: number[];
    p: number;
    height: string;
    margin: Record<string, number>;
    measured?: number[];
  },
): number[] {
  const {range, p, height, margin, measured} = ctx;
  const same =
    measured &&
    measured[0] === range[0] &&
    measured[measured.length - 1] === range[range.length - 1];
  if (!axis.schema.title || same) return range;
  margin[axis.schema.orient] = titleRoom(
    axis,
    range,
    (axis.schema[height] as number) - axis.schema.tickSize - p * 2,
  );
  return range;
}

/** Resolves the tick height/width buffers from the shape config. */
export function computeBuffers(
  axis: Axis,
  _ticks: unknown[],
  tickGet: TickGet,
  height: string,
): {hBuff: number; wBuff: number} {
  // The ternary and `tickGet` already resolve per-tick functions to a single
  // value, so both buffers are numbers by here.
  let hBuff: number =
    axis.schema.shape === "Circle"
      ? typeof axis.schema.shapeConfig.r === "function"
        ? axis.schema.shapeConfig.r({tick: true})
        : axis.schema.shapeConfig.r
      : axis.schema.shape === "Rect"
        ? typeof axis.schema.shapeConfig[height] === "function"
          ? axis.schema.shapeConfig[height]({tick: true})
          : axis.schema.shapeConfig[height]
        : axis.schema.tickSize;
  let wBuff: number = tickGet({tick: true});

  if (axis.schema.shape === "Rect") hBuff /= 2;
  if (axis.schema.shape !== "Circle") wBuff /= 2;

  return {hBuff, wBuff};
}

/** Assigns vertical offsets to alternating labels that would overlap. */
function calculateOffset(arr: AxisTextDatum[] = [], horizontal: boolean): void {
  let offset = 0;
  arr.forEach((datum: AxisTextDatum) => {
    const prev = arr[datum.i - 1];
    const h =
        (datum.rotate && horizontal) || (!datum.rotate && !horizontal)
          ? "width"
          : "height",
      w =
        (datum.rotate && horizontal) || (!datum.rotate && !horizontal)
          ? "height"
          : "width";

    if (!prev) {
      offset = 1;
    } else if (prev.position + prev[w] / 2 > datum.position - datum[w] / 2) {
      if (offset) {
        datum.offset = prev[h];
        offset = 0;
      } else offset = 1;
    }
  });
}

/**
    Each label's base record (its font, padding, line height, and position),
    before `createTextData` measures it.
*/
function baseTextData(axis: Axis, labels: unknown[]): AxisTextDatum[] {
  const {fontSize} = axis.schema.shapeConfig.labelConfig;
  const fontFamilyConfig =
    axis.schema.shapeConfig.labelConfig.fontFamily || d3plusFontFamily;
  const fontPadding = axis.schema.shapeConfig.labelConfig.padding;

  const angle = axis._labelRotation ? axis._labelAngle : 0;
  const slant = !!axis._labelRotation && axis._labelSlant;
  return labels.map((d: unknown, i: number) => {
    const fF =
        typeof fontFamilyConfig === "function"
          ? fontFamilyConfig(d, i)
          : fontFamilyConfig,
      fP = typeof fontPadding === "function" ? fontPadding(d, i) : fontPadding,
      fS = typeof fontSize === "function" ? fontSize(d, i) : fontSize,
      position = axis._getPosition(d);

    // Measured with the line height the label is painted with (see
    // `configureTickShape`).
    const lineHeight = labelLineHeight(axis.schema.shapeConfig, d, i, fS);
    // Base record — `space`/`lines`/`width`/`height` are filled later.
    return {
      d,
      i,
      fF,
      fP,
      fS,
      lineHeight,
      position,
      rotate: axis._labelRotation,
      angle,
      slant,
    } as AxisTextDatum;
  });
}

/**
    The widest share of the axis any label has: a band's width, else the
    largest gap between neighboring ticks (doubled, except on a point scale).
*/
function maxLabelSpace(
  axis: Axis,
  textData: AxisTextDatum[],
  rangeOuter: number[],
): number {
  return axis.schema.scale === "band"
    ? axis._d3Scale!.bandwidth!()
    : textData.reduce((s: number, d: AxisTextDatum, i: number) => {
        const {position} = d;
        const prevPosition = !i
          ? textData.length === 1
            ? rangeOuter[0]
            : position - (textData[i + 1].position - position)
          : position - (position - textData[i - 1].position);
        const prevSpace = Math.abs(position - prevPosition);

        const nextPosition =
          i == textData.length - 1
            ? textData.length === 1
              ? rangeOuter[1]
              : position + (position - textData[i - 1].position)
            : position - (position - textData[i + 1].position);
        const nextSpace = Math.abs(position - nextPosition);
        const mod = axis.schema.scale === "point" ? 1 : 2;
        return max([max([prevSpace, nextSpace])! * mod, s])!;
      }, 0);
}

/**
    Measures every label, computes per-label space, sizes via `textWrap`, and
    resolves truncation (and optional offset). Returns the `textData` array.
*/
export function createTextData(
  axis: Axis,
  ctx: LabelLayoutCtx & {
    labels: unknown[];
    rangeOuter: number[];
    offset?: number;
    /** Whether the labels left shown take the room hidden ones leave (see `regrowShown`). */
    regrow?: boolean;
  },
): AxisTextDatum[] {
  const {
    labels,
    rangeOuter,
    horizontal,
    hBuff,
    p,
    tickFormat,
    offset = 1,
    ownSpace,
    regrow,
  } = ctx;
  const wholeLine =
    horizontal && !axis._labelRotation && wholeLineLabels(axis, labels);
  // Every label is shown until the overlap pass below thins them.
  axis._shownLabels = labels;
  const labelCtx: LabelLayoutCtx = {
    horizontal,
    hBuff,
    p,
    tickFormat,
    wholeLine,
    ownSpace,
  };
  let textData = baseTextData(axis, labels);
  const maxSpace = maxLabelSpace(axis, textData, rangeOuter);
  labelCtx.slantWidth = slantedWidth(axis, textData, {
    ...labelCtx,
    space: maxSpace,
  });

  const spaces = ownSpace
    ? ownLabelSpaces(
        textData.map((d: AxisTextDatum) => d.position),
        rangeOuter,
      )
    : undefined;

  // Thinning measures the labels again as they read the ones shown (see
  // `show`), mostly to the same text, so each text is measured once.
  const measured = new Map<string, LabelSize>();
  const size = (
    datum: AxisTextDatum,
    space = (spaces ? spaces[datum.i] : maxSpace) - datum.fP * 2,
    keepShare = false,
  ): AxisTextDatum => {
    datum.space = space;
    const {lines, widths, width, height, fits, cut} = calculateLabelSize(
      axis,
      datum,
      keepShare ? {...labelCtx, keepShare} : labelCtx,
      measured,
    );
    // A label measured wider than its share (see `calculateLabelSize`) is
    // painted at that width; the overlap pass below thins its neighbors.
    if (horizontal && !datum.rotate)
      datum.space = Math.max(datum.space, Math.ceil(width));
    // Likewise a vertical axis label taller than its share is painted at its
    // own height, leaving the overlap pass to thin out its neighbors.
    else if (!horizontal && !datum.rotate && height - datum.fP > datum.space)
      datum.space = Math.ceil(height);
    return Object.assign(datum, {lines, widths, width, height, fits, cut});
  };
  textData = textData.map((datum: AxisTextDatum) => size(datum));

  // Date labels read which labels are shown (see `Axis._shownLabels`), so a
  // whole-line axis measures them again each time it thins them.
  const show = (shown: AxisTextDatum[], resize: AxisTextDatum[] = shown) => {
    axis._shownLabels = shown.map((t: AxisTextDatum) => t.d);
    resize.forEach((datum: AxisTextDatum) => size(datum));
  };
  if (isDiscreteScale(axis.schema.scale))
    thinEvenly(
      textData,
      horizontal,
      wholeLine
        ? (step: number, all: boolean) => {
            const shown = textData.filter(
              (_t: AxisTextDatum, i: number) => i % step === 0,
            );
            show(shown, all ? textData : shown);
          }
        : undefined,
    );
  else if (spaces && horizontal && !axis._labelRotation)
    fitOwnSpaces(textData, spaces, axis._d3Scale!.range(), size, rangeOuter);
  else if (wholeLine) thinGreedilyShown(textData, horizontal, show);
  else thinGreedily(textData, horizontal);
  if (regrow && !horizontal && !axis._labelRotation)
    regrowShown(textData, size, rangeOuter);

  // Painted only as wide as the widest label, a cut label is cut there.
  if (
    !horizontal &&
    typeof axis.schema.fixedSize !== "number" &&
    !textData.some((t: AxisTextDatum) => t.rotate || t.slant)
  )
    fitLabelRoom(textData, (t: AxisTextDatum) =>
      calculateLabelSize(axis, t, labelCtx, measured),
    );
  if (offset > 1) calculateOffset(textData, horizontal);
  return textData;
}

/**
    The width slanted labels wrap at: narrow enough to put a long label on
    as many lines (up to three) as fit between neighbouring labels `space`
    apart, so it reaches less far from the axis. Undefined when the labels
    don't slant.
*/
function slantedWidth(
  axis: Axis,
  textData: AxisTextDatum[],
  ctx: LabelLayoutCtx & {space: number},
): number | undefined {
  const first = textData[0];
  if (!first?.slant) return undefined;
  const {horizontal, hBuff, p, tickFormat, space} = ctx;
  const limit = slantedWrapSize(
    first.angle!,
    horizontal,
    labelRoom(axis, horizontal, hBuff, p),
    space - first.fP * 2,
    first.lineHeight,
  );
  return slantedLineWidth(
    textData.map((d: AxisTextDatum) => ({
      text: tickFormat(d.d),
      fontFamily: d.fF,
      fontSize: d.fS,
      lineHeight: d.lineHeight,
    })),
    slantedLines(limit.height, first.lineHeight),
    limit.width,
  );
}

/**
    How far a measured label reaches out from the axis: its height when it
    lies flat along a horizontal axis, its width when it stands out from the
    axis, and for a slanted label, both projected across the axis (with its
    padding on a horizontal axis, as its height holds).
*/
export function labelDepth(t: AxisTextDatum, horizontal: boolean): number {
  if (t.slant)
    return (
      slantedDepth(t.angle!, horizontal, t.width, t.height - t.fP) +
      (horizontal ? t.fP : 0)
    );
  return t[t.rotate || !horizontal ? "width" : "height"];
}

/** Derives `_outerBounds` + axis margins from the measured text data. */
export function computeAxisBounds(
  axis: Axis,
  ctx: {
    textData: AxisTextDatum[];
    rangeOuter: number[];
    hBuff: number;
    horizontal: boolean;
    p: number;
    width: string;
    height: string;
    x: string;
    y: string;
    opposite: string;
    margin: Record<string, number>;
  },
): Record<string, number> {
  const {
    textData,
    rangeOuter,
    hBuff,
    horizontal,
    p,
    width,
    height,
    x,
    y,
    opposite,
    margin,
  } = ctx;
  const tBuff = axis.schema.shape === "Line" ? 0 : hBuff;
  const bounds: Record<string, number> = (axis._outerBounds = {
    [height]:
      (max(textData, (t: AxisTextDatum) =>
        Math.ceil(labelDepth(t, horizontal) + (t.offset ?? 0)),
      ) || 0) + (textData.length ? p : 0),
    [width]: rangeOuter[rangeOuter.length - 1] - rangeOuter[0],
    [x]: rangeOuter[0],
  });

  bounds[height] =
    typeof axis.schema.fixedSize === "number"
      ? axis.schema.fixedSize
      : max([axis.schema.minSize, bounds[height]])!;
  axis._labelSpace = bounds[height];

  margin[axis.schema.orient] += hBuff;
  margin[opposite] =
    axis.schema.gridSize !== undefined
      ? max([axis.schema.gridSize, tBuff])!
      : (axis.schema[height] as number) -
        margin[axis.schema.orient] -
        bounds[height] -
        p;
  bounds[height] += margin[opposite] + margin[axis.schema.orient];
  bounds[y] =
    axis.schema.align === "start"
      ? axis.schema.padding
      : axis.schema.align === "end"
        ? (axis.schema[height] as number) - bounds[height] - axis.schema.padding
        : (axis.schema[height] as number) / 2 - bounds[height] / 2;

  return bounds;
}
