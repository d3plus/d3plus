/**
    `networkEmit` — link Paths + per-shape-type node groups.
*/
/* eslint-disable @typescript-eslint/no-explicit-any */

import type {SceneNode} from "@d3plus/render";

import * as allShapes from "../../shapes/index.js";
import {Path} from "../../shapes/index.js";
import {collectComputed, shapeConfigFor} from "../emitHelpers.js";
import type {ChartDefinition} from "../ChartDefinition.js";

export const networkEmit: ChartDefinition["emit"] = ({viz}) => {
  const c = viz.ctx.networkCtx as any;
  if (!c) return [];
  const out: SceneNode[] = [];

  if (c.links && c.links.length) {
    const linkPath = new Path()
      .renderMode("compute")
      .data(c.links)
      .config(c.linkConfig)
      .strokeWidth((d: any) => d.size)
      .d(c.linkD as any);
    out.push(...collectComputed(linkPath, {labels: false}));
  }

  if (c.nodeGroups && c.nodeGroups.length) {
    const shapesNs = allShapes as any;
    for (const [key, values] of c.nodeGroups) {
      if (!shapesNs[key]) continue;
      const inst = new shapesNs[key]()
        .renderMode("compute")
        .config(shapeConfigFor(viz, key))
        .config(c.nodeShapeConfig)
        .config(c.nodeShapeConfig[key] || {})
        .data(values);
      out.push(...collectComputed(inst));
    }
  }
  return out;
};
