/**
    AreaPlot — Plot with `baseline: 0`, `discrete: "x"`, `shape: "Area"`.
*/

import constant from "../../utils/constant.js";
import {backFeature, subtitleFeature, titleFeature, totalFeature} from "../features/features.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import Plot from "../Plot/index.js";

export const areaPlotDef: ChartDefinition = {
  name: "AreaPlot",
  paintDriven: true,
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],

  ctx: {},

  fields: [
    {key: "baseline", default: 0},
    {key: "discrete", default: "x"},
    {key: "shape", default: constant("Area"), coerce: "const"},
  ],
};

/**
    Creates an area plot based on an array of data.
*/
export default makeChart(areaPlotDef, Plot);
