/**
    Shortest-path measures of a network's nodes: betweenness (Brandes'
    algorithm) and closeness, from one search per node. The graph is a list
    of directed arcs; an undirected link is two arcs, one each way.
*/

/** One way along a link: from `source` to `target`, `length` steps long (default 1). */
export interface MeasureArc {
  source: string;
  target: string;
  length?: number;
}

/** Each node's betweenness and closeness, both from 0 to 1. */
export interface NetworkMeasures {
  betweenness: Map<string, number>;
  closeness: Map<string, number>;
}

/** The graph as compressed adjacency: node `i`'s arcs are `offsets[i]` to `offsets[i + 1]`. */
interface Adjacency {
  offsets: Int32Array;
  targets: Int32Array;
  lengths: Float64Array;
  /** Whether every arc is one step long, so a breadth-first search finds shortest paths. */
  unit: boolean;
}

/**
    The arcs between distinct nodes, keeping the shortest of parallel arcs.
    Arcs from a node to itself, arcs to unknown nodes, and arcs without a
    positive finite length are left out.
*/
function adjacency(index: Map<string, number>, arcs: MeasureArc[]): Adjacency {
  const n = index.size;
  const out = Array.from({length: n}, () => new Map<number, number>());
  for (const arc of arcs) {
    const a = index.get(arc.source);
    const b = index.get(arc.target);
    const length = arc.length ?? 1;
    if (a === undefined || b === undefined || a === b) continue;
    if (!(length > 0) || !Number.isFinite(length)) continue;
    const prev = out[a].get(b);
    if (prev === undefined || length < prev) out[a].set(b, length);
  }
  const offsets = new Int32Array(n + 1);
  for (let i = 0; i < n; i++) offsets[i + 1] = offsets[i] + out[i].size;
  const targets = new Int32Array(offsets[n]);
  const lengths = new Float64Array(offsets[n]);
  let unit = true;
  out.forEach((adj, i) => {
    let k = offsets[i];
    for (const [b, length] of adj) {
      targets[k] = b;
      lengths[k++] = length;
      if (length !== 1) unit = false;
    }
  });
  return {offsets, targets, lengths, unit};
}

/** The slack allowed when comparing path lengths, for floating-point sums. */
const EPSILON = 1e-9;

/** Whether path length `a` equals `b` (a positive length), allowing for floating-point sums. */
const same = (a: number, b: number) => Math.abs(a - b) <= EPSILON * b;

/** A binary min-heap of node indices by distance, with stale entries skipped on pop. */
class Heap {
  private nodes: number[] = [];
  private keys: number[] = [];
  get size(): number {
    return this.nodes.length;
  }
  push(node: number, key: number): void {
    const {nodes, keys} = this;
    let i = nodes.length;
    nodes.push(node);
    keys.push(key);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (keys[p] <= key) break;
      nodes[i] = nodes[p];
      keys[i] = keys[p];
      i = p;
    }
    nodes[i] = node;
    keys[i] = key;
  }
  /** The key of the node `pop` last returned. */
  key = 0;
  /** Removes and returns the node with the smallest key, setting `key` to it. */
  pop(): number {
    const {nodes, keys} = this;
    const top = nodes[0];
    this.key = keys[0];
    const node = nodes.pop()!;
    const key = keys.pop()!;
    const n = nodes.length;
    if (n) {
      let i = 0;
      for (;;) {
        let c = 2 * i + 1;
        if (c >= n) break;
        if (c + 1 < n && keys[c + 1] < keys[c]) c++;
        if (keys[c] >= key) break;
        nodes[i] = nodes[c];
        keys[i] = keys[c];
        i = c;
      }
      nodes[i] = node;
      keys[i] = key;
    }
    return top;
  }
}

/** The working arrays one search fills, reused from search to search. */
interface Search {
  dist: Float64Array;
  sigma: Float64Array;
  delta: Float64Array;
  /** The nodes reached, in the order their distances were settled. */
  order: Int32Array;
  reached: number;
  /** Which nodes Dijkstra's search has settled. */
  done: Uint8Array;
}

/** Breadth-first search from `s`, counting shortest paths (every arc one step). */
function bfs(g: Adjacency, s: number, w: Search): void {
  const {dist, sigma, order} = w;
  const {offsets, targets} = g;
  dist.fill(Infinity);
  sigma.fill(0);
  dist[s] = 0;
  sigma[s] = 1;
  order[0] = s;
  let head = 0;
  let tail = 1;
  while (head < tail) {
    const v = order[head++];
    const next = dist[v] + 1;
    const end = offsets[v + 1];
    for (let k = offsets[v]; k < end; k++) {
      const t = targets[k];
      if (dist[t] === Infinity) {
        dist[t] = next;
        order[tail++] = t;
      }
      if (dist[t] === next) sigma[t] += sigma[v];
    }
  }
  w.reached = tail;
}

/** Dijkstra's search from `s`, counting shortest paths. */
function dijkstra(g: Adjacency, s: number, w: Search): void {
  const {dist, sigma, order} = w;
  dist.fill(Infinity);
  sigma.fill(0);
  const {offsets, targets, lengths} = g;
  const done = w.done;
  done.fill(0);
  dist[s] = 0;
  sigma[s] = 1;
  const heap = new Heap();
  heap.push(s, 0);
  let reached = 0;
  while (heap.size) {
    const v = heap.pop();
    const d = heap.key;
    if (done[v] || d > dist[v]) continue;
    done[v] = 1;
    order[reached++] = v;
    const end = offsets[v + 1];
    for (let k = offsets[v]; k < end; k++) {
      const t = targets[k];
      if (done[t]) continue;
      const alt = d + lengths[k];
      if (dist[t] !== Infinity && same(alt, dist[t])) sigma[t] += sigma[v];
      else if (alt < dist[t]) {
        dist[t] = alt;
        sigma[t] = sigma[v];
        heap.push(t, alt);
      }
    }
  }
  w.reached = reached;
}

/**
    Adds each node's share of the shortest paths from the search's source
    to `raw`, walking the reached nodes farthest first.
*/
function accumulate(g: Adjacency, s: number, w: Search, raw: Float64Array) {
  const {dist, sigma, delta, order} = w;
  const {offsets, targets, lengths, unit} = g;
  for (let j = w.reached - 1; j >= 0; j--) {
    const v = order[j];
    const dv = dist[v];
    let sum = 0;
    const end = offsets[v + 1];
    for (let k = offsets[v]; k < end; k++) {
      const t = targets[k];
      const dt = dist[t];
      if (unit ? dt === dv + 1 : dt !== Infinity && same(dv + lengths[k], dt))
        sum += (1 + delta[t]) / sigma[t];
    }
    delta[v] = sum * sigma[v];
    if (v !== s) raw[v] += delta[v];
  }
}

/**
    Works out the measures one node's search at a time (see
    `networkMeasures`), so the work can be spread over several turns.
*/
export interface MeasuresTask {
  /**
      Runs searches until `budget` milliseconds have passed (at least one),
      and returns whether every node has been searched.
  */
  step(budget?: number): boolean;
  /** The measures, once `step` has returned `true`. */
  result(): NetworkMeasures;
}

/** The current time in milliseconds, for task budgets. */
const now = (): number =>
  typeof performance !== "undefined" ? performance.now() : Date.now();

/**
    A task working out each node's betweenness and closeness (see
    `networkMeasures`), one node's search per unit of work.
    @param nodes The node ids; arcs naming other ids are ignored.
    @param arcs The directed arcs between them.
*/
export function measuresTask(
  nodes: string[],
  arcs: MeasureArc[],
): MeasuresTask {
  const index = new Map<string, number>();
  for (const id of nodes) if (!index.has(id)) index.set(id, index.size);
  const n = index.size;
  const g = adjacency(index, arcs);
  const w: Search = {
    dist: new Float64Array(n),
    sigma: new Float64Array(n),
    delta: new Float64Array(n),
    order: new Int32Array(n),
    reached: 0,
    done: new Uint8Array(n),
  };
  const raw = new Float64Array(n);
  const close = new Float64Array(n);
  let s = 0;
  return {
    step(budget = Infinity) {
      const start = now();
      while (s < n) {
        if (g.unit) bfs(g, s, w);
        else dijkstra(g, s, w);
        let total = 0;
        for (let j = 1; j < w.reached; j++) total += w.dist[w.order[j]];
        const r = w.reached - 1;
        close[s] = r > 0 && total > 0 ? (r / total) * (r / (n - 1)) : 0;
        accumulate(g, s, w, raw);
        s++;
        if (now() - start >= budget) break;
      }
      return s >= n;
    },
    result() {
      const scale = n > 2 ? 1 / ((n - 1) * (n - 2)) : 0;
      const betweenness = new Map<string, number>();
      const closeness = new Map<string, number>();
      for (const [id, i] of index) {
        betweenness.set(id, raw[i] * scale);
        closeness.set(id, close[i]);
      }
      return {betweenness, closeness};
    },
  };
}

/**
    Each node's betweenness and closeness.

    Betweenness is the share of shortest paths between other pairs of nodes
    that pass through the node, normalized by `(n - 1)(n - 2)` (the most a
    node can have, as the center of a star), so it runs from 0 to 1.

    Closeness is the inverse of the node's average distance to the nodes it
    can reach, scaled by the share of the other nodes it can reach (Wasserman
    and Faust's form, so a node in a small component isn't as close as one
    linked to everything). It is 1 for a node one step from every other, and
    0 for a node that reaches none. In a directed graph it reads distances
    from the node along its arcs.
    @param nodes The node ids; arcs naming other ids are ignored.
    @param arcs The directed arcs between them.
*/
export function networkMeasures(
  nodes: string[],
  arcs: MeasureArc[],
): NetworkMeasures {
  const task = measuresTask(nodes, arcs);
  task.step();
  return task.result();
}
