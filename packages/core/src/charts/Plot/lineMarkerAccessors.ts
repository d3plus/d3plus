/**
    A Plot's `lineMarkerConfig`, as its markers read it: each accessor gets
    the marker's source row and that row's index, as every other Plot
    shape's accessors and handlers do, rather than the Plot record wrapping
    the row and the marker's place among the markers.

    @module
*/

import type {DataPoint} from "@d3plus/data";

import type {VizInstance} from "../viz/vizTypes.js";

type Accessor = (this: unknown, d: DataPoint, i: number) => unknown;

/** The source row a Plot record wraps, and that row's index. */
export function markerRow(d: DataPoint, i: number): [DataPoint, number] {
  let row = d;
  let index = i;
  while (row && row.__d3plus__ && row.data) {
    if (typeof row.i === "number") index = row.i;
    row = row.data as DataPoint;
  }
  return [row, index];
}

/** An accessor that reads the source row and its index (see `markerRow`). */
export function rowAccessor(fn: Accessor): Accessor {
  return function (this: unknown, d: DataPoint, i: number) {
    return fn.call(this, ...markerRow(d, i));
  };
}

/** The chart's `lineMarkerConfig`, its accessors reading source rows. */
export function lineMarkerAccessors(
  viz: Pick<VizInstance, "_lineMarkerConfig">,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(viz._lineMarkerConfig ?? {}))
    out[key] =
      typeof value === "function" ? rowAccessor(value as Accessor) : value;
  return out;
}
