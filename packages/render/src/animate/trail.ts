import {rgb} from "d3-color";

import {gradientToken} from "../scene.js";
import type {SceneNode} from "../scene.js";

/**
    Motion-trail geometry shared by both backends. A trail is a tapering "cone"
    swept from a point's previous position (the tail, at its pre-transition
    size) to its current interpolated position (the head, at its current size),
    filled with a gradient that fades from the point's color at the head to
    transparent at the tail. The Canvas backend rebuilds the cone each frame via
    interpolateScene; the SVG backend tweens the same path `d` over its
    transition. Keeping the math here keeps the two in lockstep.
*/

/** The endpoints a trail is swept between, plus the point's color. */
export interface TrailSpec {
  key: string | number;
  /** Tail (previous) center + radius. */
  ax: number;
  ay: number;
  aR: number;
  /** Head (target) center + radius. */
  bx: number;
  by: number;
  bR: number;
  color: string;
}

/** Peak opacity of a trail's head; scales down to 0 as the point arrives. */
const TRAIL_MAX = 0.6;
/** Below this travel distance a trail isn't worth drawing. */
export const TRAIL_MIN_DISTANCE = 1;

/** A trail's overall opacity at transition progress `t` — fades out on arrival. */
export function trailOpacity(t: number): number {
  return TRAIL_MAX * (1 - t);
}

/**
    A tapered quad from the tail (center A, radius aR) to the head (center H,
    radius hR), plus its axis-aligned bounding box. The quad's two ends are
    chords perpendicular to the A→H axis, so it reads as a cone widening (or
    narrowing) from the old size to the current one.
*/
export function coneGeometry(
  ax: number, ay: number, aR: number, hx: number, hy: number, hR: number,
): {d: string; box: {x: number; y: number; w: number; h: number}} {
  const dx = hx - ax, dy = hy - ay;
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len, py = dx / len; // unit perpendicular to the axis
  const t1x = ax + px * aR, t1y = ay + py * aR;
  const t2x = ax - px * aR, t2y = ay - py * aR;
  const h1x = hx + px * hR, h1y = hy + py * hR;
  const h2x = hx - px * hR, h2y = hy - py * hR;
  const d = `M${t1x},${t1y}L${h1x},${h1y}L${h2x},${h2y}L${t2x},${t2y}Z`;
  const xs = [t1x, t2x, h1x, h2x], ys = [t1y, t2y, h1y, h2y];
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  return {d, box: {x: minX, y: minY, w: maxX - minX || 1, h: maxY - minY || 1}};
}

/**
    The trail's fill: a linear gradient (in objectBoundingBox units) fading from
    transparent at the tail to the point's color at the head. Because A and H sit
    at opposite corners of the cone's bbox for a straight move, the endpoints
    depend only on the travel direction's signs and stay constant across the
    transition — so one gradient serves every frame.
*/
export function trailGradient(dx: number, dy: number, color: string): string {
  const fx = dx >= 0 ? 0 : 1, fy = dy >= 0 ? 0 : 1; // tail corner
  const c = rgb(color);
  const clear = Number.isNaN(c.r) ? "transparent" : `rgba(${c.r},${c.g},${c.b},0)`;
  return gradientToken({
    type: "linear",
    from: [fx, fy],
    to: [1 - fx, 1 - fy],
    stops: [
      {offset: 0, color: clear},
      {offset: 1, color},
    ],
  });
}

/**
    Builds the trail cone scene node for a point at transition progress `t`
    (0 = start, 1 = arrived). The head rides the point's interpolated position
    and size; the tail stays pinned at the previous position and size. Returns
    null when the point barely moves. The node carries `gradientBounds` so the
    Canvas backend can scale the (path) gradient without parsing `d`.
*/
export function trailNode(spec: TrailSpec, t: number): SceneNode | null {
  const {ax, ay, aR, bx, by, bR, color, key} = spec;
  if (Math.hypot(bx - ax, by - ay) < TRAIL_MIN_DISTANCE) return null;
  const hx = ax + (bx - ax) * t, hy = ay + (by - ay) * t;
  const hR = aR + (bR - aR) * t;
  const {d, box} = coneGeometry(ax, ay, aR, hx, hy, hR);
  return {
    type: "path",
    key: `${key}__trail`,
    interactive: false,
    d,
    gradientBounds: box,
    paint: {fill: trailGradient(bx - ax, by - ay, color), opacity: trailOpacity(t)},
  } as unknown as SceneNode;
}
