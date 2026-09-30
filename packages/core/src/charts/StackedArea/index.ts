/**
    StackedArea — AreaPlot with `stacked: true`.
*/

import AreaPlot from "../AreaPlot/index.js";
import {subtitleFeature, titleFeature, totalFeature} from "../features/features.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import {stackShareTooltipConfig} from "../Plot/stackShareTooltip.js";

export const stackedAreaDef: ChartDefinition = {
  name: "StackedArea",
  paintDriven: true,
  features: [titleFeature, subtitleFeature, totalFeature],

  ctx: {},

  fields: [
    {key: "stacked", default: true},
    {key: "tooltipConfig", merge: true, factory: stackShareTooltipConfig},
  ],
};

/**
    Creates a stacked area plot based on an array of data. Each point's
    fraction of its stack total is available to tooltip accessors as `share`.
*/
export default makeChart(stackedAreaDef, AreaPlot);
