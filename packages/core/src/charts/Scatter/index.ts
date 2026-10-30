/**
    Scatter — Plot drawing every row as a point (`shape: "Circle"`).
*/

import constant from "../../utils/constant.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import Plot from "../Plot/index.js";

export const scatterDef: ChartDefinition = {
  name: "Scatter",
  paintDriven: true,

  ctx: {},

  fields: [
    /** Every row is a point. */
    {key: "shape", default: constant("Circle"), coerce: "const"},
  ],
};

/**
    Creates a scatter plot from an array of data: each row draws as a point at
    its `x` and `y` values, on continuous axes (set `discrete` to place points
    along a category axis). Points are `sizeMin` pixels in radius; a `size`
    accessor scales them between `sizeMin` and `sizeMax` and adds a size
    legend (see BubbleChart for bubbles sized by area). Hover any point for
    its values.
*/
export default makeChart(scatterDef, Plot);
