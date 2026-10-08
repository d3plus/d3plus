/**
    The shared config Plot's x and x2 axes start from (see `measureAxes`).
*/
import {withAxisInk} from "../Plot/axisInk.js";
import type {AxisMeasureInputs} from "./axes.js";
import type {VizInstance as Viz} from "../viz/vizTypes.js";

/** Build the shared x-axis config object. */
export function buildXConfig(viz: Viz, inputs: AxisMeasureInputs): Record<string, unknown> {
  const {xData, xScalePadding} = inputs;

  const xC: Record<string, unknown> = {
    data: xData,
    locale: viz.schema.locale,
    rounding: viz.schema.xDomain || (viz._discreteExtent && viz.schema.discrete === "x") ? "none" : "outside",
    scalePadding: xScalePadding,
  };

  return withAxisInk(viz, xC);
}
