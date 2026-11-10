/**
    Whether a hovered shape or legend entry shows a tooltip. Every caller asks
    through `tooltipEnabled`, so the chart's `tooltip` accessor receives the
    same arguments wherever it is consulted.
*/

import type {DataPoint} from "@d3plus/data";

import type {TooltipLevels} from "../../utils/D3plusConfig.js";

import {groupDepthOf} from "./groupRow.js";
import type {VizInstance} from "./vizTypes.js";

/** The parts of a chart `tooltipLevels` reads. */
export type TooltipHost = Pick<VizInstance, "schema"> &
  Partial<Pick<VizInstance, "_drawDepth" | "_legendDepth" | "_shapeDepth">>;

/**
    The `groupBy` levels a `tooltip` accessor receives for `d`. `depth` is the
    level `d` stands for: a group row's own level (see `groupRow.ts`), else
    the level its chart reports for the shape (`ChartDefinition.shapeDepth`),
    else the level the chart draws. A legend entry stands for the level its
    label is read at. `maxDepth` is the deepest `groupBy` level.
    @param viz The chart.
    @param d The hovered shape's row, or the legend entry's.
    @param legend Whether `d` is a legend entry.
*/
export function tooltipLevels(
  viz: TooltipHost,
  d: DataPoint | undefined | null,
  legend = false,
): TooltipLevels {
  const groupBy = viz.schema.groupBy as unknown[] | undefined;
  const maxDepth = Math.max(0, (groupBy?.length ?? 1) - 1);
  const own = legend
    ? viz._legendDepth
    : (groupDepthOf(d) ?? (d ? viz._shapeDepth?.(d) : undefined));
  const depth = own ?? viz._drawDepth ?? 0;
  return {depth: Math.min(Math.max(depth, 0), maxDepth), maxDepth};
}

/**
    Whether `d` shows a tooltip: the chart's `tooltip` setting, called with
    the datum, its index, and its `groupBy` levels (see `tooltipLevels`).
    @param viz The chart.
    @param d The hovered shape's row, or the legend entry's.
    @param i The row's index.
    @param legend Whether `d` is a legend entry.
*/
export function tooltipEnabled(
  viz: TooltipHost,
  d: DataPoint | undefined | null,
  i: number,
  legend = false,
): boolean {
  const {schema} = viz;
  if (typeof schema.tooltip !== "function") return Boolean(schema.tooltip);
  return Boolean(schema.tooltip(d, i, tooltipLevels(viz, d, legend)));
}
