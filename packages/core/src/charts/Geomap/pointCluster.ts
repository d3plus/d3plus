/**
    Hierarchical, greedy clustering of a Geomap's coordinate points by
    screen distance (the way supercluster does it): the points are
    clustered at a ladder of zoom scales, from the deepest up, each level
    merging the clusters of the one below it that sit within the cluster
    radius of one another at its scale. A cluster at one level is then
    always a union of clusters at every deeper one, so zooming in splits
    clusters and zooming out merges them. Seeds are taken in the points'
    order, so the same points always cluster the same way.

    @module
*/

/** A point to cluster: its position in unzoomed pixels, its radius, and its weight. */
export interface ClusterLeaf {
  x: number;
  y: number;
  r: number;
  weight: number;
}

/** A cluster (or a lone point) at one level. */
export interface ClusterNode {
  /** The index of the point it grew from, which names it at every level it spans. */
  id: number;
  /** Its center: the mean of its points' positions, in unzoomed pixels. */
  x: number;
  y: number;
  /** The indices of its points, the one it grew from first. */
  leaves: number[];
  /** Its points' summed weight. */
  weight: number;
}

/** The clusters at one zoom scale. */
export interface ClusterLevel {
  /** The zoom scale the level is drawn from. */
  k: number;
  nodes: ClusterNode[];
  /** Each point's node, by index into `nodes`. */
  nodeOf: Int32Array;
}

/** How many cluster levels each doubling of the zoom scale gets. */
export const CLUSTER_STEPS = 2;

/** The deepest zoom scale clusters are built for. */
export const CLUSTER_K_MAX = 1024;

/**
    The zoom scales of the cluster levels: `1`, then `CLUSTER_STEPS` steps
    for each doubling, up to `kMax`.
    @param kMax The deepest scale.
*/
export function clusterScales(kMax: number = CLUSTER_K_MAX): number[] {
  const top = Math.max(
    0,
    Math.ceil(Math.log2(Math.max(1, kMax)) * CLUSTER_STEPS),
  );
  return Array.from({length: top + 1}, (_, j) => 2 ** (j / CLUSTER_STEPS));
}

/** A grid cell's column or row, held to the range a 32-bit integer keeps. */
const cellOf = (v: number): number =>
  Math.max(-1e9, Math.min(1e9, Math.floor(v)));

/** A grid cell's hash. */
const cellHash = (cx: number, cy: number): number =>
  (Math.imul(cx, 73856093) ^ Math.imul(cy, 19349663)) >>> 0;

/** Nodes bucketed by grid cell: each node's cell, and its cellmates in order. */
interface CellGrid {
  cx: Int32Array;
  cy: Int32Array;
  /** The next node in the same cell, or -1. */
  next: Int32Array;
  /** The first node in a cell, or -1. */
  first: (cx: number, cy: number) => number;
}

/**
    Buckets nodes into square cells `size` wide, in an open-addressed hash
    of typed arrays, so a level of thousands of points is bucketed without
    allocating per node.
*/
function cellGrid(nodes: {x: number; y: number}[], size: number): CellGrid {
  const n = nodes.length;
  let cap = 2;
  while (cap < n * 2) cap <<= 1;
  const mask = cap - 1;
  const head = new Int32Array(cap).fill(-1),
    kx = new Int32Array(cap),
    ky = new Int32Array(cap);
  const cx = new Int32Array(n),
    cy = new Int32Array(n),
    next = new Int32Array(n);
  const slot = (x: number, y: number): number => {
    let h = cellHash(x, y) & mask;
    while (head[h] !== -1 && (kx[h] !== x || ky[h] !== y)) h = (h + 1) & mask;
    return h;
  };
  // Last to first, so each cell lists its nodes in order.
  for (let i = n - 1; i >= 0; i--) {
    const x = cellOf(nodes[i].x / size),
      y = cellOf(nodes[i].y / size);
    cx[i] = x;
    cy[i] = y;
    const h = slot(x, y);
    if (head[h] === -1) {
      kx[h] = x;
      ky[h] = y;
    }
    next[i] = head[h];
    head[h] = i;
  }
  return {cx, cy, next, first: (x, y) => head[slot(x, y)]};
}

/**
    One level of greedy clustering: each node not yet taken, in order,
    takes every other untaken node within `radius` of it, and the group
    becomes one node at their points' mean position, named by the seed.
    A node with no neighbor stays as it is (and with none at all, the
    level is the nodes given).
    @param nodes The nodes of the level below.
    @param radius The cluster radius, in unzoomed pixels.
*/
export function clusterNodes(
  nodes: ClusterNode[],
  radius: number,
): ClusterNode[] {
  if (!(radius > 0) || nodes.length < 2) return nodes;
  const grid = cellGrid(nodes, radius);
  const taken = new Uint8Array(nodes.length);
  const r2 = radius * radius;
  const out: ClusterNode[] = [];
  let merged = false;
  nodes.forEach((seed, i) => {
    if (taken[i]) return;
    taken[i] = 1;
    let group: number[] | null = null;
    for (let gx = grid.cx[i] - 1; gx <= grid.cx[i] + 1; gx++)
      for (let gy = grid.cy[i] - 1; gy <= grid.cy[i] + 1; gy++)
        for (let j = grid.first(gx, gy); j !== -1; j = grid.next[j]) {
          if (taken[j]) continue;
          const dx = nodes[j].x - seed.x,
            dy = nodes[j].y - seed.y;
          if (dx * dx + dy * dy <= r2) {
            taken[j] = 1;
            (group ??= [i]).push(j);
          }
        }
    if (!group) {
      out.push(seed);
      return;
    }
    merged = true;
    out.push(mergeNodes(nodes, group));
  });
  return merged ? out : nodes;
}

/** One node from a group of them, named by the first, at their points' mean position. */
function mergeNodes(nodes: ClusterNode[], group: number[]): ClusterNode {
  let count = 0,
    sx = 0,
    sy = 0,
    weight = 0;
  const leaves: number[] = [];
  for (const g of group) {
    const n = nodes[g];
    const c = n.leaves.length;
    count += c;
    sx += n.x * c;
    sy += n.y * c;
    weight += n.weight;
    for (const leaf of n.leaves) leaves.push(leaf);
  }
  return {id: nodes[group[0]].id, x: sx / count, y: sy / count, leaves, weight};
}

/** Each point's node in `nodes`, by index. */
function leafIndex(nodes: ClusterNode[], count: number): Int32Array {
  const of = new Int32Array(count).fill(-1);
  nodes.forEach((n, i) => {
    for (const leaf of n.leaves) of[leaf] = i;
  });
  return of;
}

/**
    The cluster levels of some points, one for each of `clusterScales`,
    shallowest first: at each, the clusters `radius` pixels apart once the
    map is zoomed to its scale.
    @param leaves The points, in unzoomed pixels.
    @param radius The cluster radius, in pixels on screen.
    @param kMax The deepest zoom scale.
*/
export function buildClusterLevels(
  leaves: ClusterLeaf[],
  radius: number,
  kMax: number = CLUSTER_K_MAX,
): ClusterLevel[] {
  const ks = clusterScales(kMax);
  let nodes: ClusterNode[] = leaves.map((l, i) => ({
    id: i,
    x: l.x,
    y: l.y,
    leaves: [i],
    weight: l.weight,
  }));
  const levels: ClusterLevel[] = new Array(ks.length);
  for (let j = ks.length - 1; j >= 0; j--) {
    const next = clusterNodes(nodes, radius / ks[j]);
    const deeper = levels[j + 1];
    levels[j] = {
      k: ks[j],
      nodes: next,
      nodeOf:
        deeper && next === nodes
          ? deeper.nodeOf
          : leafIndex(next, leaves.length),
    };
    nodes = next;
  }
  return levels;
}

/**
    The index of the level drawn at zoom scale `k`: the deepest whose scale
    the zoom has reached.
    @param levels The levels, shallowest first.
    @param k The zoom scale.
*/
export function clusterLevelAt(levels: ClusterLevel[], k: number): number {
  let j = 0;
  while (j + 1 < levels.length && levels[j + 1].k <= k * (1 + 1e-9)) j++;
  return j;
}

/**
    The zoom scale at which a node splits into more than one: the scale of
    the first deeper level that draws its points apart, or `Infinity` when
    none does (its points sit too close to ever split).
    @param levels The levels, shallowest first.
    @param j The node's level.
    @param node The node.
*/
export function clusterSplitK(
  levels: ClusterLevel[],
  j: number,
  node: ClusterNode,
): number {
  const first = node.leaves[0];
  for (let jj = j + 1; jj < levels.length; jj++) {
    const level = levels[jj];
    if (level.nodes[level.nodeOf[first]].leaves.length < node.leaves.length)
      return level.k;
  }
  return Infinity;
}

/**
    The box around some of the points: top-left and bottom-right, in
    unzoomed pixels.
    @param leaves The points.
    @param indices Which of them.
*/
export function clusterBounds(
  leaves: ClusterLeaf[],
  indices: number[],
): [[number, number], [number, number]] {
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const i of indices) {
    const {x, y} = leaves[i];
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  return [
    [x0, y0],
    [x1, y1],
  ];
}

/**
    Whether any two of the points' circles overlap (their centers are
    nearer than their two radii).
    @param leaves The points.
*/
export function pointsOverlap(leaves: ClusterLeaf[]): boolean {
  if (leaves.length < 2) return false;
  const size = Math.max(1e-6, 2 * Math.max(...leaves.map(l => l.r)));
  const grid = cellGrid(leaves, size);
  for (let i = 0; i < leaves.length; i++) {
    const a = leaves[i];
    for (let gx = grid.cx[i] - 1; gx <= grid.cx[i] + 1; gx++)
      for (let gy = grid.cy[i] - 1; gy <= grid.cy[i] + 1; gy++)
        for (let j = grid.first(gx, gy); j !== -1; j = grid.next[j]) {
          const b = leaves[j];
          if (j > i && Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r)
            return true;
        }
  }
  return false;
}

/** The space between fanned-out points, in pixels. */
export const SPIDER_GAP = 4;

/**
    Where the points of a cluster that can't split fan out to: evenly
    around a circle about the cluster's center, clear of its bubble and of
    one another, starting at the top and going clockwise. Offsets in
    pixels on screen.
    @param radii The points' radii.
    @param hub The radius of the cluster's bubble.
*/
export function spiderOffsets(
  radii: number[],
  hub: number,
): [number, number][] {
  const n = radii.length;
  if (!n) return [];
  const widest = Math.max(...radii);
  const around = radii.reduce((sum, r) => sum + 2 * r + SPIDER_GAP, 0);
  const ring = Math.max(hub + widest + SPIDER_GAP * 2, around / (2 * Math.PI));
  return radii.map((_, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return [ring * Math.cos(a), ring * Math.sin(a)];
  });
}
