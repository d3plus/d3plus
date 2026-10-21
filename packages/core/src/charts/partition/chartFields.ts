/**
    ChartDefinition pieces shared by the partition charts (Sunburst, Icicle):
    Treemap-style threshold bucketing, the default sibling order, the `sum`
    accessor, the legend order, and the setup that installs the shared
    interaction.
*/

import type {DataPoint} from "@d3plus/data";

import accessor from "../../utils/accessor.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {thresholdFunction} from "../Treemap/thresholdFunction.js";

import {partitionSort} from "./hierarchy.js";
import type {PartitionNode, PartitionSort} from "./hierarchy.js";
import {partitionHandlers} from "./interaction.js";
import type {PartitionInteraction} from "./interaction.js";

/** Buckets small branches into a "Values" node per `threshold` (Treemap's algorithm). */
export function partitionThreshold(
  viz: VizInstance,
  data: unknown[],
): unknown[] {
  return thresholdFunction(data as DataPoint[], {
    aggs: viz.schema.aggs,
    drawDepth: viz._drawDepth,
    groupBy: viz.schema.groupBy as ((
      d: DataPoint,
    ) => DataPoint[keyof DataPoint])[],
    threshold: viz.schema.threshold as (branchData: DataPoint[]) => number,
    thresholdKey: viz.schema.thresholdKey as (d: DataPoint) => number,
  });
}

/** The default `sort`: largest value first. */
export const partitionDefaultSort: PartitionSort = (a, b) =>
  (b.value ?? 0) - (a.value ?? 0);

/** Wraps a `sort` so the threshold bucket always comes last. */
export function partitionSortDecorate(_viz: VizInstance, base: unknown) {
  return partitionSort(base as PartitionSort);
}

/** Coerces a `sum` key into an accessor. */
export function partitionSumCoerce(v: unknown): unknown {
  return typeof v === "function" ? v : accessor(v as string);
}

/** Thresholds bucket by the summed value. */
export function partitionSumOnSet(viz: VizInstance, v: unknown): void {
  viz.schema.thresholdKey = v;
}

/** Legend entries ordered by value, largest first. */
export function partitionLegendSort(viz: VizInstance) {
  const sumFn = viz.schema.sum as (d: DataPoint) => number;
  return (a: DataPoint, b: DataPoint) => sumFn(b) - sumFn(a);
}

/**
    Records the chart's own default `color` and `shapeConfig.fill` (shading
    applies only while they stay in place) as `<prefix>DefaultColor` and
    `<prefix>DefaultFill`, and installs the shared hover, tooltip, and
    click-to-zoom handlers.
*/
export function partitionSetup<N extends PartitionNode>(
  viz: VizInstance,
  interaction: PartitionInteraction<N>,
): void {
  const {prefix} = interaction;
  viz.ctx[`${prefix}DefaultColor`] = viz.schema.color;
  viz.ctx[`${prefix}DefaultFill`] = (
    viz.schema.shapeConfig as Record<string, unknown>
  ).fill;
  Object.assign(
    viz.schema.on,
    partitionHandlers(
      viz,
      ((viz.schema.tooltipConfig as {tbody?: unknown[][]}).tbody ?? [])[0] ??
        [],
      interaction,
    ),
  );
}
