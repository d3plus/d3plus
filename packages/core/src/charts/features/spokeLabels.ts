/**
    Labels along the spokes of a circular layout (a radial Tree, a Network
    laid out on a circle): each one turned to run along the line from the
    center through its point, reading outward from it or inward toward the
    center, and flipped upright on the left half so it reads left to right.
    Angles run clockwise from 12 o'clock, as in `d3.linkRadial`.
*/

import {rtl} from "@d3plus/dom";
import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import {emitLabels} from "../../shapes/emitLabels.js";
import {labelFitsInside, measureLabel} from "./circleLabels.js";
import {outlineReach} from "./nodeOutline.js";
import constant from "../../utils/constant.js";
import {backgroundInk, chartBackground} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {textHalo} from "./textHalo.js";

/** The space between a node and its spoke label, in pixels. */
export const SPOKE_LABEL_PADDING = 4;

/** The smallest share of the half-size the circle keeps, however long the labels. */
const MIN_RADIUS_SHARE = 0.5;

/**
    The circle's radius in a chart `half` pixels from its center to its
    nearest edge, and the room left outside it for the leaves' labels: the
    widest label, `labelWidth`, plus `pad` and the largest node's reach,
    `nodeReach`, come off the radius, but the circle keeps at least half of
    `half`, and the labels make do with what is left.
*/
export function radialFit(
  half: number,
  labelWidth: number,
  nodeReach: number,
  pad = SPOKE_LABEL_PADDING,
): {radius: number; labelWidth: number} {
  const room = Math.max(0, half);
  const label = labelWidth > 0 ? labelWidth + pad : 0;
  const radius = Math.max(room * MIN_RADIUS_SHARE, room - label - nodeReach);
  return {
    radius,
    labelWidth:
      labelWidth > 0 ? Math.max(0, room - radius - nodeReach - pad) : 0,
  };
}

/** The most lines a spoke label wraps onto. */
export const SPOKE_LABEL_LINES = 3;

/**
    How many lines a spoke label wraps onto: as many `lineHeight`-tall lines
    as fit across the `gap` (radians) its node has to its nearest neighbor
    on the same ring, measured `rho` out from the center, from 1 to
    `SPOKE_LABEL_LINES`.
*/
export function spokeLines(
  gap: number,
  rho: number,
  lineHeight: number,
): number {
  const across = gap * Math.max(0, rho);
  const lines = Math.floor(across / Math.max(lineHeight, 1));
  return Math.max(1, Math.min(SPOKE_LABEL_LINES, lines));
}

/** The smallest size `shrinkToWord` takes a label's font down to. */
export const SPOKE_LABEL_FONT_MIN = 8;

/**
    The font size at which the widest word of `text` fits `width` pixels,
    so a label wraps between words rather than cutting one short: `font`'s
    size when it already fits, else smaller, down to
    `SPOKE_LABEL_FONT_MIN`.
*/
export function shrinkToWord(
  text: string,
  font: {size: number; family?: string | string[]; weight?: string | number},
  width: number,
): number {
  const widest = widestWord(text, font);
  if (widest <= width || widest <= 0) return font.size;
  // A measured width carries 2px of slack and rounds up a pixel, which
  // don't shrink with the font.
  const size = (font.size * Math.max(0, width - 3)) / Math.max(1, widest - 2);
  return Math.max(Math.min(font.size, SPOKE_LABEL_FONT_MIN), size);
}

/**
    The font size a spoke label draws at in a `width` × `height` box: the
    largest, from where its widest word fits (see `shrinkToWord`) down to
    `SPOKE_LABEL_FONT_MIN`, at which the whole text wraps into the box
    without being cut short. Null when none does, so the label is left out
    rather than drawn cut down to an ellipsis.
*/
export function fitSpokeFont(
  text: string,
  font: {size: number; family?: string | string[]; weight?: string | number},
  width: number,
  height: number,
): number | null {
  const start = shrinkToWord(text, font, width);
  const floor = Math.min(start, SPOKE_LABEL_FONT_MIN);
  const sizes = [];
  for (let size = start; size > floor; size -= 0.5) sizes.push(size);
  sizes.push(floor);
  const fits = (size: number) =>
    labelFitsInside(
      text,
      {width, height, padding: 0},
      {...font, size, lineHeight: size * 1.2},
    );
  return sizes.find(fits) ?? null;
}

/** The width of the widest word in `text` at `font`, 0 for none. */
export function widestWord(
  text: string,
  font: {size: number; family?: string | string[]; weight?: string | number},
): number {
  const words = text.split(/\s+/).filter(Boolean);
  return Math.max(0, ...words.map(w => measureLabel(w, font).width));
}

/**
    How far from its center a `width` × `height` box's outline lies along
    the spoke at `theta` (radians clockwise from 12 o'clock).
*/
export function boxReach(width: number, height: number, theta: number): number {
  return outlineReach({shape: "Rect", width, height}, theta - Math.PI / 2);
}

/** Where a spoke label sits and how it turns. */
export interface SpokePlacement {
  /** The point the label starts from. */
  x: number;
  y: number;
  /** The label's rotation, in degrees. */
  rotate: number;
  /** The label's box about its point, before rotating. */
  box: {x: number; y: number; width: number; height: number};
  /** The end of the text that sits at its point. */
  anchor: "start" | "end";
}

/** A placed spoke label, for `emitSpokeLabels`. */
export interface SpokeLabel extends SpokePlacement {
  /** A key unique among the labels. */
  id: string;
  text: string;
  /** The row the label belongs to. */
  datum: DataPoint;
  /** Its font size, in place of the one `emitSpokeLabels` is given. */
  fontSize?: number;
}

/** The point `distance` pixels from `[cx, cy]` at `angle` radians clockwise from 12 o'clock. */
export function polarPoint(
  cx: number,
  cy: number,
  angle: number,
  distance: number,
): [number, number] {
  return [cx + Math.sin(angle) * distance, cy - Math.cos(angle) * distance];
}

/**
    Whether a label at `angle` is flipped to read upright: on the left half
    of the circle, strictly between 6 and 12 o'clock.
*/
export function spokeFlipped(angle: number): boolean {
  const a = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return a > Math.PI + 1e-9;
}

/**
    A label `width` × `height` along the spoke at `angle`, starting
    `distance` pixels out from `[cx, cy]`: running outward from there, or
    inward toward the center with `inward`. Its text is turned along the
    spoke, and flipped upright on the left half, anchored at the end nearest
    its point.
*/
export function spokePlacement(
  cx: number,
  cy: number,
  angle: number,
  distance: number,
  width: number,
  height: number,
  inward = false,
): SpokePlacement {
  const [x, y] = polarPoint(cx, cy, angle, distance);
  const flipped = spokeFlipped(angle);
  // The text's +x runs outward unflipped, and inward flipped.
  const ahead = flipped === inward;
  const rotate = (angle * 180) / Math.PI - 90 + (flipped ? 180 : 0);
  return {
    x,
    y,
    rotate,
    box: {x: ahead ? 0 : -width, y: -height / 2, width, height},
    anchor: ahead ? "start" : "end",
  };
}

/** The anchor TextBox draws an anchor with, flipped right to left. */
const textAnchor = (anchor: "start" | "end"): "start" | "end" =>
  rtl() ? (anchor === "start" ? "end" : "start") : anchor;

/**
    Text nodes for placed spoke labels, one line each in the chart's ink,
    inert to the pointer. `fontSize` sets the size of those that set none;
    `text` is any other
    TextBox config (fontColor, fontFamily, …). With `halo`, each draws over a
    halo in the chart's background (see `textHalo`), for labels that lie over
    links.
*/
export function emitSpokeLabels(
  viz: VizInstance,
  labels: readonly SpokeLabel[],
  opts: {fontSize: number; text?: Record<string, unknown>; halo?: boolean},
): SceneNode[] {
  if (!labels.length) return [];
  const byId = new Map(labels.map(l => [`${l.id}_0`, l]));
  const of = (rec: DataPoint): SpokeLabel | undefined =>
    byId.get(String(rec.id));
  const nodes = emitLabels({
    data: labels as unknown as DataPoint[],
    label: d => (d as unknown as SpokeLabel).text,
    labelBounds: d => ({...(d as unknown as SpokeLabel).box}),
    x: d => (d as unknown as SpokeLabel).x,
    y: d => (d as unknown as SpokeLabel).y,
    aes: constant({}),
    rotate: d => (d as unknown as SpokeLabel).rotate,
    id: d => (d as unknown as SpokeLabel).id,
    datum: d => (d as unknown as SpokeLabel).datum,
    labelConfig: {
      fontColor: () => backgroundInk(viz),
      ...opts.text,
      fontResize: false,
      fontSize: (rec: DataPoint) => of(rec)?.fontSize ?? opts.fontSize,
      lineHeight: (rec: DataPoint) =>
        (of(rec)?.fontSize ?? opts.fontSize) * 1.2,
      padding: 0,
      pointerEvents: "none",
      textAnchor: (rec: DataPoint) => textAnchor(of(rec)?.anchor ?? "start"),
      verticalAlign: "middle",
    },
  });
  return opts.halo
    ? textHalo(
        nodes,
        chartBackground(viz),
        Math.max(2, Math.round(opts.fontSize / 4)),
      )
    : nodes;
}
