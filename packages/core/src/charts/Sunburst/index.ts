/**
    Sunburst — a radial hierarchy: one ring per `groupBy` level from the center
    out, each node an arc whose angle is proportional to its summed value
    (d3-hierarchy `partition` in polar coordinates).

    Implementation files in this folder:
      - `applyLayout.ts` — chart-specific `TransformStage`.
      - `emit.ts` — arc Paths + label scene nodes from the laid-out nodes.
      - `partition.ts` — pure nesting + polar partition layout.
      - `geometry.ts` — pure ring radii, pad angle, and label-fit math.
      - `interaction.ts` — hover lineage, tooltip rows, and click-to-zoom.
*/

import accessor from "../../utils/accessor.js";
import {centerChartTransform} from "../features/chartGeometry.js";
import type {DataDrivenChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import {rowLegend, shareRow} from "../features/sharedFields.js";
import {sceneInsetRegion} from "../pipeline/insetPlacement.js";
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

import {applySunburstLayout} from "./applyLayout.js";
import {sunburstEmit} from "./emit.js";
import {sunburstInteraction} from "./interaction.js";
import {chartBackground} from "../viz/backgroundInk.js";

export const sunburstDef: DataDrivenChartDefinition = {
  name: "Sunburst",

  layoutStage: applySunburstLayout,
  emit: sunburstEmit,
  insetRegion: sceneInsetRegion,

  thresholdFunction: partitionThreshold,

  chartTransform: (viz: VizInstance) =>
    centerChartTransform(
      viz,
      viz.ctx.sunburstWidth as number,
      viz.ctx.sunburstHeight as number,
    ),

  // The circle the arcs fill, in the centered chart frame.
  chartBodyRect: (viz: VizInstance) => {
    const r = (viz.ctx.sunburstOuterRadius as number) ?? 0;
    return {x: -r, y: -r, width: r * 2, height: r * 2};
  },

  // Shading applies only while the default colors stay in place.
  setup: (viz: VizInstance) => partitionSetup(viz, sunburstInteraction),

  // Small-multiple panels as close to square as the grid allows.
  facet: {aspect: 1},

  ctx: {},

  fields: [
    /**
        The radius of the center slot, in pixels, or a function that receives
        the outer radius and returns one. The center is hollow until a click
        zooms into a node, which then fills it. Defaults to one ring's
        thickness (see `ringSize`).
        @type {number | function}
    */
    {key: "innerRadius"},
    /**
        The angular gap between neighboring arcs, in radians. When set, takes
        precedence over `padPixel`.
    */
    {key: "padAngle", default: 0},
    /**
        The gap between neighboring arcs, in pixels, kept the same width in
        every ring.
    */
    {key: "padPixel", default: 0},
    /**
        How the rings divide the radius: `"equal"` (default) gives every ring
        the same thickness, so label room is uniform from the center out;
        `"area"` gives every ring the same area, so the outer rings don't
        outweigh the inner ones.
        @type {"equal" | "area"}
    */
    {key: "ringSize", default: "equal"},
    /**
        Lightens each ring below the top one a step more than the ring inside
        it (see `shadeConfig`), so the rings read apart while each branch keeps
        its top-level color. Applies only to the default colors: a custom
        `color`, `shapeConfig.fill`, or `colorScale` is drawn as given. Labels
        keep their automatic contrast color.
    */
    {key: "shade", default: true},
    /**
        Shading strengths, as `colorLighter` amounts (0–1): `step` per
        `groupBy` level below the top ring, up to `max`, which keeps the
        deepest rings in their branch's hue.
        @type {{step?: number, max?: number}}
    */
    {
      key: "shadeConfig",
      merge: true,
      factory: () => ({...partitionShadeDefaults}),
    },
    /**
        Comparator for sibling arcs, given two d3-hierarchy nodes. Defaults to
        descending by summed value, with any threshold bucket last.
        @type {function}
    */
    {
      key: "sort",
      default: partitionDefaultSort,
      decorate: partitionSortDecorate,
    },
    /**
        Accessor function or string key for the value each arc's angle is
        proportional to. Parent arcs sum their children.
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
        Path: {labelConfig: {fontResize: true}},
        // A thin outline in the chart's background color separates
        // neighboring arcs and rings by the same width everywhere.
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
    Draws a hierarchy as concentric rings, one per `groupBy` level, where each
    node's arc angle is proportional to its summed value. Click an arc to zoom
    into it; click the center (or Back) to zoom out.
*/
export default makeChart(sunburstDef);
