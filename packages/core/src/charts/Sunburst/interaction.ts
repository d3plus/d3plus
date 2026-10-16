/**
    Sunburst interaction: the shared partition interaction (see
    `partition/interaction.ts`) — hover lineage, tooltip rows, and
    click-to-zoom — with the clicked arc's angles recorded so the zoom can
    sweep the rings into place.
*/

import type {DataPoint} from "@d3plus/data";

import type {VizInstance} from "../viz/vizTypes.js";
import {
  partitionHandlers,
  partitionNodeOf,
  partitionZoomIn,
} from "../partition/interaction.js";
import type {PartitionInteraction} from "../partition/interaction.js";

import type {SunburstNode} from "./partition.js";

export {
  partitionClickable as sunburstClickable,
  partitionDefaultTbody as sunburstDefaultTbody,
  partitionDrillable as sunburstDrillable,
  partitionHoverRows as sunburstHoverRows,
  partitionParentShareRow as sunburstParentShareRow,
  partitionZoomOut as sunburstZoomOut,
} from "../partition/interaction.js";

type Handler = (d: DataPoint, i: number, x?: unknown, event?: Event) => void;

/** Where the Sunburst keeps its interaction state, and the zoom origin it records. */
export const sunburstInteraction: PartitionInteraction<SunburstNode> = {
  prefix: "sunburst",
  origin: node => ({
    startAngle: node.startAngle,
    endAngle: node.endAngle,
    depth: node.depth,
  }),
};

/** The laid-out arc an event datum (a row, or a label wrapping one) belongs to. */
export function sunburstNodeOf(
  viz: VizInstance,
  d: unknown,
): SunburstNode | undefined {
  return partitionNodeOf<SunburstNode>(viz, d, "sunburst");
}

/** Zooms into `node`, recording its angles for the next layout to sweep from. */
export function sunburstZoomIn(viz: VizInstance, node: SunburstNode): void {
  partitionZoomIn(viz, node, sunburstInteraction);
}

/** The Sunburst's `on` handlers (see `partitionHandlers`). */
export function sunburstHandlers(
  viz: VizInstance,
  shareRow: unknown[],
): Record<string, Handler> {
  return partitionHandlers(viz, shareRow, sunburstInteraction);
}
