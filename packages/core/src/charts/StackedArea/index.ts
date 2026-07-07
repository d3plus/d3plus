/**
    StackedArea — AreaPlot with `stacked: true`.
*/

import AreaPlot from "../AreaPlot/index.js";
import {backFeature, subtitleFeature, titleFeature, totalFeature} from "../features/features.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";

export const stackedAreaDef: ChartDefinition = {
  name: "StackedArea",
  paintDriven: true,
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],

  ctx: {},

  fields: [
    {key: "stacked", default: true},
  ],
};

/**
    Creates a stacked area plot based on an array of data.
*/
export default makeChart(stackedAreaDef, AreaPlot);
