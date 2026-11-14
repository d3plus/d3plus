/**
    Pure placement for RadialLine and RadialArea's series labels
    (`lineLabels`): a line's name sits just outside its outermost point that
    leaves it room; a stacked band's name sits inside the band where it has
    the most room.
    Angles are radians, 0 at 12 o'clock, increasing clockwise.
*/

import {polarBoxesOverlap, polarLabelPlacement} from "../polar/labels.js";
import type {PolarLabelPlacement} from "../polar/labels.js";

import {polarXY} from "./paths.js";

/** A point of a series, in pixels: its angle and the radii its band spans. */
export interface RadialLabelPoint {
  angle: number;
  r0: number;
  r1: number;
}

/** A label to place: the series' points and its text's size. */
export interface RadialLabelInput {
  points: RadialLabelPoint[];
  width: number;
  height: number;
}

/** Gap (px) between a line's outermost point and its label. */
export const RADIAL_SERIES_LABEL_PADDING = 6;

/**
    How far a `width` × `height` box centered on a point at `angle` reaches
    along the radius: the room it needs inside a band there.
*/
export function radialBoxDepth(
  angle: number,
  width: number,
  height: number,
): number {
  return Math.abs(width * Math.sin(angle)) + Math.abs(height * Math.cos(angle));
}

/** The boxes outside a line's points, from its outermost point inward. */
export function radialOutsideCandidates(
  input: RadialLabelInput,
  padding = RADIAL_SERIES_LABEL_PADDING,
): PolarLabelPlacement[] {
  return input.points
    .slice()
    .sort((a, b) => b.r1 - a.r1)
    .map(p =>
      polarLabelPlacement(p.angle, p.r1, input.width, input.height, padding),
    );
}

/**
    The boxes centered in a band where it is deep enough for the label's own
    reach along the radius (see `radialBoxDepth`), the roomiest first.
*/
export function radialInsideCandidates(
  input: RadialLabelInput,
): PolarLabelPlacement[] {
  return input.points
    .map(p => ({
      p,
      room: p.r1 - p.r0 - radialBoxDepth(p.angle, input.width, input.height),
    }))
    .filter(c => c.room >= 0)
    .sort((a, b) => b.room - a.room)
    .map(({p}) => {
      const [cx, cy] = polarXY(p.angle, (p.r0 + p.r1) / 2);
      return {
        x: cx - input.width / 2,
        y: cy - input.height / 2,
        width: input.width,
        height: input.height,
      };
    });
}

/** Whether every corner of `box` lies within `radius` of the center. */
export function radialBoxWithin(
  box: PolarLabelPlacement,
  radius: number,
): boolean {
  return [box.x, box.x + box.width].every(x =>
    [box.y, box.y + box.height].every(y => Math.hypot(x, y) <= radius),
  );
}

/** Whether `box`, grown by `margin`, holds any of `points`. */
export function radialBoxHolds(
  box: PolarLabelPlacement,
  points: [number, number][],
  margin = 0,
): boolean {
  return points.some(
    ([x, y]) =>
      x >= box.x - margin &&
      x <= box.x + box.width + margin &&
      y >= box.y - margin &&
      y <= box.y + box.height + margin,
  );
}

/** Where `radialSeriesLabels` may put a label. */
export interface RadialLabelBounds {
  /** The radius every label stays within (the circle's edge). */
  limit?: number;
  /** Points a label must stay clear of (the series' dots). */
  obstacles?: [number, number][];
  /** The room (px) kept between a label and each obstacle. */
  margin?: number;
}

/**
    Places every label (`inside` bands, else outside the lines), in order:
    each at its first candidate (see `radialOutsideCandidates` and
    `radialInsideCandidates`) that stays within `limit`, clear of the
    `obstacles`, and clear of every label placed before it, else nowhere.
    Returns a box or null per input.
*/
export function radialSeriesLabels(
  inputs: RadialLabelInput[],
  inside: boolean,
  bounds: RadialLabelBounds = {},
): (PolarLabelPlacement | null)[] {
  const {limit = Infinity, obstacles = [], margin = 3} = bounds;
  const placed: PolarLabelPlacement[] = [];
  return inputs.map(input => {
    const candidates = inside
      ? radialInsideCandidates(input)
      : radialOutsideCandidates(input);
    const box = candidates.find(
      b =>
        radialBoxWithin(b, limit) &&
        !radialBoxHolds(b, obstacles, margin) &&
        !placed.some(other => polarBoxesOverlap(other, b)),
    );
    if (!box) return null;
    placed.push(box);
    return box;
  });
}
