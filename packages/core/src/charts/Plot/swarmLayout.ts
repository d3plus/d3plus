/**
    Deterministic beeswarm packing. Circles keep their position along the value
    axis and are pushed off the centerline just far enough not to overlap: each
    circle, taken in order of value, goes to the free offset closest to the
    centerline. No randomness or force simulation, so the same input always
    yields the same layout.
*/

/** A circle to place: its pixel position along the value axis and its radius. */
export interface SwarmNode {
  value: number;
  r: number;
}

/** What a swarm does when it is wider than its band. */
export type SwarmOverflow = "shrink" | "clamp" | "visible";

/** Options for `fitSwarms`. */
export interface SwarmFitOptions {
  /** Minimum gap between neighboring circles, in pixels. */
  padding: number;
  /** Half the band each swarm may fill, measured from its centerline. */
  extent: number;
  /**
      `"shrink"` scales every radius (and the padding) down until each swarm
      fits its band, `"clamp"` keeps the radii and holds overflowing circles at
      the band's edge (they may overlap there), and `"visible"` lets swarms
      spill past their band.
  */
  overflow: SwarmOverflow;
}

/** The result of `fitSwarms`: per-swarm offsets plus the radius scale applied. */
export interface SwarmFit {
  offsets: number[][];
  scale: number;
}

/**
    The free offset closest to 0 given the offset intervals already taken.
    Touching intervals leave their shared endpoint free (tangent circles are
    allowed). On a tie the negative side wins.
*/
export function closestFreeOffset(intervals: [number, number][]): number {
  if (!intervals.length) return 0;
  const sorted = intervals.slice().sort((a, b) => a[0] - b[0]);
  let [start, end] = sorted[0];
  for (let k = 1; k <= sorted.length; k++) {
    const next = sorted[k];
    if (next && next[0] < end) {
      if (next[1] > end) end = next[1];
      continue;
    }
    if (start < 0 && end > 0) return -start <= end ? start : end;
    if (next) [start, end] = next;
  }
  return 0;
}

/**
    Packs one swarm: returns each node's offset from the centerline, in input
    order. Runs in O(n log n + n·k log k), where k is the number of circles
    within one diameter along the value axis.
*/
export function swarmLayout(nodes: SwarmNode[], padding = 0): number[] {
  const offsets: number[] = nodes.map(() => 0);
  if (nodes.length < 2) return offsets;
  const order = nodes
    .map((_, i) => i)
    .sort((a, b) => nodes[a].value - nodes[b].value || a - b);
  const maxR = Math.max(...nodes.map(n => n.r));
  const reach = maxR * 2 + padding;
  const placed: number[] = [];
  let first = 0;
  for (const i of order) {
    const {value, r} = nodes[i];
    while (first < placed.length && nodes[placed[first]].value < value - reach)
      first++;
    const taken: [number, number][] = [];
    for (let k = first; k < placed.length; k++) {
      const j = placed[k];
      const dx = value - nodes[j].value;
      const gap = r + nodes[j].r + padding;
      if (dx < gap) {
        const h = Math.sqrt(gap * gap - dx * dx);
        taken.push([offsets[j] - h, offsets[j] + h]);
      }
    }
    offsets[i] = closestFreeOffset(taken);
    placed.push(i);
  }
  return offsets;
}

/** How far a swarm reaches from its centerline: the largest |offset| + radius. */
export function swarmExtent(
  nodes: SwarmNode[],
  offsets: number[],
  scale = 1,
): number {
  let out = 0;
  nodes.forEach((n, i) => {
    out = Math.max(out, Math.abs(offsets[i]) + n.r * scale);
  });
  return out;
}

const scaleNodes = (nodes: SwarmNode[], scale: number): SwarmNode[] =>
  scale === 1 ? nodes : nodes.map(n => ({value: n.value, r: n.r * scale}));

/**
    The radius scale (≤ 1) at which a swarm fits within `extent` of its
    centerline. A dense swarm's height grows with the square of its radii, so
    each step scales by the square root of the remaining overshoot.
*/
export function swarmFitScale(
  nodes: SwarmNode[],
  padding: number,
  extent: number,
): number {
  let scale = 1;
  for (let step = 0; step < 12; step++) {
    const reach = swarmExtent(
      nodes,
      swarmLayout(scaleNodes(nodes, scale), padding * scale),
      scale,
    );
    if (reach <= extent || reach === 0) break;
    scale *= Math.max(0.5, Math.sqrt(extent / reach) * 0.98);
  }
  return scale;
}

/**
    Packs several swarms (e.g. one per category lane) that share a band size.
    Under `"shrink"` every swarm uses the same radius scale, so circle sizes
    stay comparable across swarms.
*/
export function fitSwarms(
  groups: SwarmNode[][],
  options: SwarmFitOptions,
): SwarmFit {
  const {padding, extent, overflow} = options;
  const scale =
    overflow === "shrink" && extent > 0
      ? Math.min(1, ...groups.map(g => swarmFitScale(g, padding, extent)))
      : 1;
  const offsets = groups.map(group => {
    const placed = swarmLayout(scaleNodes(group, scale), padding * scale);
    if (overflow === "visible") return placed;
    return placed.map((o, i) => {
      const limit = Math.max(0, extent - group[i].r * scale);
      return Math.max(-limit, Math.min(limit, o));
    });
  });
  return {offsets, scale};
}
