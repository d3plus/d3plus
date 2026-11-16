/**
    A Geomap's `topojson` as it was set: one topojson, or a list of them
    (one per `groupBy` level), which stays a list once a single file in it
    has loaded.

    @module
*/

import type {VizInstance} from "../viz/vizTypes.js";

/**
    The chart's `topojson`: a list when it was set as one (loading a list
    of one file stores just the file), else the one topojson.
    @param viz The Geomap.
*/
export function geomapTopojson(viz: VizInstance): unknown {
  const topojson = viz.schema.topojson as unknown;
  return viz.ctx.topojsonList && topojson && !Array.isArray(topojson)
    ? [topojson]
    : topojson;
}
