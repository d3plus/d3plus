/**
    StripPlot — Plot with `discrete: "x"` and `jitter: true`: one strip of
    points per category, spread across its band so they don't overlap.
*/

import constant from "../../utils/constant.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import Plot from "../Plot/index.js";

export const stripPlotDef: ChartDefinition = {
  name: "StripPlot",
  paintDriven: true,

  ctx: {},

  fields: [
    {key: "discrete", default: "x"},
    /**
        StripPlot jitters by default (`true`, spreading each strip across 0.6
        of its band).
        @type {boolean | number}
    */
    {key: "jitter", default: true},
    // Jittered points are too small to carry labels.
    {
      key: "shapeConfig",
      merge: true,
      default: {Circle: {label: false}},
    },
    {key: "shape", default: constant("Circle"), coerce: "const"},
    // A strip holds many points; each tooltip names one.
    {key: "tooltipShared", default: false},
  ],
};

/**
    Creates a strip plot from an array of data: one strip of points per
    category on the `x` axis (or `y`, with `discrete: "y"`), each point at its
    value and spread across its category's band by `jitter`, a stable offset
    seeded from its id. Set `shape` to `"Tick"` for a barcode plot, a short
    line across the band at each value. See Beeswarm to pack the points
    instead, and BoxWhisker to summarize each strip.
*/
export default makeChart(stripPlotDef, Plot);
