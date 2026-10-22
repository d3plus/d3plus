import type {ClipShape, LineNode, SceneNode, TextNode} from "../scene.js";
import {apply} from "./transform.js";
import type {Mat} from "./transform.js";
import {pathFor, pathHit} from "./canvasNodePaint.js";

type Ctx = CanvasRenderingContext2D;

/** An ancestor group's clip, with the inverse of that group's accumulated transform. */
export interface ClipEntry {
  clip: ClipShape;
  inverse: Mat;
}

/** Whether a device-space point falls inside a group's clip (which paints nothing outside it). */
export function inClip(
  ctx: Ctx | undefined,
  {clip, inverse}: ClipEntry,
  device: [number, number],
): boolean {
  const [lx, ly] = apply(inverse, device);
  if (clip.type === "rect")
    return (
      lx >= clip.x &&
      lx <= clip.x + clip.width &&
      ly >= clip.y &&
      ly <= clip.y + clip.height
    );
  return ctx ? ctx.isPointInPath(new Path2D(clip.d), lx, ly) : true;
}

/**
    Whether a point in a node's local space hits it. Path and area hits need
    a context to test against and miss without one.
*/
export function hitTest(
  ctx: Ctx | undefined,
  node: SceneNode,
  lx: number,
  ly: number,
): boolean {
  switch (node.type) {
    case "rect":
      return (
        lx >= node.x &&
        lx <= node.x + node.width &&
        ly >= node.y &&
        ly <= node.y + node.height
      );
    case "circle":
      return (lx - node.cx) ** 2 + (ly - node.cy) ** 2 <= node.r ** 2;
    case "path":
      return ctx ? pathHit(ctx, node, lx, ly) : false;
    case "area":
      if (!ctx) return false;
      pathFor(ctx, node);
      return ctx.isPointInPath(lx, ly);
    case "line":
      return hitLine(node, lx, ly);
    case "image":
      return (
        lx >= node.x &&
        lx <= node.x + node.width &&
        ly >= node.y &&
        ly <= node.y + node.height
      );
    case "text":
      return hitText(node, lx, ly);
    default:
      return false;
  }
}

/** Hits a polyline when the point is within (strokeWidth/2 + 2px) of any segment. */
export function hitLine(node: LineNode, lx: number, ly: number): boolean {
  const tol = (node.paint?.strokeWidth ?? 1) / 2 + 2;
  const pts = node.points;
  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i - 1];
    const [x2, y2] = pts[i];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    const t = len2
      ? Math.max(0, Math.min(1, ((lx - x1) * dx + (ly - y1) * dy) / len2))
      : 0;
    const px = x1 + t * dx;
    const py = y1 + t * dy;
    if ((lx - px) ** 2 + (ly - py) ** 2 <= tol * tol) return true;
  }
  return false;
}

/** Loose bounding-box hit test over a text node's laid-out lines. */
export function hitText(node: TextNode, lx: number, ly: number): boolean {
  const size = node.font?.size ?? 12;
  const anchor = node.font?.anchor;
  for (const ln of node.lines) {
    const left =
      anchor === "middle"
        ? ln.x - ln.width / 2
        : anchor === "end"
          ? ln.x - ln.width
          : ln.x;
    if (
      lx >= left &&
      lx <= left + ln.width &&
      ly >= ln.y - size &&
      ly <= ln.y + size * 0.3
    )
      return true;
  }
  return false;
}
