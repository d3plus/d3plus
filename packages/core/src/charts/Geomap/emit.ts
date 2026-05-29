/**
    `geomapEmit` — country Paths + point Circles using `geomapCtx`
    stashed on `viz.ctx`.
*/
/* eslint-disable @typescript-eslint/no-explicit-any */

import type {SceneNode} from "@d3plus/render";

import {Circle, Path} from "../../shapes/index.js";
import {collectComputed, shapeConfigFor} from "../emitHelpers.js";
import type {ChartDefinition} from "../ChartDefinition.js";

export const geomapEmit: ChartDefinition["emit"] = ({viz}) => {
  const c = viz.ctx.geomapCtx as any;
  if (!c) return [];
  const out: SceneNode[] = [];
  if (c.topoData && c.topoData.length) {
    const path = new Path()
      .renderMode("compute")
      .data(c.topoData)
      .d(c.pathFn)
      .x(0)
      .y(0)
      .config(shapeConfigFor(viz, "Path"));
    out.push(...collectComputed(path));
  }
  if (c.pointData && c.pointData.length) {
    const circle = new Circle()
      .renderMode("compute")
      .config(shapeConfigFor(viz, "Circle"))
      .data(c.pointData)
      .r(c.pointR)
      .sort(c.pointSort)
      .x(c.pointX)
      .y(c.pointY);
    out.push(...collectComputed(circle));
  }
  return out;
};
