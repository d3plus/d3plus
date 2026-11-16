/**
    Spots beside a circle beyond its eight sides: a label slid along a side
    of its circle, and the lines (a network's links) a label crosses there.
    Pure geometry, used by `placeCircleLabels` when a label fits on no side.

    @module
*/

import type {CircleLabelBox, LabelSide} from "./circleLabelPlacement.js";

/**
    A spot beside a circle: a side, and how far along it the label slides,
    from -1 (left, or up) to 1 (right, or down). At ±1 one end of the label
    lines up with the circle's center.
*/
export interface LabelSlot {
  side: LabelSide;
  slide: number;
}

/** A line segment labels keep clear of when they can. */
export interface LabelSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** The slides tried along a straight side, in order. */
const SLIDES = [0, -0.5, 0.5, -1, 1];

/** Whether a side is one of the four straight ones (a label can slide along it). */
const straight = (side: LabelSide): boolean => !side.includes("-");

/**
    A label's box in a slot: the box it takes on the slot's side (see
    `sideBox`), moved along a straight side by `slide` times half its length
    on that side. A diagonal side doesn't slide.
    @param box The label's box on the slot's side.
    @param slot The side, and the slide along it.
*/
export function slideBox(box: CircleLabelBox, slot: LabelSlot): CircleLabelBox {
  if (!slot.slide || !straight(slot.side)) return box;
  if (slot.side === "top" || slot.side === "bottom")
    return {...box, x: box.x + (slot.slide * box.width) / 2};
  return {...box, y: box.y + (slot.slide * box.height) / 2};
}

/**
    Every slot beside a circle, side by side in the order given: each
    straight side centered, then slid halfway and all the way to each end;
    each diagonal side once.
    @param sides The sides, most preferred first (see `sideOrder`).
*/
export function slotOrder(sides: readonly LabelSide[]): LabelSlot[] {
  return sides.flatMap(side =>
    straight(side) ? SLIDES.map(slide => ({side, slide})) : [{side, slide: 0}],
  );
}

/**
    Whether a segment crosses or touches a box's interior (Liang–Barsky
    clipping).
    @param s The segment.
    @param box The box.
*/
export function segmentHitsBox(s: LabelSegment, box: CircleLabelBox): boolean {
  const dx = s.x2 - s.x1,
    dy = s.y2 - s.y1;
  let t0 = 0,
    t1 = 1;
  const edges: [number, number][] = [
    [-dx, s.x1 - box.x],
    [dx, box.x + box.width - s.x1],
    [-dy, s.y1 - box.y],
    [dy, box.y + box.height - s.y1],
  ];
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return false;
      continue;
    }
    const t = q / p;
    if (p < 0) t0 = Math.max(t0, t);
    else t1 = Math.min(t1, t);
    if (t0 > t1) return false;
  }
  return true;
}

/**
    A polyline's segments.
    @param points The polyline's points.
*/
export function polylineSegments(
  points: readonly (readonly [number, number])[],
): LabelSegment[] {
  const out: LabelSegment[] = [];
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i - 1],
      [x2, y2] = points[i];
    if ([x1, y1, x2, y2].every(Number.isFinite)) out.push({x1, y1, x2, y2});
  }
  return out;
}

/** A segment's bounding box. */
export const segmentBox = (s: LabelSegment): CircleLabelBox => ({
  x: Math.min(s.x1, s.x2),
  y: Math.min(s.y1, s.y2),
  width: Math.abs(s.x2 - s.x1),
  height: Math.abs(s.y2 - s.y1),
});
