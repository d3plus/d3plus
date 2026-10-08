/**
    Sunburst shading: on the default color path, every arc below the top ring
    takes its top-level ancestor's color lightened by its ring and by its rank
    among its siblings, so neighboring arcs and rings read apart while the
    whole branch keeps one hue.
*/

import {color} from "d3-color";
import {colorLighter} from "@d3plus/color";

/** How strongly arcs lighten; the `shadeConfig` shape. */
export interface SunburstShadeConfig {
  /** Lightening added per `groupBy` level below the top ring. */
  depth: number;
  /** Lightening across siblings, from none (the largest) to this much (the smallest). */
  sibling: number;
  /**
      The most any arc lightens. Half way to white keeps the smallest outer
      slivers visibly in their branch's hue — and apart from a white background
      and the background-colored outlines between arcs.
  */
  max: number;
}

export const sunburstShadeDefaults: SunburstShadeConfig = {
  depth: 0.1,
  sibling: 0.32,
  max: 0.5,
};

/**
    How much an arc lightens (0–`max`): nothing on the top ring (level 0), then
    `depth` per level plus `sibling` × its sibling spread.
    @param level The arc's `groupBy` level, which stays the same when zoomed.
    @param spread Its rank among its siblings by value, scaled to 0–1.
    @param config The shading strengths.
*/
export function sunburstShadeAmount(
  level: number,
  spread: number,
  config: Partial<SunburstShadeConfig> = {},
): number {
  const {depth, sibling, max} = {...sunburstShadeDefaults, ...config};
  if (level <= 0) return 0;
  const amount = depth * level + sibling * Math.min(1, Math.max(0, spread));
  return Math.max(0, Math.min(max, amount));
}

/** Lightens `fill` by `amount` with `colorLighter`; a fill that isn't a color passes through. */
export function sunburstShadeFill(
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
    `shapeConfig.fill` the chart started with.
*/
export function sunburstShadeActive(
  schema: Record<string, unknown>,
  defaults: {color?: unknown; fill?: unknown},
): boolean {
  const shapeConfig = (schema.shapeConfig ?? {}) as Record<string, unknown>;
  const pathConfig = (shapeConfig.Path ?? {}) as Record<string, unknown>;
  return (
    schema.shade !== false &&
    !schema.colorScale &&
    !schema.colorOrdinal &&
    schema.color === defaults.color &&
    shapeConfig.fill === defaults.fill &&
    pathConfig.fill === undefined
  );
}
