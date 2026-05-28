import type {DataPoint} from "@d3plus/data";

import type Viz from "./Viz.js";

/**
    Default label function for the legend. Bound to a Viz instance; forwards
    to `viz._drawLabel` at the legend's group-depth.

    Lived in drawSteps/drawLegend.ts until the panel drawSteps were retired
    in favor of FeatureModules; this is the only piece of that file with
    surviving call sites (Viz, Tree, events/mousemove.legend).
*/
export function legendLabel(this: Viz, d: DataPoint, i: number): string {
  return this._drawLabel(d, i, this._legendDepth);
}
