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

import {backgroundColor} from "@d3plus/dom";
import {formatAbbreviate} from "@d3plus/format";
import type {DataPoint} from "@d3plus/data";

import accessor from "../../utils/accessor.js";
import {centerChartTransform} from "../features/chartGeometry.js";
import {
  subtitleFeature,
  titleFeature,
  totalFeature,
} from "../features/features.js";
import {colorScaleBucketShare} from "../features/colorScaleBucket.js";
import {summedShare} from "../features/shareKey.js";
import type {DataDrivenChartDefinition} from "../definition/ChartDefinition.js";
import type {D3plusConfig} from "../../utils/D3plusConfig.js";
import {makeChart} from "../definition/makeChart.js";
import {sceneInsetRegion} from "../pipeline/insetPlacement.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {thresholdFunction} from "../Treemap/thresholdFunction.js";

import {applySunburstLayout} from "./applyLayout.js";
import {sunburstEmit} from "./emit.js";
import {sunburstHandlers} from "./interaction.js";
import {sunburstSort} from "./partition.js";
import {sunburstShadeDefaults} from "./shade.js";
import type {SunburstSort} from "./partition.js";

/** The "Share" tooltip row: a node's share of the drawn whole. */
function shareRow(viz: VizInstance): unknown[] {
  return [
    () => viz.schema.translate("Share"),
    (_d: DataPoint, _i: number, x: Record<string, unknown>) => {
      const pct = (s: number) =>
        `${formatAbbreviate(s * 100, viz.schema.locale)}%`;
      // A ColorScale range swatch carries no per-row share, so sum the share
      // of every datum that falls in its color range.
      if (x._isColorScaleBucket) {
        const s = colorScaleBucketShare(
          viz,
          x.color,
          viz.schema.sum as (d: DataPoint, i: number) => number,
        );
        return s == null ? "" : pct(s);
      }
      // A Legend bucket aggregates rows; sum its members' shares.
      const share = summedShare(x);
      return Number.isFinite(share) ? pct(share) : "";
    },
  ];
}

export const sunburstDef: DataDrivenChartDefinition = {
  name: "Sunburst",

  features: [titleFeature, subtitleFeature, totalFeature],
  layoutStage: applySunburstLayout,
  emit: sunburstEmit,
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

  setup: (viz: VizInstance) => {
    // Shading applies only while these stay the chart's own defaults.
    viz.ctx.sunburstDefaultColor = viz.schema.color;
    viz.ctx.sunburstDefaultFill = (
      viz.schema.shapeConfig as Record<string, unknown>
    ).fill;
    Object.assign(
      viz.schema.on,
      sunburstHandlers(
        viz,
        ((viz.schema.tooltipConfig as {tbody?: unknown[][]}).tbody ?? [])[0] ??
          [],
      ),
    );
  },

  // Small-multiple panels as close to square as the grid allows.
  facet: {aspect: 1},

  ctx: {},

  fields: [
    /**
        The center slot's radius: pixels, or a function of the outer radius.
        Defaults to one ring's thickness (see `ringSize`).
    */
    {key: "innerRadius"},
    /** Angular gap between neighboring arcs, in radians; overrides `padPixel`. */
    {key: "padAngle", default: 0},
    /** Gap between neighboring arcs, in pixels, kept even across rings. */
    {key: "padPixel", default: 0},
    /**
        Ring radii: `"equal"` gives every ring the same thickness; `"area"`
        gives every ring the same area.
    */
    {key: "ringSize", default: "equal"},
    /**
        Lightens each ring below the top one a step more than the ring inside
        it (see `shadeConfig`). Applies only to the default colors: a custom
        `color`, `shapeConfig.fill`, or `colorScale` is drawn as given.
    */
    {key: "shade", default: true},
    /**
        Shading strengths, as `colorLighter` amounts (0–1): `step` per
        `groupBy` level below the top ring, up to `max`.
    */
    {
      key: "shadeConfig",
      merge: true,
      factory: () => ({...sunburstShadeDefaults}),
    },
    {
      key: "sort",
      default: ((a, b) => (b.value ?? 0) - (a.value ?? 0)) as SunburstSort,
      decorate: (_viz, base) => sunburstSort(base as SunburstSort),
    },
    {
      key: "sum",
      default: accessor("value"),
      coerce: v => (typeof v === "function" ? v : accessor(v as string)),
      onSet: (viz, v) => {
        viz.schema.thresholdKey = v;
      },
    },
    {
      key: "shapeConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        Path: {labelConfig: {fontResize: true}},
        // A thin outline in the chart's background color separates
        // neighboring arcs and rings by the same width everywhere.
        stroke: () => backgroundColor(viz._select?.node()),
        strokeWidth: 1,
      }),
    },
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        tbody: [shareRow(viz)],
      }),
    },
    {
      key: "legendTooltip",
      merge: true,
      factory: () => ({tbody: []}),
    },
    {
      key: "legendSort",
      factory: (viz: VizInstance) => {
        const sumFn = viz.schema.sum as (d: DataPoint) => number;
        return (a: DataPoint, b: DataPoint) => sumFn(b) - sumFn(a);
      },
    },
    {
      key: "legend",
      coerce: "const",
      factory: (viz: VizInstance) => {
        const base = viz.schema.legend as (
          config: D3plusConfig,
          arr: DataPoint[],
        ) => unknown;
        return (config: D3plusConfig, arr: DataPoint[]) => {
          if (arr.length === viz._filteredData.length) return false;
          return base.call(viz, config, arr);
        };
      },
    },
  ],
};

/**
    Draws a hierarchy as concentric rings, one per `groupBy` level, where each
    node's arc angle is proportional to its summed value. Click an arc to zoom
    into it; click the center (or Back) to zoom out.
*/
export default makeChart(sunburstDef);
