import {interpolateRgb} from "d3-interpolate";

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

/**
    A neutral fill between the chart's background and its ink, for a mark
    that stands for a group rather than one value: Treemap's group headers
    and Pack's group circles while a colorScale colors the rest, and Pack's
    outermost circle.
    @private
*/
export function neutralFill(viz: InkTarget): string {
  return interpolateRgb(chartBackground(viz), backgroundInk(viz))(0.7);
}
