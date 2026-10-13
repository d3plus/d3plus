/**
    Lollipop — a BarChart drawn as stems topped by circles: each row's stem
    runs from the baseline to its value, where its head sits.
*/

import type {DataPoint} from "@d3plus/data";

import constant from "../../utils/constant.js";
import {barChartDef} from "../BarChart/index.js";
import {subtitleFeature, titleFeature, totalFeature} from "../features/features.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import Plot from "../Plot/index.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {lollipopEmit} from "./emit.js";
import {lollipopBuffer} from "./stemLayout.js";

/** BarChart's legend, which drops entries that only repeat the category axis. */
const barLegend = barChartDef.fields!.find(f => f.key === "legend")!;

/** The chart's fill for a row, so each stem defaults to its head's color. */
const fillOf = (viz: VizInstance) => (d: DataPoint, i: number) => {
  const fill = viz.schema.shapeConfig.fill;
  return typeof fill === "function" ? fill(d, i) : fill;
};

export const lollipopDef: ChartDefinition = {
  name: "Lollipop",
  paintDriven: true,
  features: [titleFeature, subtitleFeature, totalFeature],

  setup: viz => {
    viz._buffer = {...viz._buffer, Bar: lollipopBuffer};
    viz._plotShapeEmitters = {Bar: lollipopEmit};
    viz._plotCircleShapes = ["Bar"];
  },

  ctx: {},

  fields: [
    /** Stems rise from zero unless the value axis breaks away from it. */
    {key: "baseline", default: 0},
    /**
        Lets the value axis break away from zero when every value sits far
        from it, so stems start at the axis's edge instead.
    */
    {key: "baselineBreak", default: true},
    /**
        The category axis: `"x"` (default) draws vertical stems, `"y"`
        horizontal ones.
        @type {"x" | "y"}
    */
    {key: "discrete", default: "x"},
    /** BarChart's legend, hiding entries that only repeat the category axis. */
    barLegend,
    /** Rows are laid out as bars, then drawn as stems and heads. */
    {key: "shape", default: constant("Bar"), coerce: "const"},
    /** Legend swatches are drawn as circles, matching the heads. */
    {key: "legendConfig", merge: true, default: {shape: "Circle"}},
    /**
        Stems are styled by `shapeConfig.Line` (`stroke`, `strokeWidth`,
        `strokeDasharray`, …; the stroke defaults to the head's color) and
        heads by `shapeConfig.Circle` (`r`, `fill`, …).
    */
    {
      key: "shapeConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        Bar: {label: false},
        Circle: {label: false, trail: false},
        Line: {label: false, stroke: fillOf(viz)},
      }),
    },
  ],
};

/**
    Creates a lollipop chart from an array of data: each row draws a thin stem
    from the baseline (or the value axis's break) to a circle at its value,
    with a category axis set by `discrete` (`"x"` draws vertical stems, `"y"`
    horizontal ones). Rows sharing a category but differing in `groupBy` sit
    side by side, as grouped bars do. Stems are styled by `shapeConfig.Line`
    (`stroke`, `strokeWidth`, …) and heads by `shapeConfig.Circle` (`r`,
    `fill`, …); a `size` accessor scales the heads and adds a size legend.
*/
export default makeChart(lollipopDef, Plot);
