/**
    Radar — polar value polygons over a per-metric radial axis.

    Implementation files in this folder:
      - `applyLayout.ts` — polar geometry + axis decorations + polygon paths.
      - `emit.ts` — Path scene nodes per polygon.
*/

import {colorContrast} from "@d3plus/color";
import {backgroundColor} from "@d3plus/dom";

import accessor from "../../utils/accessor.js";
import constant from "../../utils/constant.js";
import {backFeature, subtitleFeature, titleFeature, totalFeature} from "../features.js";
import {centerChartTransform, chartBounds} from "../chartGeometry.js";
import type {ChartDefinition} from "../ChartDefinition.js";
import {makeChart} from "../makeChart.js";
import type {VizInstance} from "../vizTypes.js";

import {applyRadarLayout} from "./applyLayout.js";
import {radarEmit} from "./emit.js";

export const radarDef: ChartDefinition = {
  name: "Radar",

  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  layoutStage: applyRadarLayout,
  emit: radarEmit,

  chartTransform: (viz: VizInstance) => {
    const {width, height} = chartBounds(viz);
    return centerChartTransform(viz, width, height);
  },

  ctx: {},

  fields: [
    {key: "discrete", default: "metric"},
    {key: "levels", default: 6},
    {
      key: "metric",
      default: accessor("metric"),
      coerce: v => (typeof v === "function" ? v : accessor(v as string)),
    },
    {key: "outerPadding", default: 100},
    {key: "shape", default: constant("Path")},
    {
      key: "value",
      default: accessor("value"),
      coerce: v => (typeof v === "function" ? v : accessor(v as string)),
    },
    {
      key: "axisConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        shapeConfig: {
          fill: constant("none"),
          labelConfig: {
            fontColor: () => {
              const bg = viz._select
                ? backgroundColor(viz._select.node())
                : "rgb(255, 255, 255)";
              return colorContrast(bg);
            },
            fontResize: false,
            padding: 0,
            textAnchor: (d: {data?: {textAnchor?: string}}) =>
              d.data?.textAnchor ?? "middle",
            verticalAlign: "middle",
          },
          stroke: () => {
            const bg = viz._select
              ? backgroundColor(viz._select.node())
              : "rgb(255, 255, 255)";
            return colorContrast(bg);
          },
          strokeWidth: constant(1),
        },
      }),
    },
  ],
};

export default makeChart(radarDef);
