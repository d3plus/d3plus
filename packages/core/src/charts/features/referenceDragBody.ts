/**
    Moving a whole reference band by its body. The body takes no pointer
    events of its own, so the marks under it keep their hover and
    tooltips: a press inside it is caught, in the capture phase, on the
    element holding the chart (before the zoom sees it), and once it moves
    past `BOX_DRAG_DISTANCE` it drags the band; a press that doesn't move
    still clicks what is under it. For the keyboard the body is a focusable
    slider laid over the band: the arrow keys move it a step (up and down
    the vertical span, left and right the horizontal one), Page Up and Page
    Down ten, Home and End to the ends of its range. A grip marks its
    center.
*/
import {zoomIdentity} from "d3-zoom";
import type {
  GroupNode,
  HtmlOverlayNode,
  LineNode,
  RectNode,
  SceneNode,
} from "@d3plus/render";

import {
  clientPoint,
  gestureHoverEnd,
  gestureHoverMove,
  gestureHoverStart,
} from "../drawSteps/gestureHover.js";
import {dragsFar, suppressClick} from "../drawSteps/zoomDrag.js";
import {chartBackground} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {isVertical, type AnnotationAxis} from "./annotationFrame.js";
import {
  dragLit,
  redrawAfterDrag,
  referenceDragState,
  scheduleDragRepaint,
} from "./referenceDrag.js";
import {
  dragShift,
  fireBodyEvent,
  keyShift,
  moveBody,
  type BandBody,
} from "./referenceDragBand.js";
import {GRIP_KEY} from "./referenceDragGrip.js";
import {pressStartsDrag} from "./referenceDragHandle.js";

/** The class of a band body's slider element. */
export const BODY_CLASS = "d3plus-reference-drag-body";

/** The size of the grip at a band's center, in pixels. */
export const BODY_GRIP = 14;

/** The listeners `bindBodyDrag` added, and the element they are on. */
interface Binding {
  host: Element;
  press: (event: Event) => void;
}

/**
    The band body under a press: one whose overlay's box holds the point,
    unless the press is on an overlay of its own (a handle, a control).
    @param viz The chart.
    @param event The press.
*/
export function bodyUnder(viz: VizInstance, event: Event): BandBody | null {
  const at = clientPoint(event);
  const target = event.target as Element | null;
  if (!at || target?.closest?.(".d3plus-render-overlays")) return null;
  const bodies = [...referenceDragState(viz).bodies.values()].reverse();
  return (
    bodies.find(body => {
      const r = body.el?.getBoundingClientRect();
      return (
        !!r &&
        at[0] >= r.left &&
        at[0] <= r.right &&
        at[1] >= r.top &&
        at[1] <= r.bottom
      );
    }) ?? null
  );
}

/** Follows a press inside a band's body until it lets go, dragging once it moves. */
function follow(viz: VizInstance, body: BandBody, press: Event): void {
  const state = referenceDragState(viz);
  const touch = press.type === "touchstart";
  const view = ((press as UIEvent).view ?? window) as Window;
  const origin = clientPoint(press)!;
  const from = body.spans.map(s => ({...s}));
  const start = body.spans.map(s => s.values.slice() as [number, number]);
  let dragging = false;
  const block = (event: Event): void => event.preventDefault();
  const move = (event: Event): void => {
    const at = clientPoint(event);
    if (!at) return;
    if (!dragging) {
      if (!dragsFar(origin, at)) return;
      dragging = true;
      state.dragging = body.id;
      gestureHoverStart(viz, {transform: zoomIdentity, sourceEvent: press});
      gestureHoverMove(viz, {transform: zoomIdentity, sourceEvent: event});
    }
    if (event.cancelable) event.preventDefault();
    const shifts: Partial<Record<AnnotationAxis, number>> = {};
    from.forEach(span => {
      const d = isVertical(span.axis) ? at[1] - origin[1] : at[0] - origin[0];
      shifts[span.axis] = dragShift(span, d);
    });
    if (!moveBody(viz, body, start, shifts, event)) scheduleDragRepaint(viz);
  };
  const moveType = touch ? "touchmove" : "mousemove";
  const endTypes = touch ? ["touchend", "touchcancel"] : ["mouseup"];
  const end = (event: Event): void => {
    view.removeEventListener(moveType, move, true);
    for (const type of endTypes) view.removeEventListener(type, end, true);
    view.removeEventListener("selectstart", block, true);
    view.removeEventListener("dragstart", block, true);
    if (!dragging) return;
    state.dragging = undefined;
    gestureHoverEnd(viz);
    fireBodyEvent(viz, "end", body, event);
    redrawAfterDrag(viz);
    if (!touch) suppressClick(view);
  };
  view.addEventListener(moveType, move, {capture: true, passive: false});
  for (const type of endTypes) view.addEventListener(type, end, true);
  view.addEventListener("selectstart", block, true);
  view.addEventListener("dragstart", block, true);
}

/**
    Lets presses inside the chart's draggable band bodies drag them (see
    the module notes). Listens in the capture phase on the element holding
    the chart's drawing surface; rebinds when that element changes.
    @param viz The chart.
*/
export function bindBodyDrag(viz: VizInstance): void {
  const host = (viz._select?.node?.() as Element | null)?.parentElement;
  const bound = viz.ctx.referenceBodyBinding as Binding | undefined;
  if (!host || bound?.host === host) return;
  if (bound) {
    bound.host.removeEventListener("mousedown", bound.press, true);
    bound.host.removeEventListener("touchstart", bound.press, true);
  }
  const press = (event: Event): void => {
    if (viz._selectTool || !pressStartsDrag(event)) return;
    const body = bodyUnder(viz, event);
    if (!body) return;
    // The press is the band's, not the zoom's.
    event.stopPropagation();
    follow(viz, body, event);
  };
  host.addEventListener("mousedown", press, true);
  host.addEventListener("touchstart", press, true);
  viz.ctx.referenceBodyBinding = {host, press} satisfies Binding;
}

/** The keys that move a band's vertical span, and those that move its horizontal one. */
const VERTICAL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown"]);
const HORIZONTAL_KEYS = new Set(["ArrowLeft", "ArrowRight"]);

/**
    The spans a key moves: the vertical span for up, down, Page Up and Page
    Down, the horizontal one for left and right (every span when the band
    has none that way), and every span for Home and End.
    @param body The band's body.
    @param key The key.
*/
export function keySpans(body: BandBody, key: string): BandBody["spans"] {
  const way = VERTICAL_KEYS.has(key)
    ? true
    : HORIZONTAL_KEYS.has(key)
      ? false
      : undefined;
  if (way === undefined) return body.spans;
  const spans = body.spans.filter(s => isVertical(s.axis) === way);
  return spans.length ? spans : body.spans;
}

/** Moves a focused band body for a key press. */
function keydown(viz: VizInstance, body: BandBody, event: Event): void {
  const e = event as KeyboardEvent;
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  const shifts: Partial<Record<AnnotationAxis, number>> = {};
  let handled = false;
  for (const span of keySpans(body, e.key)) {
    const shift = keyShift(span, e.key);
    if (shift === null) continue;
    handled = true;
    shifts[span.axis] = shift;
  }
  if (!handled) return;
  e.preventDefault();
  e.stopPropagation();
  const from = body.spans.map(s => s.values.slice() as [number, number]);
  if (moveBody(viz, body, from, shifts, e))
    referenceDragState(viz).keyed = body.id;
}

/** Settles a band body the keys moved. */
function keyup(viz: VizInstance, body: BandBody, event: Event): void {
  const state = referenceDragState(viz);
  if (state.keyed !== body.id) return;
  state.keyed = undefined;
  fireBodyEvent(viz, "end", body, event);
  redrawAfterDrag(viz);
}

/** Lights or unlights a band body while it has focus. */
function focus(viz: VizInstance, id: string | undefined): void {
  const state = referenceDragState(viz);
  if (state.focus === id) return;
  state.focus = id;
  scheduleDragRepaint(viz);
}

/**
    Writes a band body's name and spans onto its slider.
    @param el The overlay's host element.
    @param body The band's body.
*/
export function syncBody(el: HTMLElement, body: BandBody): void {
  body.el = el;
  const handle = el.querySelector(`.${BODY_CLASS}`);
  if (!handle) return;
  const attrs: Record<string, string> = {
    "aria-label": body.name,
    "aria-valuenow": `${Math.min(...body.spans[0].values)}`,
    "aria-valuetext": body.text,
  };
  for (const [name, value] of Object.entries(attrs))
    if (handle.getAttribute(name) !== value) handle.setAttribute(name, value);
}

/**
    The grip at a band body's center: a round knob in the chart's background
    color with a cross in the band's color.
    @param viz The chart.
    @param body The band's body.
    @param stroke The band's color.
    @param lit Whether the body is lit.
    @param key The annotation's key, which prefixes the grip's.
*/
export function bodyGrip(
  viz: VizInstance,
  body: BandBody,
  stroke: string,
  lit: boolean,
  key: string,
): GroupNode {
  const {box} = body;
  const cx = box.x + box.width / 2,
    cy = box.y + box.height / 2;
  const r = BODY_GRIP / 2;
  const knob: RectNode = {
    type: "rect",
    key: `${key}-knob`,
    interactive: false,
    x: cx - r,
    y: cy - r,
    width: BODY_GRIP,
    height: BODY_GRIP,
    rx: r,
    ry: r,
    paint: {fill: chartBackground(viz), stroke, strokeWidth: lit ? 2 : 1},
  } as RectNode;
  const arm = (dx: number, dy: number, i: number): LineNode =>
    ({
      type: "line",
      key: `${key}-arm-${i}`,
      interactive: false,
      curve: "linear",
      points: [
        [cx - dx, cy - dy],
        [cx + dx, cy + dy],
      ],
      paint: {fill: "none", stroke, strokeWidth: 1},
    }) as LineNode;
  return {
    type: "group",
    key: `${key}-body${GRIP_KEY}`,
    interactive: false,
    children: [knob, arm(3.5, 0, 0), arm(0, 3.5, 1)],
  } as GroupNode;
}

/**
    The nodes a draggable band's body adds: its grip, and the slider laid
    over it (which takes no pointer events).
    @param viz The chart.
    @param body The band's body.
    @param stroke The band's color.
    @param key The annotation's key.
*/
export function bodyNodes(
  viz: VizInstance,
  body: BandBody,
  stroke: string,
  key: string,
): SceneNode[] {
  bindBodyDrag(viz);
  const lit = dragLit(referenceDragState(viz), body.id);
  const overlay: HtmlOverlayNode = {
    type: "htmlOverlay",
    key: `reference-drag-${body.id}`,
    ...body.box,
    style: {pointerEvents: "none"},
    html: `<div class="${BODY_CLASS}" role="slider" tabindex="0" aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight PageUp PageDown Home End" style="width:100%;height:100%;pointer-events:none"></div>`,
    events: {
      [`.${BODY_CLASS}`]: {
        keydown: e => keydown(viz, body, e),
        keyup: e => keyup(viz, body, e),
        focusin: () => focus(viz, body.id),
        focusout: e => {
          keyup(viz, body, e);
          focus(viz, undefined);
        },
      },
    },
    onUpdate: el => syncBody(el, body),
  };
  return [bodyGrip(viz, body, stroke, lit, key), overlay];
}
