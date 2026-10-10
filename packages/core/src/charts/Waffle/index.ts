/**
    Waffle — a grid of unit cells (10 × 10 by default, so each cell is 1%)
    filled in order by `groupBy` category, each category getting a number of
    cells proportional to its value.

    Implementation files in this folder:
      - `applyLayout.ts` — chart-specific `TransformStage`.
      - `emit.ts` — cell rects/circles and their icons.
      - `waffleLayout.ts` — pure allocation (largest remainder) and grid math.
      - `tooltip.ts` — the "Value" and "Share" tooltip rows.
*/

import type {DataPoint} from "@d3plus/data";

import accessor from "../../utils/accessor.js";
import {
  subtitleFeature,
  titleFeature,
  totalFeature,
} from "../features/features.js";
import type {DataDrivenChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import {sceneInsetRegion} from "../pipeline/insetPlacement.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {thresholdFunction} from "../Treemap/thresholdFunction.js";

import {applyWaffleLayout} from "./applyLayout.js";
import {waffleEmit} from "./emit.js";
import {waffleTooltipRows} from "./tooltip.js";

type SortFn = (a: DataPoint, b: DataPoint) => number;

/** Descending by the chart's current `sum`. */
const bySum =
  (viz: VizInstance): SortFn =>
  (a, b) => {
    const sumFn = viz.schema.sum as (d: DataPoint) => number;
    return sumFn(b) - sumFn(a);
  };

/** The chart's current `sort`, or the data order when `sort` is off. */
const fillOrder =
  (viz: VizInstance): SortFn =>
  (a, b) => {
    const sort = viz.schema.sort as SortFn | null | false;
    return typeof sort === "function" ? sort(a, b) : 0;
  };

const isAggregated = (d: DataPoint): boolean =>
  (d as {_isAggregation?: boolean})._isAggregation === true;

export const waffleDef: DataDrivenChartDefinition = {
  name: "Waffle",

  features: [titleFeature, subtitleFeature, totalFeature],
  layoutStage: applyWaffleLayout,
  emit: waffleEmit,
  insetRegion: sceneInsetRegion,

  thresholdFunction: (viz: VizInstance, data: unknown[]) =>
    thresholdFunction(data as DataPoint[], {
      aggs: viz.schema.aggs,
      drawDepth: viz._drawDepth,
      groupBy: viz.schema.groupBy as ((
        d: DataPoint,
      ) => DataPoint[keyof DataPoint])[],
      threshold: viz.schema.threshold as (branchData: DataPoint[]) => number,
      thresholdKey: viz.schema.thresholdKey as (d: DataPoint) => number,
    }),

  // The default 10 × 10 grid is square.
  facet: {aspect: 1},

  ctx: {},

  fields: [
    /** The gap between neighboring cells, in pixels. */
    {key: "cellPadding", default: 2},
    /** How each cell is drawn: `"square"`, `"rounded"`, or `"circle"`. */
    {key: "cellShape", default: "square"},
    /**
        The number of columns in the grid. With `unit`, a row-wise fill keeps
        this many columns and adds rows as needed.
    */
    {key: "columns", default: 10},
    /** The order cells fill the grid: `"row"` (along each row) or `"column"` (down each column). */
    {key: "fillDirection", default: "row"},
    /**
        The corner the first cell sits in: `"top-left"`, `"top-right"`,
        `"bottom-left"`, or `"bottom-right"`.
    */
    {key: "fillStart", default: "top-left"},
    /**
        Draws an icon in every cell in place of its fill: an image URL, or an
        accessor `(d, i) => url` returning one per category. The icon fits
        inside its cell and dims with it on hover.
    */
    {key: "icon"},
    /**
        The number of rows in the grid. With `unit` and a column-wise fill,
        the grid keeps this many rows and adds columns as needed.
    */
    {key: "rows", default: 10},
    /**
        Comparator for the categories' fill order, given two rows. Defaults to
        descending by `sum`, with any threshold bucket last; `false` keeps the
        data order.
    */
    {
      key: "sort",
      factory: (viz: VizInstance) => bySum(viz),
      decorate: (_viz, base) => {
        const baseSort = base as SortFn;
        return ((a, b) => {
          const aggA = isAggregated(a);
          const aggB = isAggregated(b);
          return aggA && !aggB ? 1 : !aggA && aggB ? -1 : baseSort(a, b);
        }) as SortFn;
      },
    },
    /** Accessor function or string key for each category's value. */
    {
      key: "sum",
      default: accessor("value"),
      coerce: v => (typeof v === "function" ? v : accessor(v as string)),
      onSet: (viz, v) => {
        viz.schema.thresholdKey = v;
      },
    },
    /**
        The value one cell stands for. By default the categories share every
        cell of the `rows` × `columns` grid, so each cell is a fixed share of
        the total; with a `unit`, each cell counts `unit` of the value and the
        grid grows to fit the total.
    */
    {key: "unit"},
    {key: "zoom", default: false},
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({tbody: waffleTooltipRows(viz)}),
    },
    {
      key: "legendTooltip",
      merge: true,
      factory: (viz: VizInstance) => ({tbody: waffleTooltipRows(viz)}),
    },
    /** Lists the legend in the order the categories fill the grid (see `sort`). */
    {
      key: "legendSort",
      factory: (viz: VizInstance) => fillOrder(viz),
    },
  ],
};

/**
    Draws a grid of unit cells filled by category in proportion to each
    category's value — 1% per cell by default, or a fixed value per cell
    with `unit`.
*/
export default makeChart(waffleDef);
