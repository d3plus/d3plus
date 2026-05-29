/**
    StackedArea — AreaPlot with `stacked: true`.
*/

import AreaPlot from "../AreaPlot/index.js";
import {backFeature, subtitleFeature, titleFeature, totalFeature} from "../features.js";
import type {ChartDefinition} from "../ChartDefinition.js";
import {makeChart} from "../makeChart.js";
import {vizPreDrawStages} from "../stages.js";

export const stackedAreaDef: ChartDefinition = {
  name: "StackedArea",
  paintDriven: true,
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  stages: vizPreDrawStages,
  emit: ({viz}) => Array.isArray(viz._chartScene) ? viz._chartScene.slice() : [],

  ctx: {},

  fields: [
    {key: "stacked", default: true},
  ],
};

export default makeChart(stackedAreaDef, AreaPlot);
