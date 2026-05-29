/**
    `radarEmit` — Path SceneNodes for each radar polygon, using
    `groupData` + `pathConfig` stashed on `viz.ctx`. Emits flat
    SceneNodes directly (no transient Shape compute pass).
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import {paintFromShapeConfig} from "../emitHelpers.js";
import type {ChartDefinition} from "../ChartDefinition.js";

interface RadarGroupDatum {
  __d3plus__?: true;
  data?: DataPoint;
  id: string | number;
  d: string;
}

export const radarEmit: ChartDefinition["emit"] = ({viz}) => {
  const groupData = viz.ctx.groupData as RadarGroupDatum[] | undefined;
  const pathConfig = viz.ctx.pathConfig as Record<string, unknown> | undefined;
  if (!groupData || !pathConfig || !groupData.length) return [];
  const out: SceneNode[] = [];
  for (let i = 0; i < groupData.length; i++) {
    const g = groupData[i];
    const datum = (g.data ?? g) as DataPoint;
    const paint = paintFromShapeConfig(pathConfig, datum, i);
    out.push({
      type: "path",
      key: `radar-${g.id}`,
      d: g.d,
      datum,
      paint,
    } as SceneNode);
  }
  return out;
};
