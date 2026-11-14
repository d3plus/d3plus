/**
    BubbleMatrix — a Matrix whose cells draw as circles, sized by `size`.
*/

import constant from "../../utils/constant.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import Matrix from "../Matrix/index.js";
import {matrixEmit} from "../Matrix/emit.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {applySymmetricColorDomain} from "./symmetricColor.js";

export const bubbleMatrixDef: ChartDefinition = {
  name: "BubbleMatrix",

  emit: matrixEmit,

  // Each draw centers the colorScale's domain on zero (see `symmetricColor.ts`).
  setup: (viz: VizInstance) => {
    const preDraw = viz._preDraw.bind(viz);
    viz._preDraw = () => {
      preDraw();
      applySymmetricColorDomain(viz);
    };
  },

  ctx: {},

  fields: [
    {key: "shape", default: constant("Circle"), coerce: "const"},
    /**
        The colorScale is linear and, over a domain symmetric around zero,
        diverges from its midpoint, so values of equal magnitude take equal
        color strength on either side. A `domain` or `scale` set here
        replaces that default.
    */
    {key: "colorScaleConfig", merge: true, default: {scale: "linear"}},
  ],
};

/**
    Creates a bubble matrix from an array of data: a Matrix whose cells draw
    as circles, each centered in its `row` × `column` cell and sized by the
    absolute value of its `size` value, so the largest circle fills its
    cell (by area with the default `"sqrt"` `sizeScale`). Color the circles
    with `colorScale`: a linear scale diverging around zero over a domain
    symmetric about it, so values of equal magnitude take equal color
    strength on either side, which suits a correlation matrix. A size legend
    keys the sizes, and hovering a circle highlights its row and column.
*/
export default makeChart(bubbleMatrixDef, Matrix);
