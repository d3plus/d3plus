import {colorContrast} from "@d3plus/color";
import {backgroundColor} from "@d3plus/dom";

import type {VizInstance} from "./vizTypes.js";

type InkTarget = Pick<VizInstance, "schema"> & Partial<Pick<VizInstance, "_select">>;

/**
    The text color that reads against the chart's own background: dark on a
    light page, light on a dark one.
    @private
*/
export function backgroundInk(viz: InkTarget): string {
  const node = viz._select && typeof viz._select.node === "function" ? viz._select.node() : null;
  const bg = node ? backgroundColor(node) : "rgb(255, 255, 255)";
  return colorContrast(bg, viz.schema.colorDefaults);
}
