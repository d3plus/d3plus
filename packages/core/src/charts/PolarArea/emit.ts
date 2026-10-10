/**
    `polarAreaEmit` — one Path SceneNode per wedge, then the ring value labels
    on top so the wedges never cover them.
*/

import {formatAbbreviate} from "@d3plus/format";
import type {SceneNode} from "@d3plus/render";

import type {ChartEmit} from "../definition/ChartDefinition.js";
import {polarWedgeNodes} from "../polar/config.js";
import type {PolarWedge} from "../polar/wedgeLayout.js";

export const polarAreaEmit: ChartEmit = ({viz, shapeData}) => {
  const wedges = (shapeData ?? []) as unknown as PolarWedge[];
  if (!wedges.length) return [];
  const stacked = typeof viz.schema.metric === "function";
  const nodes = polarWedgeNodes(viz, wedges, "polararea", w => {
    const name = viz._drawLabel(w.data, w.i);
    const value = formatAbbreviate(w.value, viz.schema.locale);
    return stacked ? `${name}, ${w.slot}, ${value}.` : `${name}, ${value}.`;
  });
  return [...nodes, ...((viz.ctx.polarLevelLabels ?? []) as SceneNode[])];
};
