/**
    The scene nodes for curved ring labels (see `ringLabels.ts`): text along
    each label's arc in a color that reads on what lies under it, carrying
    its segment's datum so it dims with it, inert, and fading rather than
    gliding when a redraw moves it.
*/
import type {DataPoint} from "@d3plus/data";
import {fontExists, textWidth} from "@d3plus/dom";
import type {FadeSwap, SceneNode, TextNode} from "@d3plus/render";
import {fontFamily as defaultFontFamily} from "@d3plus/text";

import type {VizInstance} from "../viz/vizTypes.js";
import {labelsOverlap} from "./linkLabelGeometry.js";
import type {LinkLabelBox} from "./linkLabelGeometry.js";
import {textLineBoxes} from "./linkLabels.js";
import {pathLabelNodes} from "./pathLabels.js";
import type {PathLabel} from "./pathLabels.js";
import type {RingLabelFit} from "./ringLabels.js";

/**
    How a curved label fades through a redraw that moves it: out over the
    first 6% of the eased progress, back in over the last 6%, so it never
    slides along the ring while its segment's arc tweens.
*/
export const RING_LABEL_FADE: FadeSwap = {out: 0.06, in: 0.06};

/** One curved label. */
export interface RingLabel {
  /** Its scene key. */
  key: string;
  text: string;
  /** Where it goes (see `ringLabelFit`). */
  fit: Pick<RingLabelFit, "d" | "fontSize">;
  /** Its text color. */
  color: string;
  /** The segment's datum, so hover dims them together. */
  datum?: DataPoint;
  /** The segment's index. */
  index?: number;
}

/** The plain-value font keys a label config may set. */
export interface RingLabelFont {
  fontFamily?: string | string[];
  fontWeight?: number | string;
}

/**
    The label font a shape's labelConfig sets, as plain values (accessors
    are left to the defaults).
    @param config The labelConfig.
*/
export function ringLabelFont(config: Record<string, unknown>): RingLabelFont {
  const out: RingLabelFont = {};
  const {fontFamily, fontWeight} = config;
  if (typeof fontFamily === "string" || Array.isArray(fontFamily))
    out.fontFamily = fontFamily as string | string[];
  if (typeof fontWeight === "number" || typeof fontWeight === "string")
    out.fontWeight = fontWeight;
  return out;
}

/**
    A text's one-line width in a ring label font, by font size.
    @param text The text.
    @param font The label font.
*/
export function ringTextWidth(
  text: string,
  font: RingLabelFont,
): (fontSize: number) => number {
  const style = {
    "font-family": fontExists(font.fontFamily ?? defaultFontFamily) as string,
    "font-size": 100,
    "font-weight": font.fontWeight ?? 400,
  };
  const at100 = textWidth(text, style) as number;
  return fontSize => (at100 * fontSize) / 100;
}

/** Whether a text node shows more than its ellipsis. */
const hasText = (node: SceneNode) =>
  node.type === "text" &&
  node.lines.some(l => l.text.replace(/(\.\.\.|…)$/, "").trim().length > 0);

/**
    The text nodes for curved labels: one per label that keeps some text
    after it is cut to its path, each in its own font size and color.
    @param viz The chart, for its locale.
    @param labels The labels.
    @param font The label font.
*/
export function ringLabelNodes(
  viz: VizInstance,
  labels: RingLabel[],
  font: RingLabelFont = {},
): TextNode[] {
  if (!labels.length) return [];
  const sizes = new Map(labels.map(l => [l.key, l.fit.fontSize]));
  const pathLabels: PathLabel[] = labels.map(l => ({
    key: l.key,
    text: l.text,
    d: l.fit.d,
    color: l.color,
    anchor: "middle",
    datum: l.datum,
    index: l.index,
  }));
  const nodes = pathLabelNodes(
    viz,
    pathLabels,
    {
      fontWeight: 400,
      ...font,
      fontColor: (d: PathLabel) => d.color,
      fontSize: (d: PathLabel) => sizes.get(d.key) ?? 10,
    },
    {halo: false},
  );
  return nodes.filter(hasText).map(node => ({
    ...(node as TextNode),
    fadeSwap: RING_LABEL_FADE,
  }));
}

/**
    The labels that stay clear of each other and of `obstacles`, earlier
    labels winning.
    @param nodes The label nodes, in priority order.
    @param obstacles Boxes they must stay clear of, such as other labels.
*/
export function clearRingLabels<T extends SceneNode>(
  nodes: T[],
  obstacles: LinkLabelBox[] = [],
): T[] {
  const placed = obstacles.slice();
  return nodes.filter(node => {
    const boxes = textLineBoxes([node]);
    if (boxes.some(b => placed.some(o => labelsOverlap(b, o)))) return false;
    placed.push(...boxes);
    return true;
  });
}
