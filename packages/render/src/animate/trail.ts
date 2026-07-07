import {rgb} from "d3-color";

import {gradientToken} from "../scene.js";
import type {CircleNode, RectNode, SceneNode} from "../scene.js";

/**
    Motion-trail geometry shared by both backends. A trail is a tapering "cone"
    swept from a mark's previous position (the tail, at its pre-transition size)
    to its current interpolated position (the head), filled with a gradient that
    fades from the mark's color at the head to transparent at the tail.

    The cone traces the mark's *swept silhouette* — the outline the shape carves
    as it moves — not a fixed-width streak. For a rect that's the convex hull of
    its corners at both ends, so a square sliding on a diagonal tapers corner to
    corner, matching what the eye sees; a circle keeps its radius at any angle.
    The Canvas backend rebuilds the cone each frame via interpolateScene; the SVG
    backend tweens the same path `d`.
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

/** Fade length, in step-segments, for a persistent trail (`true` = a long tail). */
const TRAIL_PERSIST_FOREVER = 30;
export function persistFadeLength(persist: number | boolean): number {
  return persist === true ? TRAIL_PERSIST_FOREVER : Math.max(1, Math.floor(Number(persist) || 0));
}

/**
    Alpha (0…TRAIL_MAX) at a point `p` step-segments behind the animating head of
    a persistent trail: full at the head, fading linearly to transparent at the
    fade length. Because it depends only on `p`, adjacent segments that share a
    turn vertex agree there, so the fade reads continuous across the bend.
*/
export function persistAlpha(p: number, persist: number | boolean): number {
  return TRAIL_MAX * Math.max(0, 1 - p / persistFadeLength(persist));
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

export type Pt = [number, number];
interface Cone {d: string; box: {x: number; y: number; w: number; h: number}}

const fmt = (p: Pt): string => `${p[0]},${p[1]}`;

/** Bounding box of a point set. */
function bbox(pts: Pt[]): {x: number; y: number; w: number; h: number} {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  return {x: minX, y: minY, w: maxX - minX || 1, h: maxY - minY || 1};
}

/** A closed straight-edged SVG path through the points, plus their bounding box. */
function pathBox(pts: Pt[]): Cone {
  return {d: `M${pts.map(fmt).join("L")}Z`, box: bbox(pts)};
}

/** The four world-space corners of a rect centered at (cx,cy), rotated `rotate`°. */
function rectCorners(cx: number, cy: number, hw: number, hh: number, rotate: number): Pt[] {
  const th = rotate * DEG, c = Math.cos(th), s = Math.sin(th);
  return ([[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]] as Pt[]).map(
    ([x, y]) => [cx + x * c - y * s, cy + x * s + y * c] as Pt,
  );
}

/** Convex hull (monotone chain, CCW) of a small point set; drops collinear points. */
function convexHull(points: Pt[]): Pt[] {
  const pts = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (seq: Pt[]): Pt[] => {
    const h: Pt[] = [];
    for (const p of seq) {
      while (h.length >= 2 && cross(h[h.length - 2], h[h.length - 1], p) <= 0) h.pop();
      h.push(p);
    }
    h.pop();
    return h;
  };
  return half(pts).concat(half(pts.slice().reverse()));
}

/**
    The cone path + bbox at transition progress `t` — the mark's swept silhouette
    from its previous size at the tail to its current interpolated size at the head.

    A circle's silhouette edges are the two lines tangent to both ends, always
    perpendicular offsets through each center at any angle; the tail is closed
    with a semicircle of the previous radius, so the trail reads as a comet
    emerging from the mark's old outline (the head stays open — the mark covers
    it). A rect's exact swept silhouette is the convex hull of its corners at
    both ends, so every edge runs true corner-to-corner rather than as a plain
    trapezoid — correct at any travel angle, not only 0/45/90°.
*/
export function coneAt(
  shape: TrailShape, A: [number, number], aDims: number[],
  B: [number, number], bDims: number[], rotate: number, t: number,
): Cone {
  const hx = lerp(A[0], B[0], t), hy = lerp(A[1], B[1], t);
  const hDims = aDims.map((v, i) => lerp(v, bDims[i], t));
  if (shape === "circle") {
    const dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy) || 1;
    const px = -dy / len, py = dx / len, mx = dx / len, my = dy / len;
    const aR = aDims[0], hR = hDims[0];
    const tp: Pt = [A[0] + px * aR, A[1] + py * aR];
    const hp: Pt = [hx + px * hR, hy + py * hR];
    const hm: Pt = [hx - px * hR, hy - py * hR];
    const tm: Pt = [A[0] - px * aR, A[1] - py * aR];
    // Sweep-flag 0 bows the arc behind A (away from the head); it spans the
    // tail chord tm→tp, so the trail's back is a true half of the old circle.
    const d = `M${fmt(tp)}L${fmt(hp)}L${fmt(hm)}L${fmt(tm)}A${aR},${aR} 0 0 0 ${fmt(tp)}Z`;
    const back: Pt = [A[0] - mx * aR, A[1] - my * aR];
    return {d, box: bbox([tp, hp, hm, tm, back])};
  }
  return pathBox(convexHull([
    ...rectCorners(A[0], A[1], aDims[0], aDims[1], rotate),
    ...rectCorners(hx, hy, hDims[0], hDims[1], rotate),
  ]));
}

/**
    The trail's fill: a gradient (objectBoundingBox units) along the travel
    direction, from `tailAlpha` of the mark's color at the tail to `headAlpha` at
    the head (defaults: transparent → opaque, the ephemeral trail). For a straight
    move the tail/head sit at opposite bbox corners, so the endpoints depend only
    on the travel direction's signs and stay constant across the transition.
    Persistent trails pass per-segment alphas so the whole path fades continuously.
*/
export function trailGradient(
  dx: number, dy: number, color: string, tailAlpha = 0, headAlpha = 1,
): string {
  const fx = dx >= 0 ? 0 : 1, fy = dy >= 0 ? 0 : 1;
  const c = rgb(color);
  const at = (a: number): string => {
    if (a >= 1) return color; // fully opaque → the raw color token
    if (Number.isNaN(c.r)) return a <= 0 ? "transparent" : color;
    return `rgba(${c.r},${c.g},${c.b},${a})`;
  };
  return gradientToken({
    type: "linear",
    from: [fx, fy],
    to: [1 - fx, 1 - fy],
    stops: [{offset: 0, color: at(tailAlpha)}, {offset: 1, color: at(headAlpha)}],
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
