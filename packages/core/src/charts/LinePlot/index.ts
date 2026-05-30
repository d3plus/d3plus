/**
    LinePlot — Plot with `discrete: "x"`, `shape: "Line"`.
*/

import constant from "../../utils/constant.js";
import {backFeature, subtitleFeature, titleFeature, totalFeature} from "../features.js";
import type {ChartDefinition} from "../ChartDefinition.js";
import {makeChart} from "../makeChart.js";
import Plot from "../Plot/index.js";

export const linePlotDef: ChartDefinition = {
  name: "LinePlot",
  paintDriven: true,
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],

  ctx: {},

  fields: [
    {key: "discrete", default: "x"},
    {key: "shape", default: constant("Line")},
  ],
};

export default makeChart(linePlotDef, Plot);
