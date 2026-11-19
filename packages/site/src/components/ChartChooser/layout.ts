import type {TreeNode} from "./tree.js";
import {nodeKey} from "./tree.js";

/** A tree node placed on the page. */
export interface Placed {
  key: string;
  node: TreeNode;
  depth: number;
  /** The node's left edge and vertical middle, in pixels. */
  x: number;
  y: number;
  /** The parent's key; undefined for the root. */
  parent?: string;
}

export interface TreeLayout {
  nodes: Placed[];
  width: number;
  height: number;
}

/** Below this width the tree draws as an indented outline. */
export const OUTLINE_BELOW = 560;

/** Visits every node depth-first, parents before children. */
function walk(
  tree: TreeNode,
  visit: (node: TreeNode, key: string, depth: number, parent?: string) => void,
) {
  const step = (node: TreeNode, path: string[], parent?: string) => {
    const key = nodeKey([...path, node.id]);
    visit(node, key, path.length, parent);
    node.children?.forEach(child => step(child, [...path, node.id], key));
  };
  step(tree, []);
}

/**
 * A left-to-right dendrogram: every leaf in one column on the right, a row
 * apart, with a gap between the root's branches; each branch level in a
 * column of its own; and each branch beside the middle of its children.
 * `columns` gives each depth's left edge, the last being the leaves'.
 */
export function dendrogram(
  tree: TreeNode,
  {
    columns,
    row,
    gap,
    width,
  }: {columns: number[]; row: number; gap: number; width: number},
): TreeLayout {
  const nodes: Placed[] = [];
  let cursor = row / 2;
  let branch: string | undefined;
  walk(tree, (node, key, depth, parent) => {
    const top = key.split("/").slice(0, 2).join("/");
    if (!node.children) {
      if (branch !== undefined && top !== branch) cursor += gap;
      branch = top;
      nodes.push({
        key,
        node,
        depth,
        parent,
        x: columns[columns.length - 1],
        y: cursor,
      });
      cursor += row;
    } else nodes.push({key, node, depth, parent, x: columns[depth], y: 0});
  });
  // Branches sit beside the middle of their children, deepest first.
  [...nodes]
    .filter(n => n.node.children)
    .sort((a, b) => b.depth - a.depth)
    .forEach(n => {
      const kids = nodes.filter(c => c.parent === n.key);
      n.y = (kids[0].y + kids[kids.length - 1].y) / 2;
    });
  return {nodes, width, height: cursor - row / 2};
}

/**
 * An indented outline, for narrow screens: one node per row in reading
 * order, each indented a step past its parent.
 */
export function indented(
  tree: TreeNode,
  {row, indent, width}: {row: number; indent: number; width: number},
): TreeLayout {
  const nodes: Placed[] = [];
  walk(tree, (node, key, depth, parent) => {
    nodes.push({
      key,
      node,
      depth,
      parent,
      x: depth * indent,
      y: nodes.length * row + row / 2,
    });
  });
  return {nodes, width, height: nodes.length * row};
}

/**
 * An elbow link from a parent's right edge across to a column, down (or up)
 * to the child's row, and on to the child, with rounded corners.
 */
export function elbow(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  turn: number,
  radius = 6,
): string {
  const dy = y1 - y0;
  if (Math.abs(dy) < 0.5) return `M${x0},${y0}H${x1}`;
  const r = Math.min(
    radius,
    Math.abs(dy) / 2,
    Math.max(0, turn - x0),
    Math.max(0, x1 - turn),
  );
  const s = Math.sign(dy);
  return [
    `M${x0},${y0}`,
    `H${turn - r}`,
    `Q${turn},${y0} ${turn},${y0 + s * r}`,
    `V${y1 - s * r}`,
    `Q${turn},${y1} ${turn + r},${y1}`,
    `H${x1}`,
  ].join("");
}

/**
 * An outline link: down from beneath the parent to the child's row, then
 * across to the child, with a rounded corner.
 */
export function outline(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  radius = 6,
): string {
  const r = Math.min(radius, Math.abs(y1 - y0), Math.abs(x1 - x0));
  return `M${x0},${y0}V${y1 - r}Q${x0},${y1} ${x0 + r},${y1}H${x1}`;
}

/**
 * Lays the tree out for a container width: an outline when narrow, else a
 * dendrogram with its leaves as far right as leaves room for their labels,
 * but no further than reads well.
 */
export function placeTree(tree: TreeNode, width: number): TreeLayout {
  if (width < OUTLINE_BELOW)
    return indented(tree, {row: 30, indent: 18, width});
  // The leaves move right as the tree widens, and the branch columns
  // spread out with them, so the links stay short.
  const leaves = Math.min(Math.max(410, width - 170), 660);
  const spread = leaves - 410;
  return dendrogram(tree, {
    columns: [0, 96 + spread * 0.1, 262 + spread * 0.4, leaves],
    row: 21,
    gap: 10,
    width,
  });
}
