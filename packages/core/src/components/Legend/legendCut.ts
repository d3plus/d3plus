/**
    Lays out labels that don't fit a Legend whole in the room it has left,
    for its TextBoxes to wrap within and cut short with "...": a Legend that
    a ColorScale draws its swatches with (`_cutLabels`) cuts its labels short
    rather than leaving them out.
*/
import {max} from "d3-array";

import {textWrap} from "@d3plus/text";

import type {DataPoint} from "@d3plus/data";

import {TEXTBOX_LINE_HEIGHT, textBoxEllipsis} from "../TextBox.js";
import type Legend from "./Legend.js";

/** The narrowest room a cut label keeps beside its swatch, for a letter or two and "...". */
const MIN_WIDTH = 24;

/** The room each label of `legend` has in one column, or one row, of its swatches. */
function labelRoom(
  legend: Legend,
  availableWidth: number,
  availableHeight: number,
): {width: number; height: number} {
  const lines = legend._lineData;
  const pad = legend.schema.padding;
  const shape = max(lines, d => d.shapeWidth as number) ?? 0;
  const n = lines.length;
  // As `buildRows` packs them: each swatch, its label and the padding
  // between take less than the available width, and the rows, each its
  // tallest label or swatch and the padding below, no more than its height.
  return legend.schema.direction === "column"
    ? {
        width: availableWidth - shape - pad * 2 - 1,
        height: Math.floor((availableHeight - pad) / n - pad),
      }
    : {
        width: Math.floor((availableWidth - 1) / n) - shape - pad * 2,
        height: availableHeight - pad * 2,
      };
}

/** A label config value: a function of the label's datum and index, or the value itself. */
type LabelValue<T> = T | ((d: DataPoint, i: number) => T) | undefined;

/**
    The lines the TextBox of the label `d` paints in the room it was given:
    wrapped with the line height and ellipsis of the legend's labels (a
    TextBox's own by default), as `renderLegendShapes` draws it.
*/
export function paintedLines(
  legend: Legend,
  d: Record<string, unknown>,
): string[] {
  const label = (legend.schema.shapeConfig.labelConfig ?? {}) as Record<
    string,
    unknown
  >;
  const value = <T>(v: LabelValue<T>, fallback: T): T =>
    v === undefined
      ? fallback
      : typeof v === "function"
        ? (v as (d: DataPoint, i: number) => T)(
            d.data as DataPoint,
            d.i as number,
          )
        : v;
  const size = d.s as number;
  const ellipsis =
    typeof label.ellipsis === "function"
      ? (label.ellipsis as (text: string, line: number) => string)
      : textBoxEllipsis;
  const wrap = textWrap()
    .fontFamily(d.f as string)
    .fontSize(size)
    .lineHeight(
      value(label.lineHeight as LabelValue<number>, size * TEXTBOX_LINE_HEIGHT),
    )
    .width(d.width as number)
    .height(Math.max(d.height as number, d.shapeHeight as number))
    .ellipsis(ellipsis)(d.sentence as string);
  const lines = wrap.lines.filter(line => line !== "");
  return lines.length ? lines : [ellipsis("", 0)];
}

/**
    Gives each label of `legend` the room it has in one column (or one row)
    of its swatches, its whole text when that fits there and else as many
    lines as fit, marking it `cut`, with the lines it paints there. Returns
    false, changing nothing, when the room can't hold a line of a few
    letters.
*/
export function cutLegendLabels(
  legend: Legend,
  availableWidth: number,
  availableHeight: number,
): boolean {
  const lines = legend._lineData;
  if (!lines.some(d => d.sentence)) return false;
  const room = labelRoom(legend, availableWidth, availableHeight);
  if (room.width < MIN_WIDTH) return false;
  if (lines.some(d => d.sentence && room.height < (d.lh as number) + 1))
    return false;
  for (const d of lines) {
    if (!d.sentence) continue;
    const step = (d.lh as number) + 1;
    const most = Math.floor(room.height / step);
    const wrap = textWrap()
      .fontFamily(d.f as string)
      .fontSize(d.s as number)
      .lineHeight(d.lh as number)
      .width(room.width)
      .height(most * step)(d.sentence as string);
    d.cut = wrap.truncated;
    d.width = d.cut
      ? room.width
      : Math.min(room.width, Math.ceil(max(wrap.widths) ?? 0) + 10);
    d.height = (d.cut ? most : wrap.lines.length) * step;
    d.lines = paintedLines(legend, d);
  }
  return true;
}
