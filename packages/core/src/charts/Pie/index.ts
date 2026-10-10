/**
    Pie — d3-shape pie layout, one path per slice.

    Implementation files in this folder:
      - `applyLayout.ts` — chart-specific `TransformStage`.
      - `emit.ts` — Path + label scene nodes from the laid-out slices.
*/

import {pie as d3Pie} from "d3-shape";
import {backgroundColor} from "@d3plus/dom";
import {formatAbbreviate} from "@d3plus/format";
import type {DataPoint} from "@d3plus/data";

import accessor from "../../utils/accessor.js";
import {centerChartTransform} from "../features/chartGeometry.js";
import {subtitleFeature, titleFeature, totalFeature} from "../features/features.js";
import {colorScaleBucketShare} from "../features/colorScaleBucket.js";
import {summedShare} from "../features/shareKey.js";
import type {DataDrivenChartDefinition} from "../definition/ChartDefinition.js";
import type {D3plusConfig} from "../../utils/D3plusConfig.js";
import {makeChart} from "../definition/makeChart.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {applyPieLayout} from "./applyLayout.js";
import {pieEmit} from "./emit.js";
import {sceneInsetRegion} from "../pipeline/insetPlacement.js";

export const pieDef: DataDrivenChartDefinition = {
  name: "Pie",

  features: [titleFeature, subtitleFeature, totalFeature],
  layoutStage: applyPieLayout,
  emit: pieEmit,
  insetRegion: sceneInsetRegion,

  chartTransform: (viz: VizInstance) =>
    centerChartTransform(
      viz,
      viz.ctx.pieWidth as number,
      viz.ctx.pieHeight as number,
    ),

  // Pie's chartTransform centers the origin — wedges are drawn in
  // [-pieWidth/2, pieWidth/2] × [-pieHeight/2, pieHeight/2], not the
  // top-left-origin box the default chartBodyRect assumes (that default is
  // only correct for a marginOriginTransform chart like Treemap). Without
  // this override, the drill-down morph's enter/exit fractions would be
  // computed against the wrong origin.
  //
  // Uses the TIGHT circle (radius = pieOuterRadius, applyPieLayout's own
  // actual, buffer-reduced outerRadius — see its comment on strokeBuffer)
  // rather than the loose pieWidth × pieHeight box: pieWidth/pieHeight is
  // the available space (not square when the chart area isn't, and larger
  // than the wedges' real size by the hover-stroke buffer), and the
  // drill-down morph's proportional remap (collapseTo's shapeType "Pie"
  // case) uses this as the "whole pie" reference — a mismatched reference
  // would stretch the circle into an ellipse, or off-scale it, as it grows.
  chartBodyRect: (viz: VizInstance) => {
    const r = (viz.ctx.pieOuterRadius as number) ?? 0;
    return {x: -r, y: -r, width: r * 2, height: r * 2};
  },

  // Small-multiple panels as close to square as the grid allows.
  facet: {aspect: 1},

  ctx: {
    pie: d3Pie(),
  },

  fields: [
    /**
        The inner radius of the Pie, in pixels, or a function that returns one;
        a nonzero value makes a Donut.
        @type {number | function}
    */
    {key: "innerRadius", default: 0},
    /**
        The padding between each arc, in radians. When set, takes precedence
        over `padPixel`.
        @type {number}
    */
    {key: "padAngle"},
    // Not used for the default wedge-to-wedge gap (see shapeConfig's
    // stroke/strokeWidth below) — an angular gap's LINEAR width is
    // proportional to radius, so it inevitably tapers to nothing as it
    // approaches the pie's center, which a full (non-donut) Pie always
    // touches. Left at 0; still available for a user who explicitly wants
    // the angular look anyway.
    /**
        The padding between each arc, in pixels, converted to an angle at the
        outer radius. Ignored when `padAngle` is set.
    */
    {key: "padPixel", default: 0},
    /**
        The accessor function or key for each data point's value, which sizes
        its slice.
        @type {string | function}
    */
    {
      key: "value",
      default: accessor("value"),
      coerce: v => (typeof v === "function" ? v : accessor(v as string)),
    },
    /**
        A comparator function that sorts the Pie slices. Defaults to descending
        by `value`.
    */
    {
      key: "sort",
      factory: (viz: VizInstance) => {
        const valueFn = viz.schema.value as (d: DataPoint) => number;
        return (a: DataPoint, b: DataPoint) => valueFn(b) - valueFn(a);
      },
    },
    {
      key: "legendSort",
      factory: (viz: VizInstance) => {
        const valueFn = viz.schema.value as (d: DataPoint) => number;
        return (a: DataPoint, b: DataPoint) => valueFn(b) - valueFn(a);
      },
    },
    {
      key: "shapeConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        ariaLabel: (d: DataPoint, i: number) => {
          const pieData = viz.ctx.pieData as {index: number}[] | undefined;
          if (!pieData) return "";
          return `${++pieData[i].index}. ${viz._drawLabel(d, i)}, ${(viz.schema.value as (d: DataPoint, i: number) => number)(d, i)}.`;
        },
        Path: {labelConfig: {fontResize: true}},
        // A visual, constant-WIDTH gap between wedges: an SVG stroke is
        // measured in screen pixels regardless of the underlying path's
        // radius, unlike padAngle (see padPixel's default above), so
        // matching it to the chart's own background color "cuts out" an
        // even border everywhere — including near the center, where an
        // angular gap has nowhere left to taper from. Centered on each
        // wedge's outline (SVG's default), so half its width falls on each
        // side of an edge shared with a neighbor.
        stroke: () => backgroundColor(viz._select?.node()),
        strokeWidth: 2,
      }),
    },
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        tbody: [
          [
            () => viz.schema.translate("Share"),
            (_d: DataPoint, _i: number, x: Record<string, unknown>) => {
              // A ColorScale range swatch carries no per-row share, so sum the
              // share of every datum that falls in its color range.
              if (x._isColorScaleBucket) {
                const s = colorScaleBucketShare(
                  viz,
                  x.color,
                  viz.schema.value as (d: DataPoint, i: number) => number,
                );
                return s == null
                  ? ""
                  : `${formatAbbreviate(s * 100, viz.schema.locale)}%`;
              }
              // A Legend bucket aggregates multiple rows; sum its members' shares.
              const share = summedShare(x);
              if (!Number.isFinite(share)) return "";
              return `${formatAbbreviate(share * 100, viz.schema.locale)}%`;
            },
          ],
        ],
      }),
    },
    {
      key: "legend",
      coerce: "const",
      factory: (viz: VizInstance) => {
        const base = viz.schema.legend as (config: D3plusConfig, arr: DataPoint[]) => unknown;
        return (config: D3plusConfig, arr: DataPoint[]) => {
          if (arr.length === viz._filteredData.length) return false;
          return base.call(viz, config, arr);
        };
      },
    },
  ],
};

/**
    Uses the d3 pie layout to create SVG arcs based on an array of data.
*/
export default makeChart(pieDef);
