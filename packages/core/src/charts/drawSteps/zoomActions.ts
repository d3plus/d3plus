/**
    The zoom-control buttons' actions, for a chart's `zoomIn`, `zoomOut`,
    `zoomReset`, and `zoomBrush` methods: buttons of a page's own can zoom a
    chart exactly as the built-in ones do, shown or not.

    @module
*/

import type Viz from "../viz/Viz.js";
import {zoomEvents, zoomMath} from "./zoomControls.js";
import {isBrushing, syncBrushButton} from "./zoomControlsMarkup.js";

/**
    Whether a chart can zoom right now: `zoom` is on and it has rendered, so
    its zoom surface and brush are in place.
    @param viz The chart.
*/
export function canZoom(viz: Viz): boolean {
  const tgt = viz._zoomEventTarget || viz._container;
  return Boolean(
    viz.schema.zoom && viz._zoomBehavior && viz._brushGroup && tgt?.node(),
  );
}

/**
    Zooms by `factor` about the chart area's center, as the zoom-in (`factor`
    is `zoomFactor`) and zoom-out (`1 / zoomFactor`) buttons do, or resets to
    the initial view for `0`, as the reset button does. Does nothing while
    the chart can't zoom (see `canZoom`).
    @param viz The chart.
    @param factor The zoom multiplier, or 0 to reset.
*/
export function zoomBy(viz: Viz, factor: number): void {
  if (canZoom(viz)) zoomMath.call(viz, factor);
}

/**
    Turns brush mode on or off, as the brush button does, and has the button
    (when it shows) report it. Does nothing while the chart can't zoom.
    @param viz The chart.
    @param on Whether brush mode is on.
*/
export function setZoomBrush(viz: Viz, on: boolean): void {
  if (!canZoom(viz) || on === isBrushing(viz)) return;
  zoomEvents.call(viz, on);
  syncBrushButton(viz);
}
