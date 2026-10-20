/**
    Pure label fitting for the Icicle: whether a label's whole words fit inside
    a rectangle upright or turned to run up its long side, and at what size.
*/

import {
  labelFitDefaults,
  largestFontSize,
  wrapLineCount,
} from "../partition/labelWords.js";
import type {LabelFitOptions, LabelMetrics} from "../partition/labelWords.js";

import type {IcicleRect} from "./geometry.js";

/**
    Where a rectangle's label goes: a box centered at (x, y) and rotated
    `rotate` degrees about its center — the whole rectangle, turned with the
    text when it runs upward.
*/
export interface IcicleLabelBox {
  orientation: "upright" | "rotated";
  x: number;
  y: number;
  width: number;
  height: number;
  rotate: number;
  /** The largest font size (px) the label fits at in this box. */
  fontSize: number;
}

/**
    Whether `metrics` fits a `width`×`height` box at `fontSize`, wrapping to at
    most `maxLines` lines between words.
*/
export function fitsBox(
  metrics: LabelMetrics,
  fontSize: number,
  width: number,
  height: number,
  options: LabelFitOptions = {},
): boolean {
  const {padding, lineHeight, maxLines} = labelFitDefaults(options);
  const inner = width - padding * 2;
  if (inner <= 0) return false;
  for (let n = 1; n <= maxLines; n++) {
    if (n * lineHeight * fontSize + padding * 2 > height) return false;
    if (wrapLineCount(metrics, fontSize, inner) <= n) return true;
  }
  return false;
}

/**
    Decides whether, and how, a label fits inside a rectangle. Tries the text
    upright and turned -90° (reading upward, for tall narrow rectangles), finds
    the largest font size its words fit at in each without breaking a word,
    and keeps whichever is larger (upright on a tie). Returns null when
    neither fits the label at `fontMin`.
    @param rect The node's rectangle.
    @param metrics The label's word widths at a 1px font size.
    @param options Font range, padding, line height, and line limit.
*/
export function icicleLabelBox(
  rect: IcicleRect,
  metrics: LabelMetrics,
  options: LabelFitOptions = {},
): IcicleLabelBox | null {
  const {width, height} = rect;
  if (!metrics.words.length || !(width > 0) || !(height > 0)) return null;
  const opts = labelFitDefaults(options);
  const fit = (w: number, h: number) =>
    largestFontSize(
      size => fitsBox(metrics, size, w, h, opts),
      opts.fontMin,
      opts.fontMax,
    );
  const upright = fit(width, height);
  const rotated = height > width ? fit(height, width) : null;
  const x = rect.x + width / 2;
  const y = rect.y + height / 2;
  if (upright !== null && (rotated === null || upright >= rotated))
    return {
      orientation: "upright",
      x,
      y,
      width,
      height,
      rotate: 0,
      fontSize: upright,
    };
  if (rotated === null) return null;
  return {
    orientation: "rotated",
    x,
    y,
    width: height,
    height: width,
    rotate: -90,
    fontSize: rotated,
  };
}
