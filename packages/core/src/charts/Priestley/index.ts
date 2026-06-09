/**
    Priestley — timeline chart with start/end bands packed onto lanes.

    Implementation files in this folder:
      - `applyLayout.ts` — chart-specific `TransformStage`.
      - `emit.ts` — Rect + label scene nodes per band.
*/

import {min, max} from "d3-array";

import accessor from "../../utils/accessor.js";
import {Axis} from "../../components/index.js";
import {backFeature, subtitleFeature, titleFeature, totalFeature} from "../features/features.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import type {DataPoint} from "@d3plus/data";
import {makeChart} from "../definition/makeChart.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {applyPriestleyLayout} from "./applyLayout.js";
import {priestleyEmit} from "./emit.js";

export const priestleyDef: ChartDefinition = {
  name: "Priestley",

  features: [backFeature, titleFeature, subtitleFeature, totalFeature],
  layoutStage: applyPriestleyLayout,
  emit: priestleyEmit,

  // Priestley positions in absolute scale coordinates — no chart transform.
  chartTransform: () => undefined,

  // The default start/end accessors are functions, so the fields' `onSet`
  // can't infer a data key to register. Seed the band-edge reducers here so
  // the time domain spans min(start)…max(end) instead of summing them.
  setup: viz => {
    if (!viz.schema.aggs.start) viz.schema.aggs.start = min;
    if (!viz.schema.aggs.end) viz.schema.aggs.end = max;
  },

  ctx: {
    axis: new Axis().align("end").orient("bottom"),
    axisTest: new Axis().align("end").gridSize(0).orient("bottom"),
  },

  fields: [
    {key: "paddingInner", default: 0.05},
    {key: "paddingOuter", default: 0.05},
    {
      key: "axisConfig",
      merge: true,
      default: {scale: "time"},
    },
    {
      key: "end",
      default: accessor("end"),
      coerce: v => (typeof v === "function" ? v : accessor(v as string)),
      onSet: (viz, v) => {
        // String accessor → also seed a default aggregation (max) for that key.
        const key = typeof v === "function" ? null : (v as string);
        if (key && !viz.schema.aggs[key]) viz.schema.aggs[key] = max;
      },
    },
    {
      key: "start",
      default: accessor("start"),
      coerce: v => (typeof v === "function" ? v : accessor(v as string)),
      onSet: (viz, v) => {
        const key = typeof v === "function" ? null : (v as string);
        if (key && !viz.schema.aggs[key]) viz.schema.aggs[key] = min;
      },
    },
    {
      key: "shapeConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        ariaLabel: (d: DataPoint, i: number) => {
          const start = (viz.schema.start as (d: DataPoint, i: number) => unknown)(d, i);
          const end = (viz.schema.end as (d: DataPoint, i: number) => unknown)(d, i);
          return `${viz._drawLabel(d, i)}, ${start} - ${end}.`;
        },
      }),
    },
  ],
};

/**
    Creates a Priestley timeline based on an array of data.
*/
export default makeChart(priestleyDef);
