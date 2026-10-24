/**
    BoxWhisker — Plot with `discrete: "x"`, `shape: "Box"`, plus a
    tooltip-title accessor that walks through `__d3plus__` wrappers. Boxes
    summarize each category's rows, or come from each row's own statistics
    (see `summary.ts`).
*/

import type {DataPoint} from "@d3plus/data";

import {toStatAccessor} from "../../shapes/boxSummary.js";
import constant from "../../utils/constant.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import Plot from "../Plot/index.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {
  boxAxisValues,
  boxWhiskerBuffer,
  boxWhiskerEmit,
  precomputedBoxes,
} from "./summary.js";
import {boxAxisRows} from "./outliers.js";
import {boxTooltipRows} from "./tooltip.js";

export const boxWhiskerDef: ChartDefinition = {
  name: "BoxWhisker",
  paintDriven: true,

  setup: viz => {
    viz._buffer = {...viz._buffer, Box: boxWhiskerBuffer};
    viz._plotShapeEmitters = {Box: boxWhiskerEmit};
    viz._plotAxisValues = (rows, axis) => boxAxisValues(viz, rows, axis);
    viz._plotAxisRows = (rows, axis) => boxAxisRows(viz, rows, axis);
  },

  ctx: {},

  fields: [
    /**
        Accessor or data key for each summary row's upper whisker end. See
        `boxMedian`.
    */
    {key: "boxMax", coerce: toStatAccessor},
    /**
        Accessor or data key for each summary row's median. Setting it,
        `boxMin`, `boxQ1`, `boxQ3`, or `boxMax` draws boxes from statistics
        you already have: each row is one box (placed by its `x`, or `y` when
        `discrete` is `"y"`) drawn from those values, with nothing computed
        and `whiskerMode` unused. All five are needed (a warning names any
        left unset), and a row whose values aren't all numbers draws no box.
        The value axis spans every row's statistics and outliers, and the
        tooltip lists them.
    */
    {key: "boxMedian", coerce: toStatAccessor},
    /**
        Accessor or data key for each summary row's lower whisker end. See
        `boxMedian`.
    */
    {key: "boxMin", coerce: toStatAccessor},
    /**
        Accessor or data key for each summary row's outliers, an array of
        values drawn as points past the whiskers. Used only with the other
        box statistics; see `boxMedian`.
    */
    {key: "boxOutliers", coerce: toStatAccessor},
    /**
        Accessor or data key for each summary row's lower quartile, where its
        box starts. See `boxMedian`.
    */
    {key: "boxQ1", coerce: toStatAccessor},
    /**
        Accessor or data key for each summary row's upper quartile, where its
        box ends. See `boxMedian`.
    */
    {key: "boxQ3", coerce: toStatAccessor},
    {key: "discrete", default: "x"},
    {key: "shape", default: constant("Box"), coerce: "const"},
    // A box summarizes a distribution; there is no single value to share.
    {key: "tooltipShared", default: false},
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        title: (d: DataPoint, i: number) => {
          if (!d) return "";
          while (d.__d3plus__ && d.data) {
            d = d.data as DataPoint;
            i = d.i as number;
          }
          const labelFn = viz.schema.label as
            ((d: DataPoint, i: number) => string) | undefined;
          if (labelFn) return labelFn(d, i);
          // A summary row is a box itself, not one of its observations.
          const depth = viz._drawDepth + (precomputedBoxes(viz) ? 1 : 0);
          const l = viz._ids(d, i).slice(0, depth);
          return l[l.length - 1];
        },
        tbody: (d: DataPoint, i: number) => boxTooltipRows(viz, d, i),
      }),
    },
  ],
};

/**
    Creates a simple box and whisker based on an array of data.
*/
export default makeChart(boxWhiskerDef, Plot);
