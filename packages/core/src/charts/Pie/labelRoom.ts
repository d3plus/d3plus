/**
    The room a Pie or Donut keeps around its ring for labels outside it (see
    `labelPosition`): beside the ring, enough for the widest label on each
    side that needs one; above and below it, enough for the labels its
    columns had no place for; and never so much that the ring shrinks below
    `PIE_MIN_SCALE` of its full size.
*/
import {chartBounds} from "../features/chartGeometry.js";
import {userLabelConfig} from "../features/emitHelpers.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {outsideMetrics, outsideRoom, outsideSide} from "./outsideLabels.js";
import {pieOutsideLabels} from "./outsideNodes.js";
import type {CrowdedLabel} from "./outsideNodes.js";
import {
  outsideFontSize,
  pieLabelPlan,
  pieMayLabelOutside,
} from "./pieLabels.js";
import type {PieSlice} from "./pieLabels.js";

/** The smallest a ring shrinks to make room for labels outside it, as a share of its full radius. */
export const PIE_MIN_SCALE = 0.6;

/** The most room a single label claims beside the ring, as a share of the chart's width; a longer label wraps. */
export const OUTSIDE_MAX_SHARE = 0.3;

/** The room kept on each side of the ring, in pixels. */
export interface PieRoom {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** No room kept. */
export const NO_ROOM: PieRoom = {left: 0, right: 0, top: 0, bottom: 0};

/**
    Scales the room on two opposite sides down, keeping their proportions,
    so the ring keeps at least `min` of the chart's `size` between them.
    @param a The room on one side.
    @param b The room on the other.
    @param size The chart area's size across both.
    @param min The least the ring keeps.
*/
export function clampSides(
  a: number,
  b: number,
  size: number,
  min: number,
): [number, number] {
  const total = a + b;
  const spare = Math.max(0, size - min);
  if (total <= spare) return [a, b];
  const k = total > 0 ? spare / total : 0;
  return [a * k, b * k];
}

/**
    The width a label claims beside the ring: its own when it is at most
    `cap`, else the narrowest it wraps onto two lines when that is, else
    none (it is drawn only where the room happens to hold it).
    @param width The label's one-line width.
    @param wrapWidth The narrowest it wraps onto two lines.
    @param cap The most a label claims.
*/
export function outsideClaim(
  width: number,
  wrapWidth: number,
  cap: number,
): number {
  if (width <= cap) return width;
  return wrapWidth <= cap ? wrapWidth : 0;
}

/**
    The room to keep beside the ring at the current layout: `room`, grown
    on each side to fit that side's widest label outside the ring (see
    `outsideClaim`; a label claims at most `OUTSIDE_MAX_SHARE` of the
    chart's width), then scaled back so the ring keeps `minWidth`.
    @param viz The chart, laid out with `room`.
    @param slices The laid-out slices.
    @param room The room the layout kept.
    @param minWidth The least width the ring keeps.
*/
export function pieLabelRoom(
  viz: VizInstance,
  slices: PieSlice[],
  room: PieRoom,
  minWidth: number,
): PieRoom {
  if (!pieMayLabelOutside(viz, slices)) return room;
  const {outside} = pieLabelPlan(viz, slices);
  if (!outside.length) return room;
  const {width} = chartBounds(viz);
  const metrics = outsideMetrics(outsideFontSize(userLabelConfig(viz, "Path")));
  const cap = width * OUTSIDE_MAX_SHARE;
  const need = outsideRoom(
    outside
      .map(c => ({
        angle: c.angle,
        width: outsideClaim(c.width, c.wrapWidth, cap),
      }))
      .filter(c => c.width > 0),
    metrics,
  );
  const [left, right] = clampSides(
    Math.max(room.left, Math.ceil(need.left)),
    Math.max(room.right, Math.ceil(need.right)),
    width,
    minWidth,
  );
  return {...room, left, right};
}

/**
    The room to keep above and below the ring for the labels its columns
    had no place for: each one's height, above the ring when its slice
    faces up and below it when its slice faces down, added to `room`, then
    scaled back so the ring keeps `minHeight` of the chart's `height`.
    @param room The room the layout kept.
    @param crowded The labels with no place.
    @param height The chart area's height.
    @param minHeight The least height the ring keeps.
*/
export function crowdedRoom(
  room: PieRoom,
  crowded: CrowdedLabel[],
  height: number,
  minHeight: number,
): PieRoom {
  let top = room.top;
  let bottom = room.bottom;
  for (const {angle, size} of crowded) {
    if (Math.cos(angle) >= 0) top += size;
    else bottom += size;
  }
  [top, bottom] = clampSides(top, bottom, height, minHeight);
  return {...room, top, bottom};
}

/**
    The room worth keeping once the labels are placed: a side where no
    label was placed gives its room back to the ring.
    @param room The room kept.
    @param used Whether a label was placed on each side.
*/
export function usedRoom(
  room: PieRoom,
  used: {left: boolean; right: boolean},
): PieRoom {
  return {
    ...room,
    left: used.left ? room.left : 0,
    right: used.right ? room.right : 0,
  };
}

/** Whether two rooms are the same. */
const sameRoom = (a: PieRoom, b: PieRoom) =>
  a.left === b.left &&
  a.right === b.right &&
  a.top === b.top &&
  a.bottom === b.bottom;

/**
    Lays the slices out, keeping room around the ring for the labels that
    go outside it. Room beside the ring is grown twice at most (see
    `pieLabelRoom`), since a smaller ring can send more labels outside; then
    room above and below it is kept, once, for the labels the columns had
    no place for (see `crowdedRoom`); last, a side whose labels couldn't be
    placed gives its room back to the ring. The room only grows until that
    last step, so the ring only shrinks, never below `min` (the ring's size
    at `PIE_MIN_SCALE`).
    @param viz The chart.
    @param layout Lays the slices out with room kept around the ring.
    @param min The least size the ring keeps.
*/
export function layoutWithLabelRoom(
  viz: VizInstance,
  layout: (room: PieRoom) => PieSlice[],
  min: {width: number; height: number},
): PieSlice[] {
  let room = NO_ROOM;
  let slices = layout(room);
  for (let pass = 0; pass < 2; pass++) {
    const next = pieLabelRoom(viz, slices, room, min.width);
    if (sameRoom(next, room)) break;
    room = next;
    slices = layout(room);
  }
  if (!room.left && !room.right) return slices;
  const {crowded} = pieOutsideLabels(viz, slices);
  if (crowded.length) {
    const next = crowdedRoom(
      room,
      crowded,
      chartBounds(viz).height,
      min.height,
    );
    if (!sameRoom(next, room)) {
      room = next;
      slices = layout(room);
    }
  }
  const used = {left: false, right: false};
  for (const d of pieOutsideLabels(viz, slices).named) {
    const right = outsideSide((d.startAngle + d.endAngle) / 2) === 1;
    used[right ? "right" : "left"] = true;
  }
  const kept = usedRoom(room, used);
  return sameRoom(kept, room) ? slices : layout(kept);
}
