/**
    Alluvial geometry: the node order within each column, each node's place
    in its fixed column, each band's ends, and the ribbon drawn for a band.
*/

import type {AlluvialBand, AlluvialGraph, AlluvialNode} from "./aggregate.js";

/**
    How the nodes in each column are ordered, top to bottom: `"crossings"`
    by value in the first column and then each column by where its flows
    come from, `"value"` by value (largest first), `"data"` by the order
    categories first appear in the data, or a comparator.
*/
export type AlluvialNodeSort =
  | "value"
  | "data"
  | "crossings"
  | ((a: AlluvialNode, b: AlluvialNode) => number);

const byFirst = (a: AlluvialNode, b: AlluvialNode) => a.first - b.first;
const byValue = (a: AlluvialNode, b: AlluvialNode) =>
  b.value - a.value || byFirst(a, b);

/**
    Where each node's incoming flows come from: the mean of the middles of
    their source nodes, weighted by each flow's value and measured in value
    units down the previous column (in its current order). A node with no
    incoming flows sorts last.
    @param column The nodes to place.
    @param previous The previous column, already ordered.
*/
export function incomingBarycenters(
  column: AlluvialNode[],
  previous: AlluvialNode[],
): Map<AlluvialNode, number> {
  const middles = new Map<AlluvialNode, number>();
  let y = 0;
  for (const node of previous) {
    middles.set(node, y + node.value / 2);
    y += node.value;
  }
  const centers = new Map<AlluvialNode, number>();
  for (const node of column) {
    let sum = 0;
    let weight = 0;
    for (const band of node.targetBands) {
      const middle = middles.get(band.source);
      if (middle === undefined) continue;
      sum += middle * band.value;
      weight += band.value;
    }
    centers.set(node, weight ? sum / weight : Infinity);
  }
  return centers;
}

/**
    Orders the nodes in every column by `sort` (see `AlluvialNodeSort`), and
    sets each node's `rank` to its position. Ties keep the order the
    categories first appeared in.
    @param graph The aggregated graph; its columns are sorted in place.
    @param sort The ordering.
*/
export function sortAlluvialColumns(
  graph: AlluvialGraph,
  sort: AlluvialNodeSort = "crossings",
): void {
  graph.columns.forEach((column, k) => {
    if (typeof sort === "function")
      column.sort((a, b) => sort(a, b) || byFirst(a, b));
    else if (sort === "data") column.sort(byFirst);
    else if (sort === "crossings" && k > 0) {
      const centers = incomingBarycenters(column, graph.columns[k - 1]);
      column.sort(
        (a, b) =>
          (centers.get(a) ?? 0) - (centers.get(b) ?? 0) || byValue(a, b),
      );
    } else column.sort(byValue);
    column.forEach((node, rank) => (node.rank = rank));
  });
}

/** The space an alluvial is laid out in, and its node sizing. */
export interface AlluvialLayoutOptions {
  width: number;
  height: number;
  /** The space above the nodes kept for the column titles. */
  top: number;
  nodeWidth: number;
  nodePadding: number;
}

/**
    Where each of `n` columns sits: evenly spaced across `width`, the first
    flush left and the last flush right (a single column is centered). Nodes
    narrow when `nodeWidth` would leave less room between columns than a node.
    @param n The number of columns.
    @param width The width to spread them across.
    @param nodeWidth The preferred node width.
    @returns Each column's left edge, and the node width.
*/
export function alluvialColumns(
  n: number,
  width: number,
  nodeWidth: number,
): {x: number[]; nodeWidth: number} {
  const w = Math.max(0, width);
  const size = Math.max(1, Math.min(nodeWidth, n > 1 ? w / (2 * n - 1) : w));
  const step = n > 1 ? (w - size) / (n - 1) : 0;
  const x = Array.from({length: n}, (_, k) =>
    n > 1 ? k * step : (w - size) / 2,
  );
  return {x, nodeWidth: size};
}

/**
    Places every node and band. The columns sit where `alluvialColumns`
    places them. The nodes in each column stack in rank order,
    `nodePadding` apart (less when the most crowded column wouldn't fit),
    centered in the space below `top`, with one value-to-pixel scale for
    every column. Where bands leave a node they stack in the order of their
    targets, and where they enter one in the order of their sources; bands
    sharing both ends stack in the order of their origins.
    @param graph The aggregated, sorted graph; its nodes and bands are positioned in place.
    @param options The layout space and node sizing.
*/
export function layoutAlluvial(
  graph: AlluvialGraph,
  options: AlluvialLayoutOptions,
): void {
  const {columns} = graph;
  const n = columns.length;
  if (!n) return;
  const {x, nodeWidth} = alluvialColumns(n, options.width, options.nodeWidth);
  const top = Math.max(0, options.top);
  const space = Math.max(0, options.height - top);
  const crowded = Math.max(...columns.map(c => c.length));
  const padding =
    crowded > 1
      ? Math.max(0, Math.min(options.nodePadding, space / 2 / (crowded - 1)))
      : 0;
  const scales = columns
    .filter(c => c.length)
    .map(c => {
      const sum = c.reduce((s, d) => s + d.value, 0);
      return sum > 0 ? (space - (c.length - 1) * padding) / sum : Infinity;
    });
  const ky = Math.max(0, Math.min(...scales, Infinity));
  const scale = Number.isFinite(ky) ? ky : 0;

  columns.forEach((column, k) => {
    const x0 = x[k];
    const used =
      column.reduce((s, d) => s + d.value, 0) * scale +
      Math.max(0, column.length - 1) * padding;
    let y = top + (space - used) / 2;
    for (const node of column) {
      node.x0 = x0;
      node.x1 = x0 + nodeWidth;
      node.y0 = y;
      node.y1 = y + node.value * scale;
      y = node.y1 + padding;
    }
  });

  const outgoing = (a: AlluvialBand, b: AlluvialBand) =>
    a.target.rank - b.target.rank || a.origin.rank - b.origin.rank;
  const incoming = (a: AlluvialBand, b: AlluvialBand) =>
    a.source.rank - b.source.rank || a.origin.rank - b.origin.rank;
  for (const column of columns) {
    for (const node of column) {
      let y = node.y0;
      for (const band of node.sourceBands.sort(outgoing)) {
        band.sy0 = y;
        y += band.value * scale;
        band.sy1 = y;
      }
      y = node.y0;
      for (const band of node.targetBands.sort(incoming)) {
        band.ty0 = y;
        y += band.value * scale;
        band.ty1 = y;
      }
    }
  }
}

/**
    A band's ribbon: a filled shape from its source node's right edge to its
    target node's left edge, its top and bottom each an S-curve, so its
    thickness at either end matches its share of the node it touches.
    @param band A positioned band.
*/
export function alluvialRibbon(band: AlluvialBand): string {
  const xs = band.source.x1;
  const xt = band.target.x0;
  const xm = (xs + xt) / 2;
  return (
    `M${xs},${band.sy0}C${xm},${band.sy0},${xm},${band.ty0},${xt},${band.ty0}` +
    `L${xt},${band.ty1}C${xm},${band.ty1},${xm},${band.sy1},${xs},${band.sy1}Z`
  );
}
