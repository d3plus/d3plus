import type {DataPoint} from "@d3plus/data";

import {depthOf} from "../features/depthKey.js";
import type {VizInstance} from "../viz/vizTypes.js";

/**
    A Tree node's label at its own `groupBy` level, from the hierarchy depth
    the layout stamps on the node's row: a branch node is named after its
    group, not after the leaves under it. The tooltip's title and the node's
    accessible name both read it.
*/
export function nodeLabel(viz: VizInstance, d: DataPoint, i: number): string {
  return viz._drawLabel(d, i, (depthOf(d) ?? 1) - 1);
}
