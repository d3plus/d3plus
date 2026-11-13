/**
    Pareto — a BarChart whose bars are sorted largest first, with a line of
    the running (cumulative) share of the total on a secondary 0–100% axis
    and a dashed reference line at 80%.
*/

import type {DataPoint} from "@d3plus/data";

import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import BarChart from "../BarChart/index.js";
import {backgroundInk} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {
  thresholdLines,
  titleShareAxis,
  tooltipRows,
  tooltipTitle,
} from "./labels.js";
import {paretoColor, sharesOneColor} from "./color.js";
import {keepLineBright} from "./hover.js";
import {paretoThreshold, syncPooledOrder, syncSort} from "./order.js";
import {
  barRows,
  interceptAxes,
  isLineRow,
  percentFormat,
  withLineRows,
  wrapDrawLabel,
  wrapGroupBy,
  type ParetoState,
} from "./state.js";

export const paretoDef: ChartDefinition = {
  name: "Pareto",
  paintDriven: true,
  defaults: {lineMarkers: true},
  facet: {scales: "independent"},
  thresholdFunction: (viz, data, all) =>
    paretoThreshold(viz, data as DataPoint[], all as DataPoint[] | undefined),

  setup: viz => {
    const state: ParetoState = {
      accessors: {} as ParetoState["accessors"],
      steps: new WeakMap(),
      oneColor: new WeakMap(),
    };
    viz.ctx.pareto = state;
    interceptAxes(viz);
    // Bars share one color while each category draws a single bar.
    viz.schema.color = state.color = paretoColor(viz);
    keepLineBright(viz);
    // A point on the line has no bar value, so the tooltip lists its own rows.
    viz._tooltipAxisRows = false;
    const percent = percentFormat(viz);
    // The top axis would otherwise draw gridlines over the bars' own.
    viz._x2Config = {...viz._x2Config, gridSize: 0, tickFormat: percent};
    viz._y2Config = {...viz._y2Config, tickFormat: percent};
    viz._lineMarkerConfig = {
      ...viz._lineMarkerConfig,
      fill: () => backgroundInk(viz),
    };
    viz._plotReferenceLines = () => thresholdLines(viz);
    const preDraw = viz._preDraw.bind(viz);
    viz._preDraw = () => {
      wrapGroupBy(viz);
      syncPooledOrder(viz, state, undefined);
      syncSort(viz, state);
      preDraw();
      wrapDrawLabel(viz);
      titleShareAxis(viz);
    };
    const draw = viz._draw.bind(viz);
    viz._draw = (callback?: () => void) => {
      // Each panel of small multiples draws its own line.
      if (viz._facetStep === "chrome")
        syncPooledOrder(viz, state, viz._filteredData);
      else viz._filteredData = withLineRows(viz, viz._filteredData);
      return draw(callback);
    };
  },

  ctx: {},

  fields: [
    {
      key: "legend",
      coerce: "const",
      factory: (viz: VizInstance) => {
        const base = viz.schema.legend as (
          config: VizInstance,
          arr: DataPoint[],
        ) => unknown;
        // BarChart's rule (no legend that only repeats the bars) reads the
        // bars alone, and bars sharing one color have no legend to show.
        return (config: VizInstance, arr: DataPoint[]) => {
          if (sharesOneColor(viz)) return false;
          const rows = viz._filteredData;
          viz._filteredData = barRows(rows);
          try {
            return base.call(viz, config, arr);
          } finally {
            viz._filteredData = rows;
          }
        };
      },
    },
    /**
        Draws a reference line across the cumulative-share axis at this share
        of the total (0–1), labeled with it: `0.8` (default) marks the 80% that
        the Pareto principle expects the largest few categories to reach.
        `false` hides it.
        @type {number | false}
    */
    {key: "paretoThreshold", default: 0.8},
    /**
        Styles the `paretoThreshold` line like a `referenceLines` entry:
        `label` (defaults to the share, such as "80%"; `false` hides it),
        `labelPosition` (defaults to the end of the line over the smallest
        bars: `"end"` for upright bars, `"start"` for horizontal ones), font
        keys, `stroke`, `strokeOpacity`, `strokeWidth`, `dash` (`true` by
        default), and `layer`.
        @type {ReferenceLineConfig}
    */
    {key: "paretoThresholdConfig", merge: true, default: {}},
    {
      key: "shape",
      default: (d: DataPoint) => (isLineRow(d) ? "Line" : "Bar"),
      coerce: "const",
    },
    /**
        The cumulative line is styled by `shapeConfig.Line` (straight
        segments in the chart's text color, 2px wide, by default) and its
        points by `lineMarkerConfig`.
    */
    {
      key: "shapeConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        Line: {
          curve: "linear",
          label: false,
          stroke: () => backgroundInk(viz),
          strokeWidth: 2,
        },
      }),
    },
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        title: (d: DataPoint, i: number) => tooltipTitle(viz, d, i),
        tbody: (d: DataPoint, i: number) => tooltipRows(viz, d, i),
      }),
    },
    /** The cumulative-share axis on top, for horizontal bars, runs from 0 to 100%. */
    {key: "x2Domain", default: [0, 1]},
    /** The cumulative-share axis on the right runs from 0 to 100%. */
    {key: "y2Domain", default: [0, 1]},
  ],
};

/**
    Creates a Pareto chart: one bar per category (`x`, or `y` with
    `discrete("y")` for horizontal bars), sorted from the largest total to
    the smallest, and a line of the running share of the total through each
    category, on a 0–100% axis to the right of the bars (above horizontal
    ones). A dashed reference line marks 80% (see `paretoThreshold`).
    Every bar takes the first color of the chart's palette, unless `groupBy`
    splits a category into series (colored by series) or `color` is set;
    hovering a bar keeps the line, and its point over that bar, bright.
    `threshold` folds the smallest categories into one bar, drawn last.
    Tooltips show each bar's value, its share of the total, and the
    cumulative share through its category.
*/
export default makeChart(paretoDef, BarChart);
