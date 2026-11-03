/**
    Finds the links that close a loop (A → B → A, or A → A), so Sankey can
    lay out the rest.
*/

/** A link between two nodes, given as node indices, and its flow. */
export interface SankeyWeightedLink {
  source: number;
  target: number;
  value: number;
}

/** A link's weight for choosing which links to keep: its value, or 0. */
const weight = (l: SankeyWeightedLink): number =>
  Number.isFinite(l.value) ? l.value : 0;

/**
    Node positions in reverse DFS postorder, so most links already point
    forward before any is checked.
*/
function initialOrder(n: number, out: number[][]): Int32Array {
  const ord = new Int32Array(n);
  const seen = new Uint8Array(n);
  let next = n;
  for (let root = 0; root < n; root++) {
    if (seen[root]) continue;
    seen[root] = 1;
    const nodes = [root];
    const edges = [0];
    while (nodes.length) {
      const top = nodes.length - 1;
      const w = nodes[top];
      if (edges[top] < out[w].length) {
        const z = out[w][edges[top]++];
        if (!seen[z]) {
          seen[z] = 1;
          nodes.push(z);
          edges.push(0);
        }
      } else {
        nodes.pop();
        edges.pop();
        ord[w] = --next;
      }
    }
  }
  return ord;
}

/**
    An acyclic graph that links are added to one at a time, keeping its
    nodes in topological order (Pearce and Kelly's dynamic topological
    sort), so a link that points forward is added without a search.
*/
function acyclicGraph(n: number, ord: Int32Array) {
  const out: number[][] = Array.from({length: n}, () => []);
  const inn: number[][] = Array.from({length: n}, () => []);
  const mark = new Int32Array(n);
  let stamp = 0;

  /** The nodes reachable from `start` along `adj`, within `inside`. */
  const search = (
    start: number,
    adj: number[][],
    inside: (z: number) => boolean,
    stop = -1,
  ): number[] | null => {
    stamp++;
    mark[start] = stamp;
    const found = [start];
    for (let k = 0; k < found.length; k++) {
      for (const z of adj[found[k]]) {
        if (z === stop) return null;
        if (mark[z] !== stamp && inside(z)) {
          mark[z] = stamp;
          found.push(z);
        }
      }
    }
    return found;
  };

  /** Adds `x → y` and returns true, or returns false if it closes a loop. */
  return (x: number, y: number): boolean => {
    if (x === y) return false;
    const lb = ord[y];
    const ub = ord[x];
    if (lb < ub) {
      const ahead = search(y, out, z => ord[z] <= ub, x);
      if (!ahead) return false;
      const behind = search(x, inn, z => ord[z] >= lb) as number[];
      const byOrd = (a: number, b: number) => ord[a] - ord[b];
      behind.sort(byOrd);
      ahead.sort(byOrd);
      const moved = behind.concat(ahead);
      const slots = moved.map(z => ord[z]).sort((a, b) => a - b);
      moved.forEach((z, k) => (ord[z] = slots[k]));
    }
    out[x].push(y);
    inn[y].push(x);
    return true;
  };
}

/**
    Splits links into a set Sankey can lay out, with no loops, and the links
    left out because they close one. Links are taken heaviest `value` first
    (ties in the order given), and a link is left out when the links kept
    so far already lead from its target back to its source. So every link
    left out is the lightest on a loop it closes, and adding any of them
    back would close a loop. A link from a node to itself is left out too.
    Both lists keep the order the links were given in.
    @param links Links whose `source` and `target` are node indices.
*/
export function sankeyAcyclicLinks<L extends SankeyWeightedLink>(
  links: readonly L[],
): {kept: L[]; looped: L[]} {
  let n = 0;
  for (const l of links) n = Math.max(n, l.source + 1, l.target + 1);
  const out: number[][] = Array.from({length: n}, () => []);
  for (const l of links)
    if (l.source !== l.target) out[l.source].push(l.target);
  const add = acyclicGraph(n, initialOrder(n, out));

  const byWeight = links
    .map((l, i) => i)
    .sort((a, b) => weight(links[b]) - weight(links[a]) || a - b);
  const looped = new Uint8Array(links.length);
  for (const i of byWeight)
    if (!add(links[i].source, links[i].target)) looped[i] = 1;

  const kept: L[] = [];
  const left: L[] = [];
  links.forEach((l, i) => (looped[i] ? left : kept).push(l));
  return {kept, looped: left};
}
