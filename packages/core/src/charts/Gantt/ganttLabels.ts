/**
    The Gantt's label column text: the label font, and each label wrapped to
    the column's width over as many lines as its row holds, the last line
    ending in an ellipsis when the label doesn't fit.
*/

import {textWidth} from "@d3plus/dom";
import {fontFamilyStringify, textWrap} from "@d3plus/text";

import {resolveAccessor} from "../features/emitHelpers.js";
import {backgroundInk} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** The label column's font. */
export interface GanttLabelFont {
  family: string;
  size: number;
  color: string;
  lineHeight: number;
}

/** A label fitted to the column. */
export interface FittedLabel {
  lines: string[];
  widths: number[];
}

/** The label font size, in pixels, unless `taskLabelConfig` sets one. */
export const LABEL_FONT_SIZE = 12;

/** Reads `taskLabelConfig`, with the chart's font and ink as defaults. */
export function ganttLabelFont(viz: VizInstance): GanttLabelFont {
  const cfg = (viz.schema.taskLabelConfig ?? {}) as Record<string, unknown>;
  const size = resolveAccessor<number>(cfg.fontSize, {}, 0);
  const family =
    resolveAccessor<string | string[]>(cfg.fontFamily, {}, 0) ??
    viz.schema.fontFamily;
  const fontSize =
    typeof size === "number" && size > 0 ? size : LABEL_FONT_SIZE;
  return {
    family: fontFamilyStringify(family),
    size: fontSize,
    color: resolveAccessor<string>(cfg.fontColor, {}, 0) ?? backgroundInk(viz),
    lineHeight: Math.round(fontSize * 1.2),
  };
}

/** The width of `text` in the label font. */
export function labelWidth(
  text: string,
  font: GanttLabelFont,
  weight: number | string = 400,
): number {
  return text
    ? textWidth(text, {
        "font-family": font.family,
        "font-size": font.size,
        "font-weight": weight,
      })
    : 0;
}

/**
    Ends `text` in an ellipsis, dropping characters until it fits `width`.
    @param text The line.
    @param width The room it has.
    @param measure Measures a line.
*/
export function ellipsize(
  text: string,
  width: number,
  measure: (t: string) => number,
): string {
  let t = text.trimEnd();
  while (t.length) {
    const candidate = `${t}…`;
    if (measure(candidate) <= width) return candidate;
    t = t.slice(0, -1).trimEnd();
  }
  return "";
}

/**
    Wraps a label to `width`, over at most `maxLines` lines, ending the last
    in an ellipsis when the label doesn't fit.
    @param text The label.
    @param width The room each line has.
    @param maxLines The most lines it may take.
    @param font The label font.
    @param weight The font weight.
*/
export function fitLabel(
  text: string,
  width: number,
  maxLines: number,
  font: GanttLabelFont,
  weight: number | string = 400,
): FittedLabel {
  const measure = (t: string) => labelWidth(t, font, weight);
  if (!text || width <= 0 || maxLines < 1) return {lines: [], widths: []};
  const wrap = textWrap()
    .fontFamily(font.family)
    .fontSize(font.size)
    .fontWeight(weight)
    .lineHeight(font.lineHeight)
    .width(width)
    .height(font.lineHeight * maxLines)
    .maxLines(maxLines)(text);
  const lines = wrap.lines.filter(l => l !== "");
  const shown = lines.join(" ").replace(/\s+/g, " ").trim();
  const whole = text.replace(/\s+/g, " ").trim();
  if (!lines.length) {
    const only = ellipsize(whole, width, measure);
    return only
      ? {lines: [only], widths: [measure(only)]}
      : {lines: [], widths: []};
  }
  if (
    wrap.truncated ||
    shown.length < whole.length ||
    measure(lines[lines.length - 1]) > width
  ) {
    const last = lines.length - 1;
    const rest = whole.slice(
      lines.slice(0, last).join(" ").length + (last ? 1 : 0),
    );
    lines[last] = ellipsize(rest, width, measure);
    if (!lines[last]) lines.pop();
  }
  return {lines, widths: lines.map(measure)};
}
