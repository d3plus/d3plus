/**
    BoxWhisker — Plot with `discrete: "x"`, `shape: "Box"`, plus a
    tooltip-title accessor that walks through `__d3plus__` wrappers. Boxes
    summarize each category's rows, or come from each row's own statistics
    (see `summary.ts`).
*/

import type {DataPoint} from "@d3plus/data";

import {toBoxExtra} from "../../shapes/boxExtras.js";
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
import {boxTooltipRows, isObservation} from "./tooltip.js";
import {themed} from "../../utils/theme.js";

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
    /**
        Precomputed boxes: accessor or data key for each summary row's
        observation count, which `boxNotch` and `boxWidthByCount` need (a
        computed box counts its own observations).
    */
    {key: "boxCount", coerce: toStatAccessor},
    {key: "boxMax", coerce: toStatAccessor},
    /**
        Marks each box's mean with a diamond (default `true`), listed as
        "Mean" in its tooltip; `false` turns it off. A computed box takes the
        mean of its observations; a precomputed box needs a data key or
        accessor here giving each row's mean (and draws none for `true`).
        Style it with `shapeConfig.Box.meanConfig`.
        @type {boolean | string | Function}
    */
    {key: "boxMean", coerce: toBoxExtra, default: true},
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
        Notches each box around its median (default `false`): the notch spans
        `median ± 1.58·IQR/√n`, roughly a 95% interval for the median, so two
        boxes whose notches don't overlap likely differ. Listed as "Notch" in
        the tooltip. A precomputed box needs `boxCount`, or an accessor
        returning each row's `[lower, upper]`; a notch reaching past a
        quartile stops at the box's edge.
        @type {boolean | Function}
    */
    {key: "boxNotch", coerce: toBoxExtra, default: false},
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
    /**
        Draws every observation of a computed box as a small point over it
        (default `true`), spread across the box's width by `jitter`; outliers
        keep their own marks, moved to their jittered places. Each point's
        tooltip names its observation and value. Precomputed boxes have no
        observations to draw. Style the points with
        `shapeConfig.Box.pointConfig`.
    */
    {key: "boxPoints", default: true},
    {key: "boxQ3", coerce: toStatAccessor},
    /**
        Scales each box's width by the square root of its observation count
        relative to the largest box's (default `false`), so a box's area
        tracks its sample size; the tooltip lists the count as
        "Observations". A precomputed box needs `boxCount`.
    */
    {key: "boxWidthByCount", default: false},
    {key: "discrete", default: "x"},
    /**
        BoxWhisker spreads its `boxPoints` across 0.6 of each box's width by
        default (`true`); a number sets that share, `false` lines them up on
        the box's center.
        @type {boolean | number}
    */
    {key: "jitter", default: true},
    {key: "shape", default: constant("Box"), coerce: "const"},
    {
      // Whiskers, their caps, and the observation points take the theme's
      // text color on a dark or custom theme, since points spread past the
      // box onto the chart's background.
      key: "shapeConfig",
      merge: true,
      factory: (viz: VizInstance) => {
        const ink = () => themed(viz._theme, t => t.text, "black");
        return {
          Box: {
            pointConfig: {fill: ink},
            whiskerConfig: {
              lineConfig: {stroke: ink},
              endpointConfig: {fill: ink},
            },
          },
        };
      },
    },
    // A box summarizes a distribution; there is no single value to share.
    {key: "tooltipShared", default: false},
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        title: (d: DataPoint, i: number) => {
          if (!d) return "";
          // An observation beside its box is named one level deeper.
          const observed = isObservation(viz, d) ? 1 : 0;
          while (d.__d3plus__ && d.data) {
            d = d.data as DataPoint;
            i = d.i as number;
          }
          const labelFn = viz.schema.label as
            ((d: DataPoint, i: number) => string) | undefined;
          if (labelFn) return labelFn(d, i);
          // A summary row is a box itself, not one of its observations.
          const depth =
            viz._drawDepth + (precomputedBoxes(viz) ? 1 : 0) + observed;
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
