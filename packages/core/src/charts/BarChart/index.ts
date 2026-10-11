/**
    BarChart — Plot with `baseline: 0`, `baselineBreak: true`, `discrete: "x"`,
    `shape: "Bar"`.
*/

import type {DataPoint} from "@d3plus/data";

import constant from "../../utils/constant.js";
import {subtitleFeature, titleFeature, totalFeature} from "../features/features.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import Plot from "../Plot/index.js";
import {barWidthAccessor, barWidthTooltipRows} from "../Plot/barWidth.js";
import {stackShareTooltipConfig} from "../Plot/stackShareTooltip.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** Tooltip rows for a bar: its width and width share (with `barWidth`), then its stack share. */
function barTooltipConfig(viz: VizInstance) {
  const share = stackShareTooltipConfig(viz);
  return {tbody: (d: DataPoint) => [...barWidthTooltipRows(viz, d), ...share.tbody()]};
}

export const barChartDef: ChartDefinition = {
  name: "BarChart",
  paintDriven: true,
  features: [titleFeature, subtitleFeature, totalFeature],

  ctx: {},

  fields: [
    /**
        Makes each bar as wide as its own measure (a data key or accessor),
        read off the merge of the bar's rows, so stacked segments add up
        unless `aggs` says otherwise. The bars sit end to end along a
        continuous discrete axis of cumulative width, labeled at their centers.
        Off (`undefined`) by default.
    */
    {key: "barWidth", coerce: barWidthAccessor},
    {key: "baseline", default: 0},
    {key: "baselineBreak", default: true},
    {key: "discrete", default: "x"},
    {key: "shape", default: constant("Bar"), coerce: "const"},
    {key: "tooltipConfig", merge: true, factory: barTooltipConfig},
    {
      key: "legend",
      coerce: "const",
      factory: (viz: VizInstance) => {
        const base = viz.schema.legend as (
          config: VizInstance,
          arr: DataPoint[],
        ) => unknown;
        return (config: VizInstance, arr: DataPoint[]) => {
          // Color-category entries never repeat the bars' own ids.
          if (viz._legendCategories) return base.call(viz, config, arr);
          const legendIds = arr
            .map(viz.schema.groupBy[viz._legendDepth!].bind(viz))
            .sort()
            .join();
          const barIds = viz._filteredData
            .map(viz.schema.groupBy[viz._legendDepth!].bind(viz))
            .sort()
            .join();
          if (legendIds === barIds) return false;
          return base.call(viz, config, arr);
        };
      },
    },
  ],
};

/**
    Creates a bar chart based on an array of data. When stacked, each bar's
    fraction of its stack total is available to tooltip accessors as `share`
    (unless the data has its own `share` field).
*/
export default makeChart(barChartDef, Plot);
