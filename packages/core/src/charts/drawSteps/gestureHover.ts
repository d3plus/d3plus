/**
    Tooltips and hover during zoom gestures. Once a drag pans the chart (or
    turns a Geomap globe), or a wheel or pinch zooms it, the marks move out
    from under a pointer that d3-zoom keeps from reporting moves: the pointer
    leaves whatever it was over, hiding its tooltip and hover, and pointer
    events wait for the gesture to end. The next move after it hovers what is
    under the pointer then. A press that lets go without moving changes
    nothing, so a click behaves as without zoom.

    @module
*/

import type {ZoomGestureEvent} from "./zoomGesture.js";
import type {VizInstance} from "../viz/vizTypes.js";

type Point = [number, number];

/** The client position of a mouse or wheel event, or of a touch event's first touch. */
export function clientPoint(event: Event | null | undefined): Point | null {
  if (!event) return null;
  const {touches, changedTouches} = event as Partial<TouchEvent>;
  const touch = touches?.[0] ?? changedTouches?.[0];
  const at = touch ?? (event as Partial<MouseEvent>);
  return typeof at.clientX === "number" && typeof at.clientY === "number"
    ? [at.clientX, at.clientY]
    : null;
}

/**
    Whether a zoom gesture's source event moves the chart: a wheel, a touch
    move, or a mouse move away from where the press began. Programmatic zooms
    (no source event) and the press itself don't.
    @param press The press's client position, if the gesture began with one.
    @param source The event behind a d3-zoom "zoom" event.
*/
export function gestureMoves(
  press: Point | null,
  source: Event | null | undefined,
): boolean {
  if (!source) return false;
  if (source.type === "wheel" || source.type === "touchmove") return true;
  if (source.type !== "mousemove") return false;
  const at = clientPoint(source);
  return !press || !at || at[0] !== press[0] || at[1] !== press[1];
}

/** Whether a zoom gesture is moving the chart, so pointer events wait. */
export function gestureHolds(viz: Pick<VizInstance, "_gestureHover">): boolean {
  return !!viz._gestureHover?.moving;
}

/** A zoom gesture begins (d3-zoom's "start"). */
export function gestureHoverStart(
  viz: VizInstance,
  event: ZoomGestureEvent,
): void {
  viz._gestureHover = {press: clientPoint(event.sourceEvent), moving: false};
}

/** A zoom gesture moves (d3-zoom's "zoom"): the first move leaves the hovered mark. */
export function gestureHoverMove(
  viz: VizInstance,
  event: ZoomGestureEvent,
): void {
  const state = viz._gestureHover;
  if (!state || state.moving || !gestureMoves(state.press, event.sourceEvent))
    return;
  state.moving = true;
  leaveHover(viz, event.sourceEvent as Event);
}

/** A zoom gesture ends (d3-zoom's "end"). */
export function gestureHoverEnd(viz: VizInstance): void {
  viz._gestureHover = undefined;
}

/**
    Sends the chart the leave the pointer makes when the marks move out from
    under it, through the same route a real one takes, so every chart's
    leave handlers clear hover and the tooltip. Nearest-point hover forgets
    its mark, so the next move enters whatever is under the pointer.
*/
function leaveHover(viz: VizInstance, source: Event): void {
  if (viz._nearestHover) viz._nearestHover.key = null;
  const node = (viz._zoomEventTarget || viz._container)?.node() as
    Element | null | undefined;
  const at = clientPoint(source);
  const rect = node?.getBoundingClientRect();
  const point: Point =
    at && rect ? [at[0] - rect.left, at[1] - rect.top] : [0, 0];
  viz._routeSceneEvent?.({
    type: "mouseleave",
    point,
    pick: null,
    nativeEvent: source,
  });
  // The leave handlers hide a mark's tooltip a macrotask later; hide it now,
  // along with one that no mark owns (a keyboard-focused mark's).
  const tooltip = viz._tooltipClass;
  if (tooltip && tooltip.data().length) tooltip.data([]).render();
}
