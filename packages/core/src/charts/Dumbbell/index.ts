/**
    Dumbbell — a range dot plot: each category draws a dot per series along the
    value axis, joined by a connector from its smallest to its largest value.
*/

// @ts-ignore
import pkg from "open-color/open-color.js";
const {theme: openColor} = pkg;

import {colorContrast} from "@d3plus/color";
import {backgroundColor} from "@d3plus/dom";

import {subtitleFeature, titleFeature, totalFeature} from "../features/features.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import Plot from "../Plot/index.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {dumbbellEmit} from "./emit.js";
import {syncGapSort, type GapSortState} from "./gapSort.js";

/** The default connector color: a quiet gray that reads on light and dark pages. */
export function connectorStroke(viz: VizInstance): string {
  const node = viz._select && typeof viz._select.node === "function" ? viz._select.node() : null;
  const bg = node ? backgroundColor(node) : "rgb(255, 255, 255)";
  return colorContrast(bg, viz.schema.colorDefaults) === viz.schema.colorDefaults.dark
    ? openColor.colors.gray[500]
    : openColor.colors.gray[700];
}

export const dumbbellDef: ChartDefinition = {
  name: "Dumbbell",
  paintDriven: true,
  features: [titleFeature, subtitleFeature, totalFeature],

  setup: viz => {
    const state: GapSortState = {};
    viz.ctx.dumbbell = state;
    viz._plotShapeEmitters = {Circle: dumbbellEmit};
    const preDraw = viz._preDraw.bind(viz);
    viz._preDraw = () => {
      syncGapSort(viz, state);
      preDraw();
    };
  },

  ctx: {},

  fields: [
    {key: "discrete", default: "y"},
    /**
        Orders the categories by their gap, the distance between each
        category's smallest and largest value: `"descending"` puts the widest
        gap first (at the top of horizontal dumbbells, at the left of vertical
        ones), `"ascending"` the narrowest. `false` (default) keeps the
        category axis's own order. A `ySort` (or `xSort`) comparator on the
        category axis takes precedence.
    */
    {key: "gapSort", default: false},
    {
      key: "shapeConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        Circle: {label: false, trail: false},
        Line: {label: false, stroke: () => connectorStroke(viz), strokeWidth: 3},
      }),
    },
  ],
};

/**
    Creates a dumbbell (range dot) chart from an array of data with one row per
    category and series, such as a country's value in 2010 and in 2020. Each
    category, read from the axis named by `discrete` (`"y"` by default, for
    horizontal dumbbells), draws a circle per row at its value, colored by
    `groupBy`, with a connector between the category's smallest and largest
    values. Circles are styled by `shapeConfig.Circle` and connectors by
    `shapeConfig.Line`; `gapSort` orders the categories by the size of their
    gap.
*/
export default makeChart(dumbbellDef, Plot);
