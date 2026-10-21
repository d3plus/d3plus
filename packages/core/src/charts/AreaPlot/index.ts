/**
    AreaPlot — Plot with `baseline: 0`, `baselineBreak: true`, `discrete: "x"`,
    `shape: "Area"`.
*/

import constant from "../../utils/constant.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import Plot from "../Plot/index.js";

export const areaPlotDef: ChartDefinition = {
  name: "AreaPlot",
  paintDriven: true,

  ctx: {},

  fields: [
    {key: "baseline", default: 0},
    {key: "baselineBreak", default: true},
    {key: "discrete", default: "x"},
    {key: "shape", default: constant("Area"), coerce: "const"},
  ],
};

/**
    Creates an area plot based on an array of data.
*/
export default makeChart(areaPlotDef, Plot);
