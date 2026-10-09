import type {DataPoint} from "@d3plus/data";

import type Viz from "../viz/Viz.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {legendCategoryOf} from "./legendCategory.js";

/**
    Default label function for the legend. Bound to a Viz instance; an entry
    that stands for a color category reads as that category, and any other
    entry forwards to `viz._drawLabel` at the legend's group-depth.
*/
export function legendLabel(this: Viz, d: DataPoint, i: number): string {
  return (
    legendCategoryOf(this as unknown as VizInstance, d) ??
    this._drawLabel(d, i, this._legendDepth)
  );
}
