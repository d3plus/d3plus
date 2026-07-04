import {rgb} from "d3-color";

import {gradientToken} from "../scene.js";
import type {CircleNode, RectNode, SceneNode} from "../scene.js";

/**
    Motion-trail geometry shared by both backends. A trail is a tapering "cone"
    swept from a mark's previous position (the tail, at its pre-transition size)
    to its current interpolated position (the head), filled with a gradient that
    fades from the mark's color at the head to transparent at the tail.

    The cone's width at each end is the mark's silhouette width *perpendicular to
    the direction of travel* — not a fixed radius. So a square sliding at 45°
    presents its corner-to-corner diagonal, matching what the eye sees, while a
    circle is the same radius at any angle. The Canvas backend rebuilds the cone
    each frame via interpolateScene; the SVG backend tweens the same path `d`.
*/

const DEG = Math.PI / 180;
/** Peak opacity of a trail's head; scales down to 0 as the mark arrives. */
const TRAIL_MAX = 0.6;
/** Below this travel distance a trail isn't worth drawing. */
export const TRAIL_MIN_DISTANCE = 1;

/** A trail's overall opacity at transition progress `t` — fades out on arrival. */
export function trailOpacity(t: number): number {
  return TRAIL_MAX * (1 - t);
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export type TrailShape = "circle" | "rect";

/** The trail-relevant geometry read off a mark node: shape + size + placement. */
export interface TrailParts {
  shape: TrailShape;
  /** circle: [r]; rect: [halfWidth, halfHeight]. */
  dims: number[];
  rotate: number;
  x: number;
  y: number;
  color: string | undefined;
}

/** A trail swept between two frames of one mark. */
export interface TrailSpec {
  key: string | number;
  shape: TrailShape;
  A: [number, number];
  B: [number, number];
  aDims: number[];
  bDims: number[];
  rotate: number;
  color: string;
}

/**
    Half-width of a mark's silhouette along the perpendicular direction (px, py).
    A circle is isotropic (its radius); a rect projects its half-extents onto the
    perpendicular after rotating it into the rect's own frame, so the width grows
    toward the diagonal as the rect turns relative to its motion.
*/
function perpHalf(shape: TrailShape, dims: number[], px: number, py: number, rotate: number): number {
  if (shape === "circle") return dims[0];
  const th = rotate * DEG, c = Math.cos(th), s = Math.sin(th);
  const lx = px * c + py * s, ly = -px * s + py * c; // p rotated into the rect's local frame
  return dims[0] * Math.abs(lx) + dims[1] * Math.abs(ly);
}

/** A tapered quad from the tail chord (half-width aHalf at A) to the head chord (hHalf at H). */
function coneGeometry(
  ax: number, ay: number, aHalf: number, hx: number, hy: number, hHalf: number,
): {d: string; box: {x: number; y: number; w: number; h: number}} {
  const dx = hx - ax, dy = hy - ay;
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len, py = dx / len;
  const t1x = ax + px * aHalf, t1y = ay + py * aHalf;
  const t2x = ax - px * aHalf, t2y = ay - py * aHalf;
  const h1x = hx + px * hHalf, h1y = hy + py * hHalf;
  const h2x = hx - px * hHalf, h2y = hy - py * hHalf;
  const d = `M${t1x},${t1y}L${h1x},${h1y}L${h2x},${h2y}L${t2x},${t2y}Z`;
  const xs = [t1x, t2x, h1x, h2x], ys = [t1y, t2y, h1y, h2y];
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  return {d, box: {x: minX, y: minY, w: maxX - minX || 1, h: maxY - minY || 1}};
}

/**
    The cone path + bbox at transition progress `t`, sized to the mark's
    silhouette perpendicular to travel at each end (tail at the previous size,
    head at the current interpolated size).
*/
export function coneAt(
  shape: TrailShape, A: [number, number], aDims: number[],
  B: [number, number], bDims: number[], rotate: number, t: number,
): {d: string; box: {x: number; y: number; w: number; h: number}} {
  const hx = lerp(A[0], B[0], t), hy = lerp(A[1], B[1], t);
  const headDims = aDims.map((v, i) => lerp(v, bDims[i], t));
  const dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy) || 1;
  const px = -dy / len, py = dx / len;
  const aHalf = perpHalf(shape, aDims, px, py, rotate);
  const hHalf = perpHalf(shape, headDims, px, py, rotate);
  return coneGeometry(A[0], A[1], aHalf, hx, hy, hHalf);
}

/**
    The trail's fill: a gradient (objectBoundingBox units) fading from transparent
    at the tail to the mark's color at the head. For a straight move the tail/head
    sit at opposite bbox corners, so the endpoints depend only on the travel
    direction's signs and stay constant across the transition.
*/
export function trailGradient(dx: number, dy: number, color: string): string {
  const fx = dx >= 0 ? 0 : 1, fy = dy >= 0 ? 0 : 1;
  const c = rgb(color);
  const clear = Number.isNaN(c.r) ? "transparent" : `rgba(${c.r},${c.g},${c.b},0)`;
  return gradientToken({
    type: "linear",
    from: [fx, fy],
    to: [1 - fx, 1 - fy],
    stops: [{offset: 0, color: clear}, {offset: 1, color}],
  });
}

/** Reads the trail-relevant geometry off a mark node, or null if it can't trail. */
export function trailPartsFromNode(node: SceneNode): TrailParts | null {
  const x = node.transform?.x ?? 0, y = node.transform?.y ?? 0;
  const color = node.paint?.fill;
  if (node.type === "circle") {
    return {shape: "circle", dims: [(node as CircleNode).r ?? 0], rotate: 0, x, y, color};
  }
  if (node.type === "rect") {
    const r = node as RectNode;
    return {shape: "rect", dims: [(r.width ?? 0) / 2, (r.height ?? 0) / 2], rotate: node.transform?.rotate ?? 0, x, y, color};
  }
  return null;
}

/** Builds the trail cone scene node for the Canvas backend at progress `t`. */
export function trailNode(spec: TrailSpec, t: number): SceneNode | null {
  if (Math.hypot(spec.B[0] - spec.A[0], spec.B[1] - spec.A[1]) < TRAIL_MIN_DISTANCE) return null;
  const {d, box} = coneAt(spec.shape, spec.A, spec.aDims, spec.B, spec.bDims, spec.rotate, t);
  return {
    type: "path",
    key: `${spec.key}__trail`,
    interactive: false,
    d,
    gradientBounds: box,
    paint: {
      fill: trailGradient(spec.B[0] - spec.A[0], spec.B[1] - spec.A[1], spec.color),
      opacity: trailOpacity(t),
    },
  } as unknown as SceneNode;
}
