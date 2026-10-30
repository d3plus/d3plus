/**
    Circle labels on a chart: resolves each label's `labelPosition`, measures
    its text, places it (see `circleLabelPlacement.ts`), and emits the labels
    that sit beside their circles. Shared by Plot's point marks, Network's
    nodes, and Geomap's coordinate points.

    @module
*/

import type {DataPoint} from "@d3plus/data";
import {fontExists, parseSides, rtl, textWidth} from "@d3plus/dom";
import type {Bounds} from "@d3plus/math";
import type {SceneNode} from "@d3plus/render";
import {fontFamily as defaultFontFamily, textWrap} from "@d3plus/text";

import {emitLabels} from "../../shapes/emitLabels.js";
import constant from "../../utils/constant.js";
import {backgroundInk} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {placeCircleLabels} from "./circleLabelPlacement.js";
import type {
  CircleLabelPlacement,
  CircleLabelBox,
  LabelPosition,
  LabelSide,
} from "./circleLabelPlacement.js";

/** A font to measure or wrap text in. */
export interface LabelFont {
  family?: string | string[];
  size: number;
  weight?: string | number;
  /** The line height, in pixels (default 1.2 × `size`). */
  lineHeight?: number;
}

/** The box an inside label wraps in, before padding. */
export interface InsideLabelBox {
  width: number;
  height: number;
  /** `"circle"` wraps lines as chords of the circle the box holds. */
  shape?: "circle" | "square";
  /** CSS-style padding inside the box (default 0). */
  padding?: number | string;
}

/** The resolved CSS font family, as TextBox renders it. */
const familyOf = (family: LabelFont["family"]): string =>
  fontExists(family ?? defaultFontFamily) as string;

/**
    Whether `text` fits inside a box at `font.size`, wrapped the way a label
    TextBox wraps it, without being cut short.
    @param text The label text.
    @param box The box, with its wrapping shape and padding.
    @param font The font, at the smallest size that counts as fitting.
*/
export function labelFitsInside(
  text: string,
  box: InsideLabelBox,
  font: LabelFont,
): boolean {
  const pad = parseSides(box.padding ?? 0);
  const width = box.width - pad.left - pad.right;
  const height = box.height - pad.top - pad.bottom;
  const lineHeight = font.lineHeight ?? font.size * 1.2;
  if (!text || width <= font.size || height < lineHeight) return false;
  const wrapped = textWrap()
    .fontFamily(familyOf(font.family))
    .fontSize(font.size)
    .fontWeight(font.weight ?? 400)
    .lineHeight(lineHeight)
    .shape(box.shape ?? "square")
    .width(width)
    .height(height)(text);
  return !wrapped.truncated && wrapped.lines.some(l => l !== "");
}

/**
    The box a one-line label takes: its measured width, plus a pixel of slack
    on each side so the TextBox drawing it never wraps it, by a line's height
    plus a pixel.
*/
export function measureLabel(
  text: string,
  font: LabelFont,
): {width: number; height: number} {
  const width = textWidth(text, {
    "font-family": familyOf(font.family),
    "font-size": font.size,
    "font-weight": font.weight ?? 400,
  }) as number;
  const lineHeight = font.lineHeight ?? font.size * 1.2;
  return {width: Math.ceil(width) + 2, height: Math.ceil(lineHeight) + 1};
}

/** The resolved `pointLabelConfig`. */
export interface PointLabelSettings {
  /** The smallest font size an inside label may shrink to before it moves outside. */
  fontMin: number;
  /** The font size of a label beside its circle. */
  fontSize: number;
  /** The space between a circle's edge and a label beside it. */
  padding: number;
  /** The TextBox config of a label beside its circle (font, color, …). */
  text: Record<string, unknown>;
}

/** Reads `pointLabelConfig`: numbers for fontMin/fontSize/padding, the rest as TextBox config. */
export function pointLabelSettings(viz: VizInstance): PointLabelSettings {
  const cfg = (viz.schema.pointLabelConfig ?? {}) as Record<string, unknown>;
  const num = (v: unknown, fallback: number): number =>
    typeof v === "number" && Number.isFinite(v) ? v : fallback;
  const {fontMin, fontSize, padding, ...text} = cfg;
  return {
    fontMin: num(fontMin, 10),
    fontSize: num(fontSize, 11),
    padding: num(padding, 3),
    text,
  };
}

/** A row's `labelPosition`, with anything unrecognized read as `"auto"`. */
export function labelPositionOf(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): LabelPosition {
  const fn = viz.schema.labelPosition as
    ((d: DataPoint, i: number) => unknown) | undefined;
  const value = typeof fn === "function" ? fn(d, i) : fn;
  return value === "inside" || value === "outside" ? value : "auto";
}

/** One circle on a chart, and its label. */
export interface CircleLabelItem<K> {
  /** What the result is keyed by (the scene datum or layout node). */
  key: K;
  /** The data row, and its index, handed to `labelPosition` and the label config. */
  datum: DataPoint;
  index: number;
  x: number;
  y: number;
  r: number;
  /** The label text; anything but a string or number leaves the circle unlabeled (an obstacle only). */
  text?: unknown;
  /** How an inside label wraps (default: the circle itself, unpadded). */
  inside?: InsideLabelBox & {font?: Pick<LabelFont, "family" | "weight">};
}

/** A label's placement, with the mode it was placed in and its text. */
export type CircleLabelLayout = CircleLabelPlacement & {
  mode: LabelPosition;
  text: string;
};

/**
    Places every labeled circle's label (see `placeCircleLabels`), reading
    each row's `labelPosition` and the chart's `pointLabelConfig`. An
    `"auto"` label counts as fitting inside when it fits at
    `pointLabelConfig.fontMin`.
    @param viz The chart.
    @param items Every circle, labeled or not.
    @param bounds The box labels must stay in, in the circles' space.
*/
export function layoutCircleLabels<K>(
  viz: VizInstance,
  items: readonly CircleLabelItem<K>[],
  bounds: Bounds,
): Map<K, CircleLabelLayout> {
  const settings = pointLabelSettings(viz);
  const font = outsideFont(settings);
  const labeled: {item: CircleLabelItem<K>; at: number; text: string}[] = [];
  items.forEach((item, at) => {
    const t = item.text;
    if ((typeof t === "string" && t.trim()) || typeof t === "number")
      labeled.push({item, at, text: `${t}`.trim()});
  });
  const requests = labeled.map(({item, at, text}) => {
    const mode = labelPositionOf(viz, item.datum, item.index);
    const inside = item.inside ?? {width: item.r * 2, height: item.r * 2};
    const fitsInside =
      mode === "auto" &&
      labelFitsInside(text, inside, {
        ...inside.font,
        size: settings.fontMin,
      });
    // Only a label that may go beside its circle needs measuring.
    const size =
      mode === "inside" || fitsInside
        ? {width: 0, height: 0}
        : measureLabel(text, resolveFont(font, item));
    return {circle: at, ...size, position: mode, fitsInside};
  });
  const placements = placeCircleLabels(
    items.map(({x, y, r}) => ({x, y, r: Number.isFinite(r) ? r : 0})),
    requests,
    bounds,
    {gap: settings.padding},
  );
  const out = new Map<K, CircleLabelLayout>();
  labeled.forEach(({item, text}, j) =>
    out.set(item.key, {...placements[j], mode: requests[j].position, text}),
  );
  return out;
}

/** The font a label beside its circle is drawn in, as accessors of the row. */
function outsideFont(settings: PointLabelSettings) {
  const {fontFamily, fontWeight} = settings.text;
  return {size: settings.fontSize, family: fontFamily, weight: fontWeight};
}

/** Resolves the outside font's accessors for one row. */
function resolveFont(
  font: ReturnType<typeof outsideFont>,
  item: CircleLabelItem<unknown>,
): LabelFont {
  const at = <T>(v: unknown): T | undefined =>
    (typeof v === "function" ? v(item.datum, item.index) : v) as T | undefined;
  return {
    size: font.size,
    family: at<string | string[]>(font.family),
    weight: at<string | number>(font.weight),
  };
}

/** The text anchor that keeps a label flush against its circle. */
export function sideAnchor(side: LabelSide): "start" | "middle" | "end" {
  const anchor = side.endsWith("right")
    ? "start"
    : side.endsWith("left")
      ? "end"
      : "middle";
  // Right to left, TextBox reads "start" as the box's right edge.
  if (anchor !== "middle" && rtl()) return anchor === "start" ? "end" : "start";
  return anchor;
}

/** A label to draw beside its circle. */
export interface OutsideLabel {
  /** The id the label's scene key is built from (`${id}_0`). */
  id: string;
  /** The scene datum the label carries (hover and active match on it). */
  datum: DataPoint;
  text: string;
  side: LabelSide;
  box: CircleLabelBox;
}

/**
    Text nodes for labels placed beside their circles: one line each, in the
    chart's ink (`backgroundInk`) at `pointLabelConfig.fontSize`, flush
    against the circle, and inert to the pointer.
    @param viz The chart.
    @param labels The labels, each with its placed box.
    @param config TextBox config layered under `pointLabelConfig` (such as a
    `fontOpacity` that follows the shapes).
*/
export function emitOutsideLabels(
  viz: VizInstance,
  labels: readonly OutsideLabel[],
  config: Record<string, unknown> = {},
): SceneNode[] {
  if (!labels.length) return [];
  const settings = pointLabelSettings(viz);
  const byId = new Map(labels.map(l => [`${l.id}_0`, l]));
  const sideOf = (rec: DataPoint): LabelSide =>
    byId.get(String(rec.id))?.side ?? "right";
  const lineHeight = settings.fontSize * 1.2;
  return emitLabels({
    data: labels as unknown as DataPoint[],
    label: d => (d as unknown as OutsideLabel).text,
    labelBounds: d => ({...(d as unknown as OutsideLabel).box}),
    x: constant(0),
    y: constant(0),
    aes: constant({}),
    rotate: constant(0),
    id: d => (d as unknown as OutsideLabel).id,
    datum: d => (d as unknown as OutsideLabel).datum,
    labelConfig: {
      fontColor: () => backgroundInk(viz),
      ...config,
      fontResize: false,
      fontSize: settings.fontSize,
      lineHeight,
      padding: 0,
      pointerEvents: "none",
      textAnchor: (rec: DataPoint) => sideAnchor(sideOf(rec)),
      verticalAlign: "middle",
      ...settings.text,
    },
  });
}

/**
    Splits laid-out labels into the ones drawn beside their circles, with the
    id and scene datum each takes.
*/
export function outsideLabels<K>(
  layout: Map<K, CircleLabelLayout>,
  describe: (key: K) => {id: string; datum: DataPoint},
): OutsideLabel[] {
  const out: OutsideLabel[] = [];
  for (const [key, placed] of layout) {
    if (placed.position !== "outside") continue;
    out.push({
      ...describe(key),
      text: placed.text,
      side: placed.side,
      box: placed.box,
    });
  }
  return out;
}

/**
    The font size floor of an inside label: `pointLabelConfig.fontMin` when it
    was placed in `"auto"` mode (so it never shrinks below the size it was
    judged to fit at), else its own.
*/
export function insideFontMin(
  viz: VizInstance,
  placed: CircleLabelLayout | undefined,
  own: number,
): number {
  if (!placed || placed.mode !== "auto" || placed.position !== "inside")
    return own;
  return Math.max(own, pointLabelSettings(viz).fontMin);
}
