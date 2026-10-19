/**
    ParallelCoordinates — one axis per dimension, each row drawn as a line
    through its value on every axis.

    Implementation files in this folder:
      - `dimensions.ts` — which keys get an axis, their types and domains.
      - `axes.ts` — one Axis per dimension, laid out with its title.
      - `titles.ts` — dimension titles (TextBox).
      - `paths.ts` — each row's crossing points and path.
      - `applyLayout.ts` — chart-specific `TransformStage`.
      - `emit.ts` — a path (plus hit path) per row.
      - `brushFilter.ts` — brush ↔ data filter math.
      - `brushDom.ts` — the d3-brush strips over each axis.
      - `lineStates.ts` — paint-time brush and hover line states.
      - `format.ts` — value formatting for tooltips and labels.
*/

import type {DataPoint} from "@d3plus/data";
import type {Scene} from "@d3plus/render";

import {subtitleFeature, titleFeature, totalFeature} from "../features/features.js";
import type {DataDrivenChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import {backgroundInk} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {applyParallelLayout, BRUSH_WIDTH, parallelDimensionKeys} from "./applyLayout.js";
import {syncBrushDom} from "./brushDom.js";
import type {BrushTarget} from "./brushDom.js";
import type {BrushSelection} from "./brushFilter.js";
import {sharedDomains} from "./dimensions.js";
import type {DimensionOptions} from "./dimensions.js";
import {parallelEmit} from "./emit.js";
import {dimensionTooltipRows} from "./format.js";
import {applyLineStates} from "./lineStates.js";

/** `brushConfig` with every function value called. */
export function resolveBrushStyle(config: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(config)) out[k] = typeof v === "function" ? (v as () => unknown)() : v;
  return out;
}

/**
    Applies the brush and hover line states to every scene the chart builds,
    and after a new layout syncs the brush strips. The sync lives here, not
    in the layout stage, because the layout queues one strip per axis per
    small-multiples panel: the first scene built after a layout is the first
    point where every panel's strips are known.
*/
function decorateParallelScene(viz: VizInstance, scene: Scene): Scene {
  const style = resolveBrushStyle((viz.schema.brushConfig ?? {}) as Record<string, unknown>);
  const queue = viz.ctx.brushQueue as BrushTarget[] | undefined;
  if (queue) {
    viz.ctx.brushQueue = undefined;
    syncBrushDom(viz, queue, style);
  }
  const root = applyLineStates(scene.root, {
    brushes: viz.schema.brushes as BrushSelection | undefined,
    inactiveOpacity: typeof style.inactiveOpacity === "number" ? style.inactiveOpacity : undefined,
  });
  return root === scene.root ? scene : {...scene, root: root as Scene["root"]};
}

export const parallelCoordinatesDef: DataDrivenChartDefinition = {
  name: "ParallelCoordinates",

  features: [titleFeature, subtitleFeature, totalFeature],
  layoutStage: applyParallelLayout,
  emit: parallelEmit,
  decorateScene: decorateParallelScene,

  facet: {
    aspect: 3 / 2,
    axes: "all",
    share: (viz: VizInstance, panels: DataPoint[][]) =>
      sharedDomains(
        parallelDimensionKeys(viz),
        panels.flat(),
        (viz.schema.dimensionConfig ?? {}) as Record<string, DimensionOptions | undefined>,
      ),
    panel: (viz: VizInstance, ctx) => {
      const previous = viz.ctx.sharedDomains;
      viz.ctx.sharedDomains = ctx.shared ? ctx.scales : undefined;
      return () => {
        viz.ctx.sharedDomains = previous;
      };
    },
  },

  ctx: {},

  fields: [
    /**
        The active brush filters, keyed by dimension: a numeric `[min, max]`,
        or the selected categories. Brushing an axis updates it; set it to
        brush from code, or to `{}` to clear every brush.
        @type {Record<string, [number, number] | string[]>}
    */
    {key: "brushes", default: {}},
    /**
        Whether each axis can be brushed to filter the lines. Drag along an
        axis to brush it. To clear a brush, click its axis outside the
        selection, double-click the axis, or press Escape while the brushed
        axis has keyboard focus.
    */
    {key: "brushing", default: true},
    /**
        `"linear"` draws straight segments between axes; `"bump"` curves into and out of each axis.
        @type {"linear" | "bump"}
    */
    {key: "curve", default: "linear"},
    /**
        Above this many lines, hovering stops dimming the others and redraws
        skip their transitions. Raised from the usual 100, since following one
        line through a dense chart is what hovering is for.
    */
    {key: "dataCutoff", default: 2000},
    /**
        The data keys to draw an axis for, in order. Defaults to every numeric
        key in the data except the `groupBy` keys and `id`. A key whose values
        aren't all numbers gets a categorical (point) axis.
        @type {string[]}
    */
    {key: "dimensions"},
    /**
        The lines' stroke opacity: a number, or `"auto"` (the default) to fade
        the lines as their number grows, so dense data reads as density.
        @type {number | "auto"}
    */
    {key: "lineOpacity", default: "auto"},
    /**
        `"horizontal"` (default) lays the axes out left to right; `"vertical"` stacks them top to bottom.
        @type {"horizontal" | "vertical"}
    */
    {key: "orient", default: "horizontal"},
    /** Zooming would slide the axes out from under their brushes, so it's off by default. */
    {key: "zoom", default: false},
    /**
        Axis config shared by every dimension's axis (`titleConfig` styles the dimension titles).
        @type {object}
    */
    {key: "axisConfig", merge: true, default: {}},
    /**
        The brush strips: `width` (px), the selection's `fill`, `fillOpacity`,
        `stroke`, and `strokeWidth`, and `inactiveOpacity`, the stroke opacity
        of the (grayed) lines outside the brushes, which by default keep 30%
        of their own opacity.
        @type {object}
    */
    {
      key: "brushConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        fill: () => backgroundInk(viz),
        fillOpacity: 0.12,
        stroke: () => backgroundInk(viz),
        strokeWidth: 1,
        width: BRUSH_WIDTH,
      }),
    },
    /**
        Per-dimension options, keyed by dimension: `domain`, `reverse`,
        `title`, and any Axis config (`tickFormat`, `ticks`, `scale`, …).
        @type {Record<string, object>}
    */
    {key: "dimensionConfig", merge: true, default: {}},
    {
      key: "shapeConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        Line: {
          stroke: (d: DataPoint, i: number) => {
            const fill = viz.schema.shapeConfig.fill;
            return typeof fill === "function" ? fill(d, i) : fill;
          },
          strokeWidth: 1.5,
        },
      }),
    },
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        tbody: (d: DataPoint) => dimensionTooltipRows(viz, d),
      }),
    },
  ],
};

/**
    Creates a parallel coordinates chart from an array of data: one axis per
    dimension and one line per row, crossing each axis at the row's value.
    Brush along an axis to filter the lines; double-click it to clear the brush.
*/
export default makeChart(parallelCoordinatesDef);
