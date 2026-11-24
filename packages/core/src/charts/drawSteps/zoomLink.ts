/**
    Linked zoom: Plots in the same `link` group share their zoom unless one
    sets `link: {group, zoom: false}`. Zooming or panning one shows the same
    window of values on the others; an overview chart (`zoom: "overview"`)
    shows that window as a band (see `overview.ts`), and small multiples show
    it in each panel (see `Plot/facetZoom.ts`).

    Charts share windows, not transforms: each chart turns a window into its
    own transform (see `windowTransform`), so charts of different sizes, or
    over different spans of data, line up on the same dates. A window passes
    only between axes of the same kind (time to time, number to number); a
    chart follows only when the windows cover every dimension its zoom
    scales, and keeps its view when none of them reaches its data. A return
    to the natural view resets the others.

    @module
*/
import {
  facetDataWindow,
  overlappingWindows,
  type FacetZoom,
} from "../Plot/facetZoom.js";
import type {ZoomState} from "../Plot/plotZoom.js";
import {
  dataWindow,
  windowTransform,
  zoomWindows,
  type ZoomWindows,
} from "../Plot/zoomWindow.js";
import {dispatchLinked, resolveLink} from "../viz/linkGroup.js";
import type Viz from "../viz/Viz.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {setFacetZoom} from "./facetZoomRedraw.js";
import {zoomTo} from "./zoomControls.js";
import {zoomedDims} from "./zoomFit.js";

/** Whether an axis plots dates. */
const timeAxis = (viz: Viz, dim: "x" | "y"): boolean =>
  Boolean(dim === "x" ? viz._xTime : viz._yTime);

/**
    The windows a target takes from a source: each one along an axis of the
    same kind on both charts.
    @param source The zoomed chart.
    @param target The chart following it.
    @param windows The source's windows.
*/
export function sharedWindows(
  source: Viz,
  target: Viz,
  windows: ZoomWindows,
): ZoomWindows {
  const out: ZoomWindows = {};
  for (const dim of ["x", "y"] as const) {
    const window = windows[dim];
    if (window && timeAxis(source, dim) === timeAxis(target, dim))
      out[dim] = window;
  }
  return out;
}

/**
    Whether windows cover every dimension a chart's zoom scales, so it can
    show them without zooming a dimension nobody asked for.
    @param dims The dimensions the chart's zoom scales.
    @param windows The windows.
*/
export function coversDims(
  dims: {x: boolean; y: boolean},
  windows: ZoomWindows,
): boolean {
  return (!dims.x || Boolean(windows.x)) && (!dims.y || Boolean(windows.y));
}

/**
    Zooms a linked chart to windows from another, or back to its natural
    view for `null`. A chart keeps its view when the windows miss a
    dimension its zoom scales, or reach none of its data.
    @param target The chart.
    @param windows The windows, or null to reset.
    @param duration The transition's length.
*/
export function followZoom(
  target: Viz,
  windows: ZoomWindows | null,
  duration: number,
): void {
  const vi = target as unknown as VizInstance;
  if (target._facetPanels) {
    const reach =
      windows && overlappingWindows(windows, d => facetDataWindow(vi, d));
    if (windows && !reach) return;
    const zoom: FacetZoom | undefined = reach ? {windows: reach} : undefined;
    return setFacetZoom(vi, zoom, duration);
  }
  if (!target._zoomBehavior || !target._plotZoomBase) return;
  if (!windows) return zoomTo(target, 1, 0, 0, duration);
  const dims = zoomedDims(target);
  if (!coversDims(dims, windows)) return;
  const reach = overlappingWindows(windows, d => dataWindow(target, d));
  if (!reach || !coversDims(dims, reach)) return;
  // The window's dates, even where they run past this chart's data.
  const t = windowTransform(target, windows);
  if (t) zoomTo(target, t.k, t.x, t.y, duration, false);
}

/**
    Passes windows from `viz` to the rest of its link group (see the module
    notes), or `null` to reset them.
    @param viz The chart the windows come from.
    @param windows The windows, or null.
    @param duration The transition's length.
*/
export function broadcastWindows(
  viz: Viz,
  windows: ZoomWindows | null,
  duration: number,
): void {
  const link = resolveLink(viz);
  if (!link?.zoom) return;
  dispatchLinked(viz as unknown as VizInstance, link, (member, memberLink) => {
    const target = member as unknown as Viz;
    if (!memberLink.zoom) return;
    if (!windows) return followZoom(target, null, duration);
    const shared = sharedWindows(viz, target, windows);
    if (shared.x || shared.y) followZoom(target, shared, duration);
  });
}

/**
    Passes a Plot's new zoom transform to the rest of its link group as
    windows. Charts that haven't drawn are left alone.
    @param viz The zoomed chart.
    @param t Its zoom transform.
    @param duration The transition's length.
*/
export function broadcastZoom(viz: Viz, t: ZoomState, duration: number): void {
  if (!viz._plotZoomBase || !resolveLink(viz)?.zoom) return;
  const identity = t.k === 1 && !t.x && !t.y;
  broadcastWindows(viz, identity ? null : zoomWindows(viz, t), duration);
}
