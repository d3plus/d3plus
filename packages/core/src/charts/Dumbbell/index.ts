/**
    Dumbbell — a range dot plot: each category draws a dot per series along the
    value axis, joined by a connector from its smallest to its largest value,
    or by an arrow from its first value to its last (`arrows`), or by a
    floating bar in place of the dots (`connector: "bar"`).
*/

import {colorContrast, colorGray} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";

import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import {columnHighlight} from "../Plot/columnHighlight.js";
import Plot from "../Plot/index.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {dumbbellEmit} from "./emit.js";
import {syncGapSort, type GapSortState} from "./gapSort.js";
import {chartBackground} from "../viz/backgroundInk.js";
import {barColor, changeRow, lineColor} from "./categoryChange.js";
import {dumbbellConnector} from "./changes.js";

/** The default connector color: a quiet gray that reads on light and dark pages. */
export function connectorStroke(viz: VizInstance): string {
  return colorContrast(chartBackground(viz), viz.schema.colorDefaults) ===
    viz.schema.colorDefaults.dark
    ? colorGray[500]
    : colorGray[700];
}

export const dumbbellDef: ChartDefinition = {
  name: "Dumbbell",
  paintDriven: true,

  setup: viz => {
    const state: GapSortState = {};
    viz.ctx.dumbbell = state;
    viz._plotShapeEmitters = {Circle: dumbbellEmit};
    viz._plotColumnHighlight = columnHighlight(viz);
    viz._sharedTooltipRows = value => {
      const row = changeRow(viz, null, value);
      return row ? [row] : [];
    };
    const preDraw = viz._preDraw.bind(viz);
    viz._preDraw = () => {
      syncGapSort(viz, state);
      preDraw();
    };
  },

  ctx: {},

  fields: [
    /**
        Draws each category's connector as an arrow from its first value to
        its last, in data order (such as 2010 to 2020): the line ends at the
        arrowhead's base, and the head's tip stops just short of the last
        value's point. Arrows (and a bar connector's fill) take
        `increaseColor` or `decreaseColor` by the direction of the change,
        and tooltips add the category's change. `false` by default.
        @type {boolean}
    */
    {key: "arrows", default: false},
    /**
        The arrowheads' tip-to-base length in pixels, or an accessor
        returning one per category. Defaults to three times the connector's
        stroke width, between 6 and 12 pixels.
        @type {number | function}
    */
    {key: "arrowSize"},
    /**
        How each category's values are joined: `"line"` (default) draws a
        connector behind the dots; `"bar"` draws a floating bar between the
        category's smallest and largest values in place of the dots (a span
        chart), styled by `shapeConfig.Rect` and filled with the color
        defaults' `sequential` color. With `arrows`, the bar runs from the
        first value to an arrowhead at the last (a change bar). Tooltips add
        the category's range (or change).
        @type {"line" | "bar"}
    */
    {key: "connector", default: "line"},
    /**
        The thickness of a bar connector, in pixels. Defaults to 60% of the
        step between neighboring categories, at most 40 pixels.
        @type {number}
    */
    {key: "connectorWidth"},
    /**
        With `arrows`, the color of a connector whose value falls from its
        first row to its last. Defaults to `colorDefaults.off`.
        @type {string}
    */
    {key: "decreaseColor"},
    /**
        With `arrows`, the color of a connector whose value rises from its
        first row to its last. Defaults to `colorDefaults.on`.
        @type {string}
    */
    {key: "increaseColor"},
    /**
        The category axis: `"y"` (default) draws horizontal dumbbells, `"x"`
        vertical ones.
        @type {"x" | "y"}
    */
    {key: "discrete", default: "y"},
    /**
        Orders the categories by their gap, the distance between each
        category's smallest and largest value: `"descending"` puts the widest
        gap first (at the top of horizontal dumbbells, at the left of vertical
        ones), `"ascending"` the narrowest. `false` (default) keeps the
        category axis's own order. A `ySort` (or `xSort`) comparator on the
        category axis takes precedence.
        @type {false | "ascending" | "descending"}
    */
    {key: "gapSort", default: false},
    /**
        Points are styled by `shapeConfig.Circle` (`r`, `fill`, …), line
        connectors by `shapeConfig.Line` (`stroke`, `strokeWidth`,
        `strokeLinecap`, …; a 3px gray line by default, colored by direction
        with `arrows`), and bar connectors by `shapeConfig.Rect` (`fill`,
        `stroke`, `strokeWidth`, `opacity`).
    */
    {
      key: "shapeConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        Circle: {label: false, trail: false},
        Line: {
          label: false,
          stroke: (d: DataPoint) => lineColor(viz, d, connectorStroke(viz)),
          strokeWidth: 3,
        },
        Rect: {fill: (d: DataPoint) => barColor(viz, d)},
      }),
    },
    /**
        The series legend, hidden with a bar connector, which draws in
        place of the series' points.
    */
    {
      key: "legend",
      coerce: "const",
      factory: (viz: VizInstance) => {
        const base = viz.schema.legend as (
          config: unknown,
          arr: DataPoint[],
        ) => unknown;
        return (config: unknown, arr: DataPoint[]) =>
          dumbbellConnector(viz.schema.connector) === "bar"
            ? false
            : base.call(viz, config, arr);
      },
    },
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        tbody: (d: DataPoint) => {
          const row = changeRow(viz, (d as {data?: DataPoint}).data ?? d);
          return row ? [row] : [];
        },
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
    gap. `arrows` draws each connector as an arrow from the category's first
    value to its last, and `connector: "bar"` draws a floating bar in place
    of the dots.
*/
export default makeChart(dumbbellDef, Plot);
