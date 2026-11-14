/**
    RadialArea — RadialLine with each series filled: down to the center (or
    `innerRadius`), or, with `stacked`, on top of the series before it.

    Extends RadialLine; inherits its layout stage and emit. Only the mark
    (`viz.ctx.radialMark`), the `stacked` option, and the fill styles differ.
*/

import constant from "../../utils/constant.js";
import type {DataDrivenChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import RadialLine, {radialLineDef} from "../RadialLine/index.js";
import type {VizInstance} from "../viz/vizTypes.js";

export const radialAreaDef: DataDrivenChartDefinition = {
  name: "RadialArea",

  // RadialLine's `_draw` lays it out; areas come from the same emit.
  emit: radialLineDef.emit,

  ctx: {radialMark: "area"},

  fields: [
    {key: "shape", default: constant("Area"), coerce: "const"},
    /**
        Stacks each series on top of the ones before it, in the order they
        appear in the data, at every `x` any series has (a missing value
        counts as 0). Each series is then a band whose thickness is its
        value, and the outer edge shows the total.
    */
    {key: "stacked", default: false},
    // See-through fills outlined in their series' color, so overlapping
    // areas all stay readable; stacked bands are solid.
    {
      key: "shapeConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        Area: {
          fillOpacity: () => (viz.schema.stacked ? 0.85 : 0.25),
          strokeWidth: () => (viz.schema.stacked ? 1 : 2),
        },
      }),
    },
  ],
};

/**
    Creates a radial area chart from an array of data: each `groupBy` group
    is an area around a circle, for cyclical data such as hours or months.
    `x` sets each point's angle and `y` its distance from the center; with
    `stacked`, each group is a band on top of the ones before it.
*/
export default makeChart(radialAreaDef, RadialLine);
