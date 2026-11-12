/**
    Pack group rows: a circle enclosing others stands for a group above the
    drawn leaves, so its scene datum is that group's row (see
    `viz/groupRow.ts`), as Treemap's group headers carry theirs: the group's
    rows merged, stamped with its `groupBy` level. Clicking it zooms into the
    group, its tooltip names it at its own level, `packOpacity` reads it,
    and so does its paint (every `shapeConfig` accessor), so it takes its
    group's color.

    The outermost circle holds every row. Its level, -1, sits above the first
    `groupBy`, so its group is everything drawn and zooming into it changes
    nothing. It names no one group, so it is painted neutral (`neutralFill`,
    between the chart's background and its ink), and so is every group while
    a colorScale colors the leaves, as Treemap's group headers are, rather
    than take the scale's color for its total. A neutral circle's fill is
    that tone, its default stroke that tone a shade darker (see
    `neutralPaint.ts`), and its other paint reads its nest entry, which holds
    no fields.

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

/** What the helpers below read off a packed node. */
type DatumSource = Pick<
  GroupedNode,
  "children" | "data" | "groupRow" | "parent"
>;

/** The datum a node's circle carries: its group row, or a leaf's own row. */
export function packDatum(node: DatumSource): DataPoint {
  return node.groupRow ?? node.data;
}

/**
    Whether a node's circle is painted neutral (see above): the outermost
    always, and a group while the chart has a colorScale.
*/
export function packNeutral(node: DatumSource, colorScale: boolean): boolean {
  return !node.parent || (colorScale && !!node.children);
}

/** The datum a node's circle is painted from: a neutral one's nest entry. */
export function packPaintDatum(node: DatumSource, neutral: boolean): DataPoint {
  return neutral ? node.data : packDatum(node);
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
