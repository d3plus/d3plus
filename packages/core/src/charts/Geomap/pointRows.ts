/**
    Which of a Geomap's rows draw as coordinate points, and which as
    `topojson` regions.

    @module
*/

import type {DataPoint} from "@d3plus/data";

import type {VizInstance} from "../viz/vizTypes.js";
import {geomapTopojson} from "./topojsonLevels.js";

/**
    Whether the level a Geomap draws is a level of regions: with a list of
    topojsons (one per `groupBy` level), a level the list has a topojson
    for draws every row as a region, even where `point` gives a row a
    coordinate (as it does to the merged rows of the points below it).
    @param viz The Geomap.
*/
export function levelDrawsRegions(viz: VizInstance): boolean {
  const topojson = geomapTopojson(viz);
  return Array.isArray(topojson) && Boolean(topojson[viz._drawDepth ?? 0]);
}

/**
    Whether a row draws as a coordinate point: `point` gives it one, and
    the level drawn isn't a level of regions (see `levelDrawsRegions`).
    @param viz The Geomap.
    @param d The row.
    @param i Its index.
*/
export function isPointRow(viz: VizInstance, d: DataPoint, i: number): boolean {
  return !levelDrawsRegions(viz) && viz.schema.point(d, i) instanceof Array;
}
