/**
    `radarEmit` — Path SceneNodes for each radar polygon, using
    `groupData` + `pathConfig` stashed on `viz.ctx`, each followed by its
    background image and a Circle on each of its vertices (see
    `points.ts`), so a later polygon covers an earlier one's dots as it
    covers its fill. Emits flat SceneNodes directly (no transient Shape
    compute pass).
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import {paintFromShapeConfig, shapeConfigFor} from "../features/emitHelpers.js";
import {backgroundImageNode} from "../features/backgroundImageEmit.js";
import type {ChartEmit} from "../definition/ChartDefinition.js";

import {radarGroupPointNodes} from "./points.js";
import type {RadarPointGroup} from "./points.js";

interface RadarGroupDatum extends RadarPointGroup {
  __d3plus__?: true;
  data?: DataPoint;
  d: string;
}

export const radarEmit: ChartEmit = ({viz}) => {
  const groupData = viz.ctx.groupData as RadarGroupDatum[] | undefined;
  const pathConfig = viz.ctx.pathConfig as Record<string, unknown> | undefined;
  if (!groupData || !pathConfig || !groupData.length) return [];
  const circleConfig = shapeConfigFor(viz, "Circle");
  const out: SceneNode[] = [];
  for (let i = 0; i < groupData.length; i++) {
    const g = groupData[i];
    const datum = (g.data ?? g) as DataPoint;
    const paint = paintFromShapeConfig(pathConfig, datum, i);
    const path = {
      type: "path",
      key: `radar-${g.id}`,
      d: g.d,
      datum,
      // The labels of the metrics it has a value for stay bright on hover.
      hoverKeys: {metric: g.metrics ?? []},
      paint,
      aria: {label: `${viz._drawLabel(datum, i)}.`},
    } as SceneNode;
    out.push(path);
    const image = pathConfig.backgroundImage
      ? backgroundImageNode(pathConfig, path, datum, i)
      : null;
    if (image) out.push(image);
    out.push(...radarGroupPointNodes(viz, g, i, circleConfig));
  }
  return out;
};
