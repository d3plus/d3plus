/**
    Windows in small multiples: a Plot drawn with `facet` zooms its picture
    under the pointer, but a range button and linked zoom set a window that
    each panel shows on its own axes. A range button reads each panel's own
    data ("the last six months" of that panel), and a linked window shows
    the same dates in every panel whose data reaches them.

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
    The windows that reach a chart's data, dimension by dimension; undefined
    when none do (the chart keeps its view).
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
    if (window && data && windowsOverlap(window, data)) out[dim] = window;
  }
  return out.x || out.y ? out : undefined;
}

/**
    The windows one panel shows for its chart's facet zoom, or undefined for
    its natural view: a range button's window over the panel's own data, or
    the linked windows that reach it.
    @param zoom The chart's facet zoom.
    @param extent The panel's data extent along a dimension.
*/
export function panelWindows(
  zoom: FacetZoom | undefined,
  extent: (dim: "x" | "y") => ZoomWindow | undefined,
): ZoomWindows | undefined {
  if (!zoom) return undefined;
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
