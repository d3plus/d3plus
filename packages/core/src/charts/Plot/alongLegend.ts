/**
    The legend a chart's along labels can stand in for: when every series is
    named along its own line (`lineLabels: "along"`) or stacked band
    (`labelPosition: "along"`, the stacked-area default), the color legend
    repeats what the labels already say, so the default legend hides. Which
    series got a label is only known once the plot is placed, so a draw that
    could label every series first lays out without the legend, then lays
    out again with it when any series went unlabeled.
*/
import type {DataPoint} from "@d3plus/data";

import type {VizInstance} from "../viz/vizTypes.js";
import {labelsAlongBand} from "./areaLabelsAlong.js";

/** How many series (lines or stacked bands) a draw had, asked to be labeled along, and labeled. */
export interface AlongStats {
  series: number;
  requested: number;
  placed: number;
}

/** Fresh counts for a draw. */
export const emptyAlongStats = (): AlongStats => ({
  series: 0,
  requested: 0,
  placed: 0,
});

/**
    Whether a chart draws stacked areas whose labels can run along their
    bands: it stacks, draws its first row as an Area, and `labelPosition`
    can ask for along labels.
    @param viz The chart.
*/
export function bandLabelsPossible(viz: VizInstance): boolean {
  if (!viz.schema.stacked) return false;
  const shape = viz.schema.shape as unknown;
  const first = (viz._filteredData?.[0] ?? {}) as DataPoint;
  const drawn = typeof shape === "function" ? shape(first, 0) : shape;
  if (drawn !== "Area") return false;
  const position = viz.schema.labelPosition as unknown;
  return typeof position === "function" || labelsAlongBand(position);
}

/**
    Whether this chart's legend may stand aside for its along labels: it is
    the default legend (a user's `legend` always wins), no series is hidden
    or soloed from it (the legend is the way back to them), and `lineLabels`
    or stacked areas can ask for along labels.
    @param viz The chart.
*/
export function alongLegendAuto(viz: VizInstance): boolean {
  if (viz.schema.legend !== viz._defaultLegend) return false;
  if (viz._hidden?.length || viz._solo?.length) return false;
  const setting = viz.schema.lineLabels;
  return (
    setting === "along" ||
    typeof setting === "function" ||
    bandLabelsPossible(viz)
  );
}

/**
    Whether a draw labeled every series along it: more than one series (a
    lone one has no label to stand in for the legend), each of which asked
    for an along label and got one.
    @param stats The draw's counts.
*/
export function allAlongLabeled(stats: AlongStats | undefined): boolean {
  return (
    !!stats &&
    stats.series > 1 &&
    stats.requested === stats.series &&
    stats.placed === stats.requested
  );
}

/**
    Runs a chart's draw, hiding its default legend when along labels name
    every series: the first draw lays out without the legend, and when any
    series goes unlabeled, the chart draws again, from the same margins,
    with the legend.
    @param viz The chart.
    @param draw Draws the chart once.
*/
export function drawWithAlongLegend(viz: VizInstance, draw: () => void): void {
  const auto = alongLegendAuto(viz);
  viz._alongLegendHide = auto;
  viz._alongStats = emptyAlongStats();
  if (!auto) return draw();
  const margin = {...viz._margin};
  const padding = {...viz._padding};
  draw();
  if (allAlongLabeled(viz._alongStats)) return;
  viz._alongLegendHide = false;
  viz._alongStats = emptyAlongStats();
  viz._margin = margin;
  viz._padding = padding;
  draw();
}
