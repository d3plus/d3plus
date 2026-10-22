/**
    FanChart — a LinePlot with the forecast turned on (`forecast: "auto"`):
    nested `confidence` bands fan out from the point where each line's
    forecast begins, and the stretch after it is marked as a forecast.
*/

import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import LinePlot from "../LinePlot/index.js";

export const fanChartDef: ChartDefinition = {
  name: "FanChart",
  paintDriven: true,

  ctx: {},

  fields: [
    /**
        On by default, so each line's forecast starts where its `confidence`
        bands open.
    */
    {key: "forecast", default: "auto"},
  ],
};

/**
    Creates a fan chart from an array of data: a line per series with nested
    `confidence` bands around it, outermost first, shaded from the widest
    (lightest) to the narrowest (darkest). The bands open from the last point
    before they spread away from the line, and the stretch after it is marked
    as a forecast: a shaded backdrop, a rule at its start, a "Forecast" label,
    and a dashed line (see `forecast` and `forecastConfig`).
*/
export default makeChart(fanChartDef, LinePlot);
