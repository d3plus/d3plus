/**
    A packed circle's scene key and accessible name. Each group and leaf
    circle is keyed by its path of keys, so a redraw pairs it with itself
    however the circles reorder, and a group circle is named after its own
    group, at its own `groupBy` level; the outermost circle, enclosing every
    group, is named as the chart's total.
*/

import type {DataPoint} from "@d3plus/data";

import type {VizInstance} from "../viz/vizTypes.js";
import type {PackLeaf} from "./applyLayout.js";

type PackNode = Pick<
  PackLeaf,
  "children" | "data" | "depth" | "i" | "leaves" | "parent" | "value"
>;

type Link = {data: DataPoint; parent: Link | null};

/** A group's key at each `groupBy` level, from the first down to its own. */
function groupPath(node: Link): string {
  const keys: string[] = [];
  for (let n: Link | null = node; n && n.parent; n = n.parent)
    keys.unshift(`${n.data.key}`);
  return keys.join("/");
}

/**
    The circle's scene key: a group's path of keys, and a leaf's its groups'
    keys and then its own id (the key of the one-row group it was nested
    in), so no two circles share one and each keeps its own across redraws.
*/
export function packNodeKey(node: PackNode): string {
  const parent = node.parent;
  if (!parent) return "pack-root-0";
  if (node.children) return `pack-group-${groupPath(node)}`;
  const key = `pack-leaf-${groupPath(parent)}`;
  // Rows that share every key are told apart by their order.
  const siblings: unknown[] = parent.children ?? [];
  return siblings.length > 1 ? `${key}#${siblings.indexOf(node)}` : key;
}

/**
    The circle's accessible name and value: a leaf's label, a group's name at
    its own `groupBy` level (as Treemap names its group headers), or the
    translated "Total" for the root.
*/
export function packNodeLabel(viz: VizInstance, node: PackNode): string {
  let name: string;
  if (!node.parent) name = viz.schema.translate("Total");
  else if (node.children)
    name = viz._drawLabel(node.leaves()[0].data, 0, node.depth - 1);
  else name = viz._drawLabel(node.data, node.i);
  return `${name}, ${node.value}.`;
}
