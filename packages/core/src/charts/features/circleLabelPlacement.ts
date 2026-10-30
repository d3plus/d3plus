/**
    Placement of circle labels: each label sits inside its circle when it fits
    there at a readable size, otherwise beside the circle on the side with the
    most open room (Moritz Stefaner's Voronoi labeling), otherwise nowhere.
    Pure geometry: text is measured by the caller.

    @module
*/

import type {Bounds} from "@d3plus/math";

import {pointVoronoi} from "../viz/pointVoronoi.js";

/** Where a circle's label goes: `"auto"` picks inside, beside, or hidden. */
export type LabelPosition = "auto" | "inside" | "outside";

/** A circle, in the same space as the bounds. */
export interface LabelCircle {
  x: number;
  y: number;
  r: number;
}

/** An axis-aligned box: its top-left corner and size. */
export interface CircleLabelBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The sides of a circle a label can sit on. */
export type LabelSide =
  | "right"
  | "left"
  | "top"
  | "bottom"
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left";

/** One label to place. */
export interface CircleLabelRequest {
  /** The index, in the circles array, of the circle the label names. */
  circle: number;
  /** The label's size when it sits beside the circle. */
  width: number;
  height: number;
  position: LabelPosition;
  /** Whether the label fits inside its circle at a readable size. */
  fitsInside: boolean;
}

/** Where a label went. */
export type CircleLabelPlacement =
  | {position: "inside"}
  | {position: "outside"; side: LabelSide; box: CircleLabelBox}
  | {position: "hidden"};

/** Tuning for `placeCircleLabels`. */
export interface PlaceCircleLabelsOptions {
  /** The space between a circle's edge and a label beside it (default 3). */
  gap?: number;
  /**
      The share of a label's area that must lie in its circle's Voronoi cell,
      the region closer to that circle's center than to any other (default
      0.5): a label mostly in a neighbor's cell would read as the neighbor's.
  */
  cellCoverage?: number;
}

/** The sides in their default order, with each one's direction (y down). */
const SIDES: [LabelSide, number, number][] = [
  ["right", 1, 0],
  ["left", -1, 0],
  ["top", 0, -1],
  ["bottom", 0, 1],
  ["top-right", Math.SQRT1_2, -Math.SQRT1_2],
  ["top-left", -Math.SQRT1_2, -Math.SQRT1_2],
  ["bottom-right", Math.SQRT1_2, Math.SQRT1_2],
  ["bottom-left", -Math.SQRT1_2, Math.SQRT1_2],
];

/** Degrees added to a diagonal side's angle when ranking sides: straight sides read better. */
const DIAGONAL_PENALTY = 20;

/** Rounding slack for overlap and containment tests. */
const EPSILON = 1e-6;

/**
    The box a `width` × `height` label takes on one side of a circle, `gap`
    pixels clear of its edge: centered on the circle's axis for a straight
    side, with its nearest corner on the circle's diagonal for a diagonal one.
*/
export function sideBox(
  circle: LabelCircle,
  side: LabelSide,
  width: number,
  height: number,
  gap = 0,
): CircleLabelBox {
  const d = circle.r + gap;
  const {x, y} = circle;
  switch (side) {
    case "right":
      return {x: x + d, y: y - height / 2, width, height};
    case "left":
      return {x: x - d - width, y: y - height / 2, width, height};
    case "top":
      return {x: x - width / 2, y: y - d - height, width, height};
    case "bottom":
      return {x: x - width / 2, y: y + d, width, height};
  }
  const o = d * Math.SQRT1_2;
  const right = side.endsWith("right");
  const top = side.startsWith("top");
  return {
    x: right ? x + o : x - o - width,
    y: top ? y - o - height : y + o,
    width,
    height,
  };
}

/** The signed area of a ring (positive when its vertices run clockwise in y-down space). */
function ringArea(ring: [number, number][]): number {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++)
    a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  return a / 2;
}

/** A ring's centroid, or null when it has no area. */
export function ringCentroid(
  ring: [number, number][],
): [number, number] | null {
  const area = ringArea(ring);
  if (Math.abs(area) < EPSILON) return null;
  let cx = 0,
    cy = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const f = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    cx += (ring[j][0] + ring[i][0]) * f;
    cy += (ring[j][1] + ring[i][1]) * f;
  }
  return [cx / (6 * area), cy / (6 * area)];
}

/**
    The sides of a circle, most open first: ordered by how closely each
    points toward the centroid of the circle's Voronoi cell (diagonals
    slightly discounted), or in the default order (right, left, top, bottom,
    then the diagonals) when the centroid is too close to the center to point
    anywhere, which is the case for an evenly surrounded circle.
    @param circle The circle.
    @param cell Its Voronoi cell, or null.
*/
export function sideOrder(
  circle: LabelCircle,
  cell: [number, number][] | null,
): LabelSide[] {
  const base = SIDES.map(s => s[0]);
  const centroid = cell ? ringCentroid(cell) : null;
  if (!centroid || !cell) return base;
  const dx = centroid[0] - circle.x,
    dy = centroid[1] - circle.y;
  const reach = Math.sqrt(Math.abs(ringArea(cell)));
  if (Math.hypot(dx, dy) < reach * 0.1) return base;
  const toward = Math.atan2(dy, dx);
  const score = ([, sx, sy]: [LabelSide, number, number]): number => {
    let diff = Math.abs(Math.atan2(sy, sx) - toward);
    if (diff > Math.PI) diff = 2 * Math.PI - diff;
    const degrees = (diff * 180) / Math.PI;
    return degrees + (sx && sy ? DIAGONAL_PENALTY : 0);
  };
  return SIDES.map((s, i) => ({side: s[0], score: score(s), i}))
    .sort((a, b) => a.score - b.score || a.i - b.i)
    .map(s => s.side);
}

/** Clips a ring to one half-plane of a box edge (Sutherland–Hodgman). */
function clipEdge(
  ring: [number, number][],
  inside: (p: [number, number]) => boolean,
  cross: (a: [number, number], b: [number, number]) => [number, number],
): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < ring.length; i++) {
    const cur = ring[i],
      prev = ring[(i + ring.length - 1) % ring.length];
    if (inside(cur)) {
      if (!inside(prev)) out.push(cross(prev, cur));
      out.push(cur);
    } else if (inside(prev)) out.push(cross(prev, cur));
  }
  return out;
}

/** Where the segment `a`–`b` crosses the vertical line at `x`. */
const atX = (a: [number, number], b: [number, number], x: number) =>
  [x, a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0])] as [number, number];

/** Where the segment `a`–`b` crosses the horizontal line at `y`. */
const atY = (a: [number, number], b: [number, number], y: number) =>
  [a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]), y] as [number, number];

/** The share (0–1) of a box's area that lies inside a ring. */
export function boxCoverage(
  box: CircleLabelBox,
  ring: [number, number][],
): number {
  const area = box.width * box.height;
  if (!(area > 0) || ring.length < 3) return 0;
  const x1 = box.x + box.width,
    y1 = box.y + box.height;
  let r = clipEdge(
    ring,
    p => p[0] >= box.x,
    (a, b) => atX(a, b, box.x),
  );
  r = clipEdge(
    r,
    p => p[0] <= x1,
    (a, b) => atX(a, b, x1),
  );
  r = clipEdge(
    r,
    p => p[1] >= box.y,
    (a, b) => atY(a, b, box.y),
  );
  r = clipEdge(
    r,
    p => p[1] <= y1,
    (a, b) => atY(a, b, y1),
  );
  return r.length < 3 ? 0 : Math.min(1, Math.abs(ringArea(r)) / area);
}

/** Whether a box overlaps a circle's interior. */
export function boxHitsCircle(
  box: CircleLabelBox,
  circle: LabelCircle,
): boolean {
  const dx = Math.max(box.x - circle.x, 0, circle.x - (box.x + box.width));
  const dy = Math.max(box.y - circle.y, 0, circle.y - (box.y + box.height));
  return dx * dx + dy * dy < circle.r * circle.r - EPSILON;
}

/** Whether two boxes overlap (touching edges don't count). */
export function boxesOverlap(a: CircleLabelBox, b: CircleLabelBox): boolean {
  return (
    a.x < b.x + b.width - EPSILON &&
    b.x < a.x + a.width - EPSILON &&
    a.y < b.y + b.height - EPSILON &&
    b.y < a.y + a.height - EPSILON
  );
}

/** Whether a box lies inside the bounds. */
function inBounds(box: CircleLabelBox, bounds: Bounds): boolean {
  return (
    box.x >= bounds.x - EPSILON &&
    box.y >= bounds.y - EPSILON &&
    box.x + box.width <= bounds.x + bounds.width + EPSILON &&
    box.y + box.height <= bounds.y + bounds.height + EPSILON
  );
}

/** A uniform grid of buckets, so overlap tests only look at nearby items. */
class BoxGrid<T> {
  private cells = new Map<string, T[]>();
  constructor(readonly size: number) {}
  private keys(box: CircleLabelBox): string[] {
    const s = this.size;
    const out: string[] = [];
    for (
      let i = Math.floor(box.x / s);
      i <= Math.floor((box.x + box.width) / s);
      i++
    )
      for (
        let j = Math.floor(box.y / s);
        j <= Math.floor((box.y + box.height) / s);
        j++
      )
        out.push(`${i},${j}`);
    return out;
  }
  add(box: CircleLabelBox, item: T): void {
    for (const k of this.keys(box)) {
      const list = this.cells.get(k);
      if (list) list.push(item);
      else this.cells.set(k, [item]);
    }
  }
  near(box: CircleLabelBox): Set<T> {
    const out = new Set<T>();
    for (const k of this.keys(box))
      for (const item of this.cells.get(k) ?? []) out.add(item);
    return out;
  }
}

/** A circle's bounding box. */
const circleBox = (c: LabelCircle): CircleLabelBox => ({
  x: c.x - c.r,
  y: c.y - c.r,
  width: c.r * 2,
  height: c.r * 2,
});

/**
    Places circle labels. A label in `"inside"` mode stays inside its circle;
    in `"auto"` mode it stays inside when `fitsInside`, and otherwise (or in
    `"outside"` mode) it takes the first side of its circle, most open first
    (see `sideOrder`), where it lies mostly in the circle's Voronoi cell, stays
    in `bounds`, and overlaps no circle and no label placed before it. A label
    with no such side, or whose circle is centered outside `bounds`, is
    hidden. Labels are placed largest circle first
    (ties in input order), so big circles win the room; the result is in
    input order and depends only on the input.
    @param circles Every circle, labeled or not: each is an obstacle.
    @param labels The labels to place.
    @param bounds The box labels must stay in.
*/
export function placeCircleLabels(
  circles: readonly LabelCircle[],
  labels: readonly CircleLabelRequest[],
  bounds: Bounds,
  options: PlaceCircleLabelsOptions = {},
): CircleLabelPlacement[] {
  const gap = options.gap ?? 3;
  const coverage = options.cellCoverage ?? 0.5;
  const result: CircleLabelPlacement[] = labels.map(() => ({
    position: "hidden",
  }));
  const valid = (c: LabelCircle | undefined): c is LabelCircle =>
    !!c && [c.x, c.y, c.r].every(Number.isFinite);

  const outside: number[] = [];
  labels.forEach((label, i) => {
    if (!valid(circles[label.circle])) return;
    if (
      label.position === "inside" ||
      (label.position !== "outside" && label.fitsInside)
    )
      result[i] = {position: "inside"};
    else if (label.width > 0 && label.height > 0) outside.push(i);
  });
  if (!outside.length) return result;

  const voronoi = pointVoronoi(
    circles.map((c, i) => ({x: c.x, y: c.y, r: c.r, item: i})),
    bounds,
  );
  const sizes = outside.map(i => Math.max(labels[i].width, labels[i].height));
  const grid = new BoxGrid<number>(
    Math.max(16, sizes.reduce((a, b) => a + b, 0) / sizes.length),
  );
  circles.forEach((c, i) => {
    if (valid(c)) grid.add(circleBox(c), i);
  });
  const placed = new BoxGrid<CircleLabelBox>(grid.size);

  outside.sort(
    (a, b) =>
      circles[labels[b].circle].r - circles[labels[a].circle].r || a - b,
  );
  for (const i of outside) {
    const label = labels[i];
    const circle = circles[label.circle];
    const cell = voronoi.cell(label.circle);
    // A circle centered outside the bounds (scrolled off by a zoom) is cut
    // off there, so a label beside it would name nothing in view.
    if (!cell || !inBounds({...circle, width: 0, height: 0}, bounds)) continue;
    for (const side of sideOrder(circle, cell)) {
      const box = sideBox(circle, side, label.width, label.height, gap);
      if (!inBounds(box, bounds)) continue;
      if ([...grid.near(box)].some(c => boxHitsCircle(box, circles[c])))
        continue;
      if ([...placed.near(box)].some(b => boxesOverlap(box, b))) continue;
      if (boxCoverage(box, cell) < coverage - EPSILON) continue;
      result[i] = {position: "outside", side, box};
      placed.add(box, box);
      break;
    }
  }
  return result;
}
