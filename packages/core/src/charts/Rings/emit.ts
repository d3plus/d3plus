/**
    `ringsEmit` — link Paths + per-shape-type node groups using
    `ringsCtx` stashed on `viz.ctx`.
*/
/* eslint-disable @typescript-eslint/no-explicit-any */

import type {SceneNode} from "@d3plus/render";

import * as allShapes from "../../shapes/index.js";
import {Path} from "../../shapes/index.js";
import {collectComputed, shapeConfigFor} from "../emitHelpers.js";
import type {ChartDefinition} from "../ChartDefinition.js";

export const ringsEmit: ChartDefinition["emit"] = ({viz}) => {
  const c = viz.ctx.ringsCtx as any;
  if (!c) return [];
  const out: SceneNode[] = [];
  if (c.edges && c.edges.length) {
    const linkPath = new Path()
      .renderMode("compute")
      .config(c.linkConfig)
      .strokeWidth((d: any) => d.size)
      .id((d: any) => `${d.source.id}_${d.target.id}`)
      .d(c.linkD)
      .data(c.edges);
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
        .data(values);
      out.push(...collectComputed(inst));
    }
  }
  return out;
};
