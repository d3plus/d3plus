/**
    BumpChart — Plot with `discrete: "x"`, `shape: "Line"`, and a
    y2-mirroring configuration that draws labeled rank lines. With `size`,
    each series draws as a band instead (see `areaBump.ts`).
*/

import type {DataPoint} from "@d3plus/data";

import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import Plot from "../Plot/index.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {
  areaBumpEmit,
  bumpBandAxisPadding,
  bumpSharedTooltipValue,
  bumpSizeTooltipRows,
} from "./areaBump.js";

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
    v.yConfig({
      tickFormat: (val: number) => {
        const data = viz._formattedData ?? [];
        const xMin =
          data[0].x instanceof Date
            ? (data[0].x as unknown as Date).getTime()
            : data[0].x;
        const startData = data.filter(
          (d: Record<string, unknown>) =>
            (d.x instanceof Date ? (d.x as Date).getTime() : d.x) === xMin,
        );
        const d = startData.find((d: Record<string, unknown>) => d.y === val);
        return d ? viz._drawLabel(d, d.i as number) : "";
      },
    });
    v.y2Config({
      tickFormat: (val: number) => {
        const data = viz._formattedData ?? [];
        const xMax =
          data[data.length - 1].x instanceof Date
            ? (data[data.length - 1].x as unknown as Date).getTime()
            : data[data.length - 1].x;
        const endData = data.filter(
          (d: Record<string, unknown>) =>
            (d.x instanceof Date ? (d.x as Date).getTime() : d.x) === xMax,
        );
        const d = endData.find((d: Record<string, unknown>) => d.y === val);
        return d ? viz._drawLabel(d, d.i as number) : "";
      },
    });
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
