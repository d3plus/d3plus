/**
    Linked zoom (`link: {group, zoom: true}`): zooming or panning a Plot
    shows the same window of values on every other Plot in its link group
    that links zoom too.

    Charts share windows, not transforms: each chart turns the window into
    its own transform (see `windowTransform`), so charts of different sizes,
    or over different spans of data, line up on the same dates. A window
    passes only between axes of the same kind (time to time, number to
    number), along the dimensions the receiving chart's zoom scales (see
    `zoomAxes`). A return to the natural view resets the others.

    @module
*/
import type {ZoomState} from "../Plot/plotZoom.js";
import {
  windowTransform,
  zoomWindows,
  type ZoomWindows,
} from "../Plot/zoomWindow.js";
import {dispatchLinked, resolveLink} from "../viz/linkGroup.js";
import type Viz from "../viz/Viz.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {zoomTo} from "./zoomControls.js";

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
    Zooms a linked chart to windows from another, or back to its natural
    view for `null`.
    @param target The chart.
    @param windows The windows, or null to reset.
    @param duration The transition's length.
*/
export function followZoom(
  target: Viz,
  windows: ZoomWindows | null,
  duration: number,
): void {
  if (!target._zoomBehavior || !target._plotZoomBase) return;
  if (!windows) return zoomTo(target, 1, 0, 0, duration);
  const t = windowTransform(target, windows);
  if (t) zoomTo(target, t.k, t.x, t.y, duration);
}

/**
    Passes a Plot's new zoom to the rest of its link group (see the module
    notes). Charts that don't link zoom, haven't drawn, or have no matching
    axis are left alone.
    @param viz The zoomed chart.
    @param t Its zoom transform.
    @param duration The transition's length.
*/
export function broadcastZoom(viz: Viz, t: ZoomState, duration: number): void {
  const link = resolveLink(viz);
  if (!link?.zoom || !viz._plotZoomBase) return;
  const identity = t.k === 1 && !t.x && !t.y;
  const windows = identity ? null : zoomWindows(viz, t);
  dispatchLinked(viz as unknown as VizInstance, link, (member, memberLink) => {
    const target = member as unknown as Viz;
    if (!memberLink.zoom) return;
    if (!windows) return followZoom(target, null, duration);
    const shared = sharedWindows(viz, target, windows);
    if (shared.x || shared.y) followZoom(target, shared, duration);
  });
}
