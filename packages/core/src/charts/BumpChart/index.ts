/**
    BumpChart — Plot with `discrete: "x"`, `shape: "Line"`, and a
    y2-mirroring configuration that draws labeled rank lines. With `size`,
    each series draws as a band instead (see `areaBump.ts`).
*/

import type {DataPoint} from "@d3plus/data";
import {formatOrdinal} from "@d3plus/format";

import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import Plot from "../Plot/index.js";
import type {TickHoverMatch, VizInstance} from "../viz/vizTypes.js";
import {
  areaBumpEmit,
  bumpBandAxisPadding,
  bumpSharedTooltipValue,
  bumpSizeTooltipRows,
} from "./areaBump.js";

/**
    The row holding rank `val` at the first or last period, if any.
    @param viz The chart.
    @param val The rank.
    @param end Which period.
*/
export function bumpRankRow(
  viz: VizInstance,
  val: unknown,
  end: "first" | "last",
): DataPoint | undefined {
  const data = viz._formattedData ?? [];
  if (!data.length) return undefined;
  const time = (x: unknown) => (x instanceof Date ? x.getTime() : x);
  const at = time(data[end === "first" ? 0 : data.length - 1].x);
  return data.find(d => time(d.x) === at && d.y === val);
}

/** The name of the series at rank `val` at the first or last period, or "". */
function rankName(viz: VizInstance, val: unknown, end: "first" | "last") {
  const d = bumpRankRow(viz, val, end);
  return d ? viz._drawLabel(d, d.i as number) : "";
}

/**
    What the tick label for rank `val` follows on hover: the series at that
    rank at the first or last period, by its id.
    @param viz The chart.
    @param val The rank.
    @param end Which period.
*/
export function bumpRankMatch(
  viz: VizInstance,
  val: unknown,
  end: "first" | "last",
): TickHoverMatch | undefined {
  const d = bumpRankRow(viz, val, end);
  return d && d.id !== undefined ? {field: "id", value: d.id} : undefined;
}

export const bumpChartDef: ChartDefinition = {
  name: "BumpChart",
  paintDriven: true,

  setup: (viz: VizInstance) => {
    viz._plotShapeEmitters = {...viz._plotShapeEmitters, Area: areaBumpEmit};
    viz._sharedTooltipValue = () => bumpSharedTooltipValue(viz);
    const preDraw = viz._preDraw.bind(viz);
    viz._preDraw = () => {
      bumpBandAxisPadding(viz);
      preDraw();
    };
    type Comparator = (
      a: Record<string, unknown>,
      b: Record<string, unknown>,
    ) => number;
    type BumpFluent = {
      y2: (
        accessor: (d: Record<string, unknown>, i: number) => unknown,
      ) => unknown;
      yConfig: (config: Record<string, unknown>) => unknown;
      y2Config: (config: Record<string, unknown>) => unknown;
      ySort: (comparator: Comparator) => unknown;
      y2Sort: (comparator: Comparator) => unknown;
    };
    const v = viz as VizInstance & BumpFluent;
    v.y2((d: Record<string, unknown>, i: number) => viz._y!(d as DataPoint, i));
    // The rank axes name the series at each rank, from the first period on
    // the left and the last on the right, and follow it on hover; elsewhere
    // a rank reads as an ordinal.
    const firstNames = (val: number) => rankName(viz, val, "first");
    const lastNames = (val: number) => rankName(viz, val, "last");
    const ordinal = (val: unknown) =>
      typeof val === "number"
        ? formatOrdinal(val, viz.schema.locale)
        : `${val}`;
    viz._tickLabelFormats = new Map([
      [firstNames, ordinal],
      [lastNames, ordinal],
    ]);
    viz._tickHoverMatch = {
      y: val => bumpRankMatch(viz, val, "first"),
      y2: val => bumpRankMatch(viz, val, "last"),
    };
    v.yConfig({tickFormat: firstNames});
    v.y2Config({tickFormat: lastNames});
    v.ySort(
      (a: Record<string, unknown>, b: Record<string, unknown>) =>
        (viz._y as (d: unknown) => number)(b) -
        (viz._y as (d: unknown) => number)(a),
    );
    v.y2Sort(
      (a: Record<string, unknown>, b: Record<string, unknown>) =>
        (viz._y as (d: unknown) => number)(b) -
        (viz._y as (d: unknown) => number)(a),
    );
  },

  // Each panel ranks its own series, so every panel labels its axes.
  facet: {axes: "all"},

  ctx: {},

  fields: [
    // The y axes label each rank with a series, so only the x axis is badged.
    {key: "axisHover", default: "x"},
    {key: "discrete", default: "x"},
    // With `size`, each series draws as a band (an Area) instead of a line.
    {
      key: "shape",
      coerce: "const",
      factory: (viz: VizInstance) => () => (viz._size ? "Area" : "Line"),
    },
    /**
        With `size`, the share of each rank's slot left empty between
        neighboring bands, from 0 (the largest band touches its neighbors'
        slots) to 1. Defaults to 0.25.
        @type {number}
    */
    {key: "bandPadding", default: 0.25},
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        tbody: (d: DataPoint, i: number) => bumpSizeTooltipRows(viz, d, i),
      }),
    },
  ],
};

/**
    Creates a bump chart based on an array of data.
*/
export default makeChart(bumpChartDef, Plot);
