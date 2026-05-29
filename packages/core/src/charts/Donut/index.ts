/**
    Donut — Pie with a centered inner radius.

    Extends Pie; inherits its layout stage + emit. Only the inner-radius
    closure and the default arc gap (`padPixel`) differ.
*/

import {min} from "d3-array";

import type {ChartDefinition} from "../ChartDefinition.js";
import {chartBounds} from "../chartGeometry.js";
import {makeChart} from "../makeChart.js";
import Pie, {pieDef} from "../Pie/index.js";
import type {VizInstance} from "../vizTypes.js";

export const donutDef: ChartDefinition = {
  name: "Donut",

  // Inherits Pie's full pipeline (features, stages, emit). Donut adds
  // no chart-specific stage of its own — `super._draw` (Pie's) handles
  // the layout.
  features: pieDef.features,
  stages: pieDef.stages,
  emit: pieDef.emit,

  ctx: {},

  fields: [
    {key: "padPixel", default: 2},
    {
      key: "innerRadius",
      factory: (viz: VizInstance) => () => {
        const {width, height} = chartBounds(viz);
        return (min([width, height]) ?? 0) / 4;
      },
    },
  ],
};

export default makeChart(donutDef, Pie);
