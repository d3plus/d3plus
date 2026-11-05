/** A node id in a `louvain` graph. */
export type LouvainId = string | number;

/** One undirected link of a `louvain` graph, with an optional weight (default 1). */
export interface LouvainLink {
  source: LouvainId;
  target: LouvainId;
  weight?: number;
}

/** The graph `louvain` partitions: node ids, and the links between them. */
export interface LouvainGraph {
  nodes: LouvainId[];
  links: LouvainLink[];
}

/** Options for `louvain`. */
export interface LouvainOptions {
  /** Above 1 favors more, smaller communities; below 1, fewer, larger ones. Default 1. */
  resolution?: number;
}

/** One level of the graph: each node's weighted neighbors, self-loop weight, and degree. */
interface Level {
  neighbors: Map<number, number>[];
  self: number[];
  degree: number[];
}

const EPS = 1e-12;

/** The first level: node indices, with duplicate links summed and self-loops kept apart. */
function firstLevel(graph: LouvainGraph): Level {
  const index = new Map<LouvainId, number>();
  graph.nodes.forEach(id => {
    if (!index.has(id)) index.set(id, index.size);
  });
  const n = index.size;
  const neighbors = Array.from({length: n}, () => new Map<number, number>());
  const self = new Array<number>(n).fill(0);
  for (const link of graph.links) {
    const a = index.get(link.source);
    const b = index.get(link.target);
    const w = link.weight === undefined ? 1 : link.weight;
    if (a === undefined || b === undefined || !(w > 0) || !isFinite(w))
      continue;
    if (a === b) self[a] += w;
    else {
      neighbors[a].set(b, (neighbors[a].get(b) ?? 0) + w);
      neighbors[b].set(a, (neighbors[b].get(a) ?? 0) + w);
    }
  }
  return withDegrees(neighbors, self);
}

/** Adds each node's degree: its links' weights, with a self-loop counted twice. */
function withDegrees(neighbors: Map<number, number>[], self: number[]): Level {
  const degree = neighbors.map((adj, i) => {
    let k = 2 * self[i];
    for (const w of adj.values()) k += w;
    return k;
  });
  return {neighbors, self, degree};
}

/**
    Moves each node, in index order, to the neighboring community that raises
    modularity most, until a sweep moves none. A node stays put on a tie with
    its own community, and otherwise takes the lowest-numbered of the tied
    ones, so the result is the same on every run. Returns each node's
    community and whether any node moved.
*/
function localMoves(
  level: Level,
  m2: number,
  resolution: number,
): {community: number[]; moved: boolean} {
  const n = level.degree.length;
  const community = Array.from({length: n}, (_, i) => i);
  const total = level.degree.slice();
  let moved = false;
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < n; i++) {
      const k = level.degree[i];
      const own = community[i];
      const links = new Map<number, number>();
      for (const [j, w] of level.neighbors[i])
        links.set(community[j], (links.get(community[j]) ?? 0) + w);
      total[own] -= k;
      const gain = (c: number) =>
        (links.get(c) ?? 0) - (resolution * total[c] * k) / m2;
      let best = own;
      let bestGain = gain(own);
      for (const c of links.keys()) {
        const g = gain(c);
        if (
          g > bestGain + EPS ||
          (Math.abs(g - bestGain) <= EPS && c < best && best !== own)
        ) {
          best = c;
          bestGain = g;
        }
      }
      total[best] += k;
      if (best !== own) {
        community[i] = best;
        improved = moved = true;
      }
    }
  }
  return {community, moved};
}

/** Renumbers communities 0, 1, … in the order of their lowest node. */
function renumber(community: number[]): number[] {
  const ids = new Map<number, number>();
  return community.map(c => {
    if (!ids.has(c)) ids.set(c, ids.size);
    return ids.get(c)!;
  });
}

/** The next level: one node per community, its internal links as a self-loop. */
function aggregate(level: Level, community: number[]): Level {
  const size = community.reduce((most, c) => Math.max(most, c + 1), 0);
  const neighbors = Array.from({length: size}, () => new Map<number, number>());
  const self = new Array<number>(size).fill(0);
  level.neighbors.forEach((adj, i) => {
    const a = community[i];
    self[a] += level.self[i];
    for (const [j, w] of adj) {
      const b = community[j];
      // Each link appears from both ends.
      if (a === b) self[a] += w / 2;
      else neighbors[a].set(b, (neighbors[a].get(b) ?? 0) + w);
    }
  });
  return withDegrees(neighbors, self);
}

/**
    Finds communities in a graph with the Louvain method (Blondel et al.,
    2008): each node joins the neighboring community that raises modularity
    most, then each community becomes one node, until nothing moves. Links
    are undirected; duplicates add their weights, and links with a missing
    end or a weight that isn't a positive number are ignored. The result is
    deterministic: nodes are visited in the order given, and ties go to the
    lowest-numbered community.

    Returns each node's community, numbered from 0 by size (largest first,
    ties in the order the communities' first nodes appear in `nodes`). A
    node with no links is a community of its own.
    @param graph The node ids and the links between them.
    @param options The modularity `resolution`.
*/
export default function louvain(
  graph: LouvainGraph,
  options: LouvainOptions = {},
): Map<LouvainId, number> {
  const resolution = options.resolution ?? 1;
  let level = firstLevel(graph);
  const n = level.degree.length;
  let membership = Array.from({length: n}, (_, i) => i);
  const m2 = level.degree.reduce((sum, k) => sum + k, 0);
  if (m2 > 0) {
    for (;;) {
      const {community, moved} = localMoves(level, m2, resolution);
      if (!moved) break;
      const next = renumber(community);
      membership = membership.map(c => next[c]);
      level = aggregate(level, next);
    }
  }
  return bySize(graph.nodes, membership);
}

/** Maps each id to its community, renumbered largest first. */
function bySize(
  nodes: LouvainId[],
  membership: number[],
): Map<LouvainId, number> {
  const ids = Array.from(new Set(nodes));
  const sizes = new Map<number, number>();
  const first = new Map<number, number>();
  membership.forEach((c, i) => {
    sizes.set(c, (sizes.get(c) ?? 0) + 1);
    if (!first.has(c)) first.set(c, i);
  });
  const order = [...sizes.keys()].sort(
    (a, b) => sizes.get(b)! - sizes.get(a)! || first.get(a)! - first.get(b)!,
  );
  const rank = new Map(order.map((c, i) => [c, i]));
  return new Map(ids.map((id, i) => [id, rank.get(membership[i])!]));
}
