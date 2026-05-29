/**
    `sankeyEmit` — link Paths + per-shape-type node groups (typically Rect).
*/
/* eslint-disable @typescript-eslint/no-explicit-any */

import type {SceneNode} from "@d3plus/render";

import * as allShapes from "../../shapes/index.js";
import {Path} from "../../shapes/index.js";
import {collectComputed, shapeConfigFor} from "../emitHelpers.js";
import type {ChartDefinition} from "../ChartDefinition.js";

export const sankeyEmit: ChartDefinition["emit"] = ({viz}) => {
  const c = viz.ctx.sankeyCtx as any;
  if (!c) return [];
  const out: SceneNode[] = [];
  if (c.links && c.links.length) {
    const linkPath = new Path()
      .renderMode("compute")
      .config(viz._shapeConfig.Path || {})
      .data(c.links)
      .d(c.pathFn);
    out.push(...collectComputed(linkPath, {labels: false}));
  }
  if (c.nodeGroups && c.nodeGroups.length) {
    const shapesNs = allShapes as any;
    for (const [key, values] of c.nodeGroups) {
      if (!shapesNs[key]) continue;
      const inst = new shapesNs[key]()
        .renderMode("compute")
        .data(values)
        .height((d: any) => d.y1 - d.y0)
        .width((d: any) => d.x1 - d.x0)
        .x((d: any) => (d.x1 + d.x0) / 2)
        .y((d: any) => (d.y1 + d.y0) / 2)
        .config(shapeConfigFor(viz, key));
      out.push(...collectComputed(inst));
    }
  }
  return out;
};
