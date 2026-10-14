/**
    Marimekko — a stacked BarChart whose bars vary in width (`barWidth`):
    each bar is as wide as its own measure, the bars sit end to end along a
    continuous axis, and segments stack to 100% within each bar, so every
    segment's area is its share of the whole.
*/

import type {DataPoint} from "@d3plus/data";

import {subtitleFeature, titleFeature, totalFeature} from "../features/features.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import BarChart from "../BarChart/index.js";
import {barWidthAccessor, labelBarWidth} from "../Plot/barWidth.js";
import {resolveStackOffset} from "../Plot/stackHelpers.js";
import {pyramidStackOrder} from "../Pyramid/stackOrder.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {marimekkoAxisDefaults} from "./axis.js";

/** Each bar's total along the value axis, labeled "Bar Total" in tooltips. */
function barTotal(viz: VizInstance) {
  return labelBarWidth((d: DataPoint, i?: number) => {
    const value = viz.schema.discrete === "y" ? viz._x : viz._y;
    return value ? value(d, i ?? 0) : undefined;
  }, "Bar Total");
}

export const marimekkoDef: ChartDefinition = {
  name: "Marimekko",
  paintDriven: true,
  features: [titleFeature, subtitleFeature, totalFeature],
  defaults: {groupPadding: 1},
  // Each panel's categories sit at its own bar centers, so every panel labels its axes.
  facet: {axes: "all"},

  setup: viz => {
    viz._stackOffset = resolveStackOffset("expand");
    // Each series keeps one level in every bar, the largest overall at the bottom.
    viz._stackOrder = pyramidStackOrder((d, i) =>
      viz._ids(d, i).slice(0, viz._drawDepth + 1).join("_"),
    ) as unknown as VizInstance["_stackOrder"];
    const preDraw = viz._preDraw.bind(viz);
    viz._preDraw = () => {
      viz._plotAxisDefaults = marimekkoAxisDefaults(viz);
      preDraw();
    };
  },

  ctx: {},

  fields: [
    /**
        Marimekko defaults to each bar's total: its rows' summed `y`, or `x`
        when the bars run along `y`, shown as "Bar Total" in tooltips.
    */
    {key: "barWidth", coerce: barWidthAccessor, factory: barTotal},
    /**
        Marimekko labels each category with its bar's share of the total
        width by default ("Retail" over "50%"); `false` shows the name alone.
        Labels the axis rotates to fit show the name alone too, while the
        tooltip always shows the share. In small multiples (`facet`), each
        panel's shares are of that panel's own total and add to 100%, even
        when shared scales (the default) draw a smaller panel narrower.
    */
    {key: "barWidthShare", default: true},
    {key: "stacked", default: true},
    // Each segment's tooltip shows its own width, value, and share.
    {key: "tooltipShared", default: false},
  ],
};

/**
    Creates a Marimekko (mosaic) chart from an array of data: one bar per
    discrete value (`x`), as wide as its `barWidth` (by default its total),
    with the bar's `groupBy` segments stacked to 100% of its height. Each
    category's label shows its bar's share of the total width, and tooltips
    show each segment's value, its share of the bar, and the bar's width and
    share of the total width. Set `stackOffset("none")` to stack absolute
    values instead.
*/
export default makeChart(marimekkoDef, BarChart);
