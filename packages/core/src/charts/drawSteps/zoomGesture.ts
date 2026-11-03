/**
    Which presses on the zoom surface belong to something other than d3-zoom.

    @module
*/

import type {ZoomTransform} from "d3-zoom";

/** The groups inside the zoom surface that hold a d3-brush: the timeline's and the zoom brush. */
export const BRUSH_GROUPS = "g.d3plus-viz-timeline, g.d3plus-zoom-brush";

/**
    Whether a press starts on a brush inside the zoom surface (a timeline
    click or drag). d3-brush stops the press's mouseup / touchend from
    reaching any other listener, so a zoom gesture started by the same press
    would never end: every later mousemove would keep "panning" the chart,
    repainting it instantly and cutting short the transition the timeline
    just started.
    @param event The pointer event d3-zoom is filtering.
*/
export function startsOnBrush(event: Pick<Event, "target">): boolean {
  const target = event.target as Partial<Element> | null;
  return Boolean(
    target &&
    typeof target.closest === "function" &&
    target.closest(BRUSH_GROUPS),
  );
}

/** A d3-zoom gesture event, as `ZoomGesture` reads it. */
export interface ZoomGestureEvent {
  /** The zoom transform the event carries. */
  transform: ZoomTransform;
  /** The pointer or wheel event behind it, or null for a programmatic zoom. */
  sourceEvent: Event | null;
}

/**
    A chart's own handling of the zoom behavior's gestures, consulted before
    the zoom transform changes (Geomap turns a globe on a drag).
*/
export interface ZoomGesture {
  /** A gesture begins. */
  start(event: ZoomGestureEvent): void;
  /** A gesture moves; true when the chart handled it, so the zoom transform is left alone. */
  zoom(event: ZoomGestureEvent): boolean;
  /** A gesture ends. */
  end(event: ZoomGestureEvent): void;
  /** The zoom controls' reset was pressed, just before the zoom resets. */
  reset(): void;
}

/**
    The hover hold of a zoom gesture in progress (see `gestureHover.ts`):
    where its press began, and whether it has moved the chart yet.
*/
export interface GestureHoverState {
  /** The press's client position, or null for a gesture without one (a wheel). */
  press: [number, number] | null;
  /** Whether the gesture has moved the chart, holding off hover until it ends. */
  moving: boolean;
}
