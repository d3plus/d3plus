/**
    Sunburst shading: on the default color path, each ring below the top one
    takes its top-level ancestor's color a step lighter than the ring inside
    it, so the rings read apart while every branch keeps one hue.
*/

import {color} from "d3-color";
import {colorLighter} from "@d3plus/color";

/** How strongly rings lighten; the `shadeConfig` shape. */
export interface SunburstShadeConfig {
  /**
      Lightening (a `colorLighter` amount) added per `groupBy` level below the
      top ring. 0.22 sets each ring of the default palette clearly apart from
      the one inside it.
  */
  step: number;
  /**
      The most any ring lightens. 0.6 leaves the fourth ring and beyond a fixed
      pastel of its branch's hue, still apart from a white background and the
      background-colored outlines between arcs.
  */
  max: number;
}

export const sunburstShadeDefaults: SunburstShadeConfig = {
  step: 0.22,
  max: 0.6,
};

/**
    How much a ring lightens (0–`max`): nothing on the top ring (level 0), then
    `step` per level.
    @param level The ring's `groupBy` level, which stays the same when zoomed.
    @param config The shading strengths.
*/
export function sunburstShadeAmount(
  level: number,
  config: Partial<SunburstShadeConfig> = {},
): number {
  const {step, max} = {...sunburstShadeDefaults, ...config};
  if (level <= 0) return 0;
  return Math.max(0, Math.min(max, step * level));
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
