/**
    Where a Network's nodes start on each draw when the chart remembers its
    layout (see `liveForce.ts`): the nodes it drew last time keep their
    places, and a node that wasn't there enters beside a linked neighbor.

    @module
*/

/** A point in the chart's pixel space. */
export interface Position {
  x: number;
  y: number;
}

/** The chart area a set of positions was laid out in. */
export interface Bounds {
  width: number;
  height: number;
}

/** A node as these helpers read it: its id, radius, and laid-out position. */
export interface PlacedNode {
  id: string;
  r: number;
  x?: number;
  y?: number;
}

/** A link between two nodes, by their ids. */
export interface LinkEnds {
  source?: {id: string};
  target?: {id: string};
}

/** The angle between successive nodes placed around the same neighbor. */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/**
    Moves positions laid out in `from` into `to`: scaled evenly (so the
    layout keeps its shape) by the smaller of the two size ratios, about the
    centers of the two areas.
    @param positions The positions, by node id.
    @param from The area they were laid out in.
    @param to The area to move them into.
*/
export function rescalePositions(
  positions: ReadonlyMap<string, Position>,
  from: Bounds,
  to: Bounds,
): Map<string, Position> {
  if (from.width === to.width && from.height === to.height)
    return new Map(positions);
  const scale = Math.min(to.width / from.width, to.height / from.height);
  const k = Number.isFinite(scale) && scale > 0 ? scale : 1;
  const out = new Map<string, Position>();
  for (const [id, p] of positions)
    out.set(id, {
      x: to.width / 2 + (p.x - from.width / 2) * k,
      y: to.height / 2 + (p.y - from.height / 2) * k,
    });
  return out;
}

/**
    The node ids linked to each node (a link from a node to itself adds
    none).
    @param links The links.
*/
export function neighborIds(links: readonly LinkEnds[]): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const l of links) {
    const a = l.source?.id;
    const b = l.target?.id;
    if (a === undefined || b === undefined || a === b) continue;
    if (!out.has(a)) out.set(a, []);
    if (!out.has(b)) out.set(b, []);
    out.get(a)!.push(b);
    out.get(b)!.push(a);
  }
  return out;
}

/**
    Where each node starts this draw. A node in `previous` keeps its
    position. A new node enters beside a placed neighbor (one that kept its
    position, or a new one already placed), just clear of it, each further
    node around the same neighbor turned by the golden angle; a new node with
    no placed neighbor starts at its own laid-out `x`/`y`. Without any node
    in `previous`, every node starts at its laid-out position.
    @param nodes The nodes, at their laid-out (precomputed) positions.
    @param links The links between them.
    @param previous Each node's position on the last draw, by id.
    @returns The positions by id, and the ids of the nodes that entered beside a neighbor.
*/
export function seedPositions(
  nodes: readonly PlacedNode[],
  links: readonly LinkEnds[],
  previous: ReadonlyMap<string, Position>,
): {positions: Map<string, Position>; entered: string[]} {
  const positions = new Map<string, Position>();
  const own = (n: PlacedNode): Position => ({x: n.x ?? 0, y: n.y ?? 0});
  if (!nodes.some(n => previous.has(n.id))) {
    for (const n of nodes) positions.set(n.id, own(n));
    return {positions, entered: []};
  }
  const byId = new Map(nodes.map(n => [n.id, n]));
  for (const n of nodes) {
    const p = previous.get(n.id);
    if (p) positions.set(n.id, {x: p.x, y: p.y});
  }
  const neighbors = neighborIds(links);
  const around = new Map<string, number>();
  const entered: string[] = [];
  // Breadth-first out from the placed nodes, so a chain of new nodes
  // enters link by link from the nearest placed one.
  const queue = [...positions.keys()];
  while (queue.length) {
    const id = queue.shift()!;
    const anchor = positions.get(id)!;
    const anchorR = byId.get(id)?.r ?? 0;
    for (const nid of neighbors.get(id) ?? []) {
      const n = byId.get(nid);
      if (!n || positions.has(nid)) continue;
      const k = around.get(id) ?? 0;
      around.set(id, k + 1);
      const angle = k * GOLDEN_ANGLE;
      const reach = anchorR + n.r + Math.max(anchorR, n.r);
      positions.set(nid, {
        x: anchor.x + Math.cos(angle) * reach,
        y: anchor.y + Math.sin(angle) * reach,
      });
      entered.push(nid);
      queue.push(nid);
    }
  }
  for (const n of nodes) if (!positions.has(n.id)) positions.set(n.id, own(n));
  return {positions, entered};
}

/**
    The ids and links a layout depends on, as one string: two draws with the
    same key lay out the same graph.
    @param nodes The nodes.
    @param links The links.
*/
export function graphKey(
  nodes: readonly {id: string}[],
  links: readonly LinkEnds[],
): string {
  const ids = nodes.map(n => n.id).join("\u0000");
  const ends = links
    .flatMap(l =>
      l.source && l.target ? [`${l.source.id}>${l.target.id}`] : [],
    )
    .join("\u0000");
  return `${ids}|${ends}`;
}

/**
    Positions for the nodes given an `x`/`y` in the data when only some of
    them have one: their coordinates fitted into the chart area (the same
    scale on both axes, centered), kept `pad` pixels from its edges. A lone
    one sits in the middle.
    @param coords Each such node's data coordinates, by id.
    @param bounds The chart area.
    @param pad The room kept at each edge.
*/
export function fitDataPositions(
  coords: ReadonlyMap<string, [number, number]>,
  bounds: Bounds,
  pad: number,
): Map<string, Position> {
  const out = new Map<string, Position>();
  const points = [...coords.values()];
  if (!points.length) return out;
  const xs = points.map(p => p[0]);
  const ys = points.map(p => p[1]);
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
  const [y0, y1] = [Math.min(...ys), Math.max(...ys)];
  const w = Math.max(0, bounds.width - pad * 2);
  const h = Math.max(0, bounds.height - pad * 2);
  const spanX = x1 - x0;
  const spanY = y1 - y0;
  const scale = Math.min(
    spanX > 0 ? w / spanX : Infinity,
    spanY > 0 ? h / spanY : Infinity,
  );
  const k = Number.isFinite(scale) ? scale : 0;
  for (const [id, [x, y]] of coords)
    out.set(id, {
      x: bounds.width / 2 + (x - (x0 + x1) / 2) * k,
      y: bounds.height / 2 + (y - (y0 + y1) / 2) * k,
    });
  return out;
}

/**
    The typical distance between linked nodes: the median length of the
    links, or (without any) four times the median radius.
    @param nodes The nodes, positioned.
    @param links The links.
*/
export function linkSpacing(
  nodes: readonly PlacedNode[],
  links: readonly LinkEnds[],
): number {
  const byId = new Map(nodes.map(n => [n.id, n]));
  const lengths = links
    .flatMap(l => {
      const a = l.source && byId.get(l.source.id);
      const b = l.target && byId.get(l.target.id);
      if (!a || !b || a === b) return [];
      return [Math.hypot((a.x ?? 0) - (b.x ?? 0), (a.y ?? 0) - (b.y ?? 0))];
    })
    .filter(d => d > 0)
    .sort((a, b) => a - b);
  if (lengths.length) return lengths[Math.floor(lengths.length / 2)];
  const radii = nodes.map(n => n.r).sort((a, b) => a - b);
  return radii.length ? radii[Math.floor(radii.length / 2)] * 4 : 1;
}
