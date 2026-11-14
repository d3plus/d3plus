/**
    A Plot with no `discrete` setting whose `x` (else `y`) values include
    text draws that axis as its discrete axis, exactly as `discrete` would
    (`x: "fruit"` on a Scatter).
*/
import type {DataPoint} from "@d3plus/data";

import {rangeBreaksTimeAxis} from "./plotRangeBreaks.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** A row accessor, such as a Plot's `_x` or `_y`. */
type RowAccessor = (d: DataPoint, i: number) => unknown;

/**
    Whether any of an axis's values is text: a string that doesn't read as a
    number (`"2019"` and `"1.5"` read as numbers).
    @param values The axis's values.
*/
export function hasCategoryValues(values: readonly unknown[]): boolean {
  return values.some(v => typeof v === "string" && isNaN(Number(v)));
}

/**
    The axis a Plot with no `discrete` setting draws as discrete: `"x"` when
    its x values include text (see `hasCategoryValues`), else `"y"` when its
    y values do. Undefined when `discrete` is set, when `swarm` is on (a
    swarm lays out its own categories; `"auto"` swarms only a single axis
    of numbers, which has no text), for a time axis, or when neither axis
    has text.
    @param viz The Plot.
*/
export function inferDiscrete(viz: VizInstance): "x" | "y" | undefined {
  const swarm = viz.schema.swarm;
  if (viz.schema.discrete || (swarm && swarm !== "auto")) return undefined;
  const rows: DataPoint[] = viz._data || [];
  if (!rows.length) return undefined;
  const time = viz.schema.time as RowAccessor | undefined;
  const firstTime = time ? time(rows[0], 0) : undefined;
  return (["x", "y"] as const).find(axis => {
    const accessor = viz[`_${axis}`] as RowAccessor | undefined;
    if (typeof accessor !== "function") return false;
    const first = accessor(rows[0], 0);
    if (firstTime !== undefined && first === firstTime) return false;
    if (rangeBreaksTimeAxis(viz, axis, first)) return false;
    return hasCategoryValues(rows.map(accessor));
  });
}

/**
    Notes the discrete axis a Plot infers for this draw (`viz._discrete`,
    see `inferDiscrete`), which `vizDiscrete` reads when `discrete` is unset.
    @param viz The Plot.
*/
export function resolveDiscrete(viz: VizInstance): void {
  viz._discrete = inferDiscrete(viz);
}
