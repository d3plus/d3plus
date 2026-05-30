/**
    StackedArea — AreaPlot with `stacked: true`.
*/

import AreaPlot from "../AreaPlot/index.js";
import {backFeature, subtitleFeature, titleFeature, totalFeature} from "../features.js";
import type {ChartDefinition} from "../ChartDefinition.js";
import {makeChart} from "../makeChart.js";

export const stackedAreaDef: ChartDefinition = {
  name: "StackedArea",
  paintDriven: true,
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],

  ctx: {},

  fields: [
    {key: "stacked", default: true},
  ],
};

export default makeChart(stackedAreaDef, AreaPlot);
