/**
    A callout's geometry in pixels: its box offset from the anchor and kept
    inside the plot, the connector from the box's edge to the anchor, and the
    arrowhead at the anchor.
*/
import type {PlotRect} from "./annotationFrame.js";

/** A pixel point. */
export type Point = [number, number];

/** A pixel rectangle, from its top-left corner. */
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
    A `width` × `height` box centered `dx`/`dy` pixels from the anchor.
    @param anchor The anchor.
    @param size The box's size.
    @param dx The horizontal offset of its center.
    @param dy The vertical offset of its center.
*/
export function offsetBox(
  anchor: Point,
  size: {width: number; height: number},
  dx: number,
  dy: number,
): Box {
  return {
    x: anchor[0] + dx - size.width / 2,
    y: anchor[1] + dy - size.height / 2,
    width: size.width,
    height: size.height,
  };
}

/** Moves a `[start, size]` stretch inside `[min, max]`, keeping it at `min` when it is wider. */
const clampStretch = (
  start: number,
  size: number,
  min: number,
  max: number,
): number => Math.max(min, Math.min(start, max - size));

/**
    Moves a box the least distance that puts it inside the plot area; a box
    larger than the plot keeps to its top-left corner.
    @param box The box.
    @param plot The plot area.
*/
export function clampBox(box: Box, plot: PlotRect): Box {
  return {
    ...box,
    x: clampStretch(box.x, box.width, plot.x0, plot.x1),
    y: clampStretch(box.y, box.height, plot.y0, plot.y1),
  };
}

/**
    Where the connector runs: `from` the point the line from the box's center
    to the anchor leaves the box, `to` the anchor (pulled back toward the box
    by `standoff`). Null when the anchor is inside the box or the connector
    would be shorter than a pixel.
    @param box The callout box.
    @param anchor The anchor.
    @param standoff The gap to leave before the anchor.
*/
export function connectorEndpoints(
  box: Box,
  anchor: Point,
  standoff = 0,
): {from: Point; to: Point} | null {
  const cx = box.x + box.width / 2,
    cy = box.y + box.height / 2;
  const vx = anchor[0] - cx,
    vy = anchor[1] - cy;
  const tx = vx ? box.width / 2 / Math.abs(vx) : Infinity;
  const ty = vy ? box.height / 2 / Math.abs(vy) : Infinity;
  const t = Math.min(tx, ty);
  if (!(t < 1)) return null;
  const from: Point = [cx + vx * t, cy + vy * t];
  const length = Math.hypot(anchor[0] - from[0], anchor[1] - from[1]);
  const pull = Math.min(Math.max(standoff, 0), length);
  const k = length ? pull / length : 0;
  const to: Point = [
    anchor[0] - (anchor[0] - from[0]) * k,
    anchor[1] - (anchor[1] - from[1]) * k,
  ];
  if (Math.hypot(to[0] - from[0], to[1] - from[1]) < 1) return null;
  return {from, to};
}

/**
    The three corners of an arrowhead `size` pixels long with its tip at
    `tip`, pointing along the line from `from`: the tip, then its base's two
    corners.
    @param from The line's start.
    @param tip The arrow's tip.
    @param size The arrowhead's length (its base is as wide).
*/
export function arrowheadPoints(
  from: Point,
  tip: Point,
  size: number,
): [Point, Point, Point] {
  const length = Math.hypot(tip[0] - from[0], tip[1] - from[1]) || 1;
  const ux = (tip[0] - from[0]) / length,
    uy = (tip[1] - from[1]) / length;
  const bx = tip[0] - ux * size,
    by = tip[1] - uy * size;
  const half = size / 2;
  return [
    tip,
    [bx - uy * half, by + ux * half],
    [bx + uy * half, by - ux * half],
  ];
}

/**
    Where a point moves along the line from `from` by `distance` pixels back
    from its end (the arrow's base, where the connector stops).
    @param from The line's start.
    @param to The line's end.
    @param distance How far back from `to`.
*/
export function pullBack(from: Point, to: Point, distance: number): Point {
  const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
  if (!length) return to;
  const k = Math.min(distance, length) / length;
  return [to[0] - (to[0] - from[0]) * k, to[1] - (to[1] - from[1]) * k];
}

/** Whether a point lies inside a box. */
const contains = (box: Box, [x, y]: Point): boolean =>
  x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;

/**
    Where a callout's box goes: centered `dx`/`dy` from the anchor and, when
    `clamp` is on, moved inside the plot area. A box that clamping pushes
    over its own anchor tries the opposite offset instead, and keeps it when
    that leaves the anchor clear.
    @param anchor The anchor.
    @param size The box's size.
    @param offset The box center's offset from the anchor.
    @param plot The plot area.
    @param clamp Whether the box stays inside the plot area.
*/
export function placeCalloutBox(
  anchor: Point,
  size: {width: number; height: number},
  [dx, dy]: Point,
  plot: PlotRect,
  clamp = true,
): Box {
  const box = offsetBox(anchor, size, dx, dy);
  if (!clamp) return box;
  const clamped = clampBox(box, plot);
  if (!contains(clamped, anchor) || contains(box, anchor)) return clamped;
  const flipped = clampBox(offsetBox(anchor, size, -dx, -dy), plot);
  return contains(flipped, anchor) ? clamped : flipped;
}
