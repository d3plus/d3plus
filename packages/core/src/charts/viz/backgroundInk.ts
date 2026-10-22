import {colorContrast} from "@d3plus/color";
import {backgroundColor} from "@d3plus/dom";

import type {VizInstance} from "./vizTypes.js";

type InkTarget = Pick<VizInstance, "schema"> &
  Partial<Pick<VizInstance, "_select">>;

/**
    The chart's background color, as detected behind its container (white
    before the chart is mounted).
    @private
*/
export function chartBackground(
  viz: Partial<Pick<VizInstance, "_select">>,
): string {
  const node =
    viz._select && typeof viz._select.node === "function"
      ? viz._select.node()
      : null;
  return node ? backgroundColor(node) : "rgb(255, 255, 255)";
}

/**
    The text color that reads against the chart's own background: dark on a
    light page, light on a dark one.
    @private
*/
export function backgroundInk(viz: InkTarget): string {
  return colorContrast(chartBackground(viz), viz.schema.colorDefaults);
}
