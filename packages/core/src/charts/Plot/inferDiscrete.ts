/**
    A Plot with no `discrete` setting whose `x` or `y` values include text
    draws that axis as its discrete axis, exactly as `discrete` would
    (`x: "fruit"` on a Scatter). One that draws bars, areas, or boxes along
    two axes of numbers stands them on `x`, as a BarChart, AreaPlot, or
    BoxWhisker does.
*/
import type {DataPoint} from "@d3plus/data";

import {rangeBreaksTimeAxis, scaleTimeAxis} from "./plotRangeBreaks.js";
import {barBaseline, drawsDiscreteShapes, plotSwarm} from "./plotShapes.js";
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
    The axis a Plot with no `discrete` setting draws as discrete: the axis
    whose values include text (see `hasCategoryValues`), or, when both do,
    the one with fewer distinct values (`"x"` on a tie). With no text on
    either axis (or only on a time axis), `"x"` when any row draws a Bar,
    Area, or Box (see `drawsDiscreteShapes`). Undefined when `discrete` is
    set, when `swarm` is on (a swarm lays out its own categories; `"auto"`
    swarms only a single axis of numbers, which has no text; see
    `plotSwarm` for the shapes that turn it off), or when neither axis has
    text (a time axis, one that plots `time` or reads dates through a time
    scale or `rangeBreaks`, has none) and no row draws one of those.
    @param viz The Plot.
*/
export function inferDiscrete(viz: VizInstance): "x" | "y" | undefined {
  const swarm = plotSwarm(viz);
  if (viz.schema.discrete || (swarm && swarm !== "auto")) return undefined;
  const rows: DataPoint[] = viz._data || [];
  if (!rows.length) return undefined;
  const time = viz.schema.time as RowAccessor | undefined;
  const firstTime = time ? time(rows[0], 0) : undefined;
  const categories = (["x", "y"] as const).flatMap(axis => {
    const accessor = viz[`_${axis}`] as RowAccessor | undefined;
    if (typeof accessor !== "function") return [];
    const first = accessor(rows[0], 0);
    if (firstTime !== undefined && first === firstTime) return [];
    if (
      rangeBreaksTimeAxis(viz, axis, first) ||
      scaleTimeAxis(viz, axis, first)
    )
      return [];
    const values = rows.map(accessor);
    return hasCategoryValues(values)
      ? [{axis, distinct: new Set(values).size}]
      : [];
  });
  if (!categories.length)
    return drawsDiscreteShapes(viz, rows) ? "x" : undefined;
  return categories.reduce((a, b) => (b.distinct < a.distinct ? b : a)).axis;
}

/**
    Notes the discrete axis a Plot infers for this draw (`viz._discrete`,
    see `inferDiscrete`), which `vizDiscrete` reads when `discrete` is unset,
    and the baseline its bars grow from when it sets none (`viz._barBaseline`,
    see `barBaseline`).
    @param viz The Plot.
*/
export function resolveDiscrete(viz: VizInstance): void {
  viz._discrete = inferDiscrete(viz);
  viz._barBaseline = barBaseline(viz, viz._data || []);
}
