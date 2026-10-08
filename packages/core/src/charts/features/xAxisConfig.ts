/**
    The shared config Plot's x and x2 axes start from (see `measureAxes`).
*/
import {withAxisInk} from "../Plot/axisInk.js";
import type {AxisMeasureInputs} from "./axes.js";
import type {VizInstance as Viz} from "../viz/vizTypes.js";

/** Build the shared x-axis config object, including the no-y-axis variant. */
export function buildXConfig(viz: Viz, inputs: AxisMeasureInputs): Record<string, unknown> {
  const {xTicks, showX, showY, xData, xScalePadding} = inputs;

  const xC: Record<string, unknown> = {
    data: xData,
    locale: viz.schema.locale,
    rounding: viz.schema.xDomain || (viz._discreteExtent && viz.schema.discrete === "x") ? "none" : "outside",
    scalePadding: xScalePadding,
  };
  if (!showY && showX) {
    xC.barConfig = {stroke: "transparent"};
    xC.tickSize = 0;
    xC.shapeConfig = {
      labelBounds: (d: {labelBounds: {height: number; y: number}}, i: number) => {
        const {height, y} = d.labelBounds;
        const width = viz.schema.width / 2;
        const x = i ? -width : 0;
        return {x, y, width, height};
      },
      labelConfig: {
        padding: 0,
        rotate: 0,
        textAnchor: (d: {id: unknown}) =>
          xTicks && d.id === xTicks[0] ? "start" : "end",
      },
      labelRotation: false,
    };
  }

  return withAxisInk(viz, xC);
}
