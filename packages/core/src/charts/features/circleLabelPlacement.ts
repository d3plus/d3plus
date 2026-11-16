/**
    Placement of circle labels: each label sits inside its circle when it fits
    there at a readable size and no circle painted over it covers it,
    otherwise beside the circle on the side with the most open room (Moritz
    Stefaner's Voronoi labeling), otherwise inside when it fits there,
    otherwise nowhere. Pure geometry: text is measured by the caller.

    @module
*/

import type {Bounds} from "@d3plus/math";

import {pointVoronoi} from "../viz/pointVoronoi.js";
import {BoxGrid} from "./boxGrid.js";
import {segmentBox, segmentHitsBox, slideBox, slotOrder} from "./labelSlots.js";
import type {LabelSegment, LabelSlot} from "./labelSlots.js";

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
  /**
      Whether a circle painted over this one overlaps where its inside label
      sits (see `coveredInside`): an `"auto"` label that fits inside then
      goes beside its circle when there's room, and stays inside when not.
  */
  covered?: boolean;
  /**
      The slot the label held on the last frame of an animation: tried
      before anything else, so the label keeps its place as its circle moves
      while that slot stays open.
  */
  previous?: LabelSlot;
}

/** Where a label went. */
export type CircleLabelPlacement =
  | {position: "inside"}
  | {
      position: "outside";
      side: LabelSide;
      box: CircleLabelBox;
      /** How far the label slid along its side (see `LabelSlot`), when it did. */
      slide?: number;
    }
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
  /** Boxes no label beside a circle may overlap, such as a point's error bars. */
  obstacles?: readonly CircleLabelBox[];
  /**
      Whether a label no side takes tries every slot beside its circle (see
      `slotOrder`): each side with the label slid along it, `slideClearance`
      clear of every other circle in place of the Voronoi cell test, taking
      the open slot that crosses the fewest `segments`. A label with no open
      slot then takes one held by a single other label when that label can
      move to another of its own open slots (default false).
  */
  slide?: boolean;
  /** Lines (such as a network's links) a slid label crosses as few of as it can. */
  segments?: readonly LabelSegment[];
  /**
      The room a slid label keeps from every circle but its own (default
      `gap`, so no other circle sits nearer to it than its own does).
  */
  slideClearance?: number;
  /**
      The room kept between a label slid along a side and every other label
      and obstacle, so neighboring labels don't read as one (default
      `gap`).
  */
  slideSpacing?: number;
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

/** A circle's bounding box. */
const circleBox = (c: LabelCircle): CircleLabelBox => ({
  x: c.x - c.r,
  y: c.y - c.r,
  width: c.r * 2,
  height: c.r * 2,
});

/** Space kept clear on each side of a box. */
export interface BoxInset {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
    The box a label inside a circle sits in: the square inscribed in the
    circle, less the label's padding, which it never draws in.
    @param circle The circle.
    @param inset The label's padding (default none).
*/
export function insideBox(
  circle: LabelCircle,
  inset?: BoxInset,
): CircleLabelBox {
  const h = circle.r * Math.SQRT1_2;
  const pad = inset ?? {top: 0, right: 0, bottom: 0, left: 0};
  const width = Math.max(0, h * 2 - pad.left - pad.right),
    height = Math.max(0, h * 2 - pad.top - pad.bottom);
  return {x: circle.x - h + pad.left, y: circle.y - h + pad.top, width, height};
}

/**
    The circles, of `which`, that a circle painted over them overlaps where
    their inside label sits (`insideBox`). A uniform grid keeps each test to
    the circles nearby.
    @param circles Every circle.
    @param which The indices of the circles to test.
    @param order Each circle's paint position: a higher one paints over a
    lower one (default: its index).
    @param insets Each circle's inside label padding (default none).
*/
export function coveredInside(
  circles: readonly LabelCircle[],
  which: readonly number[],
  order?: readonly number[],
  insets?: readonly (BoxInset | undefined)[],
): Set<number> {
  const out = new Set<number>();
  const valid = (c: LabelCircle | undefined): c is LabelCircle =>
    !!c && [c.x, c.y, c.r].every(Number.isFinite) && c.r > 0;
  const tested = which.filter(i => valid(circles[i]));
  if (!tested.length) return out;
  const live = circles.flatMap((c, i) => (valid(c) ? [i] : []));
  const size = live.reduce((sum, i) => sum + circles[i].r * 2, 0) / live.length;
  const grid = new BoxGrid<number>(Math.max(16, size));
  for (const i of live) grid.add(circleBox(circles[i]), i);
  const rank = (i: number) => order?.[i] ?? i;
  for (const i of tested) {
    const box = insideBox(circles[i], insets?.[i]);
    if (!(box.width > 0 && box.height > 0)) continue;
    for (const j of grid.near(box))
      if (rank(j) > rank(i) && boxHitsCircle(box, circles[j])) {
        out.add(i);
        break;
      }
  }
  return out;
}

/**
    Places circle labels. A label in `"inside"` mode stays inside its circle;
    in `"auto"` mode it stays inside when `fitsInside` and not `covered`, and
    otherwise (or in `"outside"` mode) it takes the first side of its circle,
    most open first (see `sideOrder`), where it lies mostly in the circle's
    Voronoi cell, stays in `bounds`, and overlaps no circle, no
    `options.obstacles` box, and no label placed before it. With
    `options.slide`, a label no side takes then tries the other slots beside
    its circle (see `PlaceCircleLabelsOptions.slide`). A label with no such
    spot, or whose circle is centered outside `bounds`, stays inside when it
    is an `"auto"` label that fits there, and is hidden otherwise. Labels are
    placed largest circle first (ties in input order), so big circles win
    the room, except that a label keeps its `previous` slot first while that
    slot is open; the result is in input order and depends only on the
    input.
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
  const result: CircleLabelPlacement[] = labels.map(() => ({
    position: "hidden",
  }));
  const outside: number[] = [];
  labels.forEach((label, i) => {
    if (!validCircle(circles[label.circle])) return;
    const auto = label.position !== "inside" && label.position !== "outside";
    // A covered "auto" label stays inside unless a side takes it below.
    if (label.position === "inside" || (auto && label.fitsInside))
      result[i] = {position: "inside"};
    if (result[i].position === "inside" && !(auto && label.covered)) return;
    if (label.width > 0 && label.height > 0) outside.push(i);
  });
  if (!outside.length) return result;

  const room = labelRoom(circles, labels, outside, bounds, options);
  outside.sort(
    (a, b) =>
      circles[labels[b].circle].r - circles[labels[a].circle].r || a - b,
  );
  const open = outside.filter(i => room.cell(i));
  const take = (i: number, spot: Spot, spaced = true) => {
    room.release(i);
    const {slot, box} = spot;
    result[i] = {
      position: "outside",
      side: slot.side,
      box,
      ...(slot.slide ? {slide: slot.slide} : {}),
    };
    room.claim(box, i, spaced);
  };
  // A label keeps the slot it held last frame while that slot is still open.
  const unplaced = open.filter(i => {
    const prev = labels[i].previous;
    const spot = prev && room.spot(i, prev);
    // A label centered on a side keeps no spacing, as on the first draw.
    const spaced = !!prev?.slide;
    if (!spot || !room.fits(i, spot, "slide", spaced)) return true;
    take(i, spot, spaced);
    return false;
  });
  const sideless = unplaced.filter(i => {
    const spot = room
      .spots(i)
      .find(s => !s.slot.slide && room.fits(i, s, "side"));
    if (spot) take(i, spot, false);
    return !spot;
  });
  if (!options.slide) return result;
  const leftover = sideless.filter(i => {
    const best = leastCrossed(room, i);
    if (best) take(i, best);
    return !best;
  });
  for (const i of leftover) {
    const swap = makeRoom(room, i);
    if (!swap) continue;
    take(swap.moved, swap.to);
    take(i, swap.spot);
  }
  return result;
}

/** Whether a circle has a finite center and radius. */
const validCircle = (c: LabelCircle | undefined): c is LabelCircle =>
  !!c && [c.x, c.y, c.r].every(Number.isFinite);

/**
    A label's slot and its box there, with what's known of it: whether it is
    free (see `labelRoom`) as a side or as a slid slot, and how many lines it
    crosses.
*/
interface Spot {
  slot: LabelSlot;
  box: CircleLabelBox;
  free: Partial<Record<FitMode, boolean>>;
  crossings?: number;
}

/**
    How a spot is judged free: `"side"`, mostly in its circle's Voronoi
    cell; `"slide"`, `slideClearance` clear of every other circle.
*/
type FitMode = "side" | "slide";

/**
    A box a label beside a circle claims, the label (-1 for an obstacle), and
    whether other labels keep `slideSpacing` from it (a slid label does).
*/
interface Claim {
  box: CircleLabelBox;
  owner: number;
  spaced: boolean;
}

/** A box grown by `pad` on every side. */
const grow = (box: CircleLabelBox, pad: number): CircleLabelBox => ({
  x: box.x - pad,
  y: box.y - pad,
  width: box.width + pad * 2,
  height: box.height + pad * 2,
});

/**
    Whether a box overlaps no circle, keeping `pad` pixels from every one but
    circle `own`.
*/
function clearOfCircles(
  box: CircleLabelBox,
  circles: readonly LabelCircle[],
  grid: BoxGrid<number>,
  own: number,
  pad: number,
): boolean {
  for (const c of grid.near(grow(box, pad))) {
    const circle = circles[c];
    const r = c === own ? circle.r : circle.r + pad;
    if (boxHitsCircle(box, {...circle, r})) return false;
  }
  return true;
}

/** The circles in a grid with buckets about the size of the labels. */
function circleGrid(
  circles: readonly LabelCircle[],
  labels: readonly CircleLabelRequest[],
  outside: readonly number[],
): BoxGrid<number> {
  const sizes = outside.map(i => Math.max(labels[i].width, labels[i].height));
  const grid = new BoxGrid<number>(
    Math.max(16, sizes.reduce((a, b) => a + b, 0) / sizes.length),
  );
  circles.forEach((c, i) => {
    if (validCircle(c)) grid.add(circleBox(c), i);
  });
  return grid;
}

/**
    Whether a circle is centered in the bounds: one centered outside them
    (scrolled off by a zoom) is cut off there, so a label beside it would
    name nothing in view.
*/
const shownCircle = (circle: LabelCircle, bounds: Bounds): boolean =>
  inBounds({...circle, width: 0, height: 0}, bounds);

/**
    The room around the circles for labels beside them: each label's
    Voronoi cell and its spots beside its circle (see `slotOrder`), whether
    a spot is free (in bounds, and clear of every circle as its `FitMode`
    asks) and open (free, and clear of every claimed box), how many
    `options.segments` it crosses, and the boxes labels claim. What depends
    only on the circles is worked out once per spot; grids keep each test to
    what's nearby.
*/
function labelRoom(
  circles: readonly LabelCircle[],
  labels: readonly CircleLabelRequest[],
  outside: readonly number[],
  bounds: Bounds,
  options: PlaceCircleLabelsOptions,
) {
  const gap = options.gap ?? 3;
  const coverage = options.cellCoverage ?? 0.5;
  const clearance = options.slideClearance ?? gap;
  const voronoi = pointVoronoi(
    circles.map((c, i) => ({x: c.x, y: c.y, r: c.r, item: i})),
    bounds,
  );
  const grid = circleGrid(circles, labels, outside);
  const placed = new BoxGrid<Claim>(grid.size);
  for (const box of options.obstacles ?? [])
    placed.add(box, {box, owner: -1, spaced: false});
  const spacing = options.slideSpacing ?? gap;
  const claims = new Map<number, Claim>();
  const lines = new BoxGrid<LabelSegment>(grid.size);
  for (const s of options.segments ?? []) lines.add(segmentBox(s), s);
  const cells = new Map(
    outside.map(i => {
      const c = labels[i].circle;
      return [i, shownCircle(circles[c], bounds) ? voronoi.cell(c) : null];
    }),
  );
  const spotsOf = new Map<number, Spot[]>();
  const toSpot = (i: number, slot: LabelSlot): Spot => {
    const {circle, width, height} = labels[i];
    const side = sideBox(circles[circle], slot.side, width, height, gap);
    return {slot, box: slideBox(side, slot), free: {}};
  };
  const spots = (i: number): Spot[] => {
    let list = spotsOf.get(i);
    if (!list) {
      const order = sideOrder(circles[labels[i].circle], cells.get(i)!);
      list = slotOrder(order).map(slot => toSpot(i, slot));
      spotsOf.set(i, list);
    }
    return list;
  };
  const free = (i: number, spot: Spot, mode: FitMode): boolean => {
    const known = spot.free[mode];
    if (known !== undefined) return known;
    const {box} = spot;
    const own = labels[i].circle;
    return (spot.free[mode] =
      inBounds(box, bounds) &&
      (mode === "side"
        ? clearOfCircles(box, circles, grid, own, 0) &&
          boxCoverage(box, cells.get(i)!) >= coverage - EPSILON
        : clearOfCircles(box, circles, grid, own, clearance)));
  };
  /** The claims a box overlaps, or comes within `spacing` of when either is spaced. */
  const taken = (b: CircleLabelBox, spaced: boolean) => {
    const wide = grow(b, spacing);
    return [...placed.near(wide)].filter(c =>
      boxesOverlap(spaced || c.spaced ? wide : b, c.box),
    );
  };
  const fits = (
    i: number,
    spot: Spot,
    mode: FitMode,
    spaced = mode === "slide",
  ) => free(i, spot, mode) && !taken(spot.box, spaced).length;
  const crossings = (spot: Spot) =>
    (spot.crossings ??= [...lines.near(spot.box)].filter(s =>
      segmentHitsBox(s, spot.box),
    ).length);
  const claim = (b: CircleLabelBox, owner: number, spaced: boolean) => {
    const c = {box: b, owner, spaced};
    claims.set(owner, c);
    placed.add(b, c);
  };
  const release = (owner: number) => {
    const c = claims.get(owner);
    if (c) placed.remove(c.box, c);
    claims.delete(owner);
  };
  return {
    cell: (i: number) => cells.get(i) ?? null,
    spots,
    /** Label `i`'s spot in a slot. */
    spot: (i: number, slot: LabelSlot): Spot =>
      spots(i).find(
        s => s.slot.side === slot.side && s.slot.slide === slot.slide,
      ) ?? toSpot(i, slot),
    free,
    taken,
    fits,
    crossings,
    claim,
    release,
  };
}

/** Label `i`'s open slid spot crossing the fewest lines (the first of any tie). */
function leastCrossed(
  room: ReturnType<typeof labelRoom>,
  i: number,
): Spot | undefined {
  let best: Spot | undefined;
  for (const spot of room.spots(i)) {
    if (!room.fits(i, spot, "slide")) continue;
    if (!best || room.crossings(spot) < room.crossings(best)) best = spot;
    if (!room.crossings(best)) break;
  }
  return best;
}

/**
    The first slid spot of label `i` held by just one other label that can
    move to another of its own open slid spots (the one crossing the fewest
    lines), with that label's new spot.
*/
function makeRoom(room: ReturnType<typeof labelRoom>, i: number) {
  for (const spot of room.spots(i)) {
    if (!room.free(i, spot, "slide")) continue;
    const holders = room.taken(spot.box, true);
    if (holders.length !== 1 || holders[0].owner < 0) continue;
    const other = holders[0];
    room.release(other.owner);
    room.claim(spot.box, i, true);
    const to = leastCrossed(room, other.owner);
    room.release(i);
    room.claim(other.box, other.owner, other.spaced);
    if (to) return {spot, moved: other.owner, to};
  }
  return undefined;
}
