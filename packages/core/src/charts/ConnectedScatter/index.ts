/**
    ConnectedScatter — Scatter joining each series' points in order, with
    arrowheads along the path and its first and last points labeled.
*/

import type {DataPoint} from "@d3plus/data";

import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import {coerceOrder, DATA_ORDER} from "../Plot/orderPath.js";
import {orderTooltipRows} from "../Plot/orderPathScene.js";
import type {VizInstance} from "../viz/vizTypes.js";
import Scatter from "../Scatter/index.js";

export const connectedScatterDef: ChartDefinition = {
  name: "ConnectedScatter",
  paintDriven: true,

  ctx: {},

  fields: [
    /**
        Accessor function or string key for the field that orders each
        series' path, such as a year. Defaults to the order of the data.
        @type {string | function}
    */
    {key: "order", default: DATA_ORDER, coerce: coerceOrder},
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        tbody: (d: DataPoint, i: number) => orderTooltipRows(viz, d, i),
      }),
    },
  ],
};

/**
    Creates a connected scatterplot from an array of data: each row draws as
    a point at its `x` and `y` values, and a line joins each series' points
    in `order` (a field such as a year; the data's order by default), so the
    line traces the path two measures took together. Arrowheads along the
    line show its direction (`pathArrows`), and its first and last points are
    labeled with their order values (`pathLabels`). Hover a point for its
    row.
*/
export default makeChart(connectedScatterDef, Scatter);
