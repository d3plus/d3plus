/**
    Pure geometry for link labels: where on a link its label sits (the
    middle of its length) and which way the link runs there, the angle that
    keeps text upright, and the overlap tests that hide labels which would
    cover each other or a node.
*/

import type {CircleLabelBox, LabelCircle} from "./circleLabelPlacement.js";
import {boxHitsCircle, boxesOverlap} from "./circleLabelPlacement.js";

/** A point on a link and the direction the link runs there, in radians. */
export interface LinkAnchor {
  x: number;
  y: number;
  angle: number;
}

type Point = [number, number];

/**
    The middle of a straight link's visible length, between the edges of the
    circles of radius `r0` and `r1` around its ends, and its direction.
*/
export function segmentMidpoint(
  a: Point,
  b: Point,
  r0 = 0,
  r1 = 0,
): LinkAnchor {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  if (!length) return {x: a[0], y: a[1], angle};
  // Half the visible run past the start edge.
  const t = (r0 + Math.max(0, length - r0 - r1) / 2) / length;
  return {x: a[0] + dx * t, y: a[1] + dy * t, angle};
}

/** The point at `t` (0–1) along a cubic Bézier curve. */
export function cubicPoint(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number,
): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return [
    a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
    a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
  ];
}

/** The direction (radians) a cubic Bézier curve runs at `t`. */
export function cubicAngle(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number,
): number {
  const u = 1 - t;
  const dx =
    3 * u * u * (p1[0] - p0[0]) +
    6 * u * t * (p2[0] - p1[0]) +
    3 * t * t * (p3[0] - p2[0]);
  const dy =
    3 * u * u * (p1[1] - p0[1]) +
    6 * u * t * (p2[1] - p1[1]) +
    3 * t * t * (p3[1] - p2[1]);
  // A degenerate end (a control point on its end) runs toward the far end.
  if (!dx && !dy) return Math.atan2(p3[1] - p0[1], p3[0] - p0[0]);
  return Math.atan2(dy, dx);
}

/**
    The point halfway along a cubic Bézier curve's length (not at `t` = 0.5,
    which bunches toward the tighter end), and its direction there.
    @param steps The number of chords the curve's length is measured in.
*/
export function cubicMidpoint(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  steps = 64,
): LinkAnchor {
  const lengths = [0];
  let prev = p0;
  for (let k = 1; k <= steps; k++) {
    const p = cubicPoint(p0, p1, p2, p3, k / steps);
    lengths.push(lengths[k - 1] + Math.hypot(p[0] - prev[0], p[1] - prev[1]));
    prev = p;
  }
  const half = lengths[steps] / 2;
  let k = 1;
  while (k < steps && lengths[k] < half) k++;
  const span = lengths[k] - lengths[k - 1];
  const t = (k - 1 + (span ? (half - lengths[k - 1]) / span : 0)) / steps;
  const [x, y] = cubicPoint(p0, p1, p2, p3, t);
  return {x, y, angle: cubicAngle(p0, p1, p2, p3, t)};
}

/**
    A direction (radians) as the rotation (degrees) that keeps text running
    along it upright: within -90° (reading bottom to top) and 90°.
*/
export function uprightAngle(radians: number): number {
  let deg = (radians * 180) / Math.PI;
  deg = ((((deg + 90) % 180) + 180) % 180) - 90;
  // -0 reads as 0.
  return deg === 0 ? 0 : Math.round(deg * 1e6) / 1e6;
}

/** A label's box: its center, its size, and its rotation in degrees about its center. */
export interface LinkLabelBox {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
}

/** A label box's four corners, clockwise from its top-left. */
export function labelCorners(box: LinkLabelBox): Point[] {
  const rad = (box.angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const hw = box.width / 2;
  const hh = box.height / 2;
  return (
    [
      [-hw, -hh],
      [hw, -hh],
      [hw, hh],
      [-hw, hh],
    ] as Point[]
  ).map(([x, y]) => [box.x + x * cos - y * sin, box.y + x * sin + y * cos]);
}

/** Whether two convex polygons overlap (separating axis test; touching edges don't count). */
function polygonsOverlap(a: Point[], b: Point[]): boolean {
  for (const poly of [a, b]) {
    for (let k = 0; k < poly.length; k++) {
      const p = poly[k];
      const q = poly[(k + 1) % poly.length];
      const nx = q[1] - p[1];
      const ny = p[0] - q[0];
      const project = (pts: Point[]) => {
        let min = Infinity;
        let max = -Infinity;
        for (const [x, y] of pts) {
          const v = x * nx + y * ny;
          if (v < min) min = v;
          if (v > max) max = v;
        }
        return [min, max];
      };
      const [amin, amax] = project(a);
      const [bmin, bmax] = project(b);
      const eps = 1e-9 * Math.hypot(nx, ny);
      if (amax <= bmin + eps || bmax <= amin + eps) return false;
    }
  }
  return true;
}

/** A label box without rotation, as a top-left box. */
const flatBox = (box: LinkLabelBox): CircleLabelBox => ({
  x: box.x - box.width / 2,
  y: box.y - box.height / 2,
  width: box.width,
  height: box.height,
});

/** Whether two label boxes overlap. */
export function labelsOverlap(a: LinkLabelBox, b: LinkLabelBox): boolean {
  if (!a.angle && !b.angle) return boxesOverlap(flatBox(a), flatBox(b));
  return polygonsOverlap(labelCorners(a), labelCorners(b));
}

/** Whether a label box overlaps a circle. */
export function labelHitsCircle(
  box: LinkLabelBox,
  circle: LabelCircle,
): boolean {
  // The circle's center in the label's own (unrotated) frame.
  const rad = (-box.angle * Math.PI) / 180;
  const dx = circle.x - box.x;
  const dy = circle.y - box.y;
  const local = {
    x: dx * Math.cos(rad) - dy * Math.sin(rad),
    y: dx * Math.sin(rad) + dy * Math.cos(rad),
    r: circle.r,
  };
  return boxHitsCircle(flatBox({...box, x: 0, y: 0}), local);
}

/** Whether a label box overlaps an axis-aligned box (such as a Sankey node). */
export function labelHitsBox(box: LinkLabelBox, rect: CircleLabelBox): boolean {
  if (!box.angle) return boxesOverlap(flatBox(box), rect);
  return polygonsOverlap(labelCorners(box), [
    [rect.x, rect.y],
    [rect.x + rect.width, rect.y],
    [rect.x + rect.width, rect.y + rect.height],
    [rect.x, rect.y + rect.height],
  ]);
}

/** The nodes (and node labels) link labels must stay clear of. */
export interface LabelObstacles {
  circles?: LabelCircle[];
  boxes?: CircleLabelBox[];
  /** Other labels' boxes, which may be rotated. */
  labels?: LinkLabelBox[];
}

/**
    The labels that fit, in the order given (earlier labels win): each one
    that overlaps no node and no label already kept.
*/
export function placeLinkLabels<T extends {box: LinkLabelBox}>(
  labels: readonly T[],
  obstacles: LabelObstacles,
): T[] {
  const circles = obstacles.circles ?? [];
  const boxes = obstacles.boxes ?? [];
  const others = obstacles.labels ?? [];
  const kept: T[] = [];
  for (const label of labels) {
    const {box} = label;
    if (!(box.width > 0 && box.height > 0)) continue;
    if (circles.some(c => labelHitsCircle(box, c))) continue;
    if (boxes.some(b => labelHitsBox(box, b))) continue;
    if (others.some(o => labelsOverlap(box, o))) continue;
    if (kept.some(k => labelsOverlap(box, k.box))) continue;
    kept.push(label);
  }
  return kept;
}
