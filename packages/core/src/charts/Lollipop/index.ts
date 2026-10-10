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
  },

  ctx: {},

  fields: [
    {key: "baseline", default: 0},
    {key: "baselineBreak", default: true},
    {key: "discrete", default: "x"},
    barLegend,
    // Rows are laid out as bars, then drawn as stems and heads.
    {key: "shape", default: constant("Bar"), coerce: "const"},
    {key: "legendConfig", merge: true, default: {shape: "Circle"}},
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
    `fill`, …); a `size` accessor scales the heads.
*/
export default makeChart(lollipopDef, Plot);
