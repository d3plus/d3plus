import {area as d3area, line as d3line} from "d3-shape";

import {curveFor} from "../paths.js";
import {parseGradient} from "../scene.js";
import type {AreaNode, LineNode, SceneNode} from "../scene.js";

type Ctx = CanvasRenderingContext2D;

/** Issues the current-path commands for a node's geometry into the context. */
/**
    Hit-tests a `path` node: its fill region first, then — for a stroked/unfilled
    path (a Line, or its fat transparent hit area) — the stroke at the node's
    width. Assumes an identity CTM (as at pick time), so `lineWidth` shares the
    path's local units.
*/
export function pathHit(
  ctx: Ctx,
  node: {d: string; paint?: {strokeWidth?: number}},
  lx: number,
  ly: number,
): boolean {
  const p = new Path2D(node.d);
  if (ctx.isPointInPath(p, lx, ly)) return true;
  const sw = node.paint?.strokeWidth;
  if (!sw) return false;
  ctx.lineWidth = sw;
  return ctx.isPointInStroke(p, lx, ly);
}

export function pathFor(ctx: Ctx, node: SceneNode): void {
  switch (node.type) {
    case "rect":
      ctx.beginPath();
      ctx.rect(node.x, node.y, node.width, node.height);
      break;
    case "circle":
      ctx.beginPath();
      ctx.arc(node.cx, node.cy, node.r, 0, 2 * Math.PI);
      break;
    case "line": {
      const n = node as LineNode;
      const gen = d3line<[number, number]>()
        .curve(curveFor(n.curve))
        .x(p => p[0])
        .y(p => p[1])
        .context(ctx);
      ctx.beginPath();
      gen(n.points);
      break;
    }
    case "area": {
      const n = node as AreaNode;
      const gen = d3area<number>()
        .curve(curveFor(n.curve))
        .x((_, i) => n.topline[i][0])
        .y0((_, i) => (n.baseline[i] ? n.baseline[i][1] : 0))
        .y1((_, i) => n.topline[i][1])
        .context(ctx);
      ctx.beginPath();
      gen(n.topline.map((_, i) => i));
      break;
    }
  }
}

/**
    Degrades a fill to a solid color the Canvas backend can paint. Texture fills
    ("pattern:<json>") fall back to the texture's background/fill color, since
    textures.js generates SVG patterns the canvas cannot consume; gradient fills
    ("gradient:<json>") fall back to the first stop color for contexts that have
    no bounding box to scale a CanvasGradient against (stroke, text). The fill of
    a bbox-bearing node is painted as a real gradient by {@link paint}.
*/
// Token-resolution cache. Without it, `solidFill` runs JSON.parse on
// every fill/stroke/text-fill call for every tokenized node every
// paint — a texture/gradient-heavy chart pays the parse cost every
// frame. SvgRenderer caches via `_textureDefs`; this is the canvas
// equivalent.
const _solidFillCache = new Map<string, string>();
export function solidFill(fill?: string): string | undefined {
  if (!fill) return fill;
  if (fill.startsWith("gradient:")) {
    const cached = _solidFillCache.get(fill);
    if (cached !== undefined) return cached;
    const g = parseGradient(fill);
    const resolved = g?.stops[0]?.color ?? "#ccc";
    _solidFillCache.set(fill, resolved);
    return resolved;
  }
  if (!fill.startsWith("pattern:")) return fill;
  const cached = _solidFillCache.get(fill);
  if (cached !== undefined) return cached;
  let resolved = "#ccc";
  try {
    const cfg = JSON.parse(fill.slice("pattern:".length));
    resolved = cfg.background || cfg.fill || cfg.stroke || "#ccc";
  } catch {
    // resolved stays "#ccc"
  }
  _solidFillCache.set(fill, resolved);
  return resolved;
}

/** The 0–1 objectBoundingBox anchor box for nodes a CanvasGradient can scale to. */
function gradientBox(
  node: SceneNode,
): {x: number; y: number; w: number; h: number} | null {
  // A node may carry its own box (e.g. a trail cone path, which Canvas can't
  // measure from `d`); prefer it.
  if (node.gradientBounds) return node.gradientBounds;
  if (node.type === "rect")
    return {x: node.x, y: node.y, w: node.width, h: node.height};
  if (node.type === "circle")
    return {x: node.cx - node.r, y: node.cy - node.r, w: node.r * 2, h: node.r * 2};
  return null;
}

/**
    Resolves a token (`pattern:<json>`) to a tiled `CanvasPattern`, or null when
    it isn't ready yet (rasterization is async — see CanvasRenderer).
*/
export type PatternResolver = (token: string) => CanvasPattern | null;

/**
    Resolves a node's fill to a Canvas-paintable style. A `gradient:<json>` token
    on a node with a bounding box becomes a CanvasGradient scaled to that box; a
    `pattern:<json>` token becomes a tiled CanvasPattern once `resolvePattern`
    has it ready; everything else degrades to a solid color via {@link solidFill}.
*/
function canvasFillStyle(
  ctx: Ctx,
  node: SceneNode,
  fill: string,
  resolvePattern?: PatternResolver,
): string | CanvasGradient | CanvasPattern {
  if (fill.startsWith("gradient:")) {
    const g = parseGradient(fill);
    // userSpaceOnUse: from/to are absolute scene coordinates (no box scaling).
    if (g && g.units === "userSpaceOnUse") {
      const grad = ctx.createLinearGradient(g.from[0], g.from[1], g.to[0], g.to[1]);
      for (const {offset, color} of g.stops)
        grad.addColorStop(Math.max(0, Math.min(1, offset)), color);
      return grad;
    }
    const box = g && gradientBox(node);
    if (g && box) {
      const grad = ctx.createLinearGradient(
        box.x + g.from[0] * box.w,
        box.y + g.from[1] * box.h,
        box.x + g.to[0] * box.w,
        box.y + g.to[1] * box.h,
      );
      for (const {offset, color} of g.stops)
        grad.addColorStop(Math.max(0, Math.min(1, offset)), color);
      return grad;
    }
  }
  if (resolvePattern && fill.startsWith("pattern:")) {
    const pat = resolvePattern(fill);
    if (pat) return pat;
    // Not rasterized yet: paint the texture's solid fallback this frame; the
    // renderer repaints once the tile is ready.
  }
  return solidFill(fill) ?? "none";
}

/**
    Fills and/or strokes the context's current path (or a Path2D) per the node's
    paint. `cssScale` is the node's on-screen scale relative to CSS pixels (the
    accumulated transform scale with the device-pixel-ratio base divided out) —
    used to honor `vector-effect: non-scaling-stroke`, which holds a stroke at a
    constant screen width regardless of an ancestor zoom/scale. It's 1 when
    nothing above the node scales, so unzoomed output is unchanged.
*/
export function paint(
  ctx: Ctx,
  node: SceneNode,
  alpha: number,
  path?: Path2D,
  resolvePattern?: PatternResolver,
  cssScale = 1,
): void {
  const p = node.paint || {};
  if (p.fill && p.fill !== "none") {
    ctx.globalAlpha = alpha * (p.fillOpacity ?? 1);
    ctx.fillStyle = canvasFillStyle(ctx, node, p.fill, resolvePattern);
    if (path) ctx.fill(path);
    else ctx.fill();
  }
  if (p.stroke && p.stroke !== "none" && (p.strokeWidth ?? 0) > 0) {
    ctx.globalAlpha = alpha * (p.strokeOpacity ?? 1);
    ctx.strokeStyle = p.stroke;
    ctx.lineWidth =
      p.vectorEffect === "non-scaling-stroke" && cssScale
        ? (p.strokeWidth as number) / cssScale
        : (p.strokeWidth as number);
    ctx.setLineDash(p.strokeDasharray ?? []);
    if (p.strokeLinecap) ctx.lineCap = p.strokeLinecap;
    if (path) ctx.stroke(path);
    else ctx.stroke();
  }
}
