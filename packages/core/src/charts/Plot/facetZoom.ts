/**
    Windows in small multiples: a Plot drawn with `facet` zooms each panel
    on its own axes, by a window of axis values. Zooming a panel (see
    `drawSteps/facetGestures.ts`) sets its window, or every panel's when they
    share scales. A range button reads the data's last date (each panel's
    own, with independent scales), and a linked window shows in every panel
    whose data it reaches, cut to that data.

    @module
*/
import {
  rangeWindow,
  type RangeButton,
} from "../drawSteps/rangeSelectorButtons.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {valuesExtent, type ZoomWindow, type ZoomWindows} from "./zoomWindow.js";

/** The window small multiples show: a linked window, or a range button. */
export interface FacetZoom {
  /** A window every panel whose data reaches it shows. */
  windows?: ZoomWindows;
  /** Windows single panels show instead, by panel key (null: its natural view), set by zooming that panel. */
  panels?: Record<string, ZoomWindows | null>;
  /** A range button each panel applies to its own data. */
  range?: {axis: "x" | "y"; index: number; button: RangeButton; utc: boolean};
}

/**
    Whether two windows share any values.
    @param a One window.
    @param b The other.
*/
export function windowsOverlap(a: ZoomWindow, b: ZoomWindow): boolean {
  return a[0] <= b[1] && a[1] >= b[0];
}

/**
    The windows cut to a chart's data, dimension by dimension: a window that
    runs past the data stops at its ends, and one that misses it is dropped.
    Undefined when none reach the data (the chart keeps its view).
    @param windows The incoming windows.
    @param extent The chart's data extent along a dimension.
*/
export function overlappingWindows(
  windows: ZoomWindows,
  extent: (dim: "x" | "y") => ZoomWindow | undefined,
): ZoomWindows | undefined {
  const out: ZoomWindows = {};
  for (const dim of ["x", "y"] as const) {
    const window = windows[dim];
    const data = extent(dim);
    if (!window || !data || !windowsOverlap(window, data)) continue;
    const cut: ZoomWindow = [
      Math.max(window[0], data[0]),
      Math.min(window[1], data[1]),
    ];
    if (cut[1] > cut[0]) out[dim] = cut;
  }
  return out.x || out.y ? out : undefined;
}

/**
    The windows one panel shows for its chart's facet zoom, or undefined for
    its natural view: the panel's own window, when zooming it set one; else
    a range button's window over the panel's data, or the linked windows cut
    to it.
    @param zoom The chart's facet zoom.
    @param extent The panel's data extent along a dimension (with shared
    scales, every panel's).
    @param key The panel's key.
*/
export function panelWindows(
  zoom: FacetZoom | undefined,
  extent: (dim: "x" | "y") => ZoomWindow | undefined,
  key?: string,
): ZoomWindows | undefined {
  if (!zoom) return undefined;
  if (key !== undefined && zoom.panels && key in zoom.panels)
    return zoom.panels[key] ?? undefined;
  if (zoom.range) {
    const {axis, button, utc} = zoom.range;
    const data = extent(axis);
    const window = data && rangeWindow(button, data, utc);
    return window ? {[axis]: window} : undefined;
  }
  return zoom.windows ? overlappingWindows(zoom.windows, extent) : undefined;
}

/**
    The extent of every panel's data along a dimension, from each panel's
    unzoomed draw. Undefined for a chart without panels.
    @param viz The chart.
    @param dim The dimension.
*/
export function facetDataWindow(
  viz: Pick<VizInstance, "_facetPanels">,
  dim: "x" | "y",
): ZoomWindow | undefined {
  const values: unknown[] = [];
  for (const panel of viz._facetPanels ?? []) {
    const base = panel.state._plotZoomBase as
      {pCtx?: Record<string, unknown>} | undefined;
    const list = base?.pCtx?.[`${dim}Data`];
    if (Array.isArray(list)) for (const v of list) values.push(v);
  }
  return valuesExtent(values);
}
