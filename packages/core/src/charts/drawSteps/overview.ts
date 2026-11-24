/**
    An overview chart (`link: {group, zoom: "overview"}`): a Plot that keeps
    its whole view and shows the window its link group is zoomed to as a
    band over its plot. Dragging the band moves the window, dragging either
    edge resizes it, dragging elsewhere draws a new one (a click centers it
    there), Ctrl/⌘ + wheel scales it, and a double-click shows everything.
    The band is a focusable slider: the arrow keys move it, Home and End
    take it to either end, and + and − resize it.

    The overview's own zoom transform *is* the band: setting the window
    zooms it with `zoomTo`, which `zoomPlot` turns into a broadcast to the
    group without rescaling the overview (see `Plot/plotZoom.ts`). Its zoom
    buttons and range selector move the band the same way, and the band
    follows when another chart in the group zooms or pans.

    @module
*/
import {zoomIdentity} from "d3-zoom";

import {formatAbbreviate} from "@d3plus/format";

import type {FeatureLayout, FeatureModule} from "../features/features.js";
import {
  clampWindow,
  keyWindow,
  moveWindow,
  resizeWindow,
  scaleWindow,
  spanWindow,
} from "../Plot/overviewWindow.js";
import {plotAxisUtc} from "../Plot/plotRangeBreaks.js";
import {isOverviewChart} from "../Plot/zoomAxes.js";
import {
  liveTransform,
  windowTransform,
  zoomWindows,
  type ZoomWindow,
} from "../Plot/zoomWindow.js";
import {effectiveDuration} from "../viz/reducedMotion.js";
import type Viz from "../viz/Viz.js";
import {escapeHtml} from "./controlButtonStyle.js";
import {minimapStyles, paintMinimapStyle} from "./minimapMarkup.js";
import {clampTransform, zoomTo} from "./zoomControls.js";
import {isBrushing} from "./zoomControlsMarkup.js";
import {fitArea, zoomedDims} from "./zoomFit.js";
import {recordTransform} from "./zoomShown.js";
import {BOX_DRAG_DISTANCE} from "./zoomDrag.js";

/** The overview's band axis, and how its values map to the overlay's pixels. */
interface BandAxis {
  dim: "x" | "y";
  /** The overview's whole domain along it, low end first. */
  domain: ZoomWindow;
  /** The plot rect on the surface: top-left and bottom-right. */
  area: [[number, number], [number, number]];
  /** A value's offset from the overlay's start edge, in pixels. */
  toPx: (value: number) => number;
  /** The value at an offset from the overlay's start edge. */
  toValue: (px: number) => number;
  /** The shortest window the zoom can show. */
  minSpan: number;
}

/** What a pointer press on the overlay is doing. */
interface Press {
  mode: "move" | "start" | "end" | "draw";
  pointerId: number;
  origin: number;
  value: number;
  window: ZoomWindow;
  dragged: boolean;
}

/** The band's axis for the overview's current draw, or null before it has drawn. */
export function bandAxis(viz: Viz): BandAxis | null {
  const base = viz._plotZoomBase;
  if (!base) return null;
  const dims = zoomedDims(viz);
  const dim = dims.x ? "x" : "y";
  const scale = base.scales[dim];
  if (!scale) return null;
  const area = fitArea(viz);
  const i = dim === "x" ? 0 : 1;
  const origin =
    dim === "x"
      ? base.chartTransform.x
      : base.chartTransform.y - base.pCtx.x2Height;
  const start = area[0][i];
  const ends = scale.domain().map(Number);
  const domain: ZoomWindow = [Math.min(...ends), Math.max(...ends)];
  const kMax = viz._zoomBehavior?.scaleExtent()[1] ?? Infinity;
  return {
    dim,
    domain,
    area,
    toPx: value => scale(value) + origin - start,
    toValue: px => +scale.invert(px + start - origin),
    minSpan: (domain[1] - domain[0]) / kMax,
  };
}

/** Whether a window takes in the overview's whole domain. */
const covers = (axis: BandAxis, [a, b]: ZoomWindow): boolean =>
  a <= axis.domain[0] && b >= axis.domain[1];

/** The window the band shows: the overview's live zoom along its axis. */
export function bandWindow(viz: Viz, axis: BandAxis): ZoomWindow {
  return zoomWindows(viz)[axis.dim] ?? axis.domain;
}

/**
    Shows a window on the overview (and so on its group): the whole domain
    returns it to its natural view.
    @param viz The overview.
    @param window The window.
    @param duration The transition's length.
*/
export function showWindow(viz: Viz, window: ZoomWindow, duration = 0): void {
  const axis = bandAxis(viz);
  if (!axis) return;
  const [a, b] = clampWindow(window, axis.domain);
  if (covers(axis, [a, b])) return zoomTo(viz, 1, 0, 0, duration);
  const t = windowTransform(viz, {[axis.dim]: [a, b]});
  if (t) zoomTo(viz, t.k, t.x, t.y, duration);
}

/** Formats a window end for the band's spoken value. */
function formatValue(viz: Viz, dim: "x" | "y", value: number): string {
  const locale = viz.schema.locale;
  if (dim === "x" ? viz._xTime : viz._yTime) {
    const utc = plotAxisUtc(viz as never, dim);
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      ...(utc ? {timeZone: "UTC"} : {}),
    }).format(new Date(value));
  }
  return formatAbbreviate(value, locale);
}

/** The band's markup: a slider holding an edge handle at either end. */
function overviewHtml(viz: Viz, dim: "x" | "y"): string {
  const t = viz.schema.translate;
  const help = escapeHtml(
    t("Drag, or use the arrow keys, to move the window; + and − resize it"),
  );
  const orientation = dim === "x" ? "horizontal" : "vertical";
  const handle = (edge: string) =>
    `<div class="d3plus-overview-handle" data-edge="${edge}" style="position:absolute;cursor:${dim === "x" ? "ew" : "ns"}-resize"></div>`;
  return `<div class="d3plus-overview-band" role="slider" tabindex="0" aria-orientation="${orientation}" aria-label="${escapeHtml(t("Zoom window"))}" aria-valuemin="0" aria-valuemax="100" title="${help}" style="position:absolute;box-sizing:border-box;cursor:grab">${handle("start")}${handle("end")}</div>`;
}

/** Positions the band, its handles, and its spoken value from the live zoom. */
function paintBand(viz: Viz, host: HTMLElement, pressed: boolean): void {
  const axis = bandAxis(viz);
  const band = host.querySelector<HTMLElement>(".d3plus-overview-band");
  if (!axis || !band) return;
  const [a, b] = bandWindow(viz, axis);
  const p0 = axis.toPx(a),
    p1 = axis.toPx(b);
  const lo = Math.min(p0, p1),
    size = Math.max(2, Math.abs(p1 - p0));
  const styles = minimapStyles(viz);
  paintMinimapStyle(
    band,
    styles.viewport,
    pressed ? styles.viewportActive : {},
  );
  // Showing everything, the band spans the plot unseen (it still takes focus).
  if (covers(axis, [a, b]))
    paintMinimapStyle(band, {
      "background-color": "transparent",
      "border-color": "transparent",
    });
  const x = axis.dim === "x";
  paintMinimapStyle(band, {
    position: "absolute",
    "box-sizing": "border-box",
    left: x ? `${lo}px` : "0px",
    top: x ? "0px" : `${lo}px`,
    width: x ? `${size}px` : "100%",
    height: x ? "100%" : `${size}px`,
  });
  // The handles straddle the band's edges, in the band's own coordinates.
  const edges: Record<string, number> = {
    start: p0 <= p1 ? 0 : size,
    end: p0 <= p1 ? size : 0,
  };
  band
    .querySelectorAll<HTMLElement>(".d3plus-overview-handle")
    .forEach(handle => {
      const at = `${edges[handle.dataset.edge ?? "start"] - 4}px`;
      paintMinimapStyle(handle, {
        left: x ? at : "0px",
        top: x ? "0px" : at,
        width: x ? "8px" : "100%",
        height: x ? "100%" : "8px",
      });
    });
  const span = axis.domain[1] - axis.domain[0];
  band.setAttribute(
    "aria-valuenow",
    String(span ? Math.round(((a - axis.domain[0]) / span) * 100) : 0),
  );
  band.setAttribute(
    "aria-valuetext",
    viz.schema.translate(
      "{0} to {1}",
      undefined,
      formatValue(viz, axis.dim, a),
      formatValue(viz, axis.dim, b),
    ),
  );
  host.style.setProperty("pointer-events", isBrushing(viz) ? "none" : "auto");
}

/** The pointer's offset from the overlay's start edge along the band's axis. */
function pointerPx(event: MouseEvent, host: Element, dim: "x" | "y"): number {
  const rect = host.getBoundingClientRect();
  return dim === "x" ? event.clientX - rect.left : event.clientY - rect.top;
}

/** The window a drag on the overlay asks for, with the pointer at `value`. */
function dragWindow(press: Press, axis: BandAxis, value: number): ZoomWindow {
  const {domain, minSpan} = axis;
  if (press.mode === "move")
    return moveWindow(press.window, value - press.value, domain);
  if (press.mode === "draw")
    return spanWindow(press.value, value, domain, minSpan);
  return resizeWindow(press.window, press.mode, value, domain, minSpan);
}

/** Ctrl/⌘ + wheel (any wheel with `zoomScroll: true`) scales the window about the pointer. */
function overviewWheel(viz: Viz, e: Event): void {
  const we = e as WheelEvent;
  if (viz.schema.zoomScroll !== true && !we.ctrlKey && !we.metaKey) return;
  const host = (e.target as Element | null)?.closest<HTMLElement>(
    ".d3plus-overview",
  );
  const axis = bandAxis(viz);
  if (!host || !axis) return;
  we.preventDefault();
  const anchor = axis.toValue(pointerPx(we, host, axis.dim));
  const factor = we.deltaY < 0 ? 1.25 : 0.8;
  const window = bandWindow(viz, axis);
  showWindow(
    viz,
    scaleWindow(window, factor, anchor, axis.domain, axis.minSpan),
    0,
  );
}

/** The overlay's pointer, wheel, and double-click handlers. */
function overlayEvents(
  viz: Viz,
  state: {press: Press | null},
  repaint: (host: HTMLElement) => void,
): Record<string, (e: Event) => void> {
  const hostOf = (e: Event): HTMLElement | null =>
    (e.target as Element | null)?.closest<HTMLElement>(".d3plus-overview") ??
    null;
  const end = (e: Event): void => {
    const pe = e as PointerEvent;
    if (!state.press || pe.pointerId !== state.press.pointerId) return;
    const axis = bandAxis(viz);
    // A click (no drag) off the band centers the window there.
    if (axis && state.press.mode === "draw" && !state.press.dragged) {
      const length = state.press.window[1] - state.press.window[0];
      showWindow(
        viz,
        [state.press.value - length / 2, state.press.value + length / 2],
        effectiveDuration(viz),
      );
    }
    state.press = null;
    const host = hostOf(e);
    if (host) repaint(host);
  };
  return {
    pointerdown: e => {
      const pe = e as PointerEvent;
      const host = hostOf(e);
      const axis = bandAxis(viz);
      if (!host || !axis || pe.button > 0 || state.press) return;
      const target = e.target as Element;
      const edge = target.closest<HTMLElement>(".d3plus-overview-handle")
        ?.dataset.edge;
      const window = bandWindow(viz, axis);
      // Showing everything, a press anywhere draws a new window.
      const onBand =
        !covers(axis, window) &&
        Boolean(target.closest(".d3plus-overview-band"));
      const px = pointerPx(pe, host, axis.dim);
      state.press = {
        mode:
          edge === "start" || edge === "end" ? edge : onBand ? "move" : "draw",
        pointerId: pe.pointerId,
        origin: px,
        value: axis.toValue(px),
        window,
        dragged: false,
      };
      try {
        host.setPointerCapture(pe.pointerId);
      } catch {
        /* a slow drag that stays over the overlay works without it */
      }
      pe.preventDefault();
      repaint(host);
    },
    pointermove: e => {
      const pe = e as PointerEvent;
      const host = hostOf(e);
      const axis = bandAxis(viz);
      if (
        !state.press ||
        !host ||
        !axis ||
        pe.pointerId !== state.press.pointerId
      )
        return;
      const px = pointerPx(pe, host, axis.dim);
      if (
        !state.press.dragged &&
        Math.abs(px - state.press.origin) <= BOX_DRAG_DISTANCE
      )
        return;
      state.press.dragged = true;
      showWindow(viz, dragWindow(state.press, axis, axis.toValue(px)), 0);
    },
    pointerup: end,
    pointercancel: end,
    dblclick: e => {
      e.preventDefault();
      zoomTo(viz, 1, 0, 0, effectiveDuration(viz));
    },
    wheel: e => overviewWheel(viz, e),
  };
}

/** The band's keyboard handler. */
function bandKeydown(viz: Viz, e: Event): void {
  const ke = e as KeyboardEvent;
  const axis = bandAxis(viz);
  if (!axis) return;
  const next = keyWindow(
    bandWindow(viz, axis),
    ke.key,
    ke.shiftKey,
    axis.domain,
    viz.schema.zoomFactor,
    axis.minSpan,
  );
  if (!next) return;
  ke.preventDefault();
  showWindow(viz, next, effectiveDuration(viz));
}

/**
    Puts back the window the overview showed before this draw, so a resize
    or a data update keeps the band on the same values.
    @private
*/
function restoreWindow(viz: Viz): void {
  const windows = viz._overviewWindows;
  const target = viz._zoomEventTarget || viz._container;
  if (!windows || !target?.node()) return;
  const t = windowTransform(viz, windows);
  if (!t) return;
  const {k, x, y} = clampTransform(viz, t.k, t.x, t.y);
  const live = liveTransform(viz);
  if (live.k === k && live.x === x && live.y === y) return;
  target.property("__zoom", zoomIdentity.translate(x, y).scale(k));
  recordTransform(viz, {k, x, y});
}

/**
    @name overviewFeature
    Draws an overview chart's band (see the module notes) as an
    `htmlOverlay` over its plot. Runs after `zoomFeature`, which sets the
    zoom extents the band's limits read.
*/
export const overviewFeature: FeatureModule = {
  name: "overview",
  layout: ({viz}) => {
    const none = {panel: null, margin: {}};
    if (!isOverviewChart(viz) || !viz._zoomBehavior) return none;
    const axis = bandAxis(viz);
    if (!axis) return none;
    restoreWindow(viz);
    const [[x0, y0], [x1, y1]] = axis.area;
    const state: {press: Press | null} = {press: null};
    const repaint = (host: HTMLElement): void =>
      paintBand(viz, host, state.press !== null);
    const events = overlayEvents(viz, state, repaint);
    const panel: FeatureLayout["panel"] = {
      type: "htmlOverlay",
      key: "viz-overview",
      x: x0,
      y: y0,
      width: x1 - x0,
      height: y1 - y0,
      className: "d3plus-overview",
      html: overviewHtml(viz, axis.dim),
      style: {
        cursor: "crosshair",
        overflow: "hidden",
        "touch-action": axis.dim === "x" ? "pan-y" : "pan-x",
      },
      events: {
        ".d3plus-overview": events,
        ".d3plus-overview-band": {keydown: e => bandKeydown(viz, e)},
      },
      onUpdate: repaint,
    };
    return {panel, margin: {}};
  },
};
