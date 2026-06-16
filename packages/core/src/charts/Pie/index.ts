/**
    Pie — d3-shape pie layout, one path per slice.

    Implementation files in this folder:
      - `applyLayout.ts` — chart-specific `TransformStage`.
      - `emit.ts` — Path + label scene nodes from the laid-out slices.
*/

import {pie as d3Pie} from "d3-shape";
import {formatAbbreviate} from "@d3plus/format";
import type {DataPoint} from "@d3plus/data";

import accessor from "../../utils/accessor.js";
import {centerChartTransform} from "../features/chartGeometry.js";
import {backFeature, subtitleFeature, titleFeature, totalFeature} from "../features/features.js";
import {colorScaleBucketShare} from "../features/colorScaleBucket.js";
import type {DataDrivenChartDefinition} from "../definition/ChartDefinition.js";
import type {D3plusConfig} from "../../utils/D3plusConfig.js";
import {makeChart} from "../definition/makeChart.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {applyPieLayout} from "./applyLayout.js";
import {pieEmit} from "./emit.js";

export const pieDef: DataDrivenChartDefinition = {
  name: "Pie",

  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
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
        const valueFn = viz.schema.value as (d: DataPoint) => number;
        return (a: DataPoint, b: DataPoint) => valueFn(b) - valueFn(a);
      },
    },
    {
      key: "legendSort",
      factory: (viz: VizInstance) => {
        const valueFn = viz.schema.value as (d: DataPoint) => number;
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
          return `${++pieData[i].index}. ${viz._drawLabel(d, i)}, ${(viz.schema.value as (d: DataPoint, i: number) => number)(d, i)}.`;
        },
        Path: {labelConfig: {fontResize: true}},
      }),
    },
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        tbody: [
          [
            () => viz.schema.translate("Share"),
            (_d: DataPoint, _i: number, x: Record<string, unknown>) => {
              // A ColorScale range swatch carries no per-row share, so sum the
              // share of every datum that falls in its color range.
              if (x._isColorScaleBucket) {
                const s = colorScaleBucketShare(
                  viz,
                  x.color,
                  viz.schema.value as (d: DataPoint, i: number) => number,
                );
                return s == null
                  ? ""
                  : `${formatAbbreviate(s * 100, viz.schema.locale)}%`;
              }
              // A Legend bucket aggregates multiple rows, so `share` arrives
              // as an array of the members' shares — sum it; a single cell's
              // share is a plain number.
              const share = Array.isArray(x.share)
                ? (x.share as number[]).reduce((a, b) => a + b, 0)
                : (x.share as number);
              if (!Number.isFinite(share)) return "";
              return `${formatAbbreviate(share * 100, viz.schema.locale)}%`;
            },
          ],
        ],
      }),
    },
    {
      key: "legend",
      factory: (viz: VizInstance) => {
        const base = viz.schema.legend as (config: D3plusConfig, arr: DataPoint[]) => unknown;
        return (config: D3plusConfig, arr: DataPoint[]) => {
          if (arr.length === viz._filteredData.length) return false;
          return base.call(viz, config, arr);
        };
      },
    },
  ],
};

/**
    Uses the d3 pie layout to create SVG arcs based on an array of data.
*/
export default makeChart(pieDef);
