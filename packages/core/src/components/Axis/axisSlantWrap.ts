/**
    Wrapping for slanted axis labels (see `labelRotation`). Long labels wrap
    onto two or three lines, as many as fit between neighbouring labels,
    breaking only between words, so
    a slanted label reaches less far from the axis than it would on one long
    line. Every label wraps at one shared width: the narrowest at which the
    longest label fits those lines, so the shorter ones stay whole on fewer.
*/
import {textWidth} from "@d3plus/dom";
import {textWrap} from "@d3plus/text";

import {wholeWordSplit} from "../../utils/wholeWords.js";

/** The most lines a slanted label wraps onto. */
export const SLANTED_MAX_LINES = 3;

/** How many lines of `lineHeight` fit in a slanted label `thickness` thick: 1 to 3. */
export const slantedLines = (thickness: number, lineHeight: number): number =>
  Math.max(
    1,
    Math.min(SLANTED_MAX_LINES, Math.floor(thickness / lineHeight + 1e-9)),
  );

/**
    The narrowest width, from `min` up to `max` in steps of `step` times the
    last, at which text wraps onto at most `lines` lines, as `lineCount`
    counts them at a width; `max` when none does.
*/
export function narrowestWidth(
  lineCount: (width: number) => number,
  lines: number,
  min: number,
  max: number,
  step = 1.08,
): number {
  for (let width = Math.max(1, min); width < max; width *= step)
    if (lineCount(width) <= lines) return Math.ceil(width);
  return max;
}

/** A label to wrap: its text and font. */
export interface SlantedText {
  text: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
}

/**
    The width slanted labels wrap at to fit on `lines` lines, at most `max`:
    the widest any one of them needs, and never narrower than a word.
*/
export function slantedLineWidth(
  labels: SlantedText[],
  lines: number,
  max: number,
): number {
  if (lines < 2) return max;
  const widths = labels.map(({text, fontFamily, fontSize, lineHeight}) => {
    const font = {"font-family": fontFamily, "font-size": fontSize};
    const whole = textWidth(`${text}`, font) as number;
    const words = `${text}`.split(/\s+/).filter(Boolean);
    const word = Math.max(0, ...words.map(w => textWidth(w, font) as number));
    const wrap = textWrap()
      .fontFamily(fontFamily)
      .fontSize(fontSize)
      .lineHeight(lineHeight)
      .split(wholeWordSplit)
      .height(lineHeight * (lines + 1));
    const count = (width: number) =>
      wrap
        .width(width)(`${text}`)
        .lines.filter((l: string) => l !== "").length;
    return narrowestWidth(count, lines, Math.max(word + 1, whole / lines), max);
  });
  return Math.min(max, Math.max(0, ...widths));
}
