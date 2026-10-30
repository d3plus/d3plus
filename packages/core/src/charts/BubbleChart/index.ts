/**
    BubbleChart — a Scatter whose points are sized by `size`, by area.
*/

import constant from "../../utils/constant.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import Scatter from "../Scatter/index.js";
import {chartBackground} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {bubbleEmit} from "./emit.js";

export const bubbleChartDef: ChartDefinition = {
  name: "BubbleChart",
  paintDriven: true,

  setup: viz => {
    viz._plotShapeEmitters = {...viz._plotShapeEmitters, Circle: bubbleEmit};
  },

  ctx: {},

  fields: [
    /** The largest bubble's radius, in pixels. */
    {key: "sizeMax", default: 40},
    /** Radii follow the square root of `size`, so areas follow the value. */
    {key: "sizeScale", default: "sqrt"},
    /** The size scale starts at zero, so each bubble's area is proportional to its value. */
    {key: "sizeZero", default: true},
    /**
        Each bubble is outlined in the chart's background color, so
        overlapping bubbles stay distinct.
    */
    {
      key: "shapeConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        Circle: {stroke: () => chartBackground(viz), strokeWidth: constant(1)},
      }),
    },
  ],
};

/**
    Creates a bubble chart from an array of data: each row draws as a circle
    at its `x` and `y` values, sized by its `size` value. Bubbles are sized by
    area (`sizeZero` with a `"sqrt"` `sizeScale`): a value twice as large
    draws a bubble with twice the area, and the largest draws at `sizeMax`
    pixels in radius. A size legend keys the sizes, larger bubbles are drawn
    first so smaller ones stay on top, and each bubble is outlined in the
    chart's background color so overlapping bubbles stay distinct.
*/
export default makeChart(bubbleChartDef, Scatter);
