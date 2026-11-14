/**
    Waffle's `layout: "arc"`: fits the arc to the chart area and places
    every cell on it, in fill order (see `arcLayout.ts`).

    @module
*/

import {fitRing, pieSweep} from "../Pie/arcFit.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {
  arcRingCount,
  arcRingSeats,
  arcSeatPoint,
  arcSeats,
  arcSeatSize,
  majorityAngle,
  majoritySeats,
} from "./arcLayout.js";

/** How far the majority line reaches past the outer ring, in pixels (kept free above the arc). */
export const MAJORITY_OVERHANG = 4;

/** The fitted arc: its center and radii in pixels, sweep, and majority. */
export interface WaffleArc {
  cx: number;
  cy: number;
  /** The outer radius. */
  radius: number;
  /** The inner radius, the hole the center label fills. */
  inner: number;
  start: number;
  end: number;
  /** The seats a majority needs (0 for none). */
  majority: number;
  /** The angle the majority line marks, or null. */
  majorityAngle: number | null;
  /** The seats' diameter. */
  size: number;
}

/** A placed cell: its ring and place on it, and its square's top-left corner and side. */
export interface ArcCellPlace {
  row: number;
  column: number;
  x: number;
  y: number;
  size: number;
}

/** Whether a chart lays its cells out on an arc. */
export function isArcLayout(viz: VizInstance): boolean {
  return viz.schema.layout === "arc";
}

/**
    The inner radius in pixels for an outer radius: the `innerRadius`
    setting (pixels, or a function of the outer radius), at most 90% of it.
*/
export function arcInnerRadius(setting: unknown, outer: number): number {
  const raw =
    typeof setting === "function"
      ? Number((setting as (outer: number) => unknown)(outer))
      : Number(setting);
  const px = Number.isFinite(raw) ? Math.max(0, raw) : 0;
  return Math.min(px, outer * 0.9);
}

/**
    The width/height ratio of an arc's footprint: 2 for the default half
    circle (for small-multiple panels).
*/
export function arcAspect(viz: VizInstance): number {
  const {start, end} = pieSweep(viz.schema.startAngle, viz.schema.endAngle);
  const fit = fitRing(2, 2, start, end);
  const b = fit.box;
  const h = b.y1 - b.y0;
  return h > 0 ? (b.x1 - b.x0) / h : 1;
}

/**
    Lays `count` cells out on an arc fitted to `width × height`: the rings
    (`rings`, or as many as the cells need), the seats on each, and each
    cell's place in fill order. Room is kept above for the majority line's
    overhang.
    @param viz The chart.
    @param count The number of cells.
    @param width The chart area's width.
    @param height The chart area's height.
*/
export function waffleArcLayout(
  viz: VizInstance,
  count: number,
  width: number,
  height: number,
): {arc: WaffleArc; places: ArcCellPlace[]} {
  const {start, end} = pieSweep(viz.schema.startAngle, viz.schema.endAngle);
  const majority = majoritySeats(viz.schema.majority, count);
  const top = majority ? MAJORITY_OVERHANG : 0;
  const fit = fitRing(width, Math.max(0, height - top), start, end);
  const radius = fit.radius;
  const inner = arcInnerRadius(viz.schema.innerRadius, radius);
  const ratio = radius > 0 ? inner / radius : 0;
  const sweep = Math.abs(end - start);
  const ringSetting = Math.round(Number(viz.schema.rings));
  const rings =
    ringSetting > 0
      ? Math.min(ringSetting, Math.max(1, count))
      : arcRingCount(count, ratio, sweep);
  const perRing = arcRingSeats(count, rings, ratio);
  const seats = arcSeats(perRing, ratio, start, end);
  const size = arcSeatSize(
    perRing,
    ratio,
    sweep,
    radius,
    Number(viz.schema.cellPadding) || 0,
  );
  const cx = fit.cx;
  const cy = fit.cy + top;
  const places = seats.map(seat => {
    const [px, py] = arcSeatPoint(seat, radius);
    return {
      row: seat.ring,
      column: seat.index,
      x: cx + px - size / 2,
      y: cy + py - size / 2,
      size,
    };
  });
  return {
    arc: {
      cx,
      cy,
      radius,
      inner,
      start,
      end,
      majority,
      majorityAngle: majorityAngle(seats, majority),
      size,
    },
    places,
  };
}
