import {area as d3area, line as d3line} from "d3-shape";

import {curveFor} from "../paths.js";
import type {AreaNode, LineNode, SceneNode} from "../scene.js";

type Ctx = CanvasRenderingContext2D;

/** Issues the current-path commands for a node's geometry into the context. */
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
    textures.js generates SVG patterns the canvas cannot consume.
*/
// Pattern-token resolution cache. Without it, `solidFill` runs
// JSON.parse on every fill/stroke/text-fill call for every textured
// node every paint — a texture-heavy chart pays the parse cost every
// frame. SvgRenderer caches via `_textureDefs`; this is the canvas
// equivalent.
const _solidFillCache = new Map<string, string>();
export function solidFill(fill?: string): string | undefined {
  if (!fill || !fill.startsWith("pattern:")) return fill;
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

/** Fills and/or strokes the context's current path (or a Path2D) per the node's paint. */
export function paint(ctx: Ctx, node: SceneNode, alpha: number, path?: Path2D): void {
  const p = node.paint || {};
  const fill = solidFill(p.fill);
  if (fill && fill !== "none") {
    ctx.globalAlpha = alpha * (p.fillOpacity ?? 1);
    ctx.fillStyle = fill;
    if (path) ctx.fill(path);
    else ctx.fill();
  }
  if (p.stroke && p.stroke !== "none" && (p.strokeWidth ?? 0) > 0) {
    ctx.globalAlpha = alpha * (p.strokeOpacity ?? 1);
    ctx.strokeStyle = p.stroke;
    ctx.lineWidth = p.strokeWidth as number;
    ctx.setLineDash(p.strokeDasharray ?? []);
    if (p.strokeLinecap) ctx.lineCap = p.strokeLinecap;
    if (path) ctx.stroke(path);
    else ctx.stroke();
  }
}
