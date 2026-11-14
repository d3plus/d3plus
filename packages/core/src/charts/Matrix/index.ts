/**
    Matrix — row × column grid of cells.

    Implementation files in this folder:
      - `applyLayout.ts` — `TransformStage` that runs the row+column axes.
      - `emit.ts` — Rect (or Circle) cells positioned by the stashed scales.
      - `bubbles.ts` — Circle cells sized by `size`.
*/

import type {DataPoint} from "@d3plus/data";

import accessor from "../../utils/accessor.js";
import {fieldAccessor} from "../../utils/fieldAccessor.js";
import {Axis} from "../../components/index.js";
import {colorScaleBucketOf} from "../features/colorScaleBucket.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {getProp} from "../../utils/index.js";
import {makeChart} from "../definition/makeChart.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {applyMatrixLayout} from "./applyLayout.js";
import {
  matrixSizeLegendScale,
  matrixSizeTooltipRows,
  matrixSizeValues,
} from "./bubbles.js";
import {matrixEmit} from "./emit.js";

const defaultAxisConfig: Record<string, unknown> = {
  align: "start",
  barConfig: {stroke: 0},
  gridSize: 0,
  padding: 5,
  paddingInner: 0,
  paddingOuter: 0,
  scale: "band",
  tickSize: 0,
};

const localeCompare = (
  a: DataPoint[keyof DataPoint],
  b: DataPoint[keyof DataPoint],
) => `${a}`.localeCompare(`${b}`);

export const matrixDef: ChartDefinition = {
  name: "Matrix",

  layoutStage: applyMatrixLayout,
  sizeLegendScale: matrixSizeLegendScale,
  emit: matrixEmit,

  chartTransform: (viz: VizInstance) => ({x: 0, y: viz._margin.top}),

  setup: (viz: VizInstance) => {
    /**
        Sizes each circle cell (a cell whose `shape` is `"Circle"`) by the
        absolute value of a data key or accessor function, so the largest
        circle fills its cell (see `sizeScale`) and the size legend keys
        the sizes. A cell without a value draws no circle. When unset,
        every circle fills its cell.
        @type {string | function}
    */
    (viz as VizInstance & {size: unknown}).size = function (
      this: VizInstance,
      _?: unknown,
    ) {
      if (!arguments.length) return this._size;
      this._size = (
        typeof _ === "function" || !_ ? _ : fieldAccessor(_ as string)
      ) as VizInstance["_size"];
      this._sizeKey = typeof _ === "string" ? _ : undefined;
      return this;
    };
    const baseMouseMoveShape = viz.schema.on["mousemove.shape"];
    viz.schema.on["mousemove.shape"] = (
      d: DataPoint,
      i: number,
      x: unknown,
      event: unknown,
    ) => {
      baseMouseMoveShape(d, i, x, event);
      // A colorScale swatch routes through the shape path but has no row/column,
      // so its row/column hover would match nothing and wipe out the bucket
      // highlight `mouseenter` already set. Leave that highlight in place.
      if (colorScaleBucketOf(x) || colorScaleBucketOf(d)) return;
      const row = getProp.bind(viz)("row", d, i);
      const column = getProp.bind(viz)("column", d, i);
      // Without a colorScale every cell has a value to highlight.
      const colorScale = viz.schema.colorScale as
        ((d: DataPoint, i: number) => unknown) | undefined;
      type HoverFn = (fn: (h: DataPoint, ii: number) => boolean) => unknown;
      const hasValue = (h: DataPoint, ii: number): boolean => {
        if (typeof colorScale !== "function") return true;
        const value = colorScale(h, ii);
        // A bivariate colorScale reads a pair of values.
        return typeof value === "number" || Array.isArray(value);
      };
      const hover = (h: DataPoint, ii: number) =>
        (getProp.bind(viz)("row", h, ii) === row ||
          getProp.bind(viz)("column", h, ii) === column) &&
        hasValue(h, ii);
      // The crosshair lights the whole row and column; only the hovered
      // cell's row and column labels stay bright.
      viz._hoverFocus = {hover, rows: [{row, column} as DataPoint]};
      (viz as VizInstance & {hover: HoverFn}).hover(hover);
    };
  },

  facet: {
    // Panels as close to square as the grid allows.
    aspect: 1,
    // Every panel's circles share one size scale.
    share: (viz, panels) =>
      viz._size ? matrixSizeValues(viz, panels.flat()) : undefined,
    panel: (viz, {shared, scales}) => {
      const previous = viz.ctx.sharedSizeValues;
      if (shared && scales) viz.ctx.sharedSizeValues = scales;
      return () => {
        viz.ctx.sharedSizeValues = previous;
      };
    },
  },

  ctx: {
    rowAxis: new Axis(),
    columnAxis: new Axis(),
  },

  fields: [
    /** The pixel padding between neighboring cells. */
    {key: "cellPadding", default: 2},
    /**
        The column each data point falls in: a key present in every data
        point, or an accessor function that receives a data point and its
        index and returns its column value.
        @type {string | function}
    */
    {
      key: "column",
      default: accessor("column"),
      coerce: v => (typeof v === "function" ? v : fieldAccessor(v as string)),
    },
    /**
        The row each data point falls in: a key present in every data point,
        or an accessor function that receives a data point and its index and
        returns its row value.
        @type {string | function}
    */
    {
      key: "row",
      default: accessor("row"),
      coerce: v => (typeof v === "function" ? v : fieldAccessor(v as string)),
    },
    /**
        A manual list of column values to draw, in place of the unique
        `column` values found in the data. Sorted by `columnSort`.
        @type {(string | number | boolean)[]}
    */
    {key: "columnList"},
    /**
        A manual list of row values to draw, in place of the unique `row`
        values found in the data. Sorted by `rowSort`.
        @type {(string | number | boolean)[]}
    */
    {key: "rowList"},
    /** A sort comparator run on the unique set of column values. */
    {key: "columnSort", default: localeCompare},
    /** A sort comparator run on the unique set of row values. */
    {key: "rowSort", default: localeCompare},
    /** Config for the `Axis` that draws the row labels, merged over the defaults. */
    {
      key: "rowConfig",
      merge: true,
      default: {orient: "left", ...defaultAxisConfig},
    },
    /** Config for the `Axis` that draws the column labels, merged over the defaults. */
    {
      key: "columnConfig",
      merge: true,
      default: {orient: "top", ...defaultAxisConfig},
    },
    /**
        How circle cells scale their `size` values to radii, anchored at
        zero: `"sqrt"` (the default) makes each circle's area proportional
        to its value, and `"linear"` its radius.
        @type {"sqrt" | "linear"}
    */
    {key: "sizeScale", default: "sqrt"},
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        tbody: (d: DataPoint, i: number) => matrixSizeTooltipRows(viz, d, i),
      }),
    },
    {
      key: "label",
      coerce: "const",
      factory: (viz: VizInstance) => (d: DataPoint, i: number) =>
        `${getProp.bind(viz)("row", d, i)} / ${getProp.bind(viz)("column", d, i)}`,
    },
  ],
};

/**
    Creates a simple rows/columns Matrix view of any dataset.
*/
export default makeChart(matrixDef);
