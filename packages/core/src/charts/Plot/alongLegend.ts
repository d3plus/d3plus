/**
    The legend a chart's along-line labels can stand in for: when every
    series' line is named along it (`lineLabels: "along"`), the color legend
    repeats what the labels already say, so the default legend hides. Which
    lines got a label is only known once the plot is placed, so a draw that
    could label every line first lays out without the legend, then lays out
    again with it when any line went unlabeled.
*/
import type {VizInstance} from "../viz/vizTypes.js";

/** How many lines a draw had, asked to be labeled along, and labeled. */
export interface AlongStats {
  lines: number;
  requested: number;
  placed: number;
}

/** Fresh counts for a draw. */
export const emptyAlongStats = (): AlongStats => ({
  lines: 0,
  requested: 0,
  placed: 0,
});

/**
    Whether this chart's legend may stand aside for its along-line labels:
    it is the default legend (a user's `legend` always wins), and
    `lineLabels` can ask for along labels, or the chart says its own along
    labels can name every series (`_alongLabelsPossible`, such as a
    RadialBar's curved track labels).
    @param viz The chart.
*/
export function alongLegendAuto(viz: VizInstance): boolean {
  const setting = viz.schema.lineLabels;
  return (
    viz.schema.legend === viz._defaultLegend &&
    (setting === "along" ||
      typeof setting === "function" ||
      Boolean(viz._alongLabelsPossible?.(viz)))
  );
}

/**
    Whether a draw labeled every line along it: more than one line (a lone
    line has no label to stand in for the legend), each of which asked for
    an along label and got one.
    @param stats The draw's counts.
*/
export function allAlongLabeled(stats: AlongStats | undefined): boolean {
  return (
    !!stats &&
    stats.lines > 1 &&
    stats.requested === stats.lines &&
    stats.placed === stats.requested
  );
}

/**
    Runs a chart's draw, hiding its default legend when along labels name
    every line: the first draw lays out without the legend, and when any
    line goes unlabeled, the chart draws again, from the same margins, with
    the legend.
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
