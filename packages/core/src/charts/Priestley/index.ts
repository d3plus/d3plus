/**
    Priestley — timeline chart with start/end bands packed onto lanes.

    Implementation files in this folder:
      - `applyLayout.ts` — chart-specific `TransformStage`.
      - `emit.ts` — Rect + label scene nodes per band.
*/

import {Axis} from "../../components/index.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import type {DataPoint} from "@d3plus/data";
import {makeChart} from "../definition/makeChart.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {applyPriestleyLayout} from "./applyLayout.js";
import {priestleyEmit} from "./emit.js";
import {seedTimeAggs, timeFields} from "./timeAxis.js";

export const priestleyDef: ChartDefinition = {
  name: "Priestley",

  layoutStage: applyPriestleyLayout,
  emit: priestleyEmit,

  // Priestley positions in absolute scale coordinates — no chart transform.
  chartTransform: () => undefined,

  // The default start/end accessors are functions, so the fields' `onSet`
  // can't infer a data key to register. Seed the band-edge reducers here so
  // the time domain spans min(start)…max(end) instead of summing them.
  setup: seedTimeAggs,

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
    ...timeFields(),
    {
      key: "shapeConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        ariaLabel: (d: DataPoint, i: number) => {
          const start = (
            viz.schema.start as (d: DataPoint, i: number) => unknown
          )(d, i);
          const end = (viz.schema.end as (d: DataPoint, i: number) => unknown)(
            d,
            i,
          );
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
