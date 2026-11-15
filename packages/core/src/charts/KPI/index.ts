/**
    KPI — a grid of tiles, one per row or group, each showing a big value,
    its change against the previous value (▲/▼, colored as good or bad
    news), and a sparkline of its history.

    Implementation files in this folder:
      - `delta.ts` — the change, its text, and its good/bad colors.
      - `series.ts` — a tile's periods, sparkline points, and previous value.
      - `tileLayout.ts` — pure layout: the grid, a tile's parts, sparklines.
      - `applyLayout.ts` — chart-specific `TransformStage`.
      - `emit.ts` — each tile's scene nodes.
*/

import type {DataPoint} from "@d3plus/data";
import {colorDefaults} from "@d3plus/color";
import {formatAbbreviate} from "@d3plus/format";

import accessor from "../../utils/accessor.js";
import constant from "../../utils/constant.js";
import {fieldAccessor} from "../../utils/fieldAccessor.js";
import type {D3plusConfig} from "../../utils/D3plusConfig.js";
import type {DataDrivenChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import {optionalAccessor} from "../viz/vizFields.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {applyKpiLayout} from "./applyLayout.js";
import type {KpiShared} from "./applyLayout.js";
import {deltaText} from "./delta.js";
import {deltaFormats, kpiEmit} from "./emit.js";

type RowFn = (d: DataPoint, i: number) => unknown;

/**
    Coerces a per-row accessor: a function is kept, a string becomes a
    data-key accessor, a number becomes a constant, and anything else turns
    it off.
*/
export function kpiAccessor(v: unknown): RowFn | false {
  if (typeof v === "function") return v as RowFn;
  if (typeof v === "string") return fieldAccessor(v);
  if (typeof v === "number") return constant(v) as RowFn;
  return false;
}

/** The tooltip's Value, Previous, and Change rows, for whichever a tile has. */
export function kpiTooltipRows(
  viz: VizInstance,
  d: DataPoint,
): [string, string][] {
  const tile = (viz.ctx.kpi as KpiShared | undefined)?.tiles.get(d);
  if (!tile) return [];
  const formats = deltaFormats(viz, d);
  const rows: [string, string][] = [];
  if (Number.isFinite(tile.value))
    rows.push([viz.schema.translate("Value"), formats.value(tile.value)]);
  if (Number.isFinite(tile.previous))
    rows.push([viz.schema.translate("Previous"), formats.value(tile.previous)]);
  if (tile.delta)
    rows.push([
      viz.schema.translate("Change"),
      deltaText(tile.delta, "both", formats, true),
    ]);
  return rows;
}

export const kpiDef: DataDrivenChartDefinition = {
  name: "KPI",

  layoutStage: applyKpiLayout,
  emit: kpiEmit,

  ctx: {},

  fields: [
    /**
        Colors each tile's sparkline. Every tile takes the color defaults'
        `sequential` color by default, so its sparkline never reads as the
        delta's good or bad color; a `color` of your own (a key or a
        function) colors the tiles by it, as it does any other chart.
        @type {string | function}
    */
    {
      key: "color",
      coerce: optionalAccessor,
      factory: (viz: VizInstance) => () =>
        ({...colorDefaults, ...viz.schema.colorDefaults}).sequential,
    },
    /**
        The words after each tile's delta: a string, a `(d, i)` accessor, or
        `false` for none. Defaults to "vs. previous", translated. They are
        left out when the tile is too narrow for them.
        @type {string | function | false}
    */
    {key: "comparisonLabel"},
    /**
        What each tile's delta shows: `"percent"` (default) for the percent
        change, `"absolute"` for the change in the value's own units, `"both"`
        for "1.2K (4.5%)", or `false` for no delta. A percent change against
        a previous value of 0 falls back to the absolute change.
        @type {"percent" | "absolute" | "both" | false}
    */
    {key: "delta", default: "percent"},
    /**
        Which way is good news: `"up"` (default) colors a rise with
        `colorDefaults.on` and a fall with `colorDefaults.off`; `"down"` (for
        costs, churn, or response times) swaps them. A `(d, i)` accessor sets
        it per tile.
        @type {"up" | "down" | function}
    */
    {key: "deltaDirection", default: "up"},
    /**
        Each tile is labeled with its name, so the legend only shows when its
        entries group the tiles (e.g. colored by a coarser category).
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
          const keys = new Set(rows.map((d, i) => viz._ids(d, i).join("-")));
          if (arr.length >= keys.size) return false;
          return base.call(viz, config, arr);
        };
      },
    },
    /**
        Accessor for each tile's previous value, the one its delta compares
        against: a data key, a function, or `false`. Where it gives no number
        and `time` is set, the previous value is the one from the period
        before the current one.
        @type {string | function | false}
    */
    {key: "previous", default: accessor("previous"), coerce: kpiAccessor},
    /**
        How each tile draws its history when `time` is set: `"area"`
        (default) for a line over a faint fill, `"line"`, `"bar"`, or `false`
        for none. It spans every period, in the tile's color, with the
        current period marked. Tiles too short for it leave it out.
        @type {"area" | "line" | "bar" | false}
    */
    {key: "sparkline", default: "area"},
    /**
        How the tiles fill the chart area and how they look: `aspect` (the
        tile width/height ratio the grid aims for, 1.75 by default),
        `columns` or `rows` (a fixed grid), `padding` (the space between
        tiles, 12 by default), and `fill`, `stroke`, `strokeWidth`, and `rx`
        for each tile's card. Unset colors follow the chart's background, so
        the tiles read on light and dark themes alike.
        @type {{aspect, columns, rows, padding, fill, stroke, strokeWidth, rx}}
    */
    {key: "tileConfig", merge: true, default: {}},
    /**
        Each tile's sparkline already shows its history, so the timeline is
        off by default; turn it on to pick the period the tiles show.
    */
    {key: "timeline", default: false},
    /** Lists each tile's Value, Previous value, and Change in the tooltip body. */
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        tbody: (d: DataPoint) => kpiTooltipRows(viz, d),
      }),
    },
    /**
        Accessor for each tile's value: a data key or a function. With
        `time` set, it reads the current period's rows, rolled up.
        @type {string | function}
    */
    {
      key: "value",
      default: accessor("value"),
      coerce: v => kpiAccessor(v) || accessor("value"),
    },
    /**
        Formats each tile's value, its absolute change, and the tooltip's
        values, as `(value, datum) => string`. Defaults to the locale's
        abbreviated number format.
    */
    {
      key: "valueFormat",
      factory: (viz: VizInstance) => (n: number) =>
        formatAbbreviate(n, viz.schema.locale),
    },
    /** Zooming and panning don't help read a tile, so they're off by default. */
    {key: "zoom", default: false},
  ],
};

/**
    Creates KPI tiles from an array of data: one tile per row (or `groupBy`
    group) showing its `value` large, its change against a `previous` value
    as ▲/▼ colored good or bad by `deltaDirection`, and with `time` set, a
    sparkline of its history, comparing the latest period with the one
    before it. The tiles flow left to right in a grid sized to the chart.
*/
export default makeChart(kpiDef);
