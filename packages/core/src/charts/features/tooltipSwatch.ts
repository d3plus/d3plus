/**
    The small colored glyph that ties a tooltip row or title to the mark it
    describes, matching the legend's swatches: a dot with a short line through
    it for a Line, a dot for a Circle, and a square for everything else.
*/
import type {PickResult, SceneNode} from "@d3plus/render";

import type Tooltip from "../../components/Tooltip.js";

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
  if (text === undefined || text === null || text === false || text === "") return "";
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

/** Key suffixes of nodes drawn on behalf of another mark: a transparent hover target, a bar's error bar. */
const OWNED_SUFFIXES = ["::hit", "::confidence"];

/**
    The mark a picked scene node stands in for: the visible sibling of a
    transparent hover target (a `::hit` node), or the bar of an error bar (a
    `::confidence` node). Any other node is its own mark.
    @param viz The chart, whose scene holds the mark.
    @param node The picked scene node.
*/
export function ownerNode<T extends SceneNode>(viz: VizInstance, node: T | undefined): T | undefined {
  const key = node && (node as PaintNode).key;
  if (typeof key !== "string") return node;
  let owner = key;
  for (const suffix of OWNED_SUFFIXES)
    while (owner.endsWith(suffix)) owner = owner.slice(0, -suffix.length);
  return owner === key ? node : (findNode(viz._chartScene || [], owner) as T | undefined) || node;
}

/**
    The color a picked scene node draws in: a Line's stroke, otherwise its
    fill (or stroke, for an unfilled mark). A node drawn on behalf of another
    mark (see `ownerNode`) reads that mark's paint.
    @param viz The chart, whose scene holds the mark.
    @param node The picked scene node.
*/
export function nodeColor(viz: VizInstance, node: SceneNode | undefined): string | undefined {
  const n = ownerNode(viz, node as PaintNode | undefined);
  return n && paintColor(n);
}

/** A Line's stroke, otherwise a mark's fill (or stroke, for an unfilled mark). */
function paintColor(node: PaintNode): string | undefined {
  const paint = node.paint;
  if (!paint) return undefined;
  return node.shapeType === "Line"
    ? visibleColor(paint.stroke) ?? visibleColor(paint.fill)
    : visibleColor(paint.fill) ?? visibleColor(paint.stroke);
}

type PickedNode = PaintNode & {interactionGroup?: string; datum?: unknown};

/** Whether a node draws a mark, rather than a label (which some charts tag with a shape type). */
const isMark = (node: PickedNode): boolean =>
  !!node.paint && node.shapeType !== "Label" && node.type !== "text";

/** A mark's shape type, or a Circle for a circle a chart emits without one. */
const shapeOf = (node: PickedNode): string | undefined =>
  node.shapeType ?? (node.type === "circle" ? "Circle" : undefined);

/**
    A node's source row, unwrapping label records, shape wrappers, and layout
    nodes (e.g. a d3-hierarchy node) down their `.data` chain.
*/
function sourceRow(d: unknown): unknown {
  let row = d as {data?: unknown} | undefined;
  while (row && typeof row === "object" && row.data && typeof row.data === "object" && !Array.isArray(row.data))
    row = row.data as typeof row;
  return row;
}

/**
    The first painted mark drawing `row`, in the legend's subtree or outside
    it, searching depth-first.
*/
function markFor(nodes: SceneNode[], row: unknown, legend: boolean): PickedNode | undefined {
  for (const node of nodes as PickedNode[]) {
    if (isMark(node) && !`${node.key}`.endsWith("::hit") && (node.interactionGroup === "legend") === legend
      && sourceRow(node.datum) === row && paintColor(node)) return node;
    const child = node.children && markFor(node.children, row, legend);
    if (child) return child;
  }
  return undefined;
}

/**
    The swatch for a hovered scene node: the picked mark's own color and shape,
    or, when the pointer is over a label (or another unpainted node), the color
    and shape of the mark that label belongs to. A legend entry reads as the
    shape it names, so a Line entry (a stroke with a dot) reads as a Line.
    Empty when no painted mark matches.
    @param viz The chart, whose painted scene holds the marks.
    @param pick The hovered node and its source datum.
*/
export function pickSwatch(
  viz: VizInstance,
  pick: {node?: PickResult["node"]; d?: unknown; isLegend?: boolean} | null | undefined,
): string {
  if (!pick || !pick.node) return "";
  const node = pick.node as PickedNode;
  const own = isMark(node) ? nodeColor(viz, node) : undefined;
  if (own && !pick.isLegend) return tooltipSwatch(own, shapeOf(node));
  const root = viz._paintedScene?.root;
  const match = own ? node : root && markFor([root], sourceRow(pick.d), !!pick.isLegend);
  if (!match) return "";
  // A legend entry names its own glyph (a Line draws as a stroke and a dot).
  const entry = (match.datum as {shape?: unknown} | undefined)?.shape;
  return tooltipSwatch(nodeColor(viz, match), pick.isLegend && typeof entry === "string" ? entry : shapeOf(match));
}

/**
    Leads the tooltip's title, whichever accessor set it (the chart's default,
    a chart's own `tooltipConfig`, or the user's), with `swatch` — unless the
    tooltip's `titleSwatch` is `false`.
    @param tooltip The tooltip, already configured.
    @param swatch The swatch HTML, from `tooltipSwatch` or `pickSwatch`.
*/
export function leadTitleWithSwatch(tooltip: Tooltip, swatch: string): Tooltip {
  if (!swatch || tooltip.schema.titleSwatch === false) return tooltip;
  const title = tooltip.schema.title as (d: unknown, i: number) => unknown;
  return tooltip.title((d: unknown, i: number) => withSwatch(swatch, title(d, i)));
}
