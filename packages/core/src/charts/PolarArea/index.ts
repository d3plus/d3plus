/**
    PolarArea — a Nightingale rose (coxcomb): equal-angle wedges whose radius
    encodes value, with each category's `groupBy` rows stacked outward.

    Implementation files in this folder:
      - `applyLayout.ts` — chart-specific `TransformStage` (see
        `../polar/wedgeLayout.ts` for the geometry it shares with RadialBar).
      - `emit.ts` — wedge Paths.
*/

import type {DataPoint} from "@d3plus/data";

import accessor from "../../utils/accessor.js";
import {centerChartTransform, chartBounds} from "../features/chartGeometry.js";
import {
  subtitleFeature,
  titleFeature,
  totalFeature,
} from "../features/features.js";
import type {DataDrivenChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import {sceneInsetRegion} from "../pipeline/insetPlacement.js";
import {backgroundColor} from "@d3plus/dom";
import {polarAxisConfig, polarLegend, polarValueRow} from "../polar/config.js";
import {polarFacetHooks} from "../polar/polarFacet.js";
import type {PolarFrame} from "../polar/wedgeLayout.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {applyPolarAreaLayout, polarAreaDomainValues} from "./applyLayout.js";
import {polarAreaEmit} from "./emit.js";

export const polarAreaDef: DataDrivenChartDefinition = {
  name: "PolarArea",

  features: [titleFeature, subtitleFeature, totalFeature],
  layoutStage: applyPolarAreaLayout,
  emit: polarAreaEmit,
  insetRegion: sceneInsetRegion,

  chartTransform: (viz: VizInstance) => {
    const {width, height} = chartBounds(viz);
    return centerChartTransform(viz, width, height);
  },

  // The circle the wedges fill, in the centered chart frame.
  chartBodyRect: (viz: VizInstance) => {
    const r = (viz.ctx.polar as PolarFrame | undefined)?.outer ?? 0;
    return {x: -r, y: -r, width: r * 2, height: r * 2};
  },

  // Square-ish small-multiple panels, each fit to its own values unless
  // `facetConfig.scales` is "shared".
  facet: polarFacetHooks(polarAreaDomainValues),

  ctx: {},

  fields: [
    // Nests rows by `metric`, so each category keeps one row per group.
    {key: "discrete", default: "metric"},
    /**
        The `[min, max]` the radius spans. Either end may be left `undefined`
        to come from the data, rounded out to nice numbers and including zero.
        @type {[number, number]}
    */
    {key: "domain"},
    /**
        The radius of the empty center, in pixels, or a function of the outer
        radius.
        @type {number | function}
    */
    {key: "innerRadius", default: 0},
    /** Formats the ring value labels. Defaults to the abbreviated number format. */
    {key: "levelFormat"},
    /** Direction of the ring value labels, in degrees clockwise from 12 o'clock. */
    {key: "levelLabelAngle", default: 0},
    /** Whether each value ring is labeled with its value. */
    {key: "levelLabels", default: true},
    /**
        The value rings: an approximate count (the domain rounds out to nice
        values and the rings sit on its ticks), or an array of exact values.
        @type {number | number[]}
    */
    {key: "levels", default: 4},
    /**
        The category each wedge belongs to. Rows sharing a `metric` share one
        slice of the circle, their `groupBy` groups stacked outward from the
        center in data order. Unset, every row is its own category.
        @type {string | function}
    */
    {
      key: "metric",
      coerce: v =>
        typeof v === "function"
          ? v
          : typeof v === "string"
            ? accessor(v)
            : undefined,
    },
    /**
        Room (px) reserved around the circle for the category labels, or
        `"auto"` to size the circle to the measured labels.
    */
    {key: "outerPadding", default: "auto"},
    /** Angular gap between neighboring wedges, in radians; overrides `padPixel`. */
    {key: "padAngle", default: 0},
    /** Gap between neighboring wedges, in pixels. */
    {key: "padPixel", default: 0},
    /**
        How values map onto radii: `"sqrt"` (default) makes each wedge's area
        proportional to its value; `"linear"` makes its radius proportional.
    */
    {key: "radialScale", default: "sqrt"},
    /** Where the first category starts, in degrees clockwise from 12 o'clock. */
    {key: "startAngle", default: 0},
    /** Accessor for each row's value. */
    {
      key: "value",
      default: accessor("value"),
      coerce: v => (typeof v === "function" ? v : accessor(v as string)),
    },
    {key: "legend", coerce: "const", factory: polarLegend},
    /** Styles the ring value labels: `fontColor`, `fontFamily`, `fontOpacity`, `fontSize`, `fontWeight`. */
    {key: "levelLabelConfig", default: {}, merge: true},
    /**
        Styles the chrome like a Plot axis: `gridConfig` the inner value rings,
        `barConfig` the outer ring, and `shapeConfig.labelConfig` the category
        labels.
    */
    {key: "axisConfig", merge: true, factory: polarAxisConfig},
    {
      key: "shapeConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        // A thin outline in the chart's background color separates
        // neighboring wedges by the same width everywhere.
        stroke: () => backgroundColor(viz._select?.node()),
        strokeWidth: 1,
      }),
    },
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => {
        const [label, value] = polarValueRow(viz);
        return {
          tbody: [
            [
              (d: DataPoint, i: number) => {
                const metric = viz.schema.metric as
                  ((d: DataPoint, i: number) => unknown) | undefined;
                return typeof metric === "function"
                  ? `${metric(d, i)}`
                  : (label as () => string)();
              },
              value,
            ],
          ],
        };
      },
    },
    {key: "legendTooltip", merge: true, factory: () => ({tbody: []})},
  ],
};

/**
    Creates a polar area chart (Nightingale rose or coxcomb) from an array of
    data: every category gets an equal slice of the circle, and each wedge's
    radius shows its value. With a `metric`, each category stacks its
    `groupBy` groups outward from the center.
*/
export default makeChart(polarAreaDef);
