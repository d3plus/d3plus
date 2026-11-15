/**
    The config a Geomap's `dotDensity` and `hexbin` add, and how they reach
    the colorScale and the legend.

    @module
*/

import type {DataPoint} from "@d3plus/data";

import type {ConfigField} from "../../fluent.js";
import type {D3plusConfig} from "../../utils/D3plusConfig.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {dotDensitySettings} from "./dotDensityLayout.js";
import {geoBinValue, geoHexbinSettings} from "./geoHexbin.js";
import {geoHexbinColorRows, rebinOnZoom} from "./geoHexbinZoom.js";

/** Geomap's `dotDensity` and `hexbin` fields. */
export function densityFields(): ConfigField[] {
  return [
    /**
        Draws one dot for every `per` units of each row's `value`, scattered
        inside its region. Each region places its dots the same way on
        every draw, so a resize or a new value never moves the dots
        already there. With more than one `groupBy` level, the outer levels
        split each region into categories, whose dots take their colors
        (and show in the legend); with one, every dot takes the first color
        of the chart's palette. Past 20,000 dots, a chart whose `renderer`
        isn't set draws on Canvas. The region outlines stay drawn, and
        hovering one shows its totals. `false` (the default) draws no dots.
        @type {false | {value: string | function, per?: number, r?: number, fill?: string | function, fillOpacity?: number, max?: number}}
    */
    {key: "dotDensity", default: false},
    /**
        Bins the coordinate points into hexagons on the map, each colored
        on the colorScale by how many points it holds: `true`, or
        `{radius, value, agg, label}` to set the hexagon radius in pixels
        (`12` by default) and color each bin by the `"sum"` (default) or
        `"mean"` of `value` over its points instead, named `label` in its
        tooltip. Zooming bins the points again at the same pixel radius, so
        finer detail appears. The points themselves aren't drawn. `false`
        (the default) draws the points.
        @type {boolean | {radius?: number, value?: string | function, agg?: "sum" | "mean", label?: string}}
    */
    {key: "hexbin", default: false},
  ];
}

/**
    Points the colorScale at the bins while `hexbin` is on (it reads each
    bin's measure, from the bins in view), and re-bins them as the map
    zooms. Runs before each draw.
    @param viz The Geomap.
*/
export function syncDensityColorScale(viz: VizInstance): void {
  const settings = geoHexbinSettings(viz);
  viz._colorScaleAccessor = settings ? () => geoBinValue : undefined;
  // Bins re-bin as the map zooms; the zoom still moves the map.
  viz._zoomRescale = settings ? zoom => rebinOnZoom(viz, zoom) : undefined;
  viz._colorScaleRows = settings
    ? () => geoHexbinColorRows(viz, settings)
    : undefined;
}

/**
    Wraps the chart's legend so it hides while `hexbin` bins the points, or
    while `dotDensity` draws every dot one color.
    @param viz The Geomap.
*/
export function densityLegend(
  viz: VizInstance,
): (config: D3plusConfig, arr: DataPoint[]) => unknown {
  const base = viz.schema.legend as (
    config: D3plusConfig,
    arr: DataPoint[],
  ) => unknown;
  return (config: D3plusConfig, arr: DataPoint[]) => {
    if (geoHexbinSettings(viz)) return false;
    if (dotDensitySettings(viz) && !(viz._drawDepth > 0)) return false;
    return base.call(viz, config, arr);
  };
}
