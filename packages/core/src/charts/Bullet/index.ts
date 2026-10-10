/**
    Bullet — Stephen Few's bullet graph: a compact linear gauge per row, with
    qualitative bands behind a measure bar, a target marker across it, and an
    optional forecast bar.

    Implementation files in this folder:
      - `bulletGeometry.ts` — pure math: bands, domain, ticks, value → pixel.
      - `bulletLayout.ts` — places the stack of bullets in the chart area.
      - `bulletStyle.ts` — theme-aware colors, fonts, and band shades.
      - `applyLayout.ts` — chart-specific `TransformStage`.
      - `emit.ts` — the scene nodes of each bullet.
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
import type {FacetHooks} from "../facet/facetConfig.js";
import type {D3plusConfig} from "../../utils/D3plusConfig.js";
import {makeChart} from "../definition/makeChart.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {
  applyBulletLayout,
  bulletExtents,
  bulletKey,
  rowNumber,
} from "./applyLayout.js";
import {chartBackground} from "../Gauge/emit.js";
import {bulletEmit} from "./emit.js";

/** The width of the background-colored outline around each measure bar. */
export const MEASURE_OUTLINE = 1;

type RowFn = (d: DataPoint, i: number) => unknown;

/**
    Coerces a per-row option: a function is kept, a string becomes a data-key
    accessor, a number becomes a constant, and anything else turns it off.
*/
export function rowAccessor(v: unknown): RowFn | false {
  if (typeof v === "function") return v as RowFn;
  if (typeof v === "string") return accessor(v);
  if (typeof v === "number") return constant(v) as RowFn;
  return false;
}

/** The tooltip's Value, Target, and Forecast rows, for whichever a row has. */
export function bulletTooltipRows(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): [string, string][] {
  const format = viz.schema.valueFormat as (v: number, d: DataPoint) => string;
  const rows: [string, string][] = [];
  for (const [key, label] of [
    ["value", "Value"],
    ["target", "Target"],
    ["forecast", "Forecast"],
  ]) {
    const v = rowNumber(viz.schema[key] as RowFn | false, d, i);
    if (Number.isFinite(v))
      rows.push([viz.schema.translate(label), `${format(v, d)}`]);
  }
  return rows;
}

/**
    Small multiples: with shared facet scales, a bullet reads against the same
    domain in every panel (by row id, or one domain with `sharedDomain`).
*/
export const bulletFacet: FacetHooks = {
  aspect: 2,
  share: (viz, panels) => bulletExtents(viz, panels.flat()),
  panel: (viz, ctx) => {
    if (ctx.shared && ctx.scales instanceof Map)
      viz.ctx.bulletFacet = ctx.scales;
    return () => {
      viz.ctx.bulletFacet = undefined;
    };
  },
};

export const bulletDef: DataDrivenChartDefinition = {
  name: "Bullet",

  features: [titleFeature, subtitleFeature, totalFeature],
  layoutStage: applyBulletLayout,
  emit: bulletEmit,
  facet: bulletFacet,

  ctx: {},

  fields: [
    /**
        Styles the bullets' static parts: `shapeConfig.fill` colors the empty
        track, `shapeConfig.stroke`/`strokeWidth` the tick marks, and
        `shapeConfig.labelConfig` (`fontColor`, `fontFamily`, `fontSize`) the
        tick and row labels. Unset colors follow the chart's background, so
        the bullets read on light and dark themes alike.
    */
    {key: "axisConfig", merge: true},
    /**
        The qualitative ranges behind each measure (e.g. poor / satisfactory /
        good). Either threshold values, `[60, 85]`, which split the domain
        into three bands, or Gauge-style band objects, `[{max: 60}, {max: 85,
        color: "#ffd43b"}, {}]`. Bands without a `color` are shades of one
        hue, contrasting most with the background first and stepping lighter.
        A function `(d, i) => bands` gives each row its own bands.
    */
    {key: "bands", default: []},
    /** The largest thickness of each bullet's band, in pixels. */
    {key: "bulletSize", default: 40},
    /**
        The `[min, max]` each bullet spans, or a function `(d, i) => [min,
        max]` for per-row domains. Either end may be left `undefined` to come
        from the row's values (measure, target, forecast) and band edges,
        rounded outward to nice numbers and always including zero.
    */
    {key: "domain"},
    /**
        Accessor for each row's forecast (or other comparative measure), drawn
        as a wider, paler bar behind the measure. A data key, a function, a
        number shared by every row, or `false` for none.
    */
    {key: "forecast", default: accessor("forecast"), coerce: rowAccessor},
    /**
        Each bullet is labeled at its start, so the legend only shows when its
        entries group the bullets (e.g. colored by a coarser category).
    */
    {
      key: "legend",
      coerce: "const",
      factory: (viz: VizInstance) => {
        const base = viz.schema.legend as (
          config: D3plusConfig,
          arr: DataPoint[],
        ) => unknown;
        return (config: D3plusConfig, arr: DataPoint[]) => {
          const rows = (viz._filteredData ?? []) as DataPoint[];
          const keys = new Set(rows.map((d, i) => bulletKey(viz, d, i)));
          if (arr.length >= keys.size) return false;
          return base.call(viz, config, arr);
        };
      },
    },
    /** The measure bar's thickness, as a fraction of the band's thickness. */
    {key: "measureSize", default: 0.35},
    /**
        Which way the bullets run: `"horizontal"` (default) stacks them as
        rows with values growing rightward; `"vertical"` lines them up as
        columns with values growing upward.
    */
    {key: "orient", default: "horizontal"},
    /**
        Whether every bullet reads against one shared domain, labeled by a
        single value axis, instead of each bullet fitting its own.
    */
    {key: "sharedDomain", default: false},
    /** Accessor for a smaller second label under each row's name, such as its unit. */
    {key: "subLabel", default: false, coerce: rowAccessor},
    /**
        Accessor for each row's target, drawn as a marker across the band. A
        data key, a function, a number shared by every row, or `false` for none.
    */
    {key: "target", default: accessor("target"), coerce: rowAccessor},
    /** Formats the tick labels. Defaults to the locale's abbreviated number format. */
    {
      key: "tickFormat",
      factory: (viz: VizInstance) => (n: number) =>
        formatAbbreviate(n, viz.schema.locale),
    },
    /**
        The value axis ticks: a target count, an explicit array of values, or
        `false` for no axis. By default each axis fits as many ticks as its
        labels allow, always labeling both ends of the domain.
    */
    {key: "ticks"},
    /** Accessor for each row's measure. */
    {
      key: "value",
      default: accessor("value"),
      coerce: v => rowAccessor(v) || accessor("value"),
    },
    /**
        Formats the values in tooltips and aria labels, as
        `(value, datum) => string`. Defaults to the locale's abbreviated number
        format.
    */
    {
      key: "valueFormat",
      factory: (viz: VizInstance) => (n: number) =>
        formatAbbreviate(n, viz.schema.locale),
    },
    /** Zooming and panning don't help read a bullet, so they're off by default. */
    {key: "zoom", default: false},
    /**
        Styles the forecast bar: `size` (its thickness as a fraction of the
        band's), `opacity`, and `fill` (the row's color by default), each a
        value or a `(d, i)` accessor.
    */
    {key: "forecastConfig", merge: true, default: {opacity: 0.35, size: 0.6}},
    /**
        Outlines each measure bar in the chart's background color, so a bar
        stays distinct over a band of a similar color. Set
        `shapeConfig.stroke`/`strokeWidth` to override.
    */
    {
      key: "shapeConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        stroke: () => chartBackground(viz),
        strokeWidth: MEASURE_OUTLINE,
      }),
    },
    /**
        Styles the target marker: `size` (its length as a fraction of the
        band's thickness), `stroke` (the text color by default), and
        `strokeWidth`, each a value or a `(d, i)` accessor.
    */
    {key: "targetConfig", merge: true, default: {size: 0.75, strokeWidth: 3}},
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        tbody: (d: DataPoint, i: number) => bulletTooltipRows(viz, d, i),
      }),
    },
  ],
};

/**
    Creates a bullet graph from an array of data: one compact bar per row
    reading its `value` against qualitative `bands`, with a `target` marker,
    an optional `forecast` bar, and a value axis. Rows stack top to bottom,
    or side by side with `orient("vertical")`.
*/
export default makeChart(bulletDef);
