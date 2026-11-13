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

/** The room each label has in one layout of the swatches. */
interface Room {
  width: number;
  height: number;
}

/**
    The room each label of `legend` has with its swatches in `rows` rows of
    as many each as fit (`rows` 1 to the count of swatches), or in one
    column.
*/
export function labelRoom(
  legend: Legend,
  availableWidth: number,
  availableHeight: number,
  rows = 1,
): Room {
  const lines = legend._lineData;
  const pad = legend.schema.padding;
  const shape = max(lines, d => d.shapeWidth as number) ?? 0;
  const n = lines.length;
  // As `buildRows` packs them: each swatch, its label and the padding
  // between take less than the available width, and the rows, each its
  // tallest label or swatch and the padding below, no more than its height.
  if (legend.schema.direction === "column")
    return {
      width: availableWidth - shape - pad * 2 - 1,
      height: Math.floor((availableHeight - pad) / n - pad),
    };
  const perRow = Math.ceil(n / rows);
  return {
    width: Math.floor((availableWidth - 1) / perRow) - shape - pad * 2,
    height: Math.floor((availableHeight - pad) / rows - pad),
  };
}

/** How one label lays out in a room: cut short or whole, how much it shows, and its size. */
interface LabelFit {
  cut: boolean;
  shown: number;
  width: number;
  height: number;
}

/** Lays the label `d` out in `room`, or null when the room can't hold a line of it. */
function fitLabel(d: Record<string, unknown>, room: Room): LabelFit | null {
  const step = (d.lh as number) + 1;
  const most = Math.floor(room.height / step);
  if (room.width < MIN_WIDTH || most < 1) return null;
  const wrap = textWrap()
    .fontFamily(d.f as string)
    .fontSize(d.s as number)
    .lineHeight(d.lh as number)
    .width(room.width)
    .height(most * step)(d.sentence as string);
  const cut = wrap.truncated;
  // A label cut down to nothing doesn't fit.
  if (cut && !wrap.lines.length) return null;
  return {
    cut,
    shown: cut ? wrap.lines.join("").length : `${d.sentence}`.length,
    width: cut
      ? room.width
      : Math.min(room.width, Math.ceil(max(wrap.widths) ?? 0) + 10),
    height: (cut ? most : wrap.lines.length) * step,
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
    Gives each label of `legend` the room it has in the layout of its
    swatches that shows the most of its labels, its whole text when that
    fits there and else as many lines as fit, marking it `cut`, with the
    lines it paints there. In a row, the swatches try each count of rows
    within the height, keeping the layout that cuts the fewest labels short,
    then shows the most of their text, then is the shortest. In a column,
    they keep to one column, which reads in order from top to bottom.
    Returns false, changing nothing, when no layout can hold a line of a
    few letters.
*/
export function cutLegendLabels(
  legend: Legend,
  availableWidth: number,
  availableHeight: number,
): boolean {
  const lines = legend._lineData;
  const labeled = lines.filter(d => d.sentence);
  if (!labeled.length) return false;
  const counts =
    legend.schema.direction === "column"
      ? [1]
      : Array.from({length: lines.length}, (_, i) => i + 1);
  const shape = max(lines, d => d.shapeHeight as number) ?? 0;
  const pad = legend.schema.padding;
  let best:
    {fits: LabelFit[]; cut: number; shown: number; height: number} | undefined;
  for (const rows of counts) {
    const room = labelRoom(legend, availableWidth, availableHeight, rows);
    const fits = labeled.map(d => fitLabel(d, room));
    if (fits.some(fit => !fit)) continue;
    const all = fits as LabelFit[];
    const cut = all.filter(fit => fit.cut).length;
    const shown = all.reduce((total, fit) => total + fit.shown, 0);
    const height =
      rows * (Math.max(shape, ...all.map(fit => fit.height)) + pad) + pad;
    if (
      !best ||
      cut < best.cut ||
      (cut === best.cut &&
        (shown > best.shown || (shown === best.shown && height < best.height)))
    )
      best = {fits: all, cut, shown, height};
  }
  if (!best) return false;
  labeled.forEach((d, i) => {
    const fit = best!.fits[i];
    d.cut = fit.cut;
    d.width = fit.width;
    d.height = fit.height;
    d.lines = paintedLines(legend, d);
  });
  return true;
}
