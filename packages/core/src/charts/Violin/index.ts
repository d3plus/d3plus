/**
    Violin — a Plot of density curves: each group's observations become a
    mirrored kernel density estimate around its category, with an optional
    box plot, quartile lines, or swarm of the observations inside.
*/

import {subtitleFeature, titleFeature, totalFeature} from "../features/features.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import {densityAccessorFields, densityConfigFields, installDensity} from "../helpers/densityChart.js";
import Plot from "../Plot/index.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {VIOLIN_PADDING, violinEmit} from "./emit.js";

export const violinDef: ChartDefinition = {
  name: "Violin",
  paintDriven: true,
  features: [titleFeature, subtitleFeature, totalFeature],
  defaults: {groupPadding: 16},

  setup: viz =>
    installDensity(viz, {
      valueAxis: (v: VizInstance) => (v.schema.discrete === "y" ? "x" : "y"),
      categoryPadding: () => [VIOLIN_PADDING, 0.5],
      emit: violinEmit,
    }),

  ctx: {},

  fields: [
    /** The category axis: `"x"` (default) draws vertical violins, `"y"` horizontal ones. */
    {key: "discrete", default: "x"},
    /**
        What to draw inside each violin: `"box"` (default; a narrow box plot),
        `"quartiles"` (a solid line at the median and dashed lines at the
        quartiles), `"points"` (the observations packed into a swarm), an
        array of several, or `false` for nothing.
    */
    {key: "inner", default: "box"},
    /**
        With two groupBy levels, the first places each violin and the second
        sets them side by side. `split` draws a category holding exactly two
        violins as the two halves of one shape instead.
    */
    {key: "split", default: false},
    ...densityAccessorFields(),
    ...densityConfigFields(2),
    /**
        Styles for the `inner` overlays: `box` (Box config), `quartiles` (Line
        config), and `points` (Circle config).
    */
    {key: "innerConfig", merge: true, default: {box: {}, quartiles: {}, points: {}}},
    {
      key: "shapeConfig",
      merge: true,
      // Plot hides category ticks that repeat its Bar labels; there are no bars here.
      default: {Area: {fillOpacity: 0.85, strokeWidth: 1}, Bar: {label: false}},
    },
  ],
};

/**
    Creates a violin plot from an array of raw observations: the `value` of
    each row is summarized per group as a kernel density estimate, drawn as a
    mirrored curve around the group's category. Set `discrete("y")` for
    horizontal violins, `inner` for the overlay inside each violin, and
    `densityScale` for how widths compare across violins.
*/
export default makeChart(violinDef, Plot);
