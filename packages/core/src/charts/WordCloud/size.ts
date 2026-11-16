/**
    WordCloud's value accessor, `size`, which it stores on `viz._size` as
    Plot and Network store theirs.
*/

import type {DataPoint} from "@d3plus/data";

import accessor from "../../utils/accessor.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** A word's value accessor. */
export type SizeFn = (d: DataPoint, i?: number) => number;

/** The default `size`: each row's `value`. */
export const defaultSize = accessor("value") as unknown as SizeFn;

/**
    Each word's value, read through the chart's current `size` (so a later
    `size` applies to rows already wrapped in tooltips and the legend).
    @param viz The chart.
*/
export function wordSize(viz: VizInstance): SizeFn {
  return (d, i) => {
    const size = (viz._size ?? defaultSize) as SizeFn;
    return Number(size(d, i));
  };
}
