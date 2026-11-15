/**
    TileGridMap — a Geomap drawn as a tile grid: each region one equal
    hexagon (or square) at a fixed cell, the US states by default.

    Extends Geomap; inherits its layout stage and emit. Only `tileGrid`'s
    default differs.
*/

import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import Geomap from "../Geomap/index.js";
import {geomapEmit} from "../Geomap/emit.js";

export const tileGridMapDef: ChartDefinition = {
  name: "TileGridMap",

  // Geomap's `_draw` lays the grid out; the emit is Geomap's own.
  emit: geomapEmit,

  ctx: {},

  fields: [
    /**
        The tile-grid layout: `"us-states"` (the default) for the built-in
        hexagon grid of the US states and DC, or a layout of your own,
        `{[id]: [column, row]}`, where odd rows sit half a tile to the right.
        @type {"us-states" | Record<string, [number, number]>}
    */
    {key: "tileGrid", default: "us-states"},
  ],
};

/**
    Creates a tile-grid map: each region drawn as one equal hexagon (or, with `tileGridShape: "square"`, square) at a fixed cell of a grid, colored, labeled and hovered like a Geomap's regions. Draws the US states by default, found by postal abbreviation or FIPS code and needing no topojson; pass `tileGrid` a layout of your own for other regions.
*/
export default makeChart(tileGridMapDef, Geomap);
