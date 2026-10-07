/**
    Radar — polar value polygons over a per-metric radial axis.

    Implementation files in this folder:
      - `applyLayout.ts` — polar geometry + polygon paths.
      - `axisDecorations.ts` — metric labels, spokes, rings, level labels.
      - `axisLabels.ts` — sizes the web to its metric labels.
      - `levels.ts` — nice ring values + level value labels.
      - `rings.ts` — ring styles + ring scene nodes.
      - `emit.ts` — Path scene nodes per polygon.
*/

import accessor from "../../utils/accessor.js";
import constant from "../../utils/constant.js";
import {subtitleFeature, titleFeature, totalFeature} from "../features/features.js";
import {centerChartTransform, chartBounds} from "../features/chartGeometry.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import {gridStroke} from "../../components/Axis/gridStroke.js";
import {backgroundInk} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {applyRadarLayout} from "./applyLayout.js";
import {radarEmit} from "./emit.js";

export const radarDef: ChartDefinition = {
  name: "Radar",

  features: [titleFeature, subtitleFeature, totalFeature],
  layoutStage: applyRadarLayout,
  emit: radarEmit,

  chartTransform: (viz: VizInstance) => {
    const {width, height} = chartBounds(viz);
    return centerChartTransform(viz, width, height);
  },

  // Radar's chartTransform centers the origin — the polygon is drawn in
  // [-width/2, width/2] × [-height/2, height/2], not the top-left-origin box
  // the default chartBodyRect assumes (see Pie/index.ts, which documents/
  // fixes the identical issue for its own centered layout).
  chartBodyRect: (viz: VizInstance) => {
    const {width, height} = chartBounds(viz);
    return {x: -width / 2, y: -height / 2, width, height};
  },

  // Small-multiple panels as close to square as the grid allows.
  facet: {aspect: 1},

  ctx: {},

  fields: [
    {key: "discrete", default: "metric"},
    {key: "levelFormat"},
    {key: "levelLabelAngle", default: 0},
    {key: "levelLabelConfig", default: {}, merge: true},
    {key: "levelLabels", default: true},
    {key: "levels", default: 6},
    {
      key: "metric",
      default: accessor("metric"),
      coerce: v => (typeof v === "function" ? v : accessor(v as string)),
    },
    {key: "outerPadding", default: "auto"},
    {key: "shape", default: constant("Path"), coerce: "const"},
    {
      key: "value",
      default: accessor("value"),
      coerce: v => (typeof v === "function" ? v : accessor(v as string)),
    },
    {
      key: "axisConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        // The outer ring: Plot's axis line.
        barConfig: {stroke: () => backgroundInk(viz), strokeWidth: 1},
        // The inner rings: Plot's gridlines.
        gridConfig: {
          stroke: () => gridStroke(viz._select?.node(), viz.schema.colorDefaults),
          strokeWidth: 1,
        },
        // The spokes and metric labels: Plot's ticks.
        shapeConfig: {
          fill: constant("none"),
          labelConfig: {
            fontColor: () => backgroundInk(viz),
            fontResize: false,
            padding: 0,
            textAnchor: (d: {data?: {textAnchor?: string}}) =>
              d.data?.textAnchor ?? "middle",
            verticalAlign: "middle",
          },
          stroke: () => backgroundInk(viz),
          strokeWidth: constant(1),
        },
      }),
    },
  ],
};

/**
    Creates a radar visualization based on an array of data.
*/
export default makeChart(radarDef);
