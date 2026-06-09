/**
    BarChart — Plot with `baseline: 0`, `discrete: "x"`, `shape: "Bar"`.
*/
/* eslint-disable @typescript-eslint/no-explicit-any */

import type {DataPoint} from "@d3plus/data";

import constant from "../../utils/constant.js";
import {backFeature, subtitleFeature, titleFeature, totalFeature} from "../features/features.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import Plot from "../Plot/index.js";
import type {VizInstance} from "../viz/vizTypes.js";

export const barChartDef: ChartDefinition = {
  name: "BarChart",
  paintDriven: true,
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],

  ctx: {},

  fields: [
    {key: "baseline", default: 0},
    {key: "discrete", default: "x"},
    {key: "shape", default: constant("Bar")},
    {
      key: "legend",
      factory: (viz: VizInstance) => {
        const base = viz.schema.legend as (config: any, arr: DataPoint[]) => unknown;
        return (config: any, arr: DataPoint[]) => {
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
    Creates a bar chart based on an array of data.
*/
export default makeChart(barChartDef, Plot);
