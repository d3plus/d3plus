/**
    The small colored glyph that ties a tooltip row or title to the mark it
    describes, matching the legend's swatches: a dot with a short line through
    it for a Line, a dot for a Circle, and a square for everything else.
*/
import type {SceneNode} from "@d3plus/render";

import type {VizInstance} from "../viz/vizTypes.js";

/** Every swatch's size in pixels, so swatches line up down a tooltip. */
const SIZE = 10;

/** Inline styles shared by every swatch: a fixed box, spaced from its text. */
const BASE = `display: inline-block; flex: none; margin-right: 6px; width: ${SIZE}px; height: ${SIZE}px;`;

/**
    A swatch's HTML for a mark of `shape` in `color`, to lead a tooltip title
    or row (see `withSwatch`). Empty without a color.
    @param color The mark's color.
    @param shape The mark's shape type (e.g. "Line", "Circle", "Bar").
*/
export function tooltipSwatch(color?: string, shape?: string): string {
  if (!color) return "";
  if (shape === "Line") {
    const dot = SIZE * 0.6;
    return `<span class="d3plus-tooltip-swatch d3plus-tooltip-swatch-line" style="${BASE} position: relative">` +
      `<span style="position: absolute; left: 0; right: 0; top: ${SIZE / 2 - 1}px; height: 2px; background: ${color}"></span>` +
      `<span style="position: absolute; left: ${(SIZE - dot) / 2}px; top: ${(SIZE - dot) / 2}px; width: ${dot}px; height: ${dot}px; border-radius: 50%; background: ${color}"></span>` +
      "</span>";
  }
  const radius = shape === "Circle" ? "50%" : "1px";
  return `<span class="d3plus-tooltip-swatch" style="${BASE} border-radius: ${radius}; background: ${color}"></span>`;
}

/**
    Leads `text` with a swatch, centered on the text however large or bold it
    is (a tooltip title, or a row's name). Just `text` without a swatch.
    @param swatch The swatch HTML, from `tooltipSwatch`.
    @param text The title or name it leads.
*/
export function withSwatch(swatch: string, text: unknown): string {
  if (!swatch) return `${text}`;
  return `<span style="display: inline-flex; align-items: center">${swatch}<span>${text}</span></span>`;
}

/** A paint color that actually shows: not unset, "none", or transparent. */
export const visibleColor = (s: unknown): string | undefined =>
  typeof s === "string" && s !== "none" && s !== "transparent" ? s : undefined;

type PaintNode = SceneNode & {
  key?: string;
  shapeType?: string;
  paint?: {stroke?: unknown; fill?: unknown};
  children?: SceneNode[];
};

/** The scene node with a given key, searching depth-first. */
function findNode(nodes: SceneNode[], key: string): PaintNode | undefined {
  for (const node of nodes as PaintNode[]) {
    if (node.key === key) return node;
    const child = node.children && findNode(node.children, key);
    if (child) return child;
  }
  return undefined;
}

/**
    The color a picked scene node draws in: a Line's stroke, otherwise its
    fill (or stroke, for an unfilled mark). A transparent hover target (a
    `::hit` node) reads its visible sibling's paint.
    @param viz The chart, whose scene holds the sibling.
    @param node The picked scene node.
*/
export function nodeColor(viz: VizInstance, node: SceneNode | undefined): string | undefined {
  let n = node as PaintNode | undefined;
  if (n && typeof n.key === "string" && n.key.endsWith("::hit"))
    n = findNode(viz._chartScene || [], n.key.slice(0, -"::hit".length)) || n;
  const paint = n && n.paint;
  if (!paint) return undefined;
  return n!.shapeType === "Line"
    ? visibleColor(paint.stroke) ?? visibleColor(paint.fill)
    : visibleColor(paint.fill) ?? visibleColor(paint.stroke);
}
