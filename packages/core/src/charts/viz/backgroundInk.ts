import {inkBackground, inkGrid, inkText} from "../../utils/themeInk.js";
import type {VizInstance} from "./vizTypes.js";

type InkTarget = Pick<VizInstance, "schema"> &
  Partial<Pick<VizInstance, "_select" | "_theme">>;

/**
    The chart's background: its theme's (the page's own in `"auto"` mode), or,
    before the chart has drawn, the one detected behind its container (white
    before the chart is mounted).
    @private
*/
export function chartBackground(
  viz: Partial<Pick<VizInstance, "_select" | "_theme">>,
): string {
  return inkBackground(viz);
}

/**
    The text color that reads against the chart's own background: dark on a
    light page, light on a dark one, or the theme's `text`.
    @private
*/
export function backgroundInk(viz: InkTarget): string {
  return inkText(viz);
}

/**
    The chart's gridline color: the theme's `gridline`, a faint step off the
    chart's background.
    @private
*/
export function chartGridline(viz: InkTarget): string {
  return inkGrid(viz);
}
