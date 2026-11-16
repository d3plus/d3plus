/**
    Dragging a chart's nodes (Network, Sankey) with the mouse or one finger.

    A press on a node is taken before the zoom (or a select tool) sees it,
    so dragging a node never pans the chart. Once the press moves past
    `BOX_DRAG_DISTANCE`, the chart's `NodeDrag` moves the node; hover and
    the tooltip wait for the drag to end, as they do for a pan (see
    `gestureHover.ts`), and the click the drag ends with is swallowed, so it
    neither focuses nor selects. A press that doesn't move is left to click
    as usual. A double-click on a node goes to `NodeDrag.dblclick`.

    @module
*/

import {zoomIdentity} from "d3-zoom";
import type {SceneNode, Transform} from "@d3plus/render";

import {
  clientPoint,
  gestureHoverEnd,
  gestureHoverMove,
  gestureHoverStart,
} from "../drawSteps/gestureHover.js";
import {dragsFar, suppressClick} from "../drawSteps/zoomDrag.js";
import {setCursor} from "../viz/setCursor.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** A point, in pixels. */
export type Point = [number, number];

/** How a chart drags its nodes. Points are in the chart's own (unzoomed) space. */
export interface NodeDrag {
  /** The id of the node a painted scene node draws, or null when it isn't a draggable node. */
  nodeAt(node: SceneNode): string | null;
  /** A drag begins on a node, from `at`. */
  start(id: string, at: Point): void;
  /** The node is dragged to `at`. */
  move(id: string, at: Point): void;
  /** The node is let go at `at`. */
  end(id: string, at: Point): void;
  /** A double-click on a node; true when it was acted on. */
  dblclick?(id: string): boolean;
}

/** The listeners `bindNodeDrag` added, and the element they are on. */
interface Binding {
  host: Element;
  press: (event: Event) => void;
  dblclick: (event: Event) => void;
}

/**
    A point on the chart's drawing surface in the chart's own space: undoes
    the zoom transform, then the chart's positioning transform (see
    `Viz.toScene`).
    @param point The point on the surface.
    @param zoom The zoom transform.
    @param chart The chart's positioning transform.
*/
export function chartPoint(
  [px, py]: Point,
  zoom?: Transform,
  chart?: Transform,
): Point {
  const zk = zoom?.scale ?? 1;
  const ck = chart?.scale ?? 1;
  const x = (px - (zoom?.x ?? 0)) / zk;
  const y = (py - (zoom?.y ?? 0)) / zk;
  return [(x - (chart?.x ?? 0)) / ck, (y - (chart?.y ?? 0)) / ck];
}

/** The renderer's drawing surface the event happened on, if any. */
function surfaceOf(
  viz: VizInstance,
  target: EventTarget | null,
): Element | null {
  const elements: Element[] = viz._sceneRenderer?.elements?.() ?? [];
  const node = target as Node | null;
  if (!node || typeof node.nodeType !== "number") return null;
  return (
    elements.find(
      el =>
        (el.localName === "svg" || el.localName === "canvas") &&
        (el === node || el.contains(node)),
    ) ?? null
  );
}

/** Where a surface's own coordinates start, in client pixels. */
function surfaceOrigin(surface: Element): Point {
  const ctm =
    surface.localName === "svg" &&
    typeof (surface as SVGSVGElement).getScreenCTM === "function"
      ? (surface as SVGSVGElement).getScreenCTM()
      : null;
  if (ctm) return [ctm.e, ctm.f];
  const rect = surface.getBoundingClientRect();
  return [rect.left, rect.top];
}

/** The id of the draggable node under an event, with the surface it is on. */
function nodeUnder(
  viz: VizInstance,
  drag: NodeDrag,
  event: Event,
): {id: string; surface: Element} | null {
  const surface = surfaceOf(viz, event.target);
  const at = clientPoint(event);
  if (!surface || !at || !viz._sceneRenderer) return null;
  const origin = surfaceOrigin(surface);
  const pick = viz._sceneRenderer.pick([at[0] - origin[0], at[1] - origin[1]]);
  const id = pick?.node ? drag.nodeAt(pick.node) : null;
  return id === null ? null : {id, surface};
}

/** Whether a press may start a drag: the primary button, no modifier, not a double-click's second press. */
function pressCounts(event: Event): boolean {
  if (event.type === "touchstart")
    return ((event as TouchEvent).touches?.length ?? 0) === 1;
  const e = event as MouseEvent;
  return (
    !e.button &&
    !e.shiftKey &&
    !e.ctrlKey &&
    !e.metaKey &&
    !e.altKey &&
    e.detail < 2
  );
}

/** The press's drag: follows the pointer until it lets go. */
function follow(
  viz: VizInstance,
  drag: NodeDrag,
  press: Event,
  id: string,
  surface: Element,
): void {
  const touch = press.type === "touchstart";
  const view = ((press as UIEvent).view ?? window) as Window;
  const origin = clientPoint(press)!;
  const toChart = (event: Event): Point => {
    const at = clientPoint(event) ?? origin;
    const o = surfaceOrigin(surface);
    return chartPoint(
      [at[0] - o[0], at[1] - o[1]],
      viz._zoomTransform,
      viz._chartTransform,
    );
  };
  let dragging = false;
  const moveType = touch ? "touchmove" : "mousemove";
  const endTypes = touch ? ["touchend", "touchcancel"] : ["mouseup"];
  // No text selection or native drag while the node moves.
  const block = (event: Event): void => event.preventDefault();
  const move = (event: Event): void => {
    if (!dragging) {
      const at = clientPoint(event);
      if (!at || !dragsFar(origin, at)) return;
      dragging = true;
      gestureHoverStart(viz, {transform: zoomIdentity, sourceEvent: press});
      gestureHoverMove(viz, {transform: zoomIdentity, sourceEvent: event});
      setCursor(viz, "grabbing");
      drag.start(id, toChart(press));
    }
    if (event.cancelable) event.preventDefault();
    drag.move(id, toChart(event));
  };
  const end = (event: Event): void => {
    view.removeEventListener(moveType, move, true);
    for (const type of endTypes) view.removeEventListener(type, end, true);
    view.removeEventListener("selectstart", block, true);
    view.removeEventListener("dragstart", block, true);
    if (!dragging) return;
    drag.end(id, toChart(event));
    gestureHoverEnd(viz);
    setCursor(viz, "auto");
    if (!touch) suppressClick(view);
  };
  view.addEventListener(moveType, move, {capture: true, passive: false});
  for (const type of endTypes) view.addEventListener(type, end, true);
  view.addEventListener("selectstart", block, true);
  view.addEventListener("dragstart", block, true);
}

/**
    Lets the nodes of a chart be dragged (see the module notes). Listens, in
    the capture phase, on the element holding the chart's drawing surface,
    so it sees a press before the zoom does. Call it on every draw: it
    rebinds when that element changes.
    @param viz The chart.
    @param drag How the chart drags its nodes.
    @param enabled Whether nodes may be dragged right now.
*/
export function bindNodeDrag(
  viz: VizInstance,
  drag: NodeDrag,
  enabled: () => boolean,
): void {
  const host = (viz._select?.node?.() as Element | null)?.parentElement;
  const bound = viz.ctx.nodeDragBinding as Binding | undefined;
  if (bound?.host === host) return;
  unbindNodeDrag(viz);
  if (!host) return;
  const press = (event: Event): void => {
    if (!enabled() || viz._selectTool || !pressCounts(event)) return;
    const hit = nodeUnder(viz, drag, event);
    if (!hit) return;
    // The press is the drag's, not the zoom's.
    event.stopPropagation();
    follow(viz, drag, event, hit.id, hit.surface);
  };
  const dblclick = (event: Event): void => {
    if (!enabled() || !drag.dblclick) return;
    const hit = nodeUnder(viz, drag, event);
    if (hit && drag.dblclick(hit.id)) event.stopPropagation();
  };
  host.addEventListener("mousedown", press, true);
  host.addEventListener("touchstart", press, true);
  host.addEventListener("dblclick", dblclick, true);
  viz.ctx.nodeDragBinding = {host, press, dblclick} satisfies Binding;
}

/** Removes the listeners `bindNodeDrag` added. */
export function unbindNodeDrag(viz: VizInstance): void {
  const bound = viz.ctx.nodeDragBinding as Binding | undefined;
  if (!bound) return;
  bound.host.removeEventListener("mousedown", bound.press, true);
  bound.host.removeEventListener("touchstart", bound.press, true);
  bound.host.removeEventListener("dblclick", bound.dblclick, true);
  viz.ctx.nodeDragBinding = undefined;
}
