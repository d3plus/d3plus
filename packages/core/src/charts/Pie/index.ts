/**
    Pie — d3-shape pie layout, one path per slice.

    Implementation files in this folder:
      - `applyLayout.ts` — chart-specific `TransformStage`.
      - `emit.ts` — Path + label scene nodes from the laid-out slices.
*/

import {pie as d3Pie} from "d3-shape";
import type {DataPoint} from "@d3plus/data";

import accessor from "../../utils/accessor.js";
import {fieldAccessor} from "../../utils/fieldAccessor.js";
import {chartBounds, centerChartTransform} from "../features/chartGeometry.js";
import type {DataDrivenChartDefinition} from "../definition/ChartDefinition.js";
import {rowLegend, shareRow} from "../features/sharedFields.js";
import {makeChart} from "../definition/makeChart.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {applyPieLayout, pieAspect} from "./applyLayout.js";
import type {ArcBox} from "./arcFit.js";
import {pieEmit} from "./emit.js";
import {sceneInsetRegion} from "../pipeline/insetPlacement.js";
import {chartBackground} from "../viz/backgroundInk.js";

export const pieDef: DataDrivenChartDefinition = {
  name: "Pie",

  layoutStage: applyPieLayout,
  emit: pieEmit,
  insetRegion: sceneInsetRegion,

  // The origin sits at the ring's center, which applyPieLayout fits to the
  // chart area along with the ring's own footprint.
  chartTransform: (viz: VizInstance) => {
    const center = viz.ctx.pieCenter as {x: number; y: number} | undefined;
    if (!center) {
      const {width, height} = chartBounds(viz);
      return centerChartTransform(viz, width, height);
    }
    return {x: viz._margin.left + center.x, y: viz._margin.top + center.y};
  },

  // Wedges are drawn around the centered origin, not in the top-left-origin
  // box the default chartBodyRect assumes (that default is only correct for
  // a marginOriginTransform chart like Treemap); without this override, the
  // drill-down morph's enter/exit fractions would be computed against the
  // wrong origin.
  //
  // Uses the ring's TIGHT footprint (pieBox, at applyPieLayout's actual,
  // buffer-reduced outerRadius — see its comment on strokeBuffer) rather
  // than the loose available space: the drill-down morph's proportional
  // remap (collapseTo's shapeType "Pie" case) uses this as the "whole pie"
  // reference, and a mismatched reference would stretch the ring, or
  // off-scale it, as it grows.
  chartBodyRect: (viz: VizInstance) => {
    const b = viz.ctx.pieBox as ArcBox | undefined;
    if (!b) return {x: 0, y: 0, width: 0, height: 0};
    return {x: b.x0, y: b.y0, width: b.x1 - b.x0, height: b.y1 - b.y0};
  },

  // Small-multiple panels shaped like the ring's footprint: as close to
  // square as the grid allows for a full circle, twice as wide as tall for a
  // half ring.
  facet: {aspect: pieAspect},

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
        Where the slices start, in degrees clockwise from 12 o'clock, the same
        convention Gauge, PolarArea and RadialBar use. With `endAngle`, draws a
        partial ring: `startAngle: -90, endAngle: 90` makes a half pie (or,
        with Donut, a half donut) that opens downward. A partial ring is sized
        to its own footprint and centered, so a half ring fills the chart's
        width.
    */
    {key: "startAngle", default: 0},
    /**
        Where the slices end, in degrees clockwise from 12 o'clock. Defaults to
        one full turn past `startAngle`; an `endAngle` less than `startAngle`
        lays the slices out counter-clockwise. The sweep is capped at one turn.
        @type {number}
    */
    {key: "endAngle"},
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
      coerce: v => (typeof v === "function" ? v : fieldAccessor(v as string)),
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
        stroke: () => chartBackground(viz),
        strokeWidth: 2,
      }),
    },
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        tbody: [shareRow(viz, "value")],
      }),
    },
    {key: "legend", coerce: "const", factory: rowLegend},
  ],
};

/**
    Uses the d3 pie layout to create SVG arcs based on an array of data.
*/
export default makeChart(pieDef);
