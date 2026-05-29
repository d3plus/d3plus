/**
    `radarEmit` — Path SceneNodes for each radar polygon, using
    `groupData` + `pathConfig` stashed on `viz.ctx`.
*/

import type {DataPoint} from "@d3plus/data";

import {Path} from "../../shapes/index.js";
import {collectComputed} from "../emitHelpers.js";
import type {ChartDefinition} from "../ChartDefinition.js";

export const radarEmit: ChartDefinition["emit"] = ({viz}) => {
  const groupData = viz.ctx.groupData as DataPoint[] | undefined;
  const pathConfig = viz.ctx.pathConfig as Record<string, unknown> | undefined;
  if (!groupData || !pathConfig) return [];
  const path = new Path()
    .renderMode("compute")
    .data(groupData)
    .d((d: DataPoint & {d?: string}) => d.d ?? "")
    .config(pathConfig);
  return collectComputed(path);
};
