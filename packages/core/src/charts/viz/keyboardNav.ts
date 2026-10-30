/**
    Keyboard navigation between a chart's data marks (`keyboardNav`). The
    chart is one Tab stop: a focusable host beside its root svg (see
    `keyboardNavHost.ts`). Arrow keys move between marks spatially, and each
    move is replayed through the pointer bridge as the events a mouse would
    send over that mark, so tooltips, hover highlights, the shared tooltip,
    click handlers, and drill-down all behave as they do for the pointer.

    @module
*/

import type {SceneEvent, SceneNode, Transform} from "@d3plus/render";

import {backgroundInk, chartBackground} from "./backgroundInk.js";
import {focusRingNode} from "./focusRing.js";
import type {FocusRingStyle} from "./focusRing.js";
import {focusTargets, nextTarget} from "./focusTargets.js";
import type {FocusDirection, FocusTarget} from "./focusTargets.js";
import {
  createKeyboardNavHost,
  updateKeyboardNavHost,
} from "./keyboardNavHost.js";
import type {KeyboardNavHost} from "./keyboardNavHost.js";
import {handlerDatum} from "./shapeClassTargets.js";
import type {VizInstance} from "./vizTypes.js";

/** A chart's keyboard-navigation state, kept on `viz._keyboardNav`. */
export interface KeyboardNavState extends KeyboardNavHost {
  /** The `id` of the focused target, or null when no mark is focused. */
  current: string | null;
  /** The target the replayed pointer last entered, for the matching leave. */
  hovered: FocusTarget | null;
  /** The chart scene and zoom the focused target was last resolved against. */
  chartScene?: SceneNode[];
  zoom?: Transform;
  /** Set when a redraw moved or replaced the focused mark, so it is re-entered. */
  stale: boolean;
  /** Replayed events waiting for an animated transition to settle. */
  queue: (() => void)[];
  timer?: ReturnType<typeof setTimeout>;
  /** The host's DOM listeners, for removal. */
  listeners: [string, EventListener][];
}

/** Arrow keys and the direction each moves. */
const ARROWS: Record<string, FocusDirection> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

/** The targets in the scene last painted. */
function paintedTargets(viz: VizInstance): FocusTarget[] {
  return focusTargets(viz._paintedScene?.root.children ?? []);
}

/** The focused target in `targets`, if it is still there. */
function currentTarget(
  state: KeyboardNavState,
  targets: FocusTarget[],
): FocusTarget | null {
  return targets.find(t => t.id === state.current) ?? null;
}

/** The source row and index a target reports to handlers. */
function targetRow(target: FocusTarget): {d: unknown; i: number} {
  const {node, pointIndex} = target;
  const point =
    pointIndex !== undefined ? node.interactionPoints?.[pointIndex] : undefined;
  return point
    ? handlerDatum(point.datum, point.index)
    : handlerDatum(node.datum, node.index ?? 0);
}

/**
    What the live region announces for a target: a series point's label from
    the chart's `ariaLabel` accessor, a mark's own `aria-label`, or else its
    label as the tooltip titles it.
*/
export function targetLabel(viz: VizInstance, target: FocusTarget): string {
  const {node, pointIndex} = target;
  const point =
    pointIndex !== undefined ? node.interactionPoints?.[pointIndex] : undefined;
  if (point) {
    const config = viz.schema.shapeConfig || {};
    const accessor =
      (node.shapeType && config[node.shapeType]?.ariaLabel) || config.ariaLabel;
    if (typeof accessor === "function") {
      try {
        const {d, i} = targetRow(target);
        const label = accessor(d, i);
        if (label) return String(label);
      } catch {
        // Falls back to the point's label below.
      }
    }
  } else if (node.aria?.label) return node.aria.label;
  const {d, i} = targetRow(target);
  return d === undefined ? "" : String(viz._drawLabel(d as never, i) ?? "");
}

/** The focus ring's style for a target, from `keyboardNavConfig`. */
export function focusRingStyle(
  viz: VizInstance,
  target: FocusTarget,
): FocusRingStyle {
  const config = viz.schema.keyboardNavConfig || {};
  const {d, i} = targetRow(target);
  const value = <T>(v: unknown, fallback: T): T => {
    const out = typeof v === "function" ? v(d, i) : v;
    return out === undefined || out === null ? fallback : (out as T);
  };
  return {
    stroke: value(config.stroke, backgroundInk(viz)),
    strokeWidth: value(config.strokeWidth, 2),
    padding: value(config.padding, 2),
    halo: chartBackground(viz),
  };
}

/** Runs `fn` now, or once a running transition settles (the bridge drops events until then). */
function whenSettled(
  viz: VizInstance,
  state: KeyboardNavState,
  fn: () => void,
): void {
  state.queue.push(fn);
  if (state.timer !== undefined) return;
  const flush = (): void => {
    state.timer = undefined;
    const wait = (viz._transitionEndsAt ?? 0) - Date.now();
    if (wait > 0) {
      state.timer = setTimeout(flush, wait + 5);
      return;
    }
    const queue = state.queue.splice(0);
    for (const run of queue) run();
  };
  flush();
}

/** Sends one replayed pointer event over `target` (or a leave) through the bridge. */
function send(
  viz: VizInstance,
  type: string,
  target: FocusTarget | null,
  init: {nativeType?: string; shiftKey?: boolean; at?: FocusTarget} = {},
): void {
  const at = target ?? init.at;
  const point: [number, number] = at ? [...at.center] : [0, 0];
  const svg = viz._select?.node?.() as Element | undefined;
  const rect = svg?.getBoundingClientRect?.() ?? {left: 0, top: 0};
  const nativeEvent = new MouseEvent(init.nativeType ?? type, {
    clientX: rect.left + point[0],
    clientY: rect.top + point[1],
    shiftKey: !!init.shiftKey,
  });
  const pick = target
    ? {node: target.node, datum: target.node.datum, index: target.node.index}
    : null;
  const event: SceneEvent = {type, point, pick, nativeEvent};
  viz._routeSceneEvent?.(event);
}

/** Replays the pointer moving onto `target`, leaving the mark it was over. */
function hover(viz: VizInstance, state: KeyboardNavState, t: FocusTarget) {
  const prev = state.hovered;
  if (!prev || prev.node.key !== t.node.key) {
    if (prev) send(viz, "mouseleave", null, {nativeType: "mousemove", at: t});
    send(viz, "mouseenter", t);
  }
  send(viz, "mousemove", t);
  state.hovered = t;
}

/** Replays the pointer leaving the chart. */
function leave(viz: VizInstance, state: KeyboardNavState): void {
  const prev = state.hovered;
  if (!prev) return;
  state.hovered = null;
  send(viz, "mouseleave", null, {at: prev});
}

/** Outlines the host itself while it has keyboard focus but no mark does. */
function updateOutline(viz: VizInstance, state: KeyboardNavState): void {
  const {host} = state;
  let visible = host.ownerDocument.activeElement === host && !state.current;
  if (visible) {
    try {
      visible = host.matches(":focus-visible");
    } catch {
      // Without :focus-visible support, any focus shows the outline.
    }
  }
  host.style.outline = visible ? `2px solid ${backgroundInk(viz)}` : "none";
  host.style.outlineOffset = visible ? "-2px" : "";
}

/**
    Focuses `target`: announces it, replays the hover over it, and redraws
    the ring (unless the paint that called this already drew it).
*/
function focusOn(
  viz: VizInstance,
  state: KeyboardNavState,
  target: FocusTarget,
  repaint = true,
): void {
  state.current = target.id;
  state.chartScene = viz._chartScene;
  state.zoom = viz._zoomTransform;
  const label = targetLabel(viz, target);
  if (state.live.textContent !== label) state.live.textContent = label;
  whenSettled(viz, state, () => {
    hover(viz, state, target);
    if (repaint) viz._scheduleSceneRepaint();
  });
  updateOutline(viz, state);
}

/** Clears the focused mark (Escape, blur): its hover, tooltip, and ring. */
function clearFocus(viz: VizInstance, state: KeyboardNavState): void {
  const had = state.current !== null;
  state.current = null;
  whenSettled(viz, state, () => {
    leave(viz, state);
    if (had) viz._scheduleSceneRepaint();
  });
  updateOutline(viz, state);
}

/** Where a movement key goes (arrows, Home, End), or undefined for any other key. */
function moveTarget(
  key: string,
  targets: FocusTarget[],
  current: FocusTarget | null,
): FocusTarget | null | undefined {
  if (ARROWS[key]) return nextTarget(targets, current, ARROWS[key]);
  if (key === "Home") return targets[0] ?? null;
  if (key === "End") return targets[targets.length - 1] ?? null;
  return undefined;
}

/** The keydown handler: arrows, Home/End, Enter/Space, and Escape. */
function onKeydown(viz: VizInstance, state: KeyboardNavState, e: Event): void {
  const event = e as KeyboardEvent;
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  const {key} = event;
  const targets = paintedTargets(viz);
  const current = currentTarget(state, targets);
  const next = moveTarget(key, targets, current);
  if (next !== undefined) {
    event.preventDefault();
    if (next) focusOn(viz, state, next);
  } else if (current && (key === "Enter" || key === " ")) {
    event.preventDefault();
    const shiftKey = event.shiftKey;
    whenSettled(viz, state, () => {
      hover(viz, state, current);
      send(viz, "click", current, {shiftKey});
    });
  } else if (current && key === "Escape") {
    event.preventDefault();
    clearFocus(viz, state);
  }
}

/** Focusing the chart focuses its first mark. */
function onFocus(viz: VizInstance, state: KeyboardNavState): void {
  if (!state.current) {
    const first = paintedTargets(viz)[0];
    if (first) focusOn(viz, state, first);
  }
  updateOutline(viz, state);
}

/** The element the host is placed in: the root svg's parent, when it is HTML. */
function hostParent(viz: VizInstance): HTMLElement | null {
  const svg = viz._select?.node?.() as Element | null | undefined;
  const parent = svg?.parentNode as HTMLElement | null | undefined;
  if (!parent || parent.nodeType !== 1) return null;
  return parent.namespaceURI === "http://www.w3.org/1999/xhtml" ? parent : null;
}

/** Removes the host and its listeners, clearing any replayed hover. */
export function teardownKeyboardNav(viz: VizInstance): void {
  const state = viz._keyboardNav;
  if (!state) return;
  viz._keyboardNav = undefined;
  if (state.timer !== undefined) clearTimeout(state.timer);
  state.queue = [];
  leave(viz, state);
  for (const [type, fn] of state.listeners)
    state.host.removeEventListener(type, fn);
  state.host.remove();
}

/** Creates the host and binds its listeners. */
function installKeyboardNav(
  viz: VizInstance,
  parent: HTMLElement,
): KeyboardNavState {
  const state: KeyboardNavState = {
    ...createKeyboardNavHost(parent, viz._uuid),
    current: null,
    hovered: null,
    stale: false,
    queue: [],
    listeners: [],
  };
  state.listeners = [
    ["keydown", (e: Event) => onKeydown(viz, state, e)],
    ["focus", () => onFocus(viz, state)],
    ["blur", () => clearFocus(viz, state)],
  ];
  for (const [type, fn] of state.listeners)
    state.host.addEventListener(type, fn);
  return state;
}

/**
    Brings the host in line with the chart after a paint: creates it (or
    removes it under `keyboardNav(false)`), refreshes its name and box, and
    re-enters the focused mark when a redraw moved or replaced it.
*/
export function syncKeyboardNav(viz: VizInstance): void {
  const parent = viz.schema.keyboardNav ? hostParent(viz) : null;
  if (!parent) {
    teardownKeyboardNav(viz);
    return;
  }
  let state = viz._keyboardNav;
  if (state && state.host.parentNode !== parent) {
    teardownKeyboardNav(viz);
    state = undefined;
  }
  if (!state) state = viz._keyboardNav = installKeyboardNav(viz, parent);
  updateKeyboardNavHost(viz, state);
  const moved =
    viz._chartScene !== state.chartScene || viz._zoomTransform !== state.zoom;
  if (state.current && moved) state.stale = true;
  if (state.stale) {
    state.stale = false;
    const target = state.current
      ? currentTarget(state, paintedTargets(viz))
      : null;
    if (target) focusOn(viz, state, target, false);
    else clearFocus(viz, state);
  }
}

/**
    The focus ring for the scene being built, appended last so it draws above
    everything. Resolves the focused mark by its id in `children`, falling
    back to the first mark when a redraw removed it (and marking the state
    stale so `syncKeyboardNav` re-enters it).
*/
export function appendFocusRing(viz: VizInstance, children: SceneNode[]): void {
  const state = viz._keyboardNav;
  if (!state || !state.current) return;
  const targets = focusTargets(children);
  let target = currentTarget(state, targets);
  if (!target) {
    target = targets[0] ?? null;
    state.current = target ? target.id : null;
    state.stale = true;
  }
  if (target) children.push(focusRingNode(target, focusRingStyle(viz, target)));
}
