/**
    BoxWhisker — Plot with `discrete: "x"`, `shape: "Box"`, plus a
    tooltip-title accessor that walks through `__d3plus__` wrappers.
*/
/* eslint-disable @typescript-eslint/no-explicit-any */

import type {DataPoint} from "@d3plus/data";

import constant from "../../utils/constant.js";
import {backFeature, subtitleFeature, titleFeature, totalFeature} from "../features.js";
import type {ChartDefinition} from "../ChartDefinition.js";
import {makeChart} from "../makeChart.js";
import Plot from "../Plot/index.js";
import type {VizInstance} from "../vizTypes.js";

export const boxWhiskerDef: ChartDefinition = {
  name: "BoxWhisker",
  paintDriven: true,
  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  emit: ({viz}) => Array.isArray(viz._chartScene) ? viz._chartScene.slice() : [],

  ctx: {},

  fields: [
    {key: "discrete", default: "x"},
    {key: "shape", default: constant("Box")},
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        title: (d: any, i: number) => {
          if (!d) return "";
          while (d.__d3plus__ && d.data) {
            d = d.data;
            i = d.i;
          }
          const labelFn = viz.schema.label as ((d: DataPoint, i: number) => string) | undefined;
          if (labelFn) return labelFn(d, i);
          const l = viz._ids(d, i).slice(0, viz._drawDepth);
          return l[l.length - 1];
        },
      }),
    },
  ],
};

export default makeChart(boxWhiskerDef, Plot);
