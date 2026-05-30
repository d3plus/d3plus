/**
    AreaPlot — Plot with `baseline: 0`, `discrete: "x"`, `shape: "Area"`.
*/

import constant from "../../utils/constant.js";
import {backFeature, subtitleFeature, titleFeature, totalFeature} from "../features.js";
import type {ChartDefinition} from "../ChartDefinition.js";
import {makeChart} from "../makeChart.js";
import Plot from "../Plot/index.js";

export const areaPlotDef: ChartDefinition = {
  name: "AreaPlot",
  paintDriven: true,
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  emit: ({viz}) => Array.isArray(viz._chartScene) ? viz._chartScene.slice() : [],

  ctx: {},

  fields: [
    {key: "baseline", default: 0},
    {key: "discrete", default: "x"},
    {key: "shape", default: constant("Area")},
  ],
};

export default makeChart(areaPlotDef, Plot);
