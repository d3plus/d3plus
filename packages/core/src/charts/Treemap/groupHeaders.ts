/**
    Treemap group headers: with a nested `groupBy`, each group above the drawn
    tiles gets a strip across its top naming it, and its tiles sit below the
    strip. Every level above the tiles gets its own strip, nested inside its
    parent's. A group too small for a readable strip gets none, and its tiles
    fill it.

    The layout reserves a strip through d3-hierarchy's `paddingTop`, which
    sees each group's box before its children are tiled into it.
*/

import type {HierarchyRectangularNode} from "d3-hierarchy";

import {merge} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";

import {stampShare} from "../features/shareKey.js";
import {GROUP_DEPTH_KEY, GROUP_LABEL_KEY} from "../viz/groupRow.js";
import type {VizInstance} from "../viz/vizTypes.js";

type Accessor<T> = T | ((d: DataPoint, i: number) => T);

/** The resolved `groupLabelConfig` for one draw. */
export interface GroupLabelStyle {
  fill?: Accessor<string>;
  fontColor?: Accessor<string>;
  label?: (d: DataPoint, i: number) => unknown;
  fontFamily?: string | string[];
  fontSize: number;
  fontWeight: number | string;
  padding: number;
}

/** `groupLabelConfig` defaults, under the user's config. */
export const groupLabelDefaults = {fontSize: 11, fontWeight: 600, padding: 3};

/** A laid-out group's header strip, stamped on its hierarchy node. */
export interface TreemapGroupHeader {
  __d3plus__: true;
  /** The group's rows merged into one, stamped with its `groupBy` level. */
  data: DataPoint;
  /** The group's `groupBy` level. */
  depth: number;
  /** Unique across the chart: the group's key at each level. */
  id: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

type GroupNode = HierarchyRectangularNode<unknown> & {
  data: {key?: unknown};
  groupHeader?: TreemapGroupHeader;
};

/** The groups that reserved a strip, with each strip's height. */
export type GroupStrips = Map<GroupNode, number>;

/**
    The chart's group-header style, or null when headers are off
    (`groupLabels: false`).
*/
export function groupLabelStyle(viz: VizInstance): GroupLabelStyle | null {
  if (viz.schema.groupLabels === false) return null;
  const config = (viz.schema.groupLabelConfig ??
    {}) as Partial<GroupLabelStyle>;
  return {
    ...groupLabelDefaults,
    fontFamily: viz.schema.fontFamily as string | string[] | undefined,
    ...config,
  };
}

/** A strip's height: one line of text plus its padding above and below. */
export function groupStripHeight(
  style: Pick<GroupLabelStyle, "fontSize" | "padding">,
): number {
  return Math.ceil(style.fontSize * 1.2 + style.padding * 2);
}

/**
    Whether a group `width` × `height` pixels gets a strip: it keeps at least
    a strip's height for its tiles below the strip, and is wide enough for a
    few characters of its name.
*/
export function groupStripFits(
  width: number,
  height: number,
  style: Pick<GroupLabelStyle, "fontSize" | "padding">,
): boolean {
  return (
    height >= groupStripHeight(style) * 2 &&
    width >= style.fontSize * 3 + style.padding * 2
  );
}

/**
    The treemap's `paddingTop`: a group above the drawn tiles (hierarchy depth
    1 through `drawDepth`) that fits a strip reserves it, and is recorded in
    `strips` with the strip's height; every other node keeps `padding`.
*/
export function groupPaddingTop(
  opts: {drawDepth: number; padding: number; style: GroupLabelStyle | null},
  strips: GroupStrips,
): (node: HierarchyRectangularNode<unknown>) => number {
  const {drawDepth, padding, style} = opts;
  return node => {
    const group = node as GroupNode;
    if (
      !style ||
      group.depth < 1 ||
      group.depth > drawDepth ||
      group.data.key == null ||
      !groupStripFits(group.x1 - group.x0, group.y1 - group.y0, style)
    )
      return padding;
    const height = groupStripHeight(style);
    strips.set(group, height);
    return height + padding;
  };
}

/** The `id` of a group at a hierarchy node: its key at each level. */
function groupId(node: GroupNode): string {
  return node
    .ancestors()
    .reverse()
    .slice(1)
    .map(n => `${(n as GroupNode).data.key}`)
    .join("/");
}

/**
    Stamps each group that reserved a strip with its header: the strip's box
    (in the group's final, rounded position) and the group's merged row,
    carrying its share of `total` and, when `label` gives one, its own label.
*/
export function attachGroupHeaders(
  strips: GroupStrips,
  opts: {
    aggs: Parameters<typeof merge>[1];
    label?: GroupLabelStyle["label"];
    total: number;
  },
): void {
  for (const [node, height] of strips) {
    const rows = node.leaves().map(leaf => leaf.data as DataPoint);
    const data = merge(rows, opts.aggs) as DataPoint;
    // A group holding the threshold bucket is still a real group.
    delete data._isAggregation;
    delete data._threshold;
    data[GROUP_DEPTH_KEY] = node.depth - 1;
    const text = opts.label ? opts.label(data, 0) : undefined;
    if (text !== undefined && text !== null && text !== false && text !== "")
      data[GROUP_LABEL_KEY] = `${text}`;
    stampShare(data, (node.value ?? 0) / opts.total);
    node.groupHeader = {
      __d3plus__: true,
      data,
      depth: node.depth - 1,
      id: groupId(node),
      x0: node.x0,
      y0: node.y0,
      x1: node.x1,
      y1: Math.min(node.y1, node.y0 + height),
    };
  }
}

/** The headers above the laid-out tiles, shallowest level first. */
export function collectGroupHeaders(
  leaves: {parent: object | null}[],
): TreemapGroupHeader[] {
  const seen = new Set<TreemapGroupHeader>();
  for (const leaf of leaves) {
    let n = leaf.parent as GroupNode | null;
    for (; n; n = n.parent as GroupNode | null)
      if (n.groupHeader) seen.add(n.groupHeader);
  }
  return [...seen].sort((a, b) => a.depth - b.depth);
}
