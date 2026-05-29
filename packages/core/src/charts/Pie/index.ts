/**
    Pie — d3-shape pie layout, one path per slice.

    Implementation files in this folder:
      - `applyLayout.ts` — chart-specific `TransformStage`.
      - `emit.ts` — Path + label scene nodes from the laid-out slices.
*/

import {pie as d3Pie} from "d3-shape";
import type {DataPoint} from "@d3plus/data";

import accessor from "../../utils/accessor.js";
import {centerChartTransform} from "../chartGeometry.js";
import {backFeature, subtitleFeature, titleFeature, totalFeature} from "../features.js";
import type {ChartDefinition} from "../ChartDefinition.js";
import type {D3plusConfig} from "../../utils/D3plusConfig.js";
import {makeChart} from "../makeChart.js";
import {vizPreDrawStages} from "../stages.js";
import type {VizInstance} from "../vizTypes.js";

import {applyPieLayout} from "./applyLayout.js";
import {pieEmit} from "./emit.js";

export const pieDef: ChartDefinition = {
  name: "Pie",

  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  stages: [...vizPreDrawStages, applyPieLayout],
  layoutStage: applyPieLayout,
  emit: pieEmit,

  chartTransform: (viz: VizInstance) =>
    centerChartTransform(
      viz,
      viz.ctx.pieWidth as number,
      viz.ctx.pieHeight as number,
    ),

  ctx: {
    pie: d3Pie(),
  },

  fields: [
    {key: "innerRadius", default: 0},
    {key: "padAngle"},
    {key: "padPixel", default: 0},
    {
      key: "value",
      default: accessor("value"),
      coerce: v => (typeof v === "function" ? v : accessor(v as string)),
    },
    {
      key: "sort",
      factory: (viz: VizInstance) => {
        const valueFn = viz._value as (d: DataPoint) => number;
        return (a: DataPoint, b: DataPoint) => valueFn(b) - valueFn(a);
      },
    },
    {
      key: "legendSort",
      factory: (viz: VizInstance) => {
        const valueFn = viz._value as (d: DataPoint) => number;
        return (a: DataPoint, b: DataPoint) => valueFn(b) - valueFn(a);
      },
    },
    {
      key: "shapeConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        ariaLabel: (d: DataPoint, i: number) => {
          const pieData = viz.ctx.pieData as {index: number}[] | undefined;
          if (!pieData) return "";
          return `${++pieData[i].index}. ${viz._drawLabel(d, i)}, ${(viz._value as (d: DataPoint, i: number) => number)(d, i)}.`;
        },
        Path: {labelConfig: {fontResize: true}},
      }),
    },
    {
      key: "legend",
      factory: (viz: VizInstance) => {
        const base = viz._legend as (config: D3plusConfig, arr: DataPoint[]) => unknown;
        return (config: D3plusConfig, arr: DataPoint[]) => {
          if (arr.length === viz._filteredData.length) return false;
          return base.call(viz, config, arr);
        };
      },
    },
  ],
};

export default makeChart(pieDef);
