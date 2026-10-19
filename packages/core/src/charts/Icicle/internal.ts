/**
    Icicle's pipeline pieces (layout, geometry, label fit) and the partition
    helpers it shares with Sunburst (hierarchy, zoom, shade, label words),
    re-exported by `@d3plus/core/internal`.

    @module
*/
export {
  isAggregatedBranch,
  mergeBranch,
  nestPartition,
  partitionLayout,
  partitionLineage,
  partitionSort,
} from "../partition/hierarchy.js";
export type {
  PartitionBranch,
  PartitionFields,
  PartitionKey,
  PartitionLayoutInputs,
  PartitionNode,
  PartitionSort,
} from "../partition/hierarchy.js";
export {partitionFocus} from "../partition/zoom.js";
export {partitionShadeAmount} from "../partition/shade.js";
export {labelMetrics, partitionSplit, wrapLineCount} from "../partition/labelWords.js";
export {icicleLayout} from "./layout.js";
export type {IcicleNode} from "./layout.js";
export {icicleBands, icicleCollapse, icicleRect} from "./geometry.js";
export type {IcicleOrient, IcicleRect} from "./geometry.js";
export {icicleLabelBox} from "./labelFit.js";
