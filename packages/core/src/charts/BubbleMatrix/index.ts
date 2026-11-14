/**
    BubbleMatrix — a Matrix whose cells draw as circles, sized by `size`.
*/

import constant from "../../utils/constant.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import Matrix from "../Matrix/index.js";
import {matrixEmit} from "../Matrix/emit.js";

export const bubbleMatrixDef: ChartDefinition = {
  name: "BubbleMatrix",

  emit: matrixEmit,

  ctx: {},

  fields: [{key: "shape", default: constant("Circle"), coerce: "const"}],
};

/**
    Creates a bubble matrix from an array of data: a Matrix whose cells draw
    as circles, each centered in its `row` × `column` cell and sized by the
    absolute value of its `size` value, so the largest circle fills its
    cell (by area with the default `"sqrt"` `sizeScale`). Color the circles
    with `colorScale`: values on both sides of zero diverge from its
    `midpoint`, which suits a correlation matrix. A size legend keys the
    sizes, and hovering a circle highlights its row and column.
*/
export default makeChart(bubbleMatrixDef, Matrix);
