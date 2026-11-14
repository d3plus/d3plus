/**
    The angular gridlines of RadialLine and RadialArea: one spoke from the
    inner to the outer radius at each labeled `x` value, styled like the
    value rings (`axisConfig.gridConfig`). Non-interactive scenery drawn
    beneath the marks.
*/

import type {SceneNode} from "@d3plus/render";

import {radarRingPaint} from "../Radar/rings.js";
import type {RadarRingStyle} from "../Radar/rings.js";

import {polarXY} from "./paths.js";

/** One spoke: its key and angle (radians, 0 at 12 o'clock, clockwise). */
export interface RadialSpoke {
  key: string;
  angle: number;
}

/** The spoke group, from `inner` to `outer` at each spoke's angle, keyed with `prefix`. */
export function radialSpokeNodes(
  spokes: RadialSpoke[],
  inner: number,
  outer: number,
  style: RadarRingStyle,
  prefix: string,
): SceneNode[] {
  if (!spokes.length || !(outer > inner)) return [];
  const children = spokes.map((s, k): SceneNode => {
    const [x0, y0] = polarXY(s.angle, inner);
    const [x1, y1] = polarXY(s.angle, outer);
    return {
      type: "path",
      key: `${prefix}-spoke-${s.key}`,
      interactive: false,
      d: `M${x0},${y0}L${x1},${y1}`,
      paint: radarRingPaint(style, {value: k, r: outer}, k),
    };
  });
  return [
    {
      type: "group",
      key: `${prefix}-spokes`,
      interactive: false,
      children,
    },
  ];
}
