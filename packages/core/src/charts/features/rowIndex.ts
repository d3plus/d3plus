/**
    The `i` a data-driven chart's mark reports to handlers (its scene node's
    `index`): the position of the row it draws in the chart's drawn data
    (`viz._filteredData`, after the filter and rollup), as a Plot mark
    reports. A mark that stands for several rows (a group, a parent tile) or
    for none reports `AGGREGATE_INDEX`.

    @module
*/

import type {DataPoint} from "@d3plus/data";

/** The index a mark reports when it draws no single row of the data. */
export const AGGREGATE_INDEX = -1;

/** Each drawn-data array's row positions, built on first lookup. */
const positions = new WeakMap<
  readonly DataPoint[],
  {length: number; map: Map<DataPoint, number>}
>();

/**
    The position of `row` in `data` (a chart's `viz._filteredData`), or
    `AGGREGATE_INDEX` when it is not one of its rows.
*/
export function rowIndex(
  data: readonly DataPoint[] | undefined,
  row: DataPoint | undefined,
): number {
  if (!data || !row) return AGGREGATE_INDEX;
  let cached = positions.get(data);
  // Rebuilt when rows were appended to the same array.
  if (!cached || cached.length !== data.length) {
    const map = new Map<DataPoint, number>();
    data.forEach((d, i) => {
      if (!map.has(d)) map.set(d, i);
    });
    cached = {length: data.length, map};
    positions.set(data, cached);
  }
  return cached.map.get(row) ?? AGGREGATE_INDEX;
}
