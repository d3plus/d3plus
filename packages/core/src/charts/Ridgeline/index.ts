/**
    Ridgeline — a Plot of density curves stacked down a category axis: each
    group's observations become a kernel density estimate rising from its
    category's baseline, overlapping the ridge above.
*/

import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import {densityAccessorFields, densityConfigFields, installDensity} from "../helpers/densityChart.js";
import Plot from "../Plot/index.js";
import {ridgelineEmit, ridgelinePadding, ridgeOverlap} from "./emit.js";

export const ridgelineDef: ChartDefinition = {
  name: "Ridgeline",
  paintDriven: true,

  setup: viz =>
    installDensity(viz, {
      valueAxis: () => "x",
      categoryPadding: v => ridgelinePadding(ridgeOverlap(v)),
      reverse: true,
      emit: ridgelineEmit,
    }),

  ctx: {},

  fields: [
    {key: "discrete", default: "y"},
    /**
        How far the tallest ridge rises, in category steps: 1 reaches the
        next baseline up, larger values overlap the ridges above.
    */
    {key: "overlap", default: 1.5},
    ...densityAccessorFields(),
    ...densityConfigFields(3),
    {
      key: "shapeConfig",
      merge: true,
      // Plot hides category ticks that repeat its Bar labels; there are no bars here.
      default: {Area: {fillOpacity: 0.85, strokeWidth: 1}, Bar: {label: false}},
    },
  ],
};

/**
    Creates a ridgeline (joyplot) from an array of raw observations: the
    `value` of each row is summarized per group as a kernel density estimate,
    and each group's curve rises from its own baseline down the y axis,
    sharing the x axis. `overlap` sets how far ridges rise into the ones
    above; `medianSort` orders them by median.
*/
export default makeChart(ridgelineDef, Plot);
