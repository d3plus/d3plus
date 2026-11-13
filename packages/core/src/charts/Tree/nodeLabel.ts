import type {DataPoint} from "@d3plus/data";

import {depthOf} from "../features/depthKey.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {nameLevel} from "./keys.js";

/**
    A Tree node's label at its own `groupBy` level, from the hierarchy depth
    the layout stamps on the node's row: a branch node is named after its
    group, not after the leaves under it. A row without a key at its own
    level is a leaf there, named by the `label` accessor when there is one,
    or else at the deepest level it has a key. The tooltip's title and the
    node's accessible name both read it.
*/
export function nodeLabel(viz: VizInstance, d: DataPoint, i: number): string {
  const own = (depthOf(d) ?? 1) - 1;
  const level = nameLevel(viz, d, i, own);
  if (level === own) return viz._drawLabel(d, i, own);
  return viz.schema.label || level === undefined
    ? viz._drawLabel(d, i)
    : viz._drawLabel(d, i, level);
}
