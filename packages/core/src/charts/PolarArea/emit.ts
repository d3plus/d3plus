/** `polarAreaEmit` — one Path SceneNode per wedge (the chrome lies beneath, on `_chartScene`). */

import {formatAbbreviate} from "@d3plus/format";

import type {ChartEmit} from "../definition/ChartDefinition.js";
import {polarWedgeNodes} from "../polar/config.js";
import type {PolarWedge} from "../polar/wedgeLayout.js";

export const polarAreaEmit: ChartEmit = ({viz, shapeData}) => {
  const wedges = (shapeData ?? []) as unknown as PolarWedge[];
  if (!wedges.length) return [];
  const stacked = typeof viz.schema.metric === "function";
  return polarWedgeNodes(viz, wedges, "polararea", w => {
    const name = viz._drawLabel(w.data, w.i);
    const value = formatAbbreviate(w.value, viz.schema.locale);
    return stacked ? `${name}, ${w.slot}, ${value}.` : `${name}, ${value}.`;
  });
};
