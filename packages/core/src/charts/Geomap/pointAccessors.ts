/**
    A Geomap's `point` and `pointSize` accessors, read with the row's
    position in the drawn data (see `rowIndex`), the same `i` the point's
    paint and handlers get, wherever the map lays a point out.

    @module
*/

import type {DataPoint} from "@d3plus/data";

import {rowIndex} from "../features/rowIndex.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** A row's `point` (its longitude and latitude, when it has one). */
export function pointOf(viz: VizInstance, d: DataPoint): unknown {
  return viz.schema.point(d, rowIndex(viz._filteredData, d));
}

/** A row's `pointSize`. */
export function pointSizeOf(viz: VizInstance, d: DataPoint): unknown {
  return viz.schema.pointSize(d, rowIndex(viz._filteredData, d));
}
