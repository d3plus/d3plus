/**
    The pointer gestures a chart zooms by beyond d3-zoom's own pan and wheel:
    a mouse drag that draws a box to zoom into (`zoomDrag: "brush"`), and
    what a double-click does (`zoomDoubleClick`).

    The drawn box needs no brush overlay over the chart: the press listens on
    the zoom surface beside the chart's own pointer listeners, so a click
    that doesn't drag still reaches the shape under it, and hover still
    works until a drag begins. Once one does, it reuses the brush mode's
    pieces: the zoom brush shows the box (with its styles), and releasing
    zooms to it through `viz._zoomToBounds`.

    @module
*/

import {pointer, select} from "d3-selection";
import {zoomTransform} from "d3-zoom";

import type Viz from "../viz/Viz.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {
  gestureHoverEnd,
  gestureHoverMove,
  gestureHoverStart,
} from "./gestureHover.js";
import {setCursor} from "../viz/setCursor.js";
import {startsOnBrush} from "./zoomGesture.js";

/** A point in the zoom surface's coordinates. */
export type Point = [number, number];
/** A box's top-left and bottom-right corners. */
export type Box = [Point, Point];

/** How far (px) a press moves before it draws a box instead of clicking. */
export const BOX_DRAG_DISTANCE = 3;

/** The listener namespace of every gesture bound here. */
const NS = "zoombox";

/** Window listeners a press adds, removed when it lets go. */
const PRESS_EVENTS = [
  "mousemove",
  "mouseup",
  "keydown",
  "selectstart",
  "dragstart",
]
  .map(type => `${type}.${NS}`)
  .join(" ");

/**
    Clamps a point into a box.
    @param point The point.
    @param box The box.
*/
export function clampPoint([x, y]: Point, [[x0, y0], [x1, y1]]: Box): Point {
  return [Math.max(x0, Math.min(x1, x)), Math.max(y0, Math.min(y1, y))];
}

/**
    The box two corners span, whichever way the drag went.
    @param a One corner.
    @param b The opposite corner.
*/
export function spanBox(a: Point, b: Point): Box {
  return [
    [Math.min(a[0], b[0]), Math.min(a[1], b[1])],
    [Math.max(a[0], b[0]), Math.max(a[1], b[1])],
  ];
}

/**
    Whether a point lies in a box, edges included.
    @param point The point.
    @param box The box.
*/
export function inBox([x, y]: Point, [[x0, y0], [x1, y1]]: Box): boolean {
  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

/**
    Whether a press at `at` may draw a zoom box: the primary button with no
    modifier key (Shift + drag pans), the first press of a click (not the
    second of a double-click), inside the chart area, and not on a brush
    (the timeline's).
    @param event The mousedown.
    @param at The press, in the zoom surface's coordinates.
    @param area The chart area, in the same coordinates.
*/
export function startsBoxDrag(
  event: MouseEvent,
  at: Point,
  area: Box,
): boolean {
  return (
    !event.button &&
    !event.shiftKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey &&
    event.detail < 2 &&
    !startsOnBrush(event) &&
    inBox(at, area)
  );
}

/**
    Whether a move from `from` to `to` (client pixels) has gone far enough
    to be a drag rather than a click.
    @param from Where the press began.
    @param to Where the pointer is now.
*/
export function dragsFar(from: Point, to: Point): boolean {
  return Math.hypot(to[0] - from[0], to[1] - from[1]) > BOX_DRAG_DISTANCE;
}

/** The chart area in the zoom surface's coordinates (the zoom extent). */
function zoomArea(viz: Viz): Box {
  return viz._zoomBehavior.extent().bind(document)() as Box;
}

/** Shows `box` (surface coordinates) with the zoom brush, offset like it to the chart area. */
function showBox(viz: Viz, box: Box): void {
  const {left, top} = viz._margin;
  viz._brushGroup
    .style("display", "inline")
    .style("pointer-events", "none")
    .call(
      viz._zoomBrush.move,
      box.map(([x, y]) => [x - left, y - top]),
    );
}

/** Hides the zoom brush's box again. */
function hideBox(viz: Viz): void {
  viz._brushGroup
    .call(viz._zoomBrush.move, null)
    .style("display", "none")
    .style("pointer-events", null);
}

/** Swallows the click a drag ends with, so it reaches no shape. */
function suppressClick(view: Window): void {
  const win = select(view);
  win.on(
    `click.${NS}`,
    (event: Event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    },
    true,
  );
  setTimeout(() => win.on(`click.${NS}`, null), 0);
}

/**
    A press on the zoom surface while `zoomDrag` is "brush": once it drags
    past `BOX_DRAG_DISTANCE`, it draws a box (clamped to the chart area),
    holds hover like a pan does (see `gestureHover.ts`) under a crosshair
    cursor, and on release
    zooms to the box and swallows the click. A press that doesn't drag is
    left alone, so it clicks as usual. Escape cancels a box mid-drag.
*/
function pressed(viz: Viz, event: MouseEvent): void {
  const surface = event.currentTarget as Element;
  const area = zoomArea(viz);
  const start = pointer(event, surface) as Point;
  if (!startsBoxDrag(event, start, area)) return;
  const view = event.view ?? window;
  const win = select(view);
  const origin: Point = [event.clientX, event.clientY];
  let box: Box | null = null;

  const finish = (zoom: boolean): void => {
    win.on(PRESS_EVENTS, null);
    if (!box) return;
    setCursor(viz as unknown as VizInstance, "auto");
    hideBox(viz);
    gestureHoverEnd(viz as unknown as VizInstance);
    suppressClick(view);
    if (zoom) viz._zoomToBounds?.(box);
    box = null;
  };

  win
    .on(
      `mousemove.${NS}`,
      (move: MouseEvent) => {
        if (!box) {
          if (!dragsFar(origin, [move.clientX, move.clientY])) return;
          const transform = zoomTransform(surface);
          gestureHoverStart(viz as unknown as VizInstance, {
            transform,
            sourceEvent: event,
          });
          gestureHoverMove(viz as unknown as VizInstance, {
            transform,
            sourceEvent: move,
          });
          setCursor(viz as unknown as VizInstance, "crosshair");
        }
        move.preventDefault();
        const at = clampPoint(pointer(move, surface) as Point, area);
        box = spanBox(clampPoint(start, area), at);
        showBox(viz, box);
      },
      true,
    )
    .on(`mouseup.${NS}`, () => finish(true), true)
    .on(
      `keydown.${NS}`,
      (key: KeyboardEvent) => {
        if (key.key === "Escape" && box) finish(false);
      },
      true,
    )
    .on(
      `selectstart.${NS} dragstart.${NS}`,
      (e: Event) => e.preventDefault(),
      true,
    );
}

/**
    The double-click listener for `zoomDoubleClick`: d3-zoom's own (zoom in)
    for `"in"`, a reset for `"reset"`, or none for `false`. It rides
    d3-zoom's `dblclick.zoom` slot, which d3-zoom also calls for a touch
    double-tap, so a double-tap does the same.
*/
function bindDoubleClick(
  viz: Viz,
  tgt: NonNullable<Viz["_zoomEventTarget"]>,
  reset: () => void,
): void {
  const mode = viz.schema.zoomDoubleClick;
  if (mode === false) tgt.on("dblclick.zoom", null);
  else if (mode === "reset")
    tgt.on("dblclick.zoom", (event: MouseEvent) => {
      if (event.button || event.ctrlKey || startsOnBrush(event)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      reset();
    });
}

/**
    Binds the gestures this module adds to the zoom surface, after d3-zoom's
    own: the drawn zoom box for `zoomDrag: "brush"`, and the double-click
    for `zoomDoubleClick`.
    @param viz The chart.
    @param tgt The element d3-zoom is bound to.
    @param reset Returns the chart to its initial view.
*/
export function bindZoomGestures(
  viz: Viz,
  tgt: NonNullable<Viz["_zoomEventTarget"]>,
  reset: () => void,
): void {
  const brush = viz.schema.zoomDrag === "brush";
  tgt.on(`mousedown.${NS}`, brush ? (e: MouseEvent) => pressed(viz, e) : null);
  bindDoubleClick(viz, tgt, reset);
}

/**
    Removes the gestures `bindZoomGestures` added (d3-zoom's own listeners,
    the double-click included, go with `.on(".zoom", null)`).
    @param tgt The element they were bound to.
*/
export function unbindZoomGestures(
  tgt: NonNullable<Viz["_zoomEventTarget"]>,
): void {
  tgt.on(`.${NS}`, null);
}
