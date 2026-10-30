/**
    Text for callouts and reference labels: the theme-aware text style, the
    label wrapped to a width, and the text node that draws it.
*/
import type {TextNode} from "@d3plus/render";
import {fontFamilyStringify, textWrap} from "@d3plus/text";

import {backgroundInk} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** A resolved annotation text style. */
export interface AnnotationText {
  fontColor: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number | string;
  lineHeight: number;
  maxWidth: number;
}

/** A label wrapped into lines. */
export interface TextBlock {
  lines: string[];
  widths: number[];
  /** The widest line's width. */
  width: number;
  /** All lines' height. */
  height: number;
  lineHeight: number;
}

/** Which way text lines up against its `x`. */
export type TextAlign = "start" | "middle" | "end";

const num = (v: unknown, fallback: number): number =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;

/**
    The text style for an annotation: each key from `config` (through `pick`,
    which may read a row), else the defaults: the chart's text color for its
    background and font family, 12px, weight 400, a 1.3 line height, and
    a 150px wrap width.
    @param viz The chart.
    @param pick Reads one style key.
*/
export function annotationTextStyle(
  viz: VizInstance,
  pick: (key: string) => unknown,
): AnnotationText {
  const fontSize = num(pick("fontSize"), 12);
  const family = pick("fontFamily") ?? viz.schema.fontFamily;
  return {
    fontColor: (pick("fontColor") as string) || backgroundInk(viz),
    fontFamily:
      typeof family === "string" || Array.isArray(family)
        ? fontFamilyStringify(family as string | string[])
        : "sans-serif",
    fontSize,
    fontWeight: (pick("fontWeight") as number | string) ?? 400,
    lineHeight: num(pick("lineHeight"), Math.round(fontSize * 1.3)),
    maxWidth: Math.max(1, num(pick("maxWidth"), 150)),
  };
}

/**
    Wraps `text` at the style's `maxWidth`, measuring each line.
    @param text The label.
    @param style The text style.
*/
export function wrapAnnotationText(
  text: string,
  style: AnnotationText,
): TextBlock {
  const wrap = textWrap()
    .fontFamily(style.fontFamily)
    .fontSize(style.fontSize)
    .fontWeight(style.fontWeight)
    .lineHeight(style.lineHeight)
    .width(style.maxWidth)
    .height(Number.MAX_SAFE_INTEGER)(text);
  const lines: string[] = [];
  const widths: number[] = [];
  wrap.lines.forEach((line, i) => {
    if (line === "") return;
    lines.push(line);
    widths.push(wrap.widths[i] ?? 0);
  });
  return {
    lines,
    widths,
    width: widths.length ? Math.ceil(Math.max(...widths)) : 0,
    height: lines.length * style.lineHeight,
    lineHeight: style.lineHeight,
  };
}

/**
    The text node that draws a wrapped label whose block's top edge sits at
    `y`, lined up against `x` by `align` (its left edge, center, or right
    edge). Inert: annotations take no pointer or keyboard focus.
    @param block The wrapped label.
    @param style Its text style.
    @param at Where the block goes, and its key.
*/
export function annotationTextNode(
  block: TextBlock,
  style: AnnotationText,
  at: {key: string; x: number; y: number; align: TextAlign; opacity?: number},
): TextNode {
  return {
    type: "text",
    key: at.key,
    interactive: false,
    x: 0,
    y: 0,
    transform: {x: at.x, y: at.y},
    lines: block.lines.map((text, i) => ({
      text,
      x: 0,
      y: block.lineHeight * (i + 0.5),
      width: block.widths[i],
    })),
    font: {
      family: style.fontFamily,
      size: style.fontSize,
      weight: style.fontWeight,
      anchor: at.align,
      baseline: "middle",
    },
    paint: {fill: style.fontColor, opacity: at.opacity ?? 1},
  };
}
