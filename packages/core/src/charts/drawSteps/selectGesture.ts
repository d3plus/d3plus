/**
    The pointer gesture of box and lasso selection. While a select tool is
    on (see `selectMode` and the zoom-control buttons), a drag over the
    chart area draws a box or a lasso instead of panning, and releasing it
    selects the marks inside (see `selectRegion.ts`); Shift adds them to
    the selection. A press that doesn't drag is a click: on a mark it
    selects that mark (see `selectClick`), and on no mark it clears the
    selection. Escape cancels a drag in progress, and otherwise clears the
    selection of the chart last selected in.

    Pointer events drive it, so a mouse, a pen, and one finger all draw.
    While a tool is on, the drawing surface takes every touch
    (`touch-action: none`), and d3-zoom leaves single presses to it (see
    `zoomGestureFilter`), so a wheel or a pinch still zooms.

    @module
*/

import {select} from "d3-selection";
import {zoomTransform} from "d3-zoom";

import {attrize} from "@d3plus/dom";
import type {SceneNode} from "@d3plus/render";

import {chartAreaRect, chartBounds} from "../features/chartGeometry.js";
import {facetPanelAt} from "../facet/facetPanel.js";
import {focusTargets} from "../viz/focusTargets.js";
import type {FocusTarget} from "../viz/focusTargets.js";
import {surfaceOrigin} from "../viz/pointTooltipAnchor.js";
import {setCursor} from "../viz/setCursor.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {
  gestureHoverEnd,
  gestureHoverMove,
  gestureHoverStart,
} from "./gestureHover.js";
import {
  clearSelection,
  hasSelection,
  lastSelectedChart,
  selectRows,
} from "./selectActions.js";
import {
  dragRegion,
  extendLasso,
  regionHits,
  regionPath,
} from "./selectRegion.js";
import type {SelectRegion, SelectTool} from "./selectRegion.js";
import {syncSelectTool} from "./zoomControlsMarkup.js";
import {dragsFar, inBox, suppressClick} from "./zoomDrag.js";
import type {Box, Point} from "./zoomDrag.js";
import {startsOnBrush} from "./zoomGesture.js";

/** The listener namespace of every gesture bound here. */
const NS = "d3plusselect";

/** Window listeners a press adds, removed when it lets go. */
const PRESS_EVENTS = [
  "pointermove",
  "pointerup",
  "pointercancel",
  "keydown",
  "selectstart",
  "dragstart",
]
  .map(type => `${type}.${NS}`)
  .join(" ");

/** The class of the layer the box or lasso draws in. */
export const SELECT_LAYER = "d3plus-select-brush";

/** The pointer surface a chart selects on, and the press in progress. */
export interface SelectSurfaceState {
  /** The element the press listener is bound to. */
  el: Element;
  /** The latest press that didn't drag, until its click resolves. */
  press?: {clicked: boolean};
  /** Whether this set the surface's `touch-action`. */
  touch?: boolean;
  /** The window the Escape listener is bound to. */
  view?: Window;
}

/** The element a chart's pointer events land on: its canvas, or its root svg. */
function surfaceOf(viz: VizInstance): Element | null {
  if (viz._renderer === "canvas") {
    const elements: Element[] = viz._sceneRenderer?.elements?.() ?? [];
    return elements.find(el => el.localName === "canvas") ?? null;
  }
  return (viz._select?.node?.() as Element | null | undefined) ?? null;
}

/** The chart area, in surface coordinates. */
export function chartArea(viz: VizInstance): Box {
  const {left, top} = viz._margin;
  const {width, height} = chartBounds(viz);
  return [
    [left, top],
    [left + width, top + height],
  ];
}

/**
    The box a selection starting at `at` stays within: the chart area, or
    within a small-multiples panel, that panel's chart area as it shows
    (zoomed along with the picture).
    @param viz The chart.
    @param at The press, in surface coordinates.
*/
export function selectArea(viz: VizInstance, at: Point): Box {
  const area = chartArea(viz);
  const panel = facetPanelAt(viz, at);
  if (!panel) return area;
  const t = viz._zoomTransform;
  const k = t?.scale ?? 1,
    tx = t?.x ?? 0,
    ty = t?.y ?? 0;
  const {x, y, width, height} = panel.area;
  return [
    [Math.max(area[0][0], x * k + tx), Math.max(area[0][1], y * k + ty)],
    [
      Math.min(area[1][0], (x + width) * k + tx),
      Math.min(area[1][1], (y + height) * k + ty),
    ],
  ];
}

/**
    The chart's data marks as they show on its surface: its scene under the
    zoom and chart transforms and clipped to the chart area (the way
    `Viz.toScene` composes it), before hover or selection dimming.
*/
export function chartTargets(viz: VizInstance): FocusTarget[] {
  const scene: SceneNode[] = viz._chartScene ?? [];
  const clip = viz._chartClip ?? (viz._margin ? chartAreaRect(viz) : undefined);
  const body: SceneNode = {
    type: "group",
    key: "viz-chart-body",
    ...(viz._chartTransform ? {transform: viz._chartTransform} : {}),
    children: scene,
  };
  const root: SceneNode = {
    type: "group",
    key: "viz-chart-cells",
    ...(clip ? {clip} : {}),
    children: [
      {
        type: "group",
        key: "viz-zoom",
        transform: viz._zoomTransform ?? {x: 0, y: 0, scale: 1},
        children: [body],
      },
    ],
  };
  return focusTargets([root]).filter(
    t => t.group === "shape" && viz._selectMark?.(t.node) !== false,
  );
}

/** The client position of the chart's root svg, which the drawn region is placed in. */
function layerOrigin(viz: VizInstance): {left: number; top: number} {
  const svg = viz._select?.node?.() as SVGSVGElement | null | undefined;
  const ctm = svg?.getScreenCTM?.();
  if (ctm) return {left: ctm.e, top: ctm.f};
  const rect = svg?.getBoundingClientRect?.();
  return rect ? {left: rect.left, top: rect.top} : {left: 0, top: 0};
}

/** The drawn region's path, in a layer above the chart (created on first use). */
function regionLayer(viz: VizInstance): SVGPathElement | null {
  const svg = viz._select?.node?.() as SVGSVGElement | null | undefined;
  if (!svg || typeof svg.querySelector !== "function") return null;
  let layer = svg.querySelector<SVGGElement>(`:scope > g.${SELECT_LAYER}`);
  if (!layer) {
    const ns = "http://www.w3.org/2000/svg";
    layer = svg.ownerDocument.createElementNS(ns, "g");
    layer.setAttribute("class", SELECT_LAYER);
    layer.setAttribute("pointer-events", "none");
    layer.appendChild(svg.ownerDocument.createElementNS(ns, "path"));
  }
  if (layer !== svg.lastElementChild) svg.appendChild(layer);
  return layer.firstElementChild as SVGPathElement;
}

/** Draws `region` (surface coordinates), shifted by `offset` into the root svg. */
function showRegion(
  viz: VizInstance,
  region: SelectRegion,
  offset: Point,
): void {
  const path = regionLayer(viz);
  if (!path) return;
  const shifted = {
    ...region,
    points: region.points.map(([x, y]) => [x + offset[0], y + offset[1]]),
  } as SelectRegion;
  path.setAttribute("d", regionPath(shifted));
  const style = (viz.schema.selectStyle || {}) as Record<
    string,
    string | number | boolean | null
  >;
  attrize(select(path) as never, style);
  path.style.display = "";
}

/** Hides the drawn region. */
function hideRegion(viz: VizInstance): void {
  const path = regionLayer(viz);
  if (path) path.style.display = "none";
}

/** How long (ms) a press that didn't drag waits for its click. */
const CLICK_WAIT = 500;

/**
    After a press that didn't drag, waits for its click: one that selected
    no mark (see `selectClick`) clears the selection, unless Shift was held.
    A click that hasn't come within `CLICK_WAIT` (the press let go somewhere
    else) is no longer waited for.
*/
function awaitClick(
  viz: VizInstance,
  view: Window,
  press: {clicked: boolean},
): void {
  const win = select(view);
  const stop = view.setTimeout(() => win.on(`click.${NS}`, null), CLICK_WAIT);
  win.on(`click.${NS}`, (click: MouseEvent) => {
    win.on(`click.${NS}`, null);
    view.clearTimeout(stop);
    if (!press.clicked && !click.shiftKey) clearSelection(viz, click);
  });
}

/** A press on the selecting surface (see the module comment). */
function pressed(viz: VizInstance, event: PointerEvent): void {
  const tool = viz._selectTool;
  const state = viz._selectSurface;
  if (!tool || !state || !event.isPrimary) return;
  if (event.button || event.ctrlKey || event.metaKey || event.altKey) return;
  if (startsOnBrush(event)) return;
  const origin = surfaceOrigin(viz);
  const local = (e: PointerEvent): Point => [
    e.clientX - origin.left,
    e.clientY - origin.top,
  ];
  const start = local(event);
  if (!inBox(start, chartArea(viz))) return;
  const area = selectArea(viz, start);
  const view = event.view ?? window;
  const win = select(view);
  const client: Point = [event.clientX, event.clientY];
  const layer = layerOrigin(viz);
  const offset: Point = [origin.left - layer.left, origin.top - layer.top];
  const press = {clicked: false};
  state.press = press;
  win.on(`click.${NS}`, null);
  const path: Point[] = [];
  let region: SelectRegion | null = null;

  const finish = (commit: boolean, end?: Event): void => {
    win.on(PRESS_EVENTS, null);
    if (!region) {
      if (commit) awaitClick(viz, view, press);
      return;
    }
    const drawn = region;
    region = null;
    setCursor(viz, "auto");
    hideRegion(viz);
    gestureHoverEnd(viz);
    suppressClick(view);
    if (!commit) return;
    const hits = regionHits(chartTargets(viz), drawn).map(h => h.row);
    selectRows(viz, hits, event.shiftKey ? "add" : "replace", end ?? event);
  };

  win
    .on(
      `pointermove.${NS}`,
      (move: PointerEvent) => {
        if (move.pointerId !== event.pointerId) return;
        if (!region) {
          if (!dragsFar(client, [move.clientX, move.clientY])) return;
          const surface = state.el;
          const transform = zoomTransform(surface);
          gestureHoverStart(viz, {transform, sourceEvent: event});
          gestureHoverMove(viz, {transform, sourceEvent: move});
          // The mark the drag began over lets go of its hover too.
          if (typeof viz._hover === "function") viz.hover?.(false);
          setCursor(viz, "crosshair");
        }
        move.preventDefault();
        const at = local(move);
        if (tool === "lasso") extendLasso(path, at);
        else path[0] = at;
        region = dragRegion(tool as SelectTool, start, path, area);
        showRegion(viz, region, offset);
      },
      true,
    )
    .on(
      `pointerup.${NS}`,
      (up: PointerEvent) => {
        if (up.pointerId === event.pointerId) finish(true, up);
      },
      true,
    )
    .on(
      `pointercancel.${NS}`,
      (cancel: PointerEvent) => {
        if (cancel.pointerId === event.pointerId) finish(false);
      },
      true,
    )
    .on(
      `keydown.${NS}`,
      (key: KeyboardEvent) => {
        if (key.key !== "Escape" || !region) return;
        key.preventDefault();
        key.stopPropagation();
        finish(false);
      },
      true,
    )
    .on(
      `selectstart.${NS} dragstart.${NS}`,
      (e: Event) => e.preventDefault(),
      true,
    );
}

/** Escape clears the selection of the chart a viewer last selected in. */
function escaped(viz: VizInstance, event: KeyboardEvent): void {
  if (event.key !== "Escape" || event.defaultPrevented) return;
  if (!hasSelection(viz) || !lastSelectedChart(viz)) return;
  clearSelection(viz, event);
}

/**
    Brings a chart's selecting surface in line with it after a paint: syncs
    the select tool with `selectMode`, binds the press listener to the
    surface (rebinding when the renderer replaces it), has the surface take
    every touch while a tool is on, and listens for Escape.
    @param viz The chart.
    @param unbind Removes every listener (the chart is being destroyed).
*/
export function syncSelectSurface(viz: VizInstance, unbind = false): void {
  syncSelectTool(viz);
  const el = unbind ? null : surfaceOf(viz);
  let state = viz._selectSurface;
  if (state && state.el !== el) {
    select(state.el).on(`pointerdown.${NS}`, null);
    if (state.touch) (state.el as HTMLElement).style.touchAction = "";
    if (state.view) select(state.view).on(`keydown.${NS}${viz._uuid}`, null);
    state = viz._selectSurface = undefined;
  }
  if (!el) return;
  if (!state) {
    state = viz._selectSurface = {el};
    select(el).on(`pointerdown.${NS}`, (e: PointerEvent) => pressed(viz, e));
    const view = el.ownerDocument?.defaultView;
    if (view) {
      state.view = view;
      select(view).on(`keydown.${NS}${viz._uuid}`, (e: KeyboardEvent) =>
        escaped(viz, e),
      );
    }
  }
  const style = (el as HTMLElement).style;
  if (viz._selectTool) {
    style.touchAction = "none";
    state.touch = true;
  } else if (state.touch) {
    style.touchAction = "";
    state.touch = false;
  }
}
