/**
    RadialBar — bars bent around a circle. By default each row is a
    concentric track whose arc length encodes its value; `discrete("angle")`
    turns it into a circular bar chart, each row a bar radiating outward from
    an inner circle whose length encodes its value.

    Implementation files in this folder:
      - `applyLayout.ts` — chart-specific `TransformStage`.
      - `tracks.ts` — pure track radii and label room.
      - `trackLayout.ts` — the concentric-track layout and its chrome.
      - `emit.ts` — bars with track-sized hit areas.
*/

import type {DataPoint} from "@d3plus/data";
import {backgroundColor} from "@d3plus/dom";
import {formatAbbreviate} from "@d3plus/format";

import accessor from "../../utils/accessor.js";
import {centerChartTransform, chartBounds} from "../features/chartGeometry.js";
import {
  subtitleFeature,
  titleFeature,
  totalFeature,
} from "../features/features.js";
import type {DataDrivenChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import {gridStroke} from "../../components/Axis/gridStroke.js";
import {mergeConfig} from "../../fluent.js";
import {dialDefaults} from "../Gauge/emit.js";
import {sceneInsetRegion} from "../pipeline/insetPlacement.js";
import {polarAxisConfig, polarLegend, polarValueRow} from "../polar/config.js";
import {polarFacetHooks} from "../polar/polarFacet.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {applyRadialBarLayout, radialBarDomainValues} from "./applyLayout.js";
import {radialBarEmit} from "./emit.js";
import {radialBarTrackLabels} from "./trackLayout.js";

export const radialBarDef: DataDrivenChartDefinition = {
  name: "RadialBar",

  features: [titleFeature, subtitleFeature, totalFeature],
  layoutStage: applyRadialBarLayout,
  emit: radialBarEmit,
  insetRegion: sceneInsetRegion,

  // Centered on the circle, which partial sweeps shift off the area's center.
  chartTransform: (viz: VizInstance) => {
    const {width, height} = chartBounds(viz);
    const t = centerChartTransform(viz, width, height);
    const c = viz.ctx.polar as {cx?: number; cy?: number} | undefined;
    return {x: (t.x ?? 0) + (c?.cx ?? 0), y: (t.y ?? 0) + (c?.cy ?? 0)};
  },

  // The circle the bars fill, in the centered chart frame.
  chartBodyRect: (viz: VizInstance) => {
    const r = (viz.ctx.polar as {outer?: number} | undefined)?.outer ?? 0;
    return {x: -r, y: -r, width: r * 2, height: r * 2};
  },

  // Square-ish small-multiple panels, each fit to its own values unless
  // `facetConfig.scales` is "shared".
  facet: polarFacetHooks(radialBarDomainValues),

  ctx: {},

  fields: [
    /**
        Which polar dimension holds the categories: `"radius"` (default) gives
        each row a concentric track whose arc length shows its value;
        `"angle"` gives each row an equal slice of the circle, with a bar
        whose length shows its value (a circular bar chart).
        @type {"radius" | "angle"}
    */
    {key: "discrete", default: "radius"},
    /**
        The `[min, max]` the bars span. Either end may be left `undefined` to
        come from the data, rounded out to nice numbers and including zero.
        @type {[number, number]}
    */
    {key: "domain"},
    /**
        The radius of the empty center, in pixels, or a function of the outer
        radius.
        @type {number | function}
    */
    {key: "innerRadius", default: (outer: number) => outer / 4},
    /** Formats the circular bar chart's ring value labels. */
    {key: "levelFormat"},
    /** Direction of the circular bar chart's ring value labels, in degrees clockwise from 12 o'clock. */
    {key: "levelLabelAngle", default: 0},
    /** Whether the circular bar chart labels each value ring with its value. */
    {key: "levelLabels", default: true},
    /**
        The circular bar chart's value rings: an approximate count, or an array
        of exact values.
        @type {number | number[]}
    */
    {key: "levels", default: 4},
    /**
        The sweep the chart spans, in degrees from `startAngle`. Defaults to
        270 for tracks, leaving the quarter before the start for the track
        labels (past 330°, too little room is left, so the legend names the
        tracks instead), and 360 for the circular bar chart.
    */
    {key: "maxAngle"},
    /** Room (px) reserved around the circular bar chart for its category labels, or `"auto"`. */
    {key: "outerPadding", default: "auto"},
    /** Angular gap between neighboring bars of the circular bar chart, in radians; overrides `padPixel`. */
    {key: "padAngle", default: 0},
    /** Gap between neighboring bars of the circular bar chart, in pixels. */
    {key: "padPixel", default: 0},
    /** Orders the rows (outermost track, or first bar, first). Defaults to descending value; `null` keeps data order. */
    {
      key: "sort",
      factory: (viz: VizInstance) => (a: DataPoint, b: DataPoint) => {
        const valueFn = viz.schema.value as (d: DataPoint) => number;
        return valueFn(b) - valueFn(a);
      },
    },
    /** Where the sweep starts, in degrees clockwise from 12 o'clock. */
    {key: "startAngle", default: 0},
    /** Formats the value tick labels around the tracks. Defaults to the abbreviated number format. */
    {
      key: "tickFormat",
      factory: (viz: VizInstance) => (n: number) =>
        formatAbbreviate(n, viz.schema.locale),
    },
    /**
        The value ticks around the tracks: a target count, an explicit array
        of values, or `false` for none. Counted ticks always include both ends.
        @type {number | number[] | false}
    */
    {key: "ticks"},
    /** Whether to draw a background track behind every bar. */
    {key: "track", default: true},
    /** Share of each track (or each bar's slice of the circle) left as a gap between neighbors. */
    {key: "trackPadding", default: 0.25},
    /** Accessor for each row's value. */
    {
      key: "value",
      default: accessor("value"),
      coerce: v => (typeof v === "function" ? v : accessor(v as string)),
    },
    {
      key: "legend",
      coerce: "const",
      // Track labels name every row, unless the sweep leaves them no room.
      factory: (viz: VizInstance) =>
        polarLegend(
          viz,
          v => v.schema.discrete === "angle" || radialBarTrackLabels(v),
        ),
    },
    /** Styles the circular bar chart's ring value labels. */
    {key: "levelLabelConfig", default: {}, merge: true},
    /**
        Styles the chrome like a Plot axis: `gridConfig` the value gridlines
        (spokes across the tracks, or the inner rings of the circular bar
        chart), `barConfig` its outer ring, and `shapeConfig.labelConfig`
        the track, tick, and category labels.
    */
    {
      key: "axisConfig",
      merge: true,
      factory: (viz: VizInstance) =>
        mergeConfig(polarAxisConfig(viz), {
          // Gridlines cut through the background tracks in the chart's
          // background color; without tracks they take the usual faint stroke.
          gridConfig: {
            stroke: () =>
              viz.schema.track === false
                ? gridStroke(viz._select?.node(), viz.schema.colorDefaults)
                : backgroundColor(viz._select?.node()),
          },
        }),
    },
    /**
        Paints the background tracks: `fill`, `opacity`, `stroke`,
        `strokeWidth`.
        @type {object}
    */
    {
      key: "trackConfig",
      merge: true,
      factory: (viz: VizInstance) => ({fill: () => dialDefaults(viz).track}),
    },
    {
      key: "shapeConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        stroke: () => backgroundColor(viz._select?.node()),
        strokeWidth: 1,
      }),
    },
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({tbody: [polarValueRow(viz)]}),
    },
  ],
};

/**
    Creates a radial bar chart from an array of data: each row is a
    concentric track whose arc length shows its value, or, with
    `discrete("angle")`, a bar radiating out from an inner circle.
*/
export default makeChart(radialBarDef);
