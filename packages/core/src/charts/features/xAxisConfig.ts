/**
    The shared config Plot's x and x2 axes start from (see `measureAxes`).
*/
import {withAxisInk} from "../Plot/axisInk.js";
import {baselineBreakAxisConfig} from "../Plot/baselineBreak.js";
import {hasUserDomain, plotAxisRounding} from "../Plot/baselineDomain.js";
import type {AxisMeasureInputs} from "./axes.js";
import type {VizInstance as Viz} from "../viz/vizTypes.js";

/** Plot's default x-axis `rounding` when `xConfig` sets no full domain: "outside", unless the user set a domain or the axis is a discrete extent. */
export function xAxisRounding(viz: Viz): string {
  return hasUserDomain(viz, "x") ||
    (viz._discreteExtent && viz.schema.discrete === "x")
    ? "none"
    : "outside";
}

/** Build the shared x-axis config object. */
export function buildXConfig(
  viz: Viz,
  inputs: AxisMeasureInputs,
): Record<string, unknown> {
  const {xData, xScalePadding} = inputs;

  const xC: Record<string, unknown> = {
    data: xData,
    locale: viz.schema.locale,
    rounding: plotAxisRounding(viz, "x", xAxisRounding(viz)),
    scalePadding: xScalePadding,
    ...baselineBreakAxisConfig(viz, "x"),
  };

  return withAxisInk(viz, xC);
}
