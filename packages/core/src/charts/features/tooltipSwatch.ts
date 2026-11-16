/**
    The small colored glyph that ties a tooltip row or title to the mark it
    describes, matching the legend's swatches: a dot with a short line through
    it for a Line, a dot for a Circle, and a square for everything else, each
    in its mark's color or texture and outlined by its mark's stroke.
*/
import {patternTileSvg} from "@d3plus/render";
import type {PickResult, SceneNode} from "@d3plus/render";

import type Tooltip from "../../components/Tooltip.js";

import {chartBackground} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {markSwatch, swatchOutline} from "./swatchPaint.js";
import type {SwatchPaint} from "./swatchPaint.js";

export {visibleColor} from "./swatchPaint.js";

/** Every swatch's size in pixels, so swatches line up down a tooltip. */
const SIZE = 10;

/** Inline styles shared by every swatch: a fixed box, spaced from its text. */
const BASE = `display: inline-block; flex: none; margin-right: 6px; width: ${SIZE}px; height: ${SIZE}px;`;

/** Each texture's tile, as the CSS that repeats it, keyed by its token. */
const tiles = new Map<string, string>();

/**
    The CSS that draws a texture's `pattern:<json>` token over a swatch: the
    one tile the Canvas renderer repeats (see `patternTileSvg`), as an SVG
    data URI at its own size, centered so a small swatch shows the tile's
    middle. Empty without a DOM or for a bad token.
*/
export function textureStyle(token: string): string {
  if (typeof document === "undefined") return "";
  let css = tiles.get(token);
  if (css === undefined) {
    const tile = patternTileSvg(token);
    const uri =
      tile &&
      `data:image/svg+xml,${encodeURIComponent(tile.svg).replace(/'/g, "%27")}`;
    css = tile
      ? ` background-image: url('${uri}'); background-size: ${tile.width}px ${tile.height}px; background-position: center;`
      : "";
    tiles.set(token, css);
  }
  return css;
}

/**
    A swatch's HTML for a mark of `shape`, to lead a tooltip title or row
    (see `withSwatch`): in the mark's color or texture, outlined in 1px of its
    stroke (see `markSwatch`). A Line's swatch takes no outline, its stroke
    being the line itself. Empty without a color.
    @param paint The mark's color, or its swatch paint.
    @param shape The mark's shape type (e.g. "Line", "Circle", "Bar").
*/
export function tooltipSwatch(
  paint?: string | SwatchPaint,
  shape?: string,
): string {
  const {color, outline, texture}: SwatchPaint =
    typeof paint === "object" ? paint : {color: paint};
  if (!color) return "";
  if (shape === "Line") {
    const dot = SIZE * 0.6;
    return (
      `<span class="d3plus-tooltip-swatch d3plus-tooltip-swatch-line" style="${BASE} position: relative">` +
      `<span style="position: absolute; left: 0; right: 0; top: ${SIZE / 2 - 1}px; height: 2px; background: ${color}"></span>` +
      `<span style="position: absolute; left: ${(SIZE - dot) / 2}px; top: ${(SIZE - dot) / 2}px; width: ${dot}px; height: ${dot}px; border-radius: 50%; background: ${color}"></span>` +
      "</span>"
    );
  }
  const radius = shape === "Circle" ? "50%" : "1px";
  const edge = outline && swatchOutline(outline);
  const border = edge
    ? ` box-sizing: border-box; border: ${edge.strokeWidth}px solid ${edge.stroke};`
    : "";
  const pattern = texture ? textureStyle(texture) : "";
  return `<span class="d3plus-tooltip-swatch" style="${BASE} border-radius: ${radius}; background: ${color};${pattern}${border}"></span>`;
}

/**
    Leads `text` with a swatch, centered on the text however large or bold it
    is (a tooltip title, or a row's name). Just `text` without a swatch.
    @param swatch The swatch HTML, from `tooltipSwatch`.
    @param text The title or name it leads.
*/
export function withSwatch(swatch: string, text: unknown): string {
  if (!swatch) return `${text}`;
  if (text === undefined || text === null || text === false || text === "")
    return "";
  return `<span style="display: inline-flex; align-items: center">${swatch}<span>${text}</span></span>`;
}

type PaintNode = SceneNode & {
  key?: string;
  shapeType?: string;
  paint?: {stroke?: unknown; fill?: unknown};
  children?: SceneNode[];
};

/** The scene node with a given key (and `type`, when given), searching depth-first. */
function findNode(
  nodes: SceneNode[],
  key: string,
  type?: string,
): PaintNode | undefined {
  for (const node of nodes as PaintNode[]) {
    if (node.key === key && (!type || node.type === type)) return node;
    const child = node.children && findNode(node.children, key, type);
    if (child) return child;
  }
  return undefined;
}

/**
    Key suffixes of nodes drawn on behalf of another mark: a transparent hover
    target, a bar's error bar, a lollipop's stem.
*/
const OWNED_SUFFIXES = ["::hit", "::confidence", "::stem"];

/** The key of the mark a node with `key` is drawn on behalf of (see `ownerNode`). */
function ownerKey(key: string): string {
  let owner = key;
  for (const suffix of OWNED_SUFFIXES)
    while (owner.endsWith(suffix)) owner = owner.slice(0, -suffix.length);
  return owner;
}

/**
    The mark a picked scene node stands in for: the visible sibling of a
    transparent hover target (a `::hit` node), the bar of an error bar (a
    `::confidence` node), or the head of a lollipop's stem (a `::stem` node).
    Any other node is its own mark.
    @param viz The chart, whose scene holds the mark.
    @param node The picked scene node.
*/
export function ownerNode<T extends SceneNode>(
  viz: VizInstance,
  node: T | undefined,
): T | undefined {
  const key = node && (node as PaintNode).key;
  if (typeof key !== "string") return node;
  const owner = ownerKey(key);
  return owner === key
    ? node
    : (findNode(viz._chartScene || [], owner) as T | undefined) || node;
}

type PickedNode = PaintNode & {interactionGroup?: string; datum?: unknown};

/**
    The mark a picked node stands for (see `ownerNode`), as the chart (or its
    legend) draws it: hover and active emphasis restyle the painted scene's
    copies of marks, never the chart's own scene or the legend's.
*/
function drawnMark(
  viz: VizInstance,
  node: PickedNode | undefined,
): PickedNode | undefined {
  const key = node?.key;
  if (typeof key !== "string") return node;
  const legend = node!.interactionGroup === "legend";
  const scene = legend
    ? viz._legendClass
      ? [viz._legendClass.toScene()]
      : []
    : viz._chartScene || [];
  const owner = ownerKey(key);
  const type = owner === key ? node!.type : undefined;
  return (findNode(scene, owner, type) as PickedNode | undefined) ?? node;
}

/**
    A picked scene node's swatch paint: a Line's stroke, otherwise its fill
    (or stroke, for an unfilled mark), outlined by its stroke (see
    `markSwatch`). A node drawn on behalf of another mark (see `ownerNode`)
    reads that mark's paint, and a hovered or active mark its paint without
    the emphasis.
    @param viz The chart, whose scene holds the mark.
    @param node The picked scene node.
*/
export function nodeSwatch(
  viz: VizInstance,
  node: SceneNode | undefined,
): SwatchPaint {
  const n = drawnMark(viz, node as PickedNode | undefined) ?? node;
  return n
    ? markSwatch(n.paint, shapeOf(n as PickedNode), {
        background: chartBackground(viz),
      })
    : {};
}

/**
    The color a picked scene node draws in: a Line's stroke, otherwise its
    fill (or stroke, for an unfilled mark). A node drawn on behalf of another
    mark (see `ownerNode`) reads that mark's paint.
    @param viz The chart, whose scene holds the mark.
    @param node The picked scene node.
*/
export function nodeColor(
  viz: VizInstance,
  node: SceneNode | undefined,
): string | undefined {
  return nodeSwatch(viz, node).color;
}

/** A Line's stroke, otherwise a mark's fill (or stroke, for an unfilled mark). */
const paintColor = (node: PickedNode): string | undefined =>
  markSwatch(node.paint, node.shapeType).color;

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
  while (
    row &&
    typeof row === "object" &&
    row.data &&
    typeof row.data === "object" &&
    !Array.isArray(row.data)
  )
    row = row.data as typeof row;
  return row;
}

/**
    The first painted mark drawing `row`, in the legend's subtree or outside
    it, searching depth-first.
*/
function markFor(
  nodes: SceneNode[],
  row: unknown,
  legend: boolean,
): PickedNode | undefined {
  for (const node of nodes as PickedNode[]) {
    if (
      isMark(node) &&
      !`${node.key}`.endsWith("::hit") &&
      (node.interactionGroup === "legend") === legend &&
      sourceRow(node.datum) === row &&
      paintColor(node)
    )
      return node;
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
  pick:
    | {node?: PickResult["node"]; d?: unknown; isLegend?: boolean}
    | null
    | undefined,
): string {
  if (!pick || !pick.node) return "";
  const node = pick.node as PickedNode;
  const own = isMark(node) ? nodeSwatch(viz, node) : undefined;
  if (own?.color && !pick.isLegend) return tooltipSwatch(own, shapeOf(node));
  const root = viz._paintedScene?.root;
  const match = own?.color
    ? node
    : root && markFor([root], sourceRow(pick.d), !!pick.isLegend);
  if (!match) return "";
  // A legend entry names its own glyph (a Line draws as a stroke and a dot).
  const entry = (match.datum as {shape?: unknown} | undefined)?.shape;
  return tooltipSwatch(
    nodeSwatch(viz, match),
    pick.isLegend && typeof entry === "string" ? entry : shapeOf(match),
  );
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
  return tooltip.title((d: unknown, i: number) =>
    withSwatch(swatch, title(d, i)),
  );
}
