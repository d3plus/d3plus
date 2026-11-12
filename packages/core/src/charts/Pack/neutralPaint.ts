/**
    The paint of Pack's neutral circles (see `groupRows.ts`): the neutral
    fill, and the stroke the chart's default draws around it, unless a stroke
    of the user's own (`shapeConfig.stroke`, or `shapeConfig.Circle.stroke`)
    paints them instead.
*/

import {isDefault} from "../../utils/configDefault.js";
import {neutralFill} from "../viz/backgroundInk.js";
import {fillStroke} from "../viz/fillStroke.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** A neutral circle's fill, and its stroke unless the user set one. */
export interface NeutralPaint {
  fill: string;
  stroke?: string;
}

/** The paint of the chart's neutral circles. */
export function packNeutralPaint(
  viz: Pick<VizInstance, "schema"> &
    Partial<Pick<VizInstance, "_select" | "_theme">>,
): NeutralPaint {
  const fill = neutralFill(viz);
  const config = (viz.schema.shapeConfig ?? {}) as Record<string, unknown>;
  const circle = (config.Circle ?? {}) as Record<string, unknown>;
  const userStroke = circle.stroke !== undefined || !isDefault(config.stroke);
  return userStroke ? {fill} : {fill, stroke: `${fillStroke(fill)}`};
}
