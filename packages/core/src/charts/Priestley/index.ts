/**
    Priestley — timeline chart with start/end bands packed onto lanes.

    Implementation files in this folder:
      - `applyLayout.ts` — chart-specific `TransformStage`.
      - `emit.ts` — Rect + label scene nodes per band.
*/

import {min, max} from "d3-array";

import accessor from "../../utils/accessor.js";
import {Axis} from "../../components/index.js";
import {subtitleFeature, titleFeature, totalFeature} from "../features/features.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import type {DataPoint} from "@d3plus/data";
import {makeChart} from "../definition/makeChart.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {applyPriestleyLayout} from "./applyLayout.js";
import {priestleyEmit} from "./emit.js";

export const priestleyDef: ChartDefinition = {
  name: "Priestley",

  features: [titleFeature, subtitleFeature, totalFeature],
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
    /**
        The [paddingInner](https://github.com/d3/d3-scale#band_paddingInner) of the
        band scale that sets each bar's height: the space between neighboring bars,
        as a ratio from 0 to 1.
    */
    {key: "paddingInner", default: 0.05},
    /**
        The [paddingOuter](https://github.com/d3/d3-scale#band_paddingOuter) of the
        band scale that sets each bar's height: the space before the first bar and
        after the last, as a ratio from 0 to 1.
    */
    {key: "paddingOuter", default: 0.05},
    {
      key: "axisConfig",
      merge: true,
      default: {scale: "time"},
    },
    /**
        Accessor function or string key for the end date of each data point. A
        key also aggregates grouped rows by their latest end.
        @type {string | function}
    */
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
    /**
        Accessor function or string key for the start date of each data point. A
        key also aggregates grouped rows by their earliest start.
        @type {string | function}
    */
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
