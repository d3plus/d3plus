/**
    Gauge — a dial that reads values against a fixed range, with a
    needle or a progress arc, tick marks, and optional colored bands.

    Implementation files in this folder:
      - `gaugeGeometry.ts` — pure math: angles, domain, ticks, bands, fit.
      - `dialLayout.ts` — the dial's radii and font sizes for a radius.
      - `applyLayout.ts` — chart-specific `TransformStage`.
      - `emitDial.ts` — the dial's static scene nodes.
      - `emit.ts` — the dial plus one indicator per row.
*/

import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";

import accessor from "../../utils/accessor.js";
import constant from "../../utils/constant.js";
import {
  subtitleFeature,
  titleFeature,
  totalFeature,
} from "../features/features.js";
import type {DataDrivenChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {applyGaugeLayout} from "./applyLayout.js";
import {chartBackground, gaugeEmit, NEEDLE_OUTLINE} from "./emit.js";

export const gaugeDef: DataDrivenChartDefinition = {
  name: "Gauge",

  features: [titleFeature, subtitleFeature, totalFeature],
  layoutStage: applyGaugeLayout,
  emit: gaugeEmit,

  ctx: {},

  fields: [
    /**
        Styles the dial: `shapeConfig.fill` colors the track,
        `shapeConfig.stroke`/`strokeWidth` the tick marks, and
        `shapeConfig.labelConfig` (`fontColor`, `fontFamily`, `fontSize`) the
        tick, value, and name labels. Unset colors follow the chart's
        background, so the dial reads on light and dark themes alike.
        @type {{shapeConfig: {fill, stroke, strokeWidth, labelConfig}}}
    */
    {key: "axisConfig", merge: true},
    /**
        Colored zones along the dial, in order: `[{max: 60, color: "#2f9e44"},
        {max: 85, color: "#f59f00"}, {color: "#e03131"}]`. Each band starts at
        its own `min`, else where the previous band ended; it ends at its own
        `max`, else the domain's maximum. Bands are drawn on the track behind the
        needles, or as a thin strip inside the progress tracks.
        @type {GaugeBand[]}
    */
    {key: "bands", default: []},
    /**
        The `[min, max]` the dial spans. Either end may
        be left `undefined` to come from the data (and any band edges), rounded
        outward to nice numbers and always including zero. Values outside the
        domain pin the indicator to the nearest end.
        @type {[number, number]}
    */
    {key: "domain"},
    /** The angle, in degrees clockwise from 12 o'clock, where the dial ends. */
    {key: "endAngle", default: 120},
    /**
        How each row shows its value: `"needle"` (default) points a needle at
        it; `"progress"` fills a track from the minimum up to it, with one
        concentric track per row stepping inward.
        @type {"needle" | "progress"}
    */
    {key: "indicator", default: "needle"},
    /** Whether to draw unlabeled minor ticks between the major ticks. */
    {key: "minorTicks", default: true},
    /** The angle, in degrees clockwise from 12 o'clock, where the dial starts. */
    {key: "startAngle", default: -120},
    /** The track's thickness, as a fraction of the dial's radius. */
    {key: "thickness", default: 0.2},
    /** Formats the tick labels. Defaults to the locale's abbreviated number format. */
    {
      key: "tickFormat",
      factory: (viz: VizInstance) => (n: number) =>
        formatAbbreviate(n, viz.schema.locale),
    },
    /**
        The major ticks: a target count, an explicit array of values, or
        `false` for none. Counted ticks always label both ends of the domain.
        @type {number | number[] | false}
    */
    {key: "ticks"},
    /**
        Outlines each needle (and a single needle's hub) in the chart's
        background color, so a needle stays distinct over a band of its own
        color. Progress arcs sit in their own tracks and get no outline. Set
        `shapeConfig.stroke`/`strokeWidth` to override; hovering a needle
        swaps the outline for the usual darker, wider one.
    */
    {
      key: "shapeConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        stroke: () => chartBackground(viz),
        strokeWidth: () =>
          viz.schema.indicator === "progress" ? 0 : NEEDLE_OUTLINE,
      }),
    },
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        tbody: [
          [
            () => viz.schema.translate("Value"),
            (d: DataPoint, i: number) => {
              const v = Number(
                (viz.schema.value as (d: DataPoint, i: number) => unknown)(
                  d,
                  i,
                ),
              );
              return Number.isFinite(v)
                ? `${(viz.schema.valueFormat as (v: number, d: DataPoint) => string)(v, d)}`
                : "";
            },
          ],
        ],
      }),
    },
    /**
        Accessor function or string key for each row's value (a number is used
        as a constant value for every row).
        @type {string | function}
    */
    {
      key: "value",
      default: accessor("value"),
      coerce: v =>
        typeof v === "function"
          ? v
          : typeof v === "string"
            ? accessor(v)
            : constant(v as never),
    },
    /**
        Formats the value shown under the hub and in each tooltip, as
        `(value, datum) => string`. Defaults to the locale's abbreviated number
        format.
    */
    {
      key: "valueFormat",
      factory: (viz: VizInstance) => (n: number) =>
        formatAbbreviate(n, viz.schema.locale),
    },
    /** Zooming and panning don't help read a dial, so they're off by default. */
    {key: "zoom", default: false},
  ],
};

/**
    Creates a gauge (speedometer) from an array of data: a single dial that
    reads each row's `value` against its `domain`. One row shows its value
    under the hub; several rows each get a needle (or a progress track),
    identified by the legend and tooltips.
*/
export default makeChart(gaugeDef);
