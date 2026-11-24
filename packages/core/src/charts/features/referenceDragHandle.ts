/**
    The handle a draggable reference line is moved by: a strip of HTML laid
    over the line (so SVG and Canvas charts take it alike), a slider to
    assistive technology. A press on it drags the line with the mouse or
    one finger, never panning the chart; the arrow keys move a focused line
    a step, Page Up and Page Down ten, and Home and End to the ends of its
    range, each announced as the slider's new value. Hovering, focusing, or
    dragging the line lights it.
*/
import {zoomIdentity} from "d3-zoom";
import type {HtmlOverlayNode} from "@d3plus/render";

import {
  clientPoint,
  gestureHoverEnd,
  gestureHoverMove,
  gestureHoverStart,
} from "../drawSteps/gestureHover.js";
import {suppressClick} from "../drawSteps/zoomDrag.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {isVertical} from "./annotationFrame.js";
import {
  fireReferenceEvent,
  referenceDragState,
  scheduleDragRepaint,
  setReferenceValue,
  type ReferenceDragTarget,
} from "./referenceDrag.js";
import {dragRange, keyValue, valueAtPixel} from "./referenceDragValue.js";

/** How thick the handle is, in pixels. */
export const HANDLE_SIZE = 12;

/** The class of the handle's element. */
export const HANDLE_CLASS = "d3plus-reference-drag";

/** Whether a press may start a drag: one finger, or the primary button with no modifier. */
export function pressStartsDrag(event: Event): boolean {
  if (event.type === "touchstart")
    return ((event as TouchEvent).touches?.length ?? 0) === 1;
  const e = event as MouseEvent;
  return !e.button && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey;
}

/** Lights or unlights a line, repainting when that changes. */
function light(
  viz: VizInstance,
  key: "hover" | "focus",
  index: number | undefined,
): void {
  const state = referenceDragState(viz);
  if (state[key] === index) return;
  state[key] = index;
  scheduleDragRepaint(viz);
}

/** Follows a press on a line's handle until it lets go. */
function press(viz: VizInstance, index: number, event: Event): void {
  const state = referenceDragState(viz);
  const target = state.targets.get(index);
  const origin = clientPoint(event);
  if (!target || !origin || state.dragging !== undefined) return;
  if (!pressStartsDrag(event)) return;
  // The press is the line's: no text selection, focus, zoom, or scroll.
  event.preventDefault();
  event.stopPropagation();
  const touch = event.type === "touchstart";
  const view = ((event as UIEvent).view ?? window) as Window;
  const from = target.at;
  const vertical = isVertical(target.axis);
  let moved = false;
  state.dragging = index;
  scheduleDragRepaint(viz);
  gestureHoverStart(viz, {transform: zoomIdentity, sourceEvent: event});
  const move = (e: Event): void => {
    const at = clientPoint(e);
    if (!at) return;
    if (e.cancelable) e.preventDefault();
    const px = from + (vertical ? at[1] - origin[1] : at[0] - origin[0]);
    const value = valueAtPixel(target.dragAxis, px, target.options);
    if (!setReferenceValue(viz, index, value, e)) return;
    if (!moved)
      gestureHoverMove(viz, {transform: zoomIdentity, sourceEvent: e});
    moved = true;
  };
  const moveType = touch ? "touchmove" : "mousemove";
  const endTypes = touch ? ["touchend", "touchcancel"] : ["mouseup"];
  const end = (e: Event): void => {
    view.removeEventListener(moveType, move, true);
    for (const type of endTypes) view.removeEventListener(type, end, true);
    state.dragging = undefined;
    gestureHoverEnd(viz);
    scheduleDragRepaint(viz);
    if (!moved) return;
    fireReferenceEvent(viz, "end", index, e);
    if (!touch) suppressClick(view);
  };
  view.addEventListener(moveType, move, {capture: true, passive: false});
  for (const type of endTypes) view.addEventListener(type, end, true);
}

/** Moves a focused line for a key press. */
function keydown(viz: VizInstance, index: number, event: Event): void {
  const target = referenceDragState(viz).targets.get(index);
  const e = event as KeyboardEvent;
  if (!target || e.altKey || e.ctrlKey || e.metaKey) return;
  const next = keyValue(
    e.key,
    target.dragAxis,
    {value: target.value, px: target.at},
    target.length,
    target.options,
  );
  if (next === null) return;
  e.preventDefault();
  e.stopPropagation();
  if (setReferenceValue(viz, index, next, e))
    fireReferenceEvent(viz, "end", index, e);
}

/**
    Writes a line's current value and name onto its handle's slider.
    @param el The overlay's host element.
    @param target The line.
*/
export function syncHandle(el: HTMLElement, target: ReferenceDragTarget): void {
  const handle = el.querySelector(`.${HANDLE_CLASS}`);
  if (!handle) return;
  const [min, max] = dragRange(target.dragAxis, target.options);
  const attrs: Record<string, string> = {
    "aria-label": target.name,
    "aria-valuemin": `${min}`,
    "aria-valuemax": `${max}`,
    "aria-valuenow": `${target.value}`,
    "aria-valuetext": target.text,
  };
  for (const [name, value] of Object.entries(attrs))
    if (handle.getAttribute(name) !== value) handle.setAttribute(name, value);
}

/**
    The handle of a draggable line: a strip `HANDLE_SIZE` pixels across,
    centered on the line and as long as it.
    @param viz The chart.
    @param target The line.
*/
export function referenceDragHandle(
  viz: VizInstance,
  target: ReferenceDragTarget,
): HtmlOverlayNode {
  const {index, at, span} = target;
  // A line on a vertical axis runs across the plot and moves up and down.
  const across = isVertical(target.axis);
  const half = HANDLE_SIZE / 2;
  const box = across
    ? {x: span[0], y: at - half, width: span[1] - span[0], height: HANDLE_SIZE}
    : {x: at - half, y: span[0], width: HANDLE_SIZE, height: span[1] - span[0]};
  const style = [
    "width:100%",
    "height:100%",
    `cursor:${across ? "ns-resize" : "ew-resize"}`,
    "touch-action:none",
  ].join(";");
  return {
    type: "htmlOverlay",
    key: `reference-drag-${index}`,
    ...box,
    html: `<div class="${HANDLE_CLASS}" role="slider" tabindex="0" aria-orientation="${across ? "vertical" : "horizontal"}" style="${style}"></div>`,
    events: {
      [`.${HANDLE_CLASS}`]: {
        mousedown: e => press(viz, index, e),
        touchstart: e => press(viz, index, e),
        keydown: e => keydown(viz, index, e),
        mouseover: () => light(viz, "hover", index),
        mouseout: () => light(viz, "hover", undefined),
        focusin: () => light(viz, "focus", index),
        focusout: () => light(viz, "focus", undefined),
      },
    },
    onUpdate: el => syncHandle(el, target),
  };
}
