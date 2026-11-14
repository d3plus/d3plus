/**
    Tree's `nodeHeight`: each node's height above the leaves, read from a
    value (such as the distance at which a clustering merged its children),
    which sets how far from the root it sits, so the leaves line up at the
    far edge as in a cluster dendrogram.
*/

/** A laid-out Tree node, as far as its height needs. */
export interface HeightNode {
  depth?: number;
  children?: HeightNode[];
}

/** What `nodeHeight` receives about a node, after its row and index. */
export interface NodeHeightInfo {
  /** The node's id: its `groupBy` value at its own level. */
  id: string;
  /** The node's `groupBy` level, 0 for the top. */
  level: number;
  /** Whether the node is drawn without children. */
  leaf: boolean;
}

/**
    Each drawn node's height: its value when that is a finite number, else 0
    for a leaf, and for a branch the height of its tallest drawn child, so a
    branch never sits below its children. A node is a leaf when none of its
    `children` is drawn.
    @param nodes The drawn nodes.
    @param value A node's value, or anything else for none.
*/
export function nodeHeights<T extends HeightNode>(
  nodes: readonly T[],
  value: (n: T) => unknown,
): Map<T, number> {
  const drawn = new Set<HeightNode>(nodes);
  const out = new Map<T, number>();
  const deepestFirst = [...nodes].sort(
    (a, b) => (b.depth ?? 0) - (a.depth ?? 0),
  );
  for (const n of deepestFirst) {
    const v = value(n);
    if (typeof v === "number" && Number.isFinite(v)) {
      out.set(n, v);
      continue;
    }
    const kids = (n.children ?? []).filter(c => drawn.has(c)) as T[];
    out.set(n, kids.length ? Math.max(...kids.map(c => out.get(c) ?? 0)) : 0);
  }
  return out;
}

/**
    How far each node sits from the root, as a share of the way from the
    root (0) to the leaves (1). By `heights` when given: the root sits at
    the tallest height, and when several nodes share the top level, at an
    unseen root one level's share of that height above them. Otherwise by
    depth: one even step per level, the top level at 0 when it holds a
    single node, else one step out from an unseen root at 0. A tree with
    nothing to spread (one level, or every height 0) falls back to depth.
    @param nodes The drawn nodes, the top level at depth 1.
    @param heights Each node's height (see `nodeHeights`), or none.
*/
export function rootDistances<T extends HeightNode>(
  nodes: readonly T[],
  heights?: Map<T, number>,
): Map<T, number> {
  const out = new Map<T, number>();
  if (!nodes.length) return out;
  const depthOf = (n: T) => n.depth ?? 1;
  const tops = nodes.filter(n => depthOf(n) === 1);
  const deepest = Math.max(...nodes.map(depthOf));
  const single = tops.length === 1;
  if (heights) {
    const tallest = Math.max(...nodes.map(n => heights.get(n) ?? 0));
    const root = single ? tallest : tallest * (1 + 1 / deepest);
    if (root > 0) {
      for (const n of nodes) out.set(n, (root - (heights.get(n) ?? 0)) / root);
      return out;
    }
  }
  const steps = single ? deepest - 1 : deepest;
  for (const n of nodes)
    out.set(n, steps > 0 ? (depthOf(n) - (single ? 1 : 0)) / steps : 0);
  return out;
}
