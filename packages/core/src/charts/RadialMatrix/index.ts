/**
    RadialMatrix — radial-arc layout of a row × column matrix.

    Implementation files in this folder:
      - `applyLayout.ts` — polar geometry + column-label TextBox absorb.
      - `emit.ts` — Path arc cells.
*/

import {colorContrast} from "@d3plus/color";
import {backgroundColor} from "@d3plus/dom";
import type {DataPoint} from "@d3plus/data";

import accessor from "../../utils/accessor.js";
import constant from "../../utils/constant.js";
import {TextBox} from "../../components/index.js";
import {backFeature, subtitleFeature, titleFeature, totalFeature} from "../features.js";
import {centerChartTransform} from "../chartGeometry.js";
import type {ChartDefinition} from "../ChartDefinition.js";
import {getProp} from "../../utils/index.js";
import {makeChart} from "../makeChart.js";
import type {VizInstance} from "../vizTypes.js";

import {applyRadialMatrixLayout} from "./applyLayout.js";
import {radialMatrixEmit} from "./emit.js";

const localeCompare = (
  a: DataPoint[keyof DataPoint],
  b: DataPoint[keyof DataPoint],
) => `${a}`.localeCompare(`${b}`);

interface LabelDatum {
  angle: number;
  quadrant: number;
}

export const radialMatrixDef: ChartDefinition = {
  name: "RadialMatrix",

  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  layoutStage: applyRadialMatrixLayout,
  emit: radialMatrixEmit,

  chartTransform: (viz: VizInstance) =>
    centerChartTransform(
      viz,
      viz.ctx.radialMatrixWidth as number,
      viz.ctx.radialMatrixHeight as number,
    ),

  setup: (viz: VizInstance) => {
    const baseMouseMoveShape = viz.schema.on["mousemove.shape"];
    viz.schema.on["mousemove.shape"] = (
      d: DataPoint, i: number, x: unknown, event: unknown,
    ) => {
      baseMouseMoveShape(d, i, x, event);
      const row = getProp.bind(viz)("row", d, i);
      const column = getProp.bind(viz)("column", d, i);
      type HoverFn = (fn: (h: DataPoint, ii: number) => boolean) => unknown;
      (viz as VizInstance & {hover: HoverFn}).hover(
        (h: DataPoint, ii: number) =>
          getProp.bind(viz)("row", h, ii) === row ||
          getProp.bind(viz)("column", h, ii) === column,
      );
    };
  },

  ctx: {
    columnLabels: new TextBox(),
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
    {
      key: "innerRadius",
      default: (r: number) => r / 5,
      coerce: v => (typeof v === "function" ? v : constant(v as number)),
    },
    {
      key: "columnConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        shapeConfig: {
          labelConfig: {
            fontColor: () => {
              const bg = viz._select
                ? backgroundColor(viz._select.node())
                : "rgb(255, 255, 255)";
              return colorContrast(bg);
            },
            padding: 5,
            textAnchor: (d: LabelDatum) =>
              [0, 180].includes(d.angle)
                ? "middle"
                : [2, 3].includes(d.quadrant)
                  ? "end"
                  : "start",
            verticalAlign: (d: LabelDatum) =>
              [90, 270].includes(d.angle)
                ? "middle"
                : [2, 1].includes(d.quadrant)
                  ? "bottom"
                  : "top",
          },
        },
      }),
    },
    {
      key: "label",
      factory: (viz: VizInstance) => (d: DataPoint, i: number) =>
        `${getProp.bind(viz)("row", d, i)} / ${getProp.bind(viz)("column", d, i)}`,
    },
  ],
};

export default makeChart(radialMatrixDef);
