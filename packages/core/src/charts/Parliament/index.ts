/**
    Parliament — Waffle on an arc: one dot per seat on concentric half rings,
    filled party by party from left to right in data order, with the house's
    total in the middle and a line where a majority is reached.
*/

import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import type {VizInstance} from "../viz/vizTypes.js";
import Waffle, {waffleDef} from "../Waffle/index.js";
import {waffleTooltipRows} from "../Waffle/tooltip.js";

export const parliamentDef: ChartDefinition = {
  name: "Parliament",

  // Inherits Waffle's full pipeline: `super._draw` (Waffle's) runs its
  // layout stage and emit. Only the defaults differ.
  emit: waffleDef.emit,

  ctx: {},

  fields: [
    /** Draws each seat as a dot. */
    {key: "cellShape", default: "circle"},
    /** Draws the house's total seats in the middle of the arc. */
    {key: "centerLabel", default: true},
    /** Places the seats on concentric half rings. */
    {key: "layout", default: "arc"},
    /** Draws a line where more than half of the seats are reached. */
    {key: "majority", default: true},
    /**
        Fills the arc with the parties in data order (by convention, from
        left to right across the political spectrum). A comparator orders
        them instead.
        @type {false | function}
    */
    {key: "sort", default: false},
    /** Draws one dot per seat: each row's `sum` is its number of seats. */
    {key: "unit", default: 1},
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        tbody: waffleTooltipRows(viz, "Seats"),
      }),
    },
    {
      key: "legendTooltip",
      merge: true,
      factory: (viz: VizInstance) => ({
        tbody: waffleTooltipRows(viz, "Seats"),
      }),
    },
  ],
};

/**
    Draws a parliament (arc-dot) chart: one dot per seat on concentric half
    rings, colored by party (`groupBy`), each row's `sum` its seats. The
    parties fill the arc from left to right in data order, each seat placed
    by its angle so every party takes a wedge. The total sits in the middle
    (`centerLabel`) and a dashed line marks a majority (`majority`). It is a
    Waffle with `layout: "arc"`, so `rings`, `innerRadius`, `startAngle`,
    `endAngle`, `icon` and `cellPadding` apply too.
*/
export default makeChart(parliamentDef, Waffle);
