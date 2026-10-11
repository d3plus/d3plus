/**
    Beeswarm — Plot with `swarm: true`: circles keep their value along one
    axis and are packed side by side along the other.
*/

import {
  subtitleFeature,
  titleFeature,
  totalFeature,
} from "../features/features.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import Plot from "../Plot/index.js";

export const beeswarmDef: ChartDefinition = {
  name: "Beeswarm",
  paintDriven: true,
  features: [titleFeature, subtitleFeature, totalFeature],

  ctx: {},

  fields: [
    // Swarm circles are too small to carry labels, and repacking moves them
    // short distances that would leave motion trails.
    {
      key: "shapeConfig",
      merge: true,
      default: {Circle: {label: false, trail: false}},
    },
    /**
        Beeswarm swarms by default (`true`): along x when its values are
        numeric, else along y.
        @type {boolean | "x" | "y"}
    */
    {key: "swarm", default: true},
  ],
};

/**
    Creates a beeswarm from an array of data: each circle sits at its value
    along the axis set by `x` (or `y`), packed beside its neighbors so none
    overlap. Set the other axis to a categorical key to draw one swarm per
    category. Any Plot can switch between a scatter and a beeswarm with
    `swarm`; see `swarmConfig` for spacing and overflow.
*/
export default makeChart(beeswarmDef, Plot);
