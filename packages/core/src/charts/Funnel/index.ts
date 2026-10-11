/**
    Funnel — ordered stages drawn as centered bars whose width encodes each
    stage's value, joined by necks between consecutive stages.

    Implementation files in this folder:
      - `funnelGeometry.ts` — pure math: stage spans, the width profile, conversion rates.
      - `funnelLabels.ts` — pure label planning (lines, inside vs. beside, font size).
      - `applyLayout.ts` — chart-specific `TransformStage`.
      - `emit.ts` — necks and stage paths.
      - `labelNodes.ts` — stage label text nodes.
*/

import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";

import accessor from "../../utils/accessor.js";
import constant from "../../utils/constant.js";
import type {D3plusConfig} from "../../utils/D3plusConfig.js";
import {
  subtitleFeature,
  titleFeature,
  totalFeature,
} from "../features/features.js";
import type {DataDrivenChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import {sceneInsetRegion} from "../pipeline/insetPlacement.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {applyFunnelLayout, FIRST_KEY, PREVIOUS_KEY} from "./applyLayout.js";
import {funnelEmit} from "./emit.js";
import {percentText} from "./labelNodes.js";

/**
    The tooltip rows for a stage: its value, then (after the first stage)
    its share of the first stage and of the previous stage.
*/
export function funnelTooltipRows(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): [string, string][] {
  const value = Number(
    (viz.schema.value as (d: DataPoint, i: number) => unknown)(d, i),
  );
  const valueFormat = viz.schema.valueFormat as (
    v: number,
    d: DataPoint,
  ) => string;
  const rows: [string, string][] = [];
  if (Number.isFinite(value))
    rows.push([viz.schema.translate("Value"), `${valueFormat(value, d)}`]);
  const first = d ? Number(d[FIRST_KEY]) : NaN;
  const previous = d ? Number(d[PREVIOUS_KEY]) : NaN;
  if (Number.isFinite(previous)) {
    if (Number.isFinite(first))
      rows.push([
        viz.schema.translate("% of First Stage"),
        percentText(viz, first),
      ]);
    rows.push([
      viz.schema.translate("% of Previous Stage"),
      percentText(viz, previous),
    ]);
  }
  return rows;
}

export const funnelDef: DataDrivenChartDefinition = {
  name: "Funnel",

  features: [titleFeature, subtitleFeature, totalFeature],
  layoutStage: applyFunnelLayout,
  emit: funnelEmit,
  insetRegion: sceneInsetRegion,

  ctx: {},

  fields: [
    /** Whether to fill the gap between consecutive stages with a neck joining their widths. */
    {key: "connector", default: true},
    /**
        Which conversion rates each stage's label shows beneath its value:
        `"first"` (its value as a share of the first stage's), `"previous"`
        (as a share of the stage before it), `"both"` (or `true`), or `false`
        for none. Tooltips always show both.
        @type {boolean | "first" | "previous" | "both" | ("first" | "previous")[]}
    */
    {key: "conversion", default: false},
    /**
        How the funnel's width changes from one stage to the next:
        `"linear"` (straight sides) or `"smooth"` (curved sides that ease
        into each stage).
        @type {"linear" | "smooth"}
    */
    {key: "curve", default: "linear"},
    /** Hides the legend when every stage would be its own entry (stages are labeled), including across small multiples. */
    {
      key: "legend",
      coerce: "const",
      factory: (viz: VizInstance) => {
        const base = viz.schema.legend as (
          config: D3plusConfig,
          arr: DataPoint[],
        ) => unknown;
        return (config: D3plusConfig, arr: DataPoint[]) => {
          const stages = new Set(
            viz._filteredData.map((d, i) => viz._ids(d, i).join("_")),
          );
          if (arr.length >= stages.size) return false;
          return base.call(viz, config, arr);
        };
      },
    },
    /**
        The direction stages run: `"vertical"` (top to bottom, widths
        across) or `"horizontal"` (left to right, heights across).
        @type {"vertical" | "horizontal"}
    */
    {key: "orient", default: "vertical"},
    /**
        The gap between consecutive stages, as a fraction (0–1) of each
        stage's slot; the necks fill it.
    */
    {key: "stagePadding", default: 0.3},
    /**
        Whether each stage narrows from its own width to the next stage's,
        drawing a continuous straight- or smooth-sided funnel instead of
        flat bars. The last stage keeps its own width.
    */
    {key: "taper", default: false},
    /**
        Accessor function or string key for each stage's value.
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
        Formats each stage's value in its label and tooltip, as
        `(value, datum) => string`. Defaults to the locale's abbreviated
        number format.
    */
    {
      key: "valueFormat",
      factory: (viz: VizInstance) => (n: number) =>
        formatAbbreviate(n, viz.schema.locale),
    },
    /** Zooming and panning don't help read a funnel, so they're off by default. */
    {key: "zoom", default: false},
    /**
        Paint for the necks between stages (`fill`, `opacity`, `stroke`,
        `strokeWidth`), each a value or a function of the stage the neck
        leads into. `fill` defaults to that stage's fill.
    */
    {key: "connectorConfig", merge: true, default: {opacity: 0.35}},
    /**
        Tooltip rows show each stage's value, then its share of the first
        and of the previous stage.
    */
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        tbody: (d: DataPoint, i: number) => funnelTooltipRows(viz, d, i),
      }),
    },
  ],
};

/**
    Creates a funnel chart from an array of data: one stage per row, in data
    order, drawn as a centered bar whose width encodes its value, with necks
    joining consecutive stages. Labels show each stage's name and value, plus
    any conversion rates `conversion` asks for; tooltips show the conversion
    from the first and the previous stage.
*/
export default makeChart(funnelDef);
