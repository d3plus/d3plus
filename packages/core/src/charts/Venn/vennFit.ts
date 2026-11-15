/**
    Turning a Venn layout into a drawing: a steady orientation (the largest
    circle first, the next beside it), groups of circles that share nothing
    packed next to each other, and the whole scaled and centered to fit a
    box. Follows venn.js's `normalizeSolution` and `scaleSolution`.
*/

import {distance} from "./circles.js";
import type {VennCircle} from "./circles.js";
import type {VennCircles} from "./vennLayout.js";

/** A circle with the set it stands for. */
interface Named extends VennCircle {
  set: string;
}

/** The box around circles. */
export interface CircleBounds {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** The box around circles (each circle's full extent, not just its center). */
export function circleBounds(circles: VennCircle[]): CircleBounds {
  let x0 = Infinity,
    x1 = -Infinity,
    y0 = Infinity,
    y1 = -Infinity;
  for (const c of circles) {
    x0 = Math.min(x0, c.x - c.radius);
    x1 = Math.max(x1, c.x + c.radius);
    y0 = Math.min(y0, c.y - c.radius);
    y1 = Math.max(y1, c.y + c.radius);
  }
  return {x0, x1, y0, y1};
}

/**
    The groups of circles that overlap one another, directly or through
    others: a group shares nothing with any circle outside it.
*/
export function disjointClusters<T extends VennCircle>(circles: T[]): T[][] {
  const parent = circles.map((_, i) => i);
  const find = (i: number): number =>
    parent[i] === i ? i : (parent[i] = find(parent[i]));
  for (let i = 0; i < circles.length; i++)
    for (let j = i + 1; j < circles.length; j++)
      if (
        distance(circles[i], circles[j]) + 1e-10 <
        circles[i].radius + circles[j].radius
      )
        parent[find(j)] = find(i);
  const groups = new Map<number, T[]>();
  circles.forEach((c, i) => {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(c);
  });
  return [...groups.values()];
}

/**
    Turns a group of circles in place so the drawing doesn't depend on where
    the search happened to leave it: the largest circle at the origin, the
    second largest to its right, and the third below the line between them.
*/
export function orientCircles(circles: VennCircle[]): void {
  circles.sort((a, b) => b.radius - a.radius);
  if (!circles.length) return;
  const {x: ox, y: oy} = circles[0];
  for (const c of circles) {
    c.x -= ox;
    c.y -= oy;
  }
  if (circles.length < 2) return;
  const [first, second] = circles;
  if (distance(first, second) < Math.abs(second.radius - first.radius)) {
    second.x = first.x + first.radius - second.radius - 1e-10;
    second.y = first.y;
  }
  const rotation = Math.atan2(second.x, second.y) - Math.PI / 2;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  for (const c of circles) {
    const {x, y} = c;
    c.x = cos * x - sin * y;
    c.y = sin * x + cos * y;
  }
  if (circles.length < 3) return;
  let angle = Math.atan2(circles[2].x, circles[2].y) - Math.PI / 2;
  while (angle < 0) angle += 2 * Math.PI;
  while (angle > 2 * Math.PI) angle -= 2 * Math.PI;
  if (angle > Math.PI) {
    const slope = circles[1].y / (1e-10 + circles[1].x);
    for (const c of circles) {
      const d = (c.x + slope * c.y) / (1 + slope * slope);
      c.x = 2 * d - c.x;
      c.y = 2 * d * slope - c.y;
    }
  }
}

/**
    Moves `cluster` beside the circles bounded by `bounds`: to their right,
    below them, or both, with a gap of `gap`.
*/
function placeCluster(
  cluster: Named[],
  bounds: CircleBounds,
  right: boolean,
  bottom: boolean,
  gap: number,
): void {
  const own = circleBounds(cluster);
  const offset = (lo: number, hi: number, olo: number, ohi: number) => {
    const centering = (ohi - olo) / 2 - (hi - lo) / 2;
    return hi - ohi + Math.min(0, centering);
  };
  const dx = right
    ? bounds.x1 - own.x0 + gap
    : offset(bounds.x0, bounds.x1, own.x0, own.x1);
  const dy = bottom
    ? bounds.y1 - own.y0 + gap
    : offset(bounds.y0, bounds.y1, own.y0, own.y1);
  for (const c of cluster) {
    c.x += dx;
    c.y += dy;
  }
}

/**
    The circles in a steady orientation, with every group that shares
    nothing with the rest packed beside the largest group: to its right,
    below it, then diagonally, round after round.
*/
export function normalizeCircles(circles: VennCircles): VennCircles {
  const named: Named[] = Object.entries(circles).map(([set, c]) => ({
    ...c,
    set,
  }));
  const clusters = disjointClusters(named).map(cluster => {
    orientCircles(cluster);
    const b = circleBounds(cluster);
    return {cluster, size: (b.x1 - b.x0) * (b.y1 - b.y0)};
  });
  clusters.sort((a, b) => b.size - a.size);
  const out: Named[] = clusters.length ? [...clusters[0].cluster] : [];
  let bounds = circleBounds(out);
  const gap = (bounds.x1 - bounds.x0) / 50;
  for (let k = 1; k < clusters.length; k += 3) {
    const sides: [boolean, boolean][] = [
      [true, false],
      [false, true],
      [true, true],
    ];
    sides.forEach(([right, bottom], j) => {
      const next = clusters[k + j];
      if (!next) return;
      placeCluster(next.cluster, bounds, right, bottom, gap);
      out.push(...next.cluster);
    });
    bounds = circleBounds(out);
  }
  const result: VennCircles = {};
  for (const c of out) result[c.set] = {x: c.x, y: c.y, radius: c.radius};
  return result;
}

/**
    Scales and centers circles to fit inside a `width` × `height` box less
    `padding` on every side, keeping their proportions.
*/
export function fitCircles(
  circles: VennCircles,
  width: number,
  height: number,
  padding = 0,
): VennCircles {
  const list = Object.values(circles);
  const out: VennCircles = {};
  if (!list.length) return out;
  const b = circleBounds(list);
  const w = Math.max(0, width - 2 * padding);
  const h = Math.max(0, height - 2 * padding);
  const spanX = b.x1 - b.x0;
  const spanY = b.y1 - b.y0;
  const scale = spanX > 0 && spanY > 0 ? Math.min(w / spanX, h / spanY) : 0;
  const dx = padding + (w - spanX * scale) / 2;
  const dy = padding + (h - spanY * scale) / 2;
  for (const [set, c] of Object.entries(circles))
    out[set] = {
      x: dx + (c.x - b.x0) * scale,
      y: dy + (c.y - b.y0) * scale,
      radius: c.radius * scale,
    };
  return out;
}
