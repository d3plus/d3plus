/**
    Donut — Pie with a centered inner radius.

    Extends Pie; inherits its layout stage + emit. Only the inner-radius
    closure and the default arc gap (`padPixel`) differ.
*/

import {min} from "d3-array";

import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {chartBounds} from "../features/chartGeometry.js";
import {makeChart} from "../definition/makeChart.js";
import Pie, {pieDef} from "../Pie/index.js";
import type {VizInstance} from "../viz/vizTypes.js";

export const donutDef: ChartDefinition = {
  name: "Donut",

  // Inherits Pie's full pipeline (features + emit). Donut adds no
  // chart-specific layout stage of its own — `super._draw` (Pie's)
  // handles the layout.
  features: pieDef.features,
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
