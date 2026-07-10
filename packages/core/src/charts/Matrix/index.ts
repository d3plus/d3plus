/**
    Matrix — row × column grid of cells.

    Implementation files in this folder:
      - `applyLayout.ts` — `TransformStage` that runs the row+column axes.
      - `emit.ts` — Rect cells positioned by the stashed scales.
*/

import type {DataPoint} from "@d3plus/data";

import accessor from "../../utils/accessor.js";
import {Axis} from "../../components/index.js";
import {backFeature, subtitleFeature, titleFeature, totalFeature} from "../features/features.js";
import {colorScaleBucketOf} from "../features/colorScaleBucket.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {getProp} from "../../utils/index.js";
import {makeChart} from "../definition/makeChart.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {applyMatrixLayout} from "./applyLayout.js";
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

  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  layoutStage: applyMatrixLayout,
  emit: matrixEmit,

  chartTransform: (viz: VizInstance) => ({x: 0, y: viz._margin.top}),

  setup: (viz: VizInstance) => {
    const baseMouseMoveShape = viz.schema.on["mousemove.shape"];
    viz.schema.on["mousemove.shape"] = (
      d: DataPoint, i: number, x: unknown, event: unknown,
    ) => {
      baseMouseMoveShape(d, i, x, event);
      // A colorScale swatch routes through the shape path but has no row/column,
      // so its row/column hover would match nothing and wipe out the bucket
      // highlight `mouseenter` already set. Leave that highlight in place.
      if (colorScaleBucketOf(x) || colorScaleBucketOf(d)) return;
      const row = getProp.bind(viz)("row", d, i);
      const column = getProp.bind(viz)("column", d, i);
      type HoverFn = (fn: (h: DataPoint, ii: number) => boolean) => unknown;
      (viz as VizInstance & {hover: HoverFn}).hover(
        (h: DataPoint, ii: number) =>
          (getProp.bind(viz)("row", h, ii) === row ||
            getProp.bind(viz)("column", h, ii) === column) &&
          typeof (viz.schema.colorScale as (d: DataPoint, i: number) => unknown)(h, ii) === "number",
      );
    };
  },

  ctx: {
    rowAxis: new Axis(),
    columnAxis: new Axis(),
  },

  fields: [
    {key: "cellPadding", default: 2},
    {
      key: "column",
      default: accessor("column"),
      coerce: v => (typeof v === "function" ? v : accessor(v as string)),
    },
    {
      key: "row",
      default: accessor("row"),
      coerce: v => (typeof v === "function" ? v : accessor(v as string)),
    },
    {key: "columnList"},
    {key: "rowList"},
    {key: "columnSort", default: localeCompare},
    {key: "rowSort", default: localeCompare},
    {key: "rowConfig", merge: true, default: {orient: "left", ...defaultAxisConfig}},
    {key: "columnConfig", merge: true, default: {orient: "top", ...defaultAxisConfig}},
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
