/**
    Clips a Plot's data marks to the plot area when its axis domains cut the
    data off: a `yDomain([980])` over values below 980, an `xDomain` narrower
    than the data, or a confidence band reaching past the axis. Lines, areas,
    points, bands and trend lines then stop at the axes instead of painting
    over them and their labels. (Bars clamp to the value axis on their own;
    see `clampBarConfig`.)

    The marks are split into runs: text nodes (value and line labels) and
    axis chrome drawn among the marks (Candlestick's volume axis) end a run
    and stay outside every clip, so a label placed past the plot edge still
    shows, and points (circles) run separately from lines, areas and
    rects. Each run is wrapped in a group, clipped to the plot rect when it
    reaches past it, grown by the run's widest half-stroke (for points,
    radius plus half-stroke) so a mark sitting on the plot edge still draws
    whole. A run that stays inside gets a group with no clip, so its marks
    keep their parents, and tween in place, when a redraw starts or stops
    cutting data off.

    @module
*/
import {pathBounds} from "@d3plus/math";
import type {ClipShape, SceneNode, Transform} from "@d3plus/render";

import {applyTransform} from "../features/sceneBounds.js";
import type {MaskFrame} from "./plotBreaks.js";

type Point = [number, number];

/** Key prefix of the clip groups `clipToPlotArea` wraps marks in. */
export const DOMAIN_CLIP_KEY = "plot-domain-clip";

/** How far (px) a mark may stray past the plot rect before it counts as cut off. */
const TOLERANCE = 1;

/** The plot rect, in shape coordinates. */
interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** The plot rect, in shape coordinates, and the bars' nudge past it. */
export interface ClipFrame extends MaskFrame {
  /** Half the x axis's stroke: bars nudge their ends by it, so it isn't a cut. */
  yOffset?: number;
}

const isHit = (node: SceneNode): boolean => String(node.key).endsWith("::hit");

/** Whether a node is a label or axis chrome drawn among the marks, which no clip may cut. */
const isLabel = (node: SceneNode): boolean =>
  node.type === "text" ||
  node.type === "htmlOverlay" ||
  node.interactionGroup === "axis";

/** Whether a node is a point mark, whose overhang past the edge is its radius. */
const isPoint = (node: SceneNode): boolean => node.type === "circle";

/** Half a node's visible stroke, in its own units. */
function halfStroke(node: SceneNode): number {
  const paint = node.paint;
  if (
    !paint ||
    !paint.stroke ||
    paint.stroke === "none" ||
    paint.stroke === "transparent"
  )
    return 0;
  const width = Number(paint.strokeWidth ?? 1);
  return Number.isFinite(width) && width > 0 ? width / 2 : 0;
}

/**
    How far a node may reach past the plot edge while sitting on it: half its
    stroke, plus a point's radius. Hit areas draw nothing, so they add none.
*/
function slack(node: SceneNode): number {
  if (isHit(node)) return 0;
  if (node.type === "group") return widest(node.children);
  const scale = Math.abs(node.transform?.scale ?? 1);
  const own =
    node.type === "circle" ? node.r + halfStroke(node) : halfStroke(node);
  return own * scale;
}

/** The largest `slack` among `nodes`. */
function widest(nodes: SceneNode[]): number {
  return nodes.reduce((max, node) => Math.max(max, slack(node)), 0);
}

/**
    The points that place a node's geometry, before its transform: a point's
    center (its body may overhang the edge), and every other mark's corners.
*/
function anchorPoints(node: SceneNode): Point[] {
  switch (node.type) {
    case "circle":
      return [[node.cx, node.cy]];
    case "rect":
    case "image":
      return [
        [node.x, node.y],
        [node.x + node.width, node.y + node.height],
      ];
    case "path": {
      const b = pathBounds(node.d);
      return [
        [b.x, b.y],
        [b.x + b.width, b.y + b.height],
      ];
    }
    case "line":
      return node.points;
    case "area":
      return [...node.topline, ...node.baseline];
    default:
      return [];
  }
}

/** Whether a node (or anything inside it) places geometry outside `rect`. */
function overflows(
  node: SceneNode,
  rect: Rect,
  chain: Transform[] = [],
): boolean {
  if (isHit(node)) return false;
  const next = node.transform ? [node.transform, ...chain] : chain;
  if (node.type === "group")
    return node.children.some(child => overflows(child, rect, next));
  return anchorPoints(node).some(p => {
    const [x, y] = next.reduce<Point>((q, t) => applyTransform(q, t), p);
    return (
      Number.isFinite(x) &&
      Number.isFinite(y) &&
      (x < rect.x0 || x > rect.x1 || y < rect.y0 || y > rect.y1)
    );
  });
}

/** The plot rect, in shape coordinates. */
function plotRect(frame: MaskFrame): Rect {
  const xs = frame.xRange.slice(0, 2).map(Number);
  const ys = frame.yRange.slice(0, 2).map(r => Number(r) - frame.x2Height);
  return {
    x0: Math.min(...xs),
    y0: Math.min(...ys),
    x1: Math.max(...xs),
    y1: Math.max(...ys),
  };
}

/** Grows a rect by `by` on each side, and by `dy` more vertically. */
const grow = (rect: Rect, by: number, dy = 0): Rect => ({
  x0: rect.x0 - by,
  y0: rect.y0 - by - dy,
  x1: rect.x1 + by,
  y1: rect.y1 + by + dy,
});

/**
    Wraps each run of `nodes` in a group, clipped to the plot rect when the
    run reaches past it (see the module docs).
    @param nodes The plot's data marks and their labels, in paint order.
    @param frame The plot rect, in shape coordinates, or none to clip no run
    (a zoomed view clips its content itself).
*/
export function clipToPlotArea(
  nodes: SceneNode[],
  frame?: ClipFrame,
): SceneNode[] {
  const rect = frame && plotRect(frame);
  const inside =
    rect && [rect.x0, rect.y0, rect.x1, rect.y1].every(Number.isFinite)
      ? grow(rect, TOLERANCE, frame?.yOffset ?? 0)
      : undefined;
  const out: SceneNode[] = [];
  let run: SceneNode[] = [];
  let runs = 0;
  /** The plot rect, grown to fit `run`, when the run reaches past it. */
  const runClip = (): ClipShape | undefined => {
    if (!rect || !inside || !run.some(node => overflows(node, inside)))
      return undefined;
    const r = grow(rect, widest(run));
    return {
      type: "rect",
      x: r.x0,
      y: r.y0,
      width: r.x1 - r.x0,
      height: r.y1 - r.y0,
    };
  };
  const flush = (): void => {
    if (!run.length) return;
    const clip = runClip();
    // A sorted run (Plot's circles by size, their background images above
    // them) keeps its place among its siblings: the backends order each
    // group's children by `z`.
    const zs = run
      .map(node => node.z)
      .filter((z): z is number => typeof z === "number");
    out.push({
      type: "group",
      key: `${DOMAIN_CLIP_KEY}-${runs++}`,
      ...(clip ? {clip} : {}),
      children: run,
      ...(zs.length ? {z: Math.min(...zs)} : {}),
    });
    run = [];
  };
  for (const node of nodes) {
    if (isLabel(node)) {
      flush();
      out.push(node);
      continue;
    }
    if (run.length && isPoint(run[0]) !== isPoint(node)) flush();
    run.push(node);
  }
  flush();
  return out;
}

/** A clip group's key, also once a small-multiples panel prefixes it. */
const CLIP_KEY_PATTERN = new RegExp(`(^|/)${DOMAIN_CLIP_KEY}-\\d+$`);

/** Whether a node is a group `clipToPlotArea` wrapped marks in. */
export const isDomainClip = (node: SceneNode): boolean =>
  node.type === "group" && CLIP_KEY_PATTERN.test(String(node.key));

/** `nodes` with each of `clipToPlotArea`'s clip groups replaced by the marks inside it. */
export function unwrapDomainClips(nodes: SceneNode[]): SceneNode[] {
  return nodes.some(isDomainClip)
    ? nodes.flatMap(node =>
        node.type === "group" && isDomainClip(node) ? node.children : [node],
      )
    : nodes;
}
