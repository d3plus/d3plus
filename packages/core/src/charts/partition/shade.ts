/**
    Level shading shared by the partition charts (Sunburst, Icicle): on the
    default color path, each level below the top one takes its top-level
    ancestor's color a step lighter than the level above it, so the levels
    read apart while every branch keeps one hue.
*/

import {color} from "d3-color";
import {colorLighter} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";

import {resolveAccessor} from "../features/emitHelpers.js";

/** How strongly levels lighten; the `shadeConfig` shape. */
export interface PartitionShadeConfig {
  /**
      Lightening (a `colorLighter` amount) added per `groupBy` level below the
      top level. 0.22 sets each level of the default palette clearly apart
      from the one above it.
  */
  step: number;
  /**
      The most any level lightens. 0.6 leaves the fourth level and beyond a
      fixed pastel of its branch's hue, still apart from a white background
      and the background-colored outlines between nodes.
  */
  max: number;
}

export const partitionShadeDefaults: PartitionShadeConfig = {
  step: 0.22,
  max: 0.6,
};

/**
    How much a level lightens (0–`max`): nothing on the top level (level 0),
    then `step` per level.
    @param level The node's `groupBy` level, which stays the same when zoomed.
    @param config The shading strengths.
*/
export function partitionShadeAmount(
  level: number,
  config: Partial<PartitionShadeConfig> = {},
): number {
  const {step, max} = {...partitionShadeDefaults, ...config};
  if (level <= 0) return 0;
  return Math.max(0, Math.min(max, step * level));
}

/** Lightens `fill` by `amount` with `colorLighter`; a fill that isn't a color passes through. */
export function partitionShadeFill(
  fill: string | undefined,
  amount: number,
): string | undefined {
  if (!fill || !(amount > 0) || !color(fill)) return fill;
  return colorLighter(fill, amount);
}

/**
    Whether shading applies: on by `shade`, and only on the default color path —
    any `color` accessor, `shapeConfig.fill`, `colorScale`, or ordinal color
    mode the user set is drawn as given. `defaults` holds the `color` and
    `shapeConfig.fill` the chart started with; `shapeType` names the
    `shapeConfig` key the chart's shapes read (a fill set there also counts).
*/
export function partitionShadeActive(
  schema: Record<string, unknown>,
  defaults: {color?: unknown; fill?: unknown},
  shapeType = "Path",
): boolean {
  const shapeConfig = (schema.shapeConfig ?? {}) as Record<string, unknown>;
  const typeConfig = (shapeConfig[shapeType] ?? {}) as Record<string, unknown>;
  return (
    schema.shade !== false &&
    !schema.colorScale &&
    !schema.colorOrdinal &&
    schema.color === defaults.color &&
    shapeConfig.fill === defaults.fill &&
    typeConfig.fill === undefined
  );
}

/** What a fill resolves from: the node's row, its index, and its `groupBy` level. */
export interface PartitionFillable {
  datum: DataPoint;
  i: number | undefined;
  level: number;
}

/**
    Resolves a node's fill: the shape config's `fill`, lightened by level while
    shading applies (see `partitionShadeActive`).
    @param schema The chart's config.
    @param sc The resolved shape config for the chart's shape type.
    @param defaults The `color` and `shapeConfig.fill` the chart started with.
    @param shapeType The `shapeConfig` key the chart's shapes read.
*/
export function partitionFillResolver(
  schema: Record<string, unknown>,
  sc: Record<string, unknown>,
  defaults: {color?: unknown; fill?: unknown},
  shapeType: string,
): (node: PartitionFillable) => string | undefined {
  const shade = partitionShadeActive(schema, defaults, shapeType);
  const shadeConfig = (schema.shadeConfig ??
    {}) as Partial<PartitionShadeConfig>;
  return node => {
    const fill = resolveAccessor<unknown>(sc.fill, node.datum, node.i ?? 0);
    if (typeof fill !== "string") return undefined;
    return shade
      ? partitionShadeFill(fill, partitionShadeAmount(node.level, shadeConfig))
      : fill;
  };
}
