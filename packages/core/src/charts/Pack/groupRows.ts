/**
    Pack group rows: a circle enclosing others stands for a group above the
    drawn leaves, so its scene datum is that group's row (see
    `viz/groupRow.ts`), as Treemap's group headers carry theirs: the group's
    rows merged, stamped with its `groupBy` level. Clicking it zooms into the
    group, and its tooltip names it at its own level.

    The outermost circle holds every row. Its level, -1, sits above the first
    `groupBy`, so its group is everything drawn and zooming into it changes
    nothing.

    Each row also keeps its nest entry's `key` and, as `values`, the datums of
    the circles directly inside it, unenumerated: hover walks them to light a
    group's descendants (`recursionCircles`), and they stay out of the row's
    fields.
*/

import type {HierarchyNode} from "d3-hierarchy";

import {merge} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";

import {MEMBERS_KEY} from "../features/thresholdMembers.js";
import {GROUP_DEPTH_KEY} from "../viz/groupRow.js";

type Aggs = Parameters<typeof merge>[1];

/** A packed node, carrying its group row once `attachGroupRows` runs. */
export type GroupedNode = HierarchyNode<DataPoint> & {groupRow?: DataPoint};

/** The datum a node's circle carries: its group row, or a leaf's own row. */
export function packDatum(node: GroupedNode): DataPoint {
  return node.groupRow ?? node.data;
}

/** Stamps every node with children with its group row, innermost first. */
export function attachGroupRows(root: GroupedNode, aggs: Aggs): void {
  root.eachAfter(n => {
    const node = n as GroupedNode;
    if (!node.children) return;
    const row = merge(
      node.leaves().map(leaf => leaf.data),
      aggs,
    ) as DataPoint;
    // A group holding the threshold bucket is still a real group.
    delete row._isAggregation;
    delete row._threshold;
    delete row[MEMBERS_KEY];
    row[GROUP_DEPTH_KEY] = node.depth - 1;
    Object.defineProperties(row, {
      key: {value: node.data.key, configurable: true},
      values: {
        value: node.children.map(child => packDatum(child as GroupedNode)),
        configurable: true,
      },
    });
    node.groupRow = row;
  });
}
