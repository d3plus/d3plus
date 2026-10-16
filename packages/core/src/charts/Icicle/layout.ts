/**
    Pure Icicle layout: the shared partition (see `partition/hierarchy.ts`)
    placed as nested rectangles — one band per depth along the depth axis,
    breadth proportional to value across it.
*/

import {partitionLayout} from "../partition/hierarchy.js";
import type {
  PartitionLayoutInputs,
  PartitionNode,
} from "../partition/hierarchy.js";

import {icicleRect} from "./geometry.js";
import type {IcicleFrame, IcicleRect} from "./geometry.js";

/** One laid-out rectangle; `depth` 0 is the focused node's slot. */
export type IcicleNode = PartitionNode<IcicleRect>;

export interface IcicleLayoutInputs extends Omit<
  PartitionLayoutInputs,
  "breadth"
> {
  /** [start, end] per depth along the depth axis, as `icicleBands` returns. */
  bands: [number, number][];
  /** The chart area and orientation. */
  frame: IcicleFrame;
}

/**
    Lays out the Icicle. Returns every drawn node, parents before children:
    the focused node first (filling depth 0) when there is one, then each
    level from the root out. Zero-value branches are left out.
*/
export function icicleLayout(inputs: IcicleLayoutInputs): IcicleNode[] {
  const {bands, frame, ...rest} = inputs;
  return partitionLayout({...rest, breadth: 1}, f =>
    icicleRect(f, bands[f.depth] ?? [0, 0], frame),
  );
}
