// Adapted from d3-sankey 0.12.3, (c) 2015 Mike Bostock, BSD 3-Clause License
// (https://github.com/d3/d3-sankey/blob/main/LICENSE). Ported against d3-array 3
// and d3-shape 3, keeping only the API Sankey uses.

import {max, min, sum} from "d3-array";
import {linkHorizontal} from "d3-shape";

/** A node once laid out: its links, value, column, and extent. */
export interface SankeyNode {
  index: number;
  sourceLinks: SankeyLink[];
  targetLinks: SankeyLink[];
  value: number;
  fixedValue?: number;
  depth: number;
  height: number;
  layer: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** A link once laid out: its resolved ends, thickness, and end centers. */
export interface SankeyLink {
  index: number;
  source: SankeyNode;
  target: SankeyNode;
  value: number;
  width: number;
  y0: number;
  y1: number;
}

/** A link as given: its ends are node indices (or nodes). */
export interface SankeyLinkInput {
  source: number | SankeyNode;
  target: number | SankeyNode;
  value: number;
}

export type SankeyAlign = (node: SankeyNode, n: number) => number;
type Comparator<T> = (a: T, b: T) => number;

/** The fluent layout generator: configure, then call to lay out in place. */
export interface SankeyGenerator {
  (): {nodes: SankeyNode[]; links: SankeyLink[]};
  nodeAlign(align: SankeyAlign): SankeyGenerator;
  nodeSort(sort: Comparator<SankeyNode> | null | undefined): SankeyGenerator;
  nodeWidth(width: number): SankeyGenerator;
  nodePadding(padding: number): SankeyGenerator;
  nodes(nodes: object[]): SankeyGenerator;
  links(links: SankeyLinkInput[]): SankeyGenerator;
  linkSort(sort: Comparator<SankeyLink> | null | undefined): SankeyGenerator;
  size(size: [number, number]): SankeyGenerator;
  iterations(iterations: number): SankeyGenerator;
}

export const sankeyLeft: SankeyAlign = node => node.depth;

export const sankeyRight: SankeyAlign = (node, n) => n - 1 - node.height;

export const sankeyJustify: SankeyAlign = (node, n) =>
  node.sourceLinks.length ? node.depth : n - 1;

export const sankeyCenter: SankeyAlign = node =>
  node.targetLinks.length
    ? node.depth
    : node.sourceLinks.length
      ? (min(node.sourceLinks, d => d.target.depth) as number) - 1
      : 0;

/** A horizontal link path from its source node's right edge to its target's left. */
export function sankeyLinkHorizontal() {
  return linkHorizontal<SankeyLink, [number, number]>()
    .source(d => [d.source.x1, d.y0])
    .target(d => [d.target.x0, d.y1]);
}

const ascendingBreadth = (a: SankeyNode, b: SankeyNode) => a.y0 - b.y0;
const ascendingSourceBreadth = (a: SankeyLink, b: SankeyLink) =>
  ascendingBreadth(a.source, b.source) || a.index - b.index;
const ascendingTargetBreadth = (a: SankeyLink, b: SankeyLink) =>
  ascendingBreadth(a.target, b.target) || a.index - b.index;
const value = (d: {value: number}) => d.value;

function computeLinkBreadths(nodes: SankeyNode[]): void {
  for (const node of nodes) {
    let y0 = node.y0;
    let y1 = y0;
    for (const link of node.sourceLinks) {
      link.y0 = y0 + link.width / 2;
      y0 += link.width;
    }
    for (const link of node.targetLinks) {
      link.y1 = y1 + link.width / 2;
      y1 += link.width;
    }
  }
}

/** Assigns `depth` (from the sources) or `height` (from the sinks) to every node. */
function computeNodeRanks(nodes: SankeyNode[], key: "depth" | "height"): void {
  const n = nodes.length;
  let current = new Set(nodes);
  let next = new Set<SankeyNode>();
  let x = 0;
  while (current.size) {
    for (const node of current) {
      node[key] = x;
      if (key === "depth")
        for (const {target} of node.sourceLinks) next.add(target);
      else for (const {source} of node.targetLinks) next.add(source);
    }
    if (++x > n) throw new Error("circular link");
    current = next;
    next = new Set();
  }
}

/** The generator's settings, shared by the layout steps below. */
interface LayoutState {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  dx: number;
  dy: number;
  py: number;
  align: SankeyAlign;
  sort: Comparator<SankeyNode> | null | undefined;
  linkSort: Comparator<SankeyLink> | null | undefined;
  iterations: number;
}

export function sankey(): SankeyGenerator {
  const s: LayoutState = {
    x0: 0,
    y0: 0,
    x1: 1,
    y1: 1, // size
    dx: 24, // nodeWidth
    dy: 8,
    py: 8, // nodePadding
    align: sankeyJustify,
    sort: undefined,
    linkSort: undefined,
    iterations: 6,
  };
  let nodeList: object[] = [];
  let linkList: SankeyLinkInput[] = [];

  const generator = (() => {
    // The given objects are laid out in place.
    const nodes = nodeList as SankeyNode[];
    const links = linkList as unknown as SankeyLink[];
    computeNodeLinks(s, nodes, links);
    for (const node of nodes) {
      node.value =
        node.fixedValue === undefined
          ? Math.max(sum(node.sourceLinks, value), sum(node.targetLinks, value))
          : node.fixedValue;
    }
    computeNodeRanks(nodes, "depth");
    computeNodeRanks(nodes, "height");
    computeNodeBreadths(s, nodes);
    computeLinkBreadths(nodes);
    return {nodes, links};
  }) as SankeyGenerator;

  generator.nodeAlign = _ => ((s.align = _), generator);
  generator.nodeSort = _ => ((s.sort = _), generator);
  generator.nodeWidth = _ => ((s.dx = +_), generator);
  generator.nodePadding = _ => ((s.dy = s.py = +_), generator);
  generator.nodes = _ => ((nodeList = _), generator);
  generator.links = _ => ((linkList = _), generator);
  generator.linkSort = _ => ((s.linkSort = _), generator);
  generator.size = _ => ((s.x1 = +_[0]), (s.y1 = +_[1]), generator);
  generator.iterations = _ => ((s.iterations = +_), generator);

  return generator;
}

function computeNodeLinks(
  s: LayoutState,
  nodes: SankeyNode[],
  links: SankeyLink[],
): void {
  for (const [i, node] of nodes.entries()) {
    node.index = i;
    node.sourceLinks = [];
    node.targetLinks = [];
  }
  const nodeById = new Map(nodes.map((d, i) => [i, d]));
  const find = (id: number) => {
    const node = nodeById.get(id);
    if (!node) throw new Error("missing: " + id);
    return node;
  };
  for (const [i, link] of links.entries()) {
    link.index = i;
    const input = link as unknown as SankeyLinkInput;
    if (typeof input.source !== "object") link.source = find(input.source);
    if (typeof input.target !== "object") link.target = find(input.target);
    link.source.sourceLinks.push(link);
    link.target.targetLinks.push(link);
  }
  if (s.linkSort != null) {
    for (const {sourceLinks, targetLinks} of nodes) {
      sourceLinks.sort(s.linkSort);
      targetLinks.sort(s.linkSort);
    }
  }
}

function computeNodeLayers(
  s: LayoutState,
  nodes: SankeyNode[],
): SankeyNode[][] {
  const x = (max(nodes, d => d.depth) as number) + 1;
  const kx = (s.x1 - s.x0 - s.dx) / (x - 1);
  const columns: SankeyNode[][] = new Array(x);
  for (const node of nodes) {
    const i = Math.max(0, Math.min(x - 1, Math.floor(s.align(node, x))));
    node.layer = i;
    node.x0 = s.x0 + i * kx;
    node.x1 = node.x0 + s.dx;
    if (columns[i]) columns[i].push(node);
    else columns[i] = [node];
  }
  if (s.sort) for (const column of columns) column.sort(s.sort);
  return columns;
}

function initializeNodeBreadths(s: LayoutState, columns: SankeyNode[][]): void {
  const ky = min(
    columns,
    c => (s.y1 - s.y0 - (c.length - 1) * s.py) / sum(c, value),
  ) as number;
  for (const nodes of columns) {
    let y = s.y0;
    for (const node of nodes) {
      node.y0 = y;
      node.y1 = y + node.value * ky;
      y = node.y1 + s.py;
      for (const link of node.sourceLinks) link.width = link.value * ky;
    }
    y = (s.y1 - y + s.py) / (nodes.length + 1);
    for (let i = 0; i < nodes.length; ++i) {
      const node = nodes[i];
      node.y0 += y * (i + 1);
      node.y1 += y * (i + 1);
    }
    reorderLinks(s, nodes);
  }
}

function computeNodeBreadths(s: LayoutState, nodes: SankeyNode[]): void {
  const columns = computeNodeLayers(s, nodes);
  s.py = Math.min(
    s.dy,
    (s.y1 - s.y0) / ((max(columns, c => c.length) as number) - 1),
  );
  initializeNodeBreadths(s, columns);
  for (let i = 0; i < s.iterations; ++i) {
    const alpha = Math.pow(0.99, i);
    const beta = Math.max(1 - alpha, (i + 1) / s.iterations);
    relaxRightToLeft(s, columns, alpha, beta);
    relaxLeftToRight(s, columns, alpha, beta);
  }
}

// Reposition each node based on its incoming (target) links.
function relaxLeftToRight(
  s: LayoutState,
  columns: SankeyNode[][],
  alpha: number,
  beta: number,
): void {
  for (let i = 1, n = columns.length; i < n; ++i) {
    const column = columns[i];
    for (const target of column) {
      let y = 0;
      let w = 0;
      for (const {source, value} of target.targetLinks) {
        const v = value * (target.layer - source.layer);
        y += targetTop(s, source, target) * v;
        w += v;
      }
      if (!(w > 0)) continue;
      const shift = (y / w - target.y0) * alpha;
      target.y0 += shift;
      target.y1 += shift;
      reorderNodeLinks(s, target);
    }
    if (s.sort === undefined) column.sort(ascendingBreadth);
    resolveCollisions(s, column, beta);
  }
}

// Reposition each node based on its outgoing (source) links.
function relaxRightToLeft(
  s: LayoutState,
  columns: SankeyNode[][],
  alpha: number,
  beta: number,
): void {
  for (let n = columns.length, i = n - 2; i >= 0; --i) {
    const column = columns[i];
    for (const source of column) {
      let y = 0;
      let w = 0;
      for (const {target, value} of source.sourceLinks) {
        const v = value * (target.layer - source.layer);
        y += sourceTop(s, source, target) * v;
        w += v;
      }
      if (!(w > 0)) continue;
      const shift = (y / w - source.y0) * alpha;
      source.y0 += shift;
      source.y1 += shift;
      reorderNodeLinks(s, source);
    }
    if (s.sort === undefined) column.sort(ascendingBreadth);
    resolveCollisions(s, column, beta);
  }
}

function resolveCollisions(
  s: LayoutState,
  nodes: SankeyNode[],
  alpha: number,
): void {
  const i = nodes.length >> 1;
  const subject = nodes[i];
  resolveCollisionsBottomToTop(s, nodes, subject.y0 - s.py, i - 1, alpha);
  resolveCollisionsTopToBottom(s, nodes, subject.y1 + s.py, i + 1, alpha);
  resolveCollisionsBottomToTop(s, nodes, s.y1, nodes.length - 1, alpha);
  resolveCollisionsTopToBottom(s, nodes, s.y0, 0, alpha);
}

// Push any overlapping nodes down.
function resolveCollisionsTopToBottom(
  s: LayoutState,
  nodes: SankeyNode[],
  y: number,
  i: number,
  alpha: number,
): void {
  for (; i < nodes.length; ++i) {
    const node = nodes[i];
    const shift = (y - node.y0) * alpha;
    if (shift > 1e-6) ((node.y0 += shift), (node.y1 += shift));
    y = node.y1 + s.py;
  }
}

// Push any overlapping nodes up.
function resolveCollisionsBottomToTop(
  s: LayoutState,
  nodes: SankeyNode[],
  y: number,
  i: number,
  alpha: number,
): void {
  for (; i >= 0; --i) {
    const node = nodes[i];
    const shift = (node.y1 - y) * alpha;
    if (shift > 1e-6) ((node.y0 -= shift), (node.y1 -= shift));
    y = node.y0 - s.py;
  }
}

function reorderNodeLinks(
  s: LayoutState,
  {sourceLinks, targetLinks}: SankeyNode,
): void {
  if (s.linkSort === undefined) {
    for (const {source} of targetLinks)
      source.sourceLinks.sort(ascendingTargetBreadth);
    for (const {target} of sourceLinks)
      target.targetLinks.sort(ascendingSourceBreadth);
  }
}

function reorderLinks(s: LayoutState, nodes: SankeyNode[]): void {
  if (s.linkSort === undefined) {
    for (const {sourceLinks, targetLinks} of nodes) {
      sourceLinks.sort(ascendingTargetBreadth);
      targetLinks.sort(ascendingSourceBreadth);
    }
  }
}

// Returns the target.y0 that would produce an ideal link from source to target.
function targetTop(
  s: LayoutState,
  source: SankeyNode,
  target: SankeyNode,
): number {
  let y = source.y0 - ((source.sourceLinks.length - 1) * s.py) / 2;
  for (const {target: node, width} of source.sourceLinks) {
    if (node === target) break;
    y += width + s.py;
  }
  for (const {source: node, width} of target.targetLinks) {
    if (node === source) break;
    y -= width;
  }
  return y;
}

// Returns the source.y0 that would produce an ideal link from source to target.
function sourceTop(
  s: LayoutState,
  source: SankeyNode,
  target: SankeyNode,
): number {
  let y = target.y0 - ((target.targetLinks.length - 1) * s.py) / 2;
  for (const {source: node, width} of target.targetLinks) {
    if (node === source) break;
    y += width + s.py;
  }
  for (const {target: node, width} of source.sourceLinks) {
    if (node === target) break;
    y -= width;
  }
  return y;
}
