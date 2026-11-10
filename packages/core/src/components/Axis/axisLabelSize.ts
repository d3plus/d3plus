/**
    Measures a single axis label for `createTextData` (see
    `axisLayoutLabels.ts`): wrapped with `textWrap` within the room its axis
    gives it. Pure compute, no DOM.
*/
import {max, min} from "d3-array";

import {textWrap} from "@d3plus/text";
import type {TextWrapGenerator, TextWrapResult} from "@d3plus/text";

import {wholeWordFit, wholeWordSplit} from "../../utils/wholeWords.js";

import type Axis from "./Axis.js";
import {axisLabelEllipsis, labelEllipsis} from "./axisDefaults.js";
import {slantedWrapSize} from "./axisLabelAngle.js";
import type {AxisTextDatum} from "./axisLayoutLabels.js";
import {axisMaxSize} from "./axisMaxSize.js";

export interface LabelLayoutCtx {
  horizontal: boolean;
  hBuff: number;
  p: number;
  tickFormat: (d: unknown) => string;
  /** Whether each label is measured on a single line (see `wholeLineLabels`). */
  wholeLine?: boolean;
  /**
      Whether each label wraps within its own share of the axis (see
      `ownLabelSpaces`) rather than the widest share any label has.
  */
  ownSpace?: boolean;
  /** The width slanted labels wrap at (see `slantedLineWidth`). */
  slantWidth?: number;
  /**
      Whether a flat label too long for its share stays within it, cut short
      (see `cutLabel`), rather than being measured across the axis.
  */
  keepShare?: boolean;
}

/**
    Cuts a label short to fit `width`: for a label whose first word is wider
    than its room, which wraps to nothing. The word is cut to as many
    characters as fit with the ellipsis after them (the wrap's own, else
    `axisLabelEllipsis`), on one line; with no room for even one, the label
    has no lines.
*/
export function cutLabel(
  wrap: TextWrapGenerator,
  text: string,
  width: number,
): TextWrapResult {
  return wrap
    .width(width)
    .truncateWord(true)
    .ellipsis(wrap.ellipsis() ?? axisLabelEllipsis)(text);
}

/**
    Measures a flat label whose first word is wider than its room (`space`),
    which wraps to nothing there. On a horizontal axis, where `space` is the
    label's share of the axis: across the whole axis (`across` wide) instead,
    so the overlap pass thins the labels out, or when it is too wide for that
    as well, cut short within its share (see `cutLabel`). Labels in their own
    shares are cut only when none fits whole (`keepShare`, see
    `fitOwnSpaces`). On a vertical axis, where `space` is how far labels
    reach out from the axis, the label is cut short within it (`keepShare`).
*/
export function longWordLabel(
  wrap: TextWrapGenerator,
  text: string,
  space: number,
  across: number,
  ctx: Pick<LabelLayoutCtx, "keepShare" | "ownSpace">,
): {res: TextWrapResult; cut: boolean} {
  if (!ctx.keepShare) {
    const wide = wrap.width(across)(text);
    if (ctx.ownSpace || wide.lines.some((l: string) => l !== ""))
      return {res: wide, cut: false};
  }
  const res = cutLabel(wrap, text, space);
  return {res, cut: res.lines.length > 0};
}

/** How far labels may reach out from the axis, past its ticks and margins. */
export function labelRoom(
  axis: Axis,
  horizontal: boolean,
  hBuff: number,
  p: number,
): number {
  const maxSize = axisMaxSize(axis.schema, horizontal);
  return horizontal
    ? min([maxSize, axis.schema.height])! -
        hBuff -
        p -
        axis._margin.top -
        axis._margin.bottom
    : min([maxSize, axis.schema.width])! -
        hBuff -
        p -
        axis._margin.left -
        axis._margin.right;
}

/** A label's wrapped lines and measured size (see `calculateLabelSize`). */
export type LabelSize = {
  lines: string[];
  widths: number[];
  width: number;
  height: number;
  fits: boolean;
  /** Whether the label is cut short mid-word to fit (see `cutLabel`). */
  cut: boolean;
};

/** What a label's measurement depends on, to tell two labels measure alike. */
function labelSizeKey(
  text: string,
  datum: AxisTextDatum,
  ctx: LabelLayoutCtx,
): string {
  const {fF, fP, fS, lineHeight, rotate, space, angle, slant, room} = datum;
  return JSON.stringify([
    text,
    fF,
    fP,
    fS,
    lineHeight,
    rotate,
    slant && angle,
    slant && ctx.slantWidth,
    space,
    room,
    ctx.keepShare,
  ]);
}

/**
    Wraps + measures a single label, returning its sized text result. Given a
    `cache`, a label whose text, font, and space match one measured before
    reuses that measurement.
*/
export function calculateLabelSize(
  axis: Axis,
  datum: AxisTextDatum,
  ctx: LabelLayoutCtx,
  cache?: Map<string, LabelSize>,
): LabelSize {
  const {horizontal, hBuff, p, tickFormat} = ctx;
  const {d, fF, fP, fS, lineHeight, rotate, space, angle, slant} = datum;
  const h = rotate ? "width" : "height",
    w = rotate ? "height" : "width";

  const text = tickFormat(d);
  const wSize = min([axisMaxSize(axis.schema, horizontal), axis.schema.width]);
  const depth = datum.room ?? labelRoom(axis, horizontal, hBuff, p);
  const slanted = slant
    ? slantedWrapSize(angle!, horizontal, depth, space, lineHeight)
    : undefined;
  const key = cache && labelSizeKey(text, datum, ctx);
  const cached = key ? cache!.get(key) : undefined;
  if (cached)
    return {
      ...cached,
      lines: cached.lines.slice(),
      widths: cached.widths.slice(),
    };

  // A cut label ends with the ellipsis it is painted with.
  const wrap = textWrap()
    .fontFamily(fF)
    .fontSize(fS)
    .lineHeight(lineHeight)
    .ellipsis(labelEllipsis(axis.schema.shapeConfig));

  if (slanted) {
    // Slanted labels wrap between words, never mid-word.
    wrap
      .split(wholeWordSplit)
      .width(Math.min(slanted.width, ctx.slantWidth ?? Infinity))
      .height(slanted.height);
  } else {
    wrap[w](horizontal ? space : depth);
    // A flat label's lines share its room with its padding (see `res.height`).
    wrap[h](horizontal ? depth - (rotate ? 0 : fP) : space);
  }

  type Sized = ReturnType<typeof wrap> & {
    width: number;
    height: number;
    fits: boolean;
    cut: boolean;
  };
  let res: Sized, fits: boolean;
  let cut = false;
  if (ctx.wholeLine) {
    // Measured across the whole axis (`maxSize` caps its depth, not its
    // length), a label that still breaks onto a second line can't be drawn
    // whole on one.
    wrap.width((axis.schema.width as number) - p * 2);
    res = wrap(text) as Sized;
    fits =
      !res.truncated && res.lines.filter((l: string) => l !== "").length <= 1;
  } else {
    res = wrap(text) as Sized;
    // A label that only fits by breaking a word mid-word doesn't fit.
    fits = wholeWordFit(
      res,
      () => wrap.split(wholeWordSplit)(text) as Sized,
    ).fits;
    if (!rotate && `${text}`.trim() && !res.lines.some((l: string) => l !== ""))
      ({res, cut} = (
        horizontal
          ? longWordLabel(wrap, text, space, wSize! - p * 2, ctx)
          : longWordLabel(wrap, text, depth, depth, {keepShare: true})
      ) as {res: Sized; cut: boolean});
  }
  res.fits = fits;
  res.cut = cut;
  res.lines = res.lines.filter((d: string) => d !== "");
  res.width = res.lines.length ? Math.ceil(max(res.widths)!) : 0;
  res.height = res.lines.length
    ? Math.ceil(res.lines.length * (wrap.lineHeight() as number)) + fP
    : 0;
  if (key)
    cache!.set(key, {
      lines: res.lines.slice(),
      widths: res.widths.slice(),
      width: res.width,
      height: res.height,
      fits,
      cut,
    });
  return res;
}
