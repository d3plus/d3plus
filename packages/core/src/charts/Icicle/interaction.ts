/**
    Icicle interaction: the shared partition interaction (see
    `partition/interaction.ts`) — hover lineage, tooltip rows, and
    click-to-zoom — recording the clicked node's breadth extent and depth so
    the zoom can grow its rectangles into place.
*/

import type {VizInstance} from "../viz/vizTypes.js";
import {partitionNodeOf} from "../partition/interaction.js";
import type {PartitionInteraction} from "../partition/interaction.js";

import type {IcicleZoomOrigin} from "./geometry.js";
import type {IcicleNode} from "./layout.js";

/** The zoom origin a click on `node` records: its breadth extent and depth. */
export function icicleZoomOrigin(node: IcicleNode): IcicleZoomOrigin {
  return {x0: node.x0, x1: node.x1, depth: node.depth};
}

/** Where the Icicle keeps its interaction state, and the zoom origin it records. */
export const icicleInteraction: PartitionInteraction<IcicleNode> = {
  prefix: "icicle",
  origin: icicleZoomOrigin,
};

/** The laid-out rectangle an event datum (a row, or a label wrapping one) belongs to. */
export function icicleNodeOf(
  viz: VizInstance,
  d: unknown,
): IcicleNode | undefined {
  return partitionNodeOf<IcicleNode>(viz, d, icicleInteraction.prefix);
}
