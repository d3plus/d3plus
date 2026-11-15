/**
    A Plot with no `discrete` setting whose `x` or `y` values include text
    draws that axis as its discrete axis, exactly as `discrete` would
    (`x: "fruit"` on a Scatter). One that draws bars, areas, or boxes along
    two axes of numbers stands them on `x`, as a BarChart, AreaPlot, or
    BoxWhisker does.
*/
import type {DataPoint} from "@d3plus/data";

import {rangeBreaksTimeAxis, scaleTimeAxis} from "./plotRangeBreaks.js";
import {drawsDiscreteShapes, plotSwarm, shapeBaseline} from "./plotShapes.js";
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
    either axis (or only on a time axis, one that plots `time` or reads
    dates through a time scale or `rangeBreaks`), `"x"` when any row draws
    a Bar, Area, or Box (see `drawsDiscreteShapes`). Beside a swarm along
    `"x"` or `"y"`, those shapes stand across it, on the other axis.
    Undefined when `discrete` is set, when a Plot of only circles swarms (a
    swarm lays out its own categories; `"auto"` swarms only a single axis
    of numbers, which has no text), or when neither axis has text and no
    row draws a Bar, Area, or Box.
    @param viz The Plot.
*/
export function inferDiscrete(viz: VizInstance): "x" | "y" | undefined {
  if (viz.schema.discrete) return undefined;
  const rows: DataPoint[] = viz._data || [];
  if (!rows.length) return undefined;
  const swarm = plotSwarm(viz);
  const shapes = drawsDiscreteShapes(viz, rows);
  if (swarm && swarm !== "auto") {
    if (!shapes) return undefined;
    // Bars beside a swarm stand across its value axis.
    if (swarm === "x" || swarm === "y") return swarm === "x" ? "y" : "x";
  }
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
  if (!categories.length) return shapes ? "x" : undefined;
  return categories.reduce((a, b) => (b.distinct < a.distinct ? b : a)).axis;
}

/**
    Notes the discrete axis a Plot infers for this draw (`viz._discrete`,
    see `inferDiscrete`), which `vizDiscrete` reads when `discrete` is unset,
    and the baseline its bars and areas grow from when it sets none
    (`viz._shapeBaseline`,
    see `shapeBaseline`).
    @param viz The Plot.
*/
export function resolveDiscrete(viz: VizInstance): void {
  viz._discrete = inferDiscrete(viz);
  viz._shapeBaseline = shapeBaseline(viz, viz._data || []);
}
