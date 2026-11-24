/**
    The grip drawn on each draggable reference line, band edge, and
    quadrant divider: a small pill in the chart's background color, outlined
    and marked with two ridges in the line's color, at one end of it. It
    shows the reader what can be moved, and thickens with the line when it
    is hovered, focused, or dragged.
*/
import type {GroupNode, LineNode, RectNode, SceneNode} from "@d3plus/render";

import {chartBackground} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {isVertical} from "./annotationFrame.js";
import {
  dragLit,
  referenceDragState,
  type ReferenceDragTarget,
} from "./referenceDrag.js";
import {referenceDragHandle} from "./referenceDragHandle.js";

/** The grip's length along its line, and its thickness across it, in pixels. */
export const GRIP_SIZE: [number, number] = [18, 10];

/** How far the grip sits in from its end of the line, in pixels. */
const INSET = 4;

/** The suffix of a grip's key, which draws it above the data. */
export const GRIP_KEY = "-grip";

/**
    The grip's center: on the line, `INSET` pixels in from the end of its
    span it sits at (the left or bottom for `"start"`).
    @param target The target.
*/
export function gripCenter(target: ReferenceDragTarget): [number, number] {
  const [a, b] = target.span;
  const along = GRIP_SIZE[0] / 2 + INSET;
  // A line on a vertical axis runs across the plot.
  if (isVertical(target.axis))
    return [target.grip === "start" ? a + along : b - along, target.handleAt];
  return [target.handleAt, target.grip === "start" ? b - along : a + along];
}

/**
    The grip's scene nodes, grouped under a key ending in `GRIP_KEY`.
    @param viz The chart.
    @param target The target.
    @param stroke The line's color.
    @param lit Whether the target is lit.
    @param key The annotation's key, which prefixes the group's.
*/
export function referenceDragGrip(
  viz: VizInstance,
  target: ReferenceDragTarget,
  stroke: string,
  lit: boolean,
  key: string,
): GroupNode {
  const [cx, cy] = gripCenter(target);
  const across = isVertical(target.axis);
  const [w, h] = across ? GRIP_SIZE : [GRIP_SIZE[1], GRIP_SIZE[0]];
  const strokeWidth = lit ? 2 : 1;
  const pill: RectNode = {
    type: "rect",
    key: `${key}-pill`,
    interactive: false,
    x: cx - w / 2,
    y: cy - h / 2,
    width: w,
    height: h,
    rx: GRIP_SIZE[1] / 2,
    ry: GRIP_SIZE[1] / 2,
    paint: {fill: chartBackground(viz), stroke, strokeWidth},
  } as RectNode;
  // Two short ridges along the line, either side of it.
  const ridge = (offset: number, i: number): LineNode =>
    ({
      type: "line",
      key: `${key}-ridge-${i}`,
      interactive: false,
      curve: "linear",
      points: across
        ? [
            [cx - 4, cy + offset],
            [cx + 4, cy + offset],
          ]
        : [
            [cx + offset, cy - 4],
            [cx + offset, cy + 4],
          ],
      paint: {fill: "none", stroke, strokeWidth: 1},
    }) as LineNode;
  return {
    type: "group",
    key: `${key}${GRIP_KEY}`,
    interactive: false,
    children: [pill, ridge(-1.5, 0), ridge(1.5, 1)],
  } as GroupNode;
}

/**
    The nodes a draggable target adds to its annotation: its grip and its
    handle, and, for a band edge while it is lit, a line along the edge.
    @param viz The chart.
    @param target The target.
    @param stroke The line's (or band's) color.
    @param key The annotation's key, which prefixes the nodes'.
*/
export function dragNodes(
  viz: VizInstance,
  target: ReferenceDragTarget,
  stroke: string,
  key: string,
): SceneNode[] {
  const lit = dragLit(referenceDragState(viz), target.id);
  const k = `${key}-${target.axis}${target.edge ?? ""}`;
  const out: SceneNode[] = [];
  if (lit && target.edge !== undefined) {
    const [a, b] = target.span,
      at = target.handleAt;
    out.push({
      type: "line",
      key: `${k}-edge`,
      interactive: false,
      curve: "linear",
      points: isVertical(target.axis)
        ? [
            [a, at],
            [b, at],
          ]
        : [
            [at, a],
            [at, b],
          ],
      paint: {fill: "none", stroke, strokeWidth: 2},
    } as LineNode);
  }
  out.push(
    referenceDragGrip(viz, target, stroke, lit, k),
    referenceDragHandle(viz, target),
  );
  return out;
}
