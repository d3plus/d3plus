/**
    BumpChart — Plot with `discrete: "x"`, `shape: "Line"`, and a
    y2-mirroring configuration that draws labeled rank lines.
*/

import constant from "../../utils/constant.js";
import {backFeature, subtitleFeature, titleFeature, totalFeature} from "../features.js";
import type {ChartDefinition} from "../ChartDefinition.js";
import {makeChart} from "../makeChart.js";
import Plot from "../Plot/index.js";
import {vizPreDrawStages} from "../stages.js";
import type {VizInstance} from "../vizTypes.js";

export const bumpChartDef: ChartDefinition = {
  name: "BumpChart",
  paintDriven: true,
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  stages: vizPreDrawStages,
  emit: ({viz}) => Array.isArray(viz._chartScene) ? viz._chartScene.slice() : [],

  setup: (viz: VizInstance) => {
    type Comparator = (a: Record<string, unknown>, b: Record<string, unknown>) => number;
    type BumpFluent = {
      y2: (accessor: (d: Record<string, unknown>) => unknown) => unknown;
      yConfig: (config: Record<string, unknown>) => unknown;
      y2Config: (config: Record<string, unknown>) => unknown;
      ySort: (comparator: Comparator) => unknown;
      y2Sort: (comparator: Comparator) => unknown;
    };
    const v = viz as VizInstance & BumpFluent;
    v.y2((d: Record<string, unknown>) => viz._y(d));
    v.yConfig({
      tickFormat: (val: number) => {
        const data = viz._formattedData ?? [];
        const xMin = data[0].x instanceof Date ? (data[0].x as unknown as Date).getTime() : data[0].x;
        const startData = data.filter(
          (d: Record<string, unknown>) =>
            (d.x instanceof Date ? (d.x as Date).getTime() : d.x) === xMin,
        );
        const d = startData.find((d: Record<string, unknown>) => d.y === val);
        return d ? viz._drawLabel(d, d.i as number) : "";
      },
    });
    v.y2Config({
      tickFormat: (val: number) => {
        const data = viz._formattedData ?? [];
        const xMax =
          data[data.length - 1].x instanceof Date
            ? (data[data.length - 1].x as unknown as Date).getTime()
            : data[data.length - 1].x;
        const endData = data.filter(
          (d: Record<string, unknown>) =>
            (d.x instanceof Date ? (d.x as Date).getTime() : d.x) === xMax,
        );
        const d = endData.find((d: Record<string, unknown>) => d.y === val);
        return d ? viz._drawLabel(d, d.i as number) : "";
      },
    });
    v.ySort((a: Record<string, unknown>, b: Record<string, unknown>) =>
      (viz._y as (d: unknown) => number)(b) - (viz._y as (d: unknown) => number)(a));
    v.y2Sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
      (viz._y as (d: unknown) => number)(b) - (viz._y as (d: unknown) => number)(a));
  },

  ctx: {},

  fields: [
    {key: "discrete", default: "x"},
    {key: "shape", default: constant("Line")},
  ],
};

export default makeChart(bumpChartDef, Plot);
