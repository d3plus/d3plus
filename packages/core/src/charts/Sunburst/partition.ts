/**
    Pure Sunburst layout: the shared partition (see `partition/hierarchy.ts`)
    placed in polar coordinates — angle from the partition, radius from its
    ring.
*/

import {partitionLayout, partitionLineage} from "../partition/hierarchy.js";
import type {
  PartitionBranch,
  PartitionKey,
  PartitionLayoutInputs,
  PartitionNode,
  PartitionSort,
} from "../partition/hierarchy.js";

export {
  isAggregatedBranch,
  mergeBranch,
  nestPartition as nestSunburst,
  partitionSort as sunburstSort,
} from "../partition/hierarchy.js";

/** A `groupBy` accessor. */
export type SunburstKey = PartitionKey;
/** One nesting branch: every row that shares a key path. */
export type SunburstBranch = PartitionBranch;
/** Hierarchy-node comparator used to order siblings. */
export type SunburstSort = PartitionSort;

/** The polar extent of one Sunburst node. */
export interface SunburstPlacement {
  startAngle: number;
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
}

/** One laid-out arc (or the center disc); `depth` 0 is the center slot. */
export type SunburstNode = PartitionNode<SunburstPlacement>;

export interface SunburstLayoutInputs extends Omit<
  PartitionLayoutInputs,
  "breadth"
> {
  /** [inner, outer] radius per depth (0 = center), as `sunburstRadii` returns. */
  radii: [number, number][];
}

const TAU = Math.PI * 2;

/**
    Lays out the Sunburst. Returns every drawn node, parents before children:
    the focused node first (as the center disc) when there is one, then each
    ring from the center out. Zero-value branches are left out.
*/
export function sunburstLayout(inputs: SunburstLayoutInputs): SunburstNode[] {
  const {radii, ...rest} = inputs;
  return partitionLayout({...rest, breadth: TAU}, f => {
    const [innerRadius, outerRadius] = radii[f.depth] ?? [0, 0];
    return {startAngle: f.x0, endAngle: f.x1, innerRadius, outerRadius};
  });
}

/** The node followed by each of its drawn ancestors, outermost first. */
export function sunburstLineage(node: SunburstNode): SunburstNode[] {
  return partitionLineage(node);
}
