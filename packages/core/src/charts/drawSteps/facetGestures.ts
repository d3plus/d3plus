/**
    Zoom gestures on small multiples of a Plot: the wheel, a drag, a
    double-click, and a drawn box zoom the panel under the pointer, as a
    window of its axis values (see `Plot/facetZoom.ts`), instead of the
    whole picture. Panels that share scales share the window, so they stay
    comparable; with independent scales only that panel zooms. Either way
    the window goes to the chart's link group. The zoom buttons zoom every
    panel about its middle, and a reset returns every panel to its natural
    view.

    @module
*/
import {pointer, select} from "d3-selection";

import {
  facetDataWindow,
  panelWindows,
  type FacetZoom,
} from "../Plot/facetZoom.js";
import type {PlotZoomBase, ZoomState} from "../Plot/plotZoom.js";
import {
  defaultZoomAxis,
  splitZoomAxes,
  zoomDimensions,
  type AxisName,
} from "../Plot/zoomAxes.js";
import {
  valuesExtent,
  windowTransform,
  zoomWindows,
  type ZoomWindow,
  type ZoomWindows,
} from "../Plot/zoomWindow.js";
import type {FacetPanelState} from "../facet/facetConfig.js";
import {effectiveDuration} from "../viz/reducedMotion.js";
import type Viz from "../viz/Viz.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {setFacetZoom} from "./facetZoomRedraw.js";
import {fitArea, fitBounds, type Bounds} from "./zoomFit.js";
import {startsOnBrush} from "./zoomGesture.js";
import {
  gestureHoverEnd,
  gestureHoverMove,
  gestureHoverStart,
} from "./gestureHover.js";
import {zoomIdentity} from "d3-zoom";
import {broadcastWindows} from "./zoomLink.js";

/** A panel, with its natural zoom setup along the axes gestures zoom. */
interface PanelView {
  key: string;
  /** What the window helpers read: the panel's natural scales and plot rect. */
  view: Viz;
  /** The panel's plot rect on the surface. */
  area: Bounds;
  /** The panel's data extent along a dimension. */
  extent: (dim: "x" | "y") => ZoomWindow | undefined;
}

/** The chart's small-multiples panels. */
const panelsOf = (viz: Viz): FacetPanelState[] =>
  (viz as unknown as VizInstance)._facetPanels ?? [];

/** Whether a chart is small multiples of a Plot that zooms. */
export function facetZoomable(viz: Viz): boolean {
  return Boolean(
    viz.schema.zoom && panelsOf(viz).some(panel => panel.state._plotZoomBase),
  );
}

/** A panel's view, when it drew a zoomable plot. */
function panelView(viz: Viz, panel: FacetPanelState): PanelView | null {
  const base = panel.state._plotZoomBase as PlotZoomBase | undefined;
  if (!base) return null;
  const all = {...base.refit, ...base.scales};
  const dims = zoomDimensions(
    viz.schema.zoomAxes,
    defaultZoomAxis(viz as unknown as VizInstance),
  );
  const {rescale} = splitZoomAxes(Object.keys(all) as AxisName[], dims);
  const scales: PlotZoomBase["scales"] = {};
  for (const axis of rescale) scales[axis] = all[axis];
  const view = {_plotZoomBase: {...base, scales, refit: {}}} as unknown as Viz;
  const shared = viz._facetShared;
  const extent = (dim: "x" | "y"): ZoomWindow | undefined =>
    shared
      ? facetDataWindow(viz as unknown as VizInstance, dim)
      : valuesExtent((base.pCtx[`${dim}Data`] as unknown[]) ?? []);
  return {key: panel.key, view, area: fitArea(view), extent};
}

/** Every panel's view. */
function panelViews(viz: Viz): PanelView[] {
  return panelsOf(viz)
    .map(panel => panelView(viz, panel))
    .filter((p): p is PanelView => p !== null);
}

/**
    The panel whose plot holds a surface point, if any.
    @param viz The chart.
    @param point The point, in surface pixels.
*/
function panelAt(viz: Viz, [x, y]: [number, number]): PanelView | undefined {
  return panelViews(viz).find(
    ({area: [[x0, y0], [x1, y1]]}) => x >= x0 && x <= x1 && y >= y0 && y <= y1,
  );
}

/** The transform a panel shows now (the identity at its natural view). */
function panelTransform(viz: Viz, panel: PanelView): ZoomState {
  const windows = panelWindows(viz._facetZoom, panel.extent, panel.key);
  const t = windows && windowTransform(panel.view, windows);
  return t ?? {k: 1, x: 0, y: 0};
}

/**
    A transform kept inside a panel: its scale between 1 and `kMax`, and its
    content covering the panel's plot rect.
    @param t The transform.
    @param area The plot rect.
    @param kMax The largest scale.
*/
export function clampToArea(
  t: ZoomState,
  [[x0, y0], [x1, y1]]: Bounds,
  kMax: number,
): ZoomState {
  const k = Math.max(1, Math.min(kMax, t.k));
  // A clamped scale keeps the content at the rect's middle in place.
  const cx = (x0 + x1) / 2,
    cy = (y0 + y1) / 2;
  const x = k === t.k ? t.x : cx - ((cx - t.x) / t.k) * k,
    y = k === t.k ? t.y : cy - ((cy - t.y) / t.k) * k;
  return {
    k,
    x: Math.max(x1 * (1 - k), Math.min(x0 * (1 - k), x)),
    y: Math.max(y1 * (1 - k), Math.min(y0 * (1 - k), y)),
  };
}

/**
    A transform scaled by `factor` about a surface point, as a wheel zooms.
    @param t The transform.
    @param factor The scale multiplier.
    @param point The point that stays put.
*/
export function scaleAbout(
  t: ZoomState,
  factor: number,
  [px, py]: [number, number],
): ZoomState {
  return {
    k: t.k * factor,
    x: px - (px - t.x) * factor,
    y: py - (py - t.y) * factor,
  };
}

/** The largest scale a panel zooms to. */
const kMaxOf = (viz: Viz): number =>
  viz._zoomBehavior?.scaleExtent()[1] ?? Infinity;

/** Shows a new transform on one panel (and its windows on the panels it shares scales with, and the link group). */
function commitPanel(
  viz: Viz,
  panel: PanelView,
  t: ZoomState,
  duration: number,
): void {
  const c = clampToArea(t, panel.area, kMaxOf(viz));
  const windows: ZoomWindows | null =
    c.k === 1 ? null : zoomWindows(panel.view, c);
  const vi = viz as unknown as VizInstance;
  if (viz._facetShared)
    setFacetZoom(vi, windows ? {windows} : undefined, duration);
  else {
    const zoom: FacetZoom = {
      ...viz._facetZoom,
      panels: {...viz._facetZoom?.panels, [panel.key]: windows},
    };
    setFacetZoom(vi, zoom, duration);
  }
  broadcastWindows(viz, windows, duration);
}

/**
    Returns every panel to its natural view, and the link group with them.
    @param viz The chart.
*/
export function resetFacets(viz: Viz): void {
  const duration = effectiveDuration(viz);
  setFacetZoom(viz as unknown as VizInstance, undefined, duration);
  broadcastWindows(viz, null, duration);
}

/**
    Zooms every panel about the middle of its plot by `factor`, as the zoom
    buttons do; `0` resets them. Panels sharing scales share the window (and
    pass it to the link group); otherwise each panel zooms its own.
    @param viz The chart.
    @param factor The scale multiplier.
*/
export function zoomFacets(viz: Viz, factor: number): void {
  if (!factor) return resetFacets(viz);
  const duration = effectiveDuration(viz);
  const panels = panelViews(viz);
  if (viz._facetShared && panels[0]) {
    const [panel] = panels;
    return commitPanel(viz, panel, scaled(viz, panel, factor), duration);
  }
  const zoomed: Record<string, ZoomWindows | null> = {};
  for (const panel of panels) {
    const c = clampToArea(scaled(viz, panel, factor), panel.area, kMaxOf(viz));
    zoomed[panel.key] = c.k === 1 ? null : zoomWindows(panel.view, c);
  }
  setFacetZoom(
    viz as unknown as VizInstance,
    {...viz._facetZoom, panels: zoomed},
    duration,
  );
}

/** A panel's transform scaled by `factor` about the middle of its plot. */
function scaled(viz: Viz, panel: PanelView, factor: number): ZoomState {
  const [[x0, y0], [x1, y1]] = panel.area;
  return scaleAbout(panelTransform(viz, panel), factor, [
    (x0 + x1) / 2,
    (y0 + y1) / 2,
  ]);
}

/**
    Zooms the panel under a box (surface pixels, as displayed) to show it,
    as a drawn zoom box or the brush does; `null` resets every panel.
    @param viz The chart.
    @param bounds The box.
*/
export function zoomFacetToBounds(viz: Viz, bounds: number[][] | null): void {
  if (!bounds) return resetFacets(viz);
  const [[bx0, by0], [bx1, by1]] = bounds;
  const panel = panelAt(viz, [(bx0 + bx1) / 2, (by0 + by1) / 2]);
  if (!panel) return;
  const t = panelTransform(viz, panel);
  // Un-apply the panel's transform: the box in its natural view.
  const box = bounds.map(([x, y]) => [
    (x - t.x) / t.k,
    (y - t.y) / t.k,
  ]) as Bounds;
  commitPanel(viz, panel, fitBounds(panel.view, box), effectiveDuration(viz));
}

/** The listener namespace of the gestures bound here. */
const NS = "facetzoom";

/** Whether the chart's wheel setting lets this wheel event zoom. */
function wheelZooms(viz: Viz, event: WheelEvent): boolean {
  const setting = viz.schema.zoomScroll;
  if (setting === false) return false;
  return setting === true || event.ctrlKey || event.metaKey;
}

/** The wheel: zooms the panel under the pointer about it. */
function wheeled(viz: Viz, event: WheelEvent, surface: Element): void {
  if (!wheelZooms(viz, event)) return;
  const at = pointer(event, surface) as [number, number];
  const panel = panelAt(viz, at);
  if (!panel) return;
  event.preventDefault();
  const pinch =
    event.ctrlKey && event.deltaMode === 0 && Math.abs(event.deltaY) < 50;
  const delta =
    -event.deltaY *
    (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002) *
    (pinch ? 10 : 1);
  commitPanel(
    viz,
    panel,
    scaleAbout(panelTransform(viz, panel), 2 ** delta, at),
    0,
  );
}

/** A double-click: zooms in about the pointer (Shift: out), or resets, per `zoomDoubleClick`. */
function doubleClicked(viz: Viz, event: MouseEvent, surface: Element): void {
  const mode = viz.schema.zoomDoubleClick;
  if (mode === false || event.button || startsOnBrush(event)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if (mode === "reset") return resetFacets(viz);
  const at = pointer(event, surface) as [number, number];
  const panel = panelAt(viz, at);
  if (!panel) return;
  const factor = event.shiftKey ? 0.5 : 2;
  commitPanel(
    viz,
    panel,
    scaleAbout(panelTransform(viz, panel), factor, at),
    effectiveDuration(viz),
  );
}

/** How far (px) a press moves before it pans instead of clicking. */
const PAN_DISTANCE = 3;

/**
    A press: once it moves past `PAN_DISTANCE`, pans the panel it started on
    (a mouse, or a touch once that panel is zoomed in), swallowing the click
    it ends with.
*/
function pressed(viz: Viz, event: PointerEvent, surface: Element): void {
  if (!viz.schema.zoomPan || event.button > 0 || viz._selectTool) return;
  if (startsOnBrush(event)) return;
  if (
    event.pointerType === "mouse" &&
    viz.schema.zoomDrag === "brush" &&
    !event.shiftKey
  )
    return;
  const start = pointer(event, surface) as [number, number];
  const panel = panelAt(viz, start);
  if (!panel) return;
  const t0 = panelTransform(viz, panel);
  if (event.pointerType === "touch" && t0.k === 1) return;
  const vi = viz as unknown as VizInstance;
  const view = event.view ?? window;
  const win = select(view);
  let panning = false;
  const id = event.pointerId;
  const done = (): void => {
    win.on(`pointermove.${NS} pointerup.${NS} pointercancel.${NS}`, null);
    if (!panning) return;
    gestureHoverEnd(vi);
    win.on(
      `click.${NS}`,
      (e: Event) => {
        e.preventDefault();
        e.stopImmediatePropagation();
      },
      true,
    );
    setTimeout(() => win.on(`click.${NS}`, null), 0);
  };
  win
    .on(`pointermove.${NS}`, (move: PointerEvent) => {
      if (move.pointerId !== id) return;
      const [x, y] = pointer(move, surface) as [number, number];
      const dx = x - start[0],
        dy = y - start[1];
      if (!panning && Math.hypot(dx, dy) <= PAN_DISTANCE) return;
      // Tooltips and hover wait while the panel pans.
      if (!panning)
        gestureHoverStart(vi, {transform: zoomIdentity, sourceEvent: event});
      gestureHoverMove(vi, {transform: zoomIdentity, sourceEvent: move});
      panning = true;
      move.preventDefault();
      commitPanel(viz, panel, {k: t0.k, x: t0.x + dx, y: t0.y + dy}, 0);
    })
    .on(`pointerup.${NS} pointercancel.${NS}`, (up: PointerEvent) => {
      if (up.pointerId === id) done();
    });
}

/**
    Binds the panel gestures to the zoom surface of small multiples, or
    removes them from any other chart's.
    @param viz The chart.
    @param tgt The zoom surface.
*/
export function bindFacetGestures(
  viz: Viz,
  tgt: NonNullable<Viz["_zoomEventTarget"]>,
): void {
  tgt.on(`.${NS}`, null);
  if (!facetZoomable(viz)) return;
  const surface = tgt.node() as Element;
  tgt
    .on(`wheel.${NS}`, (e: WheelEvent) => wheeled(viz, e, surface))
    .on(`dblclick.${NS}`, (e: MouseEvent) => doubleClicked(viz, e, surface))
    .on(`pointerdown.${NS}`, (e: PointerEvent) => pressed(viz, e, surface));
  // One finger pans a zoomed panel; otherwise it scrolls the page.
  const zoomed = Boolean(
    viz._facetZoom &&
    (viz._facetZoom.windows ||
      viz._facetZoom.range ||
      Object.values(viz._facetZoom.panels ?? {}).some(Boolean)),
  );
  tgt.style("touch-action", zoomed ? "none" : "pan-x pan-y");
}
