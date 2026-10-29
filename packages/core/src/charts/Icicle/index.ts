/**
    Icicle — a partition chart: one band of rectangles per `groupBy` level,
    from the root edge out, each node as broad as its summed value
    (d3-hierarchy `partition`, the Sunburst unrolled into rectangles).

    Implementation files in this folder:
      - `applyLayout.ts` — chart-specific `TransformStage`.
      - `emit.ts` — Rect + label scene nodes from the laid-out nodes.
      - `layout.ts` — the shared partition placed as rectangles.
      - `geometry.ts` — pure bands, rectangles, and zoom collapse targets.
      - `labelFit.ts` — pure upright/rotated label fitting.
      - `enterStagger.ts` — where and when entering rectangles grow in.
      - `interaction.ts` — the zoom origin and node lookup for the shared
        partition interaction.
*/

import accessor from "../../utils/accessor.js";
import type {DataDrivenChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import {rowLegend, shareRow} from "../features/sharedFields.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {
  partitionDefaultSort,
  partitionLegendSort,
  partitionSetup,
  partitionSortDecorate,
  partitionSumCoerce,
  partitionSumOnSet,
  partitionThreshold,
} from "../partition/chartFields.js";
import {partitionShadeDefaults} from "../partition/shade.js";

import {applyIcicleLayout} from "./applyLayout.js";
import {icicleEmit} from "./emit.js";
import {icicleInteraction} from "./interaction.js";
import {chartBackground} from "../viz/backgroundInk.js";

export const icicleDef: DataDrivenChartDefinition = {
  name: "Icicle",

  layoutStage: applyIcicleLayout,
  emit: icicleEmit,

  thresholdFunction: partitionThreshold,

  // Shading applies only while the default colors stay in place.
  setup: (viz: VizInstance) => partitionSetup(viz, icicleInteraction),

  ctx: {},

  fields: [
    /**
        Which way the levels run: `"horizontal"` (default) puts the root on the
        left with each level to its right; `"vertical"` puts the root on top
        with each level below it.
        @type {"horizontal" | "vertical"}
    */
    {key: "orient", default: "horizontal"},
    /**
        Lightens each level below the top one a step more than the level above
        it (see `shadeConfig`), so the levels read apart while each branch
        keeps its top-level color. Applies only to the default colors: a
        custom `color`, `shapeConfig.fill`, or `colorScale` is drawn as given.
        Labels keep their automatic contrast color.
    */
    {key: "shade", default: true},
    /**
        Shading strengths, as `colorLighter` amounts (0–1): `step` per
        `groupBy` level below the top level, up to `max`, which keeps the
        deepest levels in their branch's hue.
        @type {{step?: number, max?: number}}
    */
    {
      key: "shadeConfig",
      merge: true,
      factory: () => ({...partitionShadeDefaults}),
    },
    /**
        Comparator for sibling rectangles, given two d3-hierarchy nodes.
        Defaults to descending by summed value, with any threshold bucket last.
        @type {function}
    */
    {
      key: "sort",
      default: partitionDefaultSort,
      decorate: partitionSortDecorate,
    },
    /**
        Accessor function or string key for the value each rectangle's breadth
        is proportional to. Parent rectangles sum their children.
        @type {string | function}
    */
    {
      key: "sum",
      default: accessor("value"),
      coerce: partitionSumCoerce,
      onSet: partitionSumOnSet,
    },
    {
      key: "shapeConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        Rect: {labelConfig: {fontResize: true}},
        // A thin outline in the chart's background color separates
        // neighboring rectangles and levels by the same width everywhere.
        stroke: () => chartBackground(viz),
        strokeWidth: 1,
      }),
    },
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        tbody: [shareRow(viz, "sum")],
      }),
    },
    {
      key: "legendTooltip",
      merge: true,
      factory: () => ({tbody: []}),
    },
    {key: "legendSort", factory: partitionLegendSort},
    {key: "legend", coerce: "const", factory: rowLegend},
  ],
};

/**
    Draws a hierarchy as nested rectangles, one band per `groupBy` level from
    the root edge out, where each node's breadth is proportional to its summed
    value. Click a rectangle to zoom into it; click the root band (or Back) to
    zoom out.
*/
export default makeChart(icicleDef);
