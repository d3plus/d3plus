/**
    `treeEmit` — Path (links) + per-shape-type nodes, stashed by the layout
    stage on `viz.ctx`.
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import * as allShapes from "../../shapes/index.js";
import {Path} from "../../shapes/index.js";
import {collectComputed, shapeConfigFor} from "../emitHelpers.js";
import type {ChartDefinition} from "../ChartDefinition.js";

interface ShapeGroup {
  key: string;
  values: DataPoint[];
}

export const treeEmit: ChartDefinition["emit"] = ({viz}) => {
  const linksData = viz.ctx.linksData as DataPoint[] | undefined;
  const linkD = viz.ctx.linkD as ((d: DataPoint) => string) | undefined;
  const shapeGroups = viz.ctx.shapeGroups as ShapeGroup[] | undefined;
  const shapeConfig = viz.ctx.shapeConfig as Record<string, unknown> | undefined;
  if (!shapeGroups || !shapeConfig) return [];

  const out: SceneNode[] = [];

  if (linksData && linksData.length && linkD) {
    const linkPath = new Path()
      .renderMode("compute")
      .data(linksData)
      .config(shapeConfigFor(viz, "Path"))
      .config({
        d: linkD as (d: DataPoint) => string,
        id: (d: DataPoint & {depth?: number}, i: number) =>
          (viz._ids(d, i) as string[])[(d.depth ?? 1) - 1],
      } as Record<string, unknown>);
    out.push(...collectComputed(linkPath));
  }

  const shapesNs = allShapes as Record<string, unknown>;
  for (const {key, values} of shapeGroups) {
    const ctor = shapesNs[key] as (new () => {
      renderMode: (m: string) => unknown;
      data: (d: DataPoint[]) => unknown;
      config: (c: unknown) => unknown;
    }) | undefined;
    if (!ctor) continue;
    const inst = new ctor()
      .renderMode("compute") as {
        data: (d: DataPoint[]) => {config: (c: unknown) => {config: (c: unknown) => unknown}};
      };
    const configured = inst
      .data(values)
      .config(shapeConfigFor(viz, key))
      .config(shapeConfig);
    out.push(...collectComputed(configured as unknown as Parameters<typeof collectComputed>[0]));
  }

  return out;
};
