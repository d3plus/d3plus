/**
    Lays out a Sankey with circular links: runs the layout once to see where
    the nodes fall, reserves room around them for the circular links' lanes
    and legs, runs it again inside that room, then places each circular
    link's band (see `circularLinks.ts`).
*/

import {
  circularLanes,
  circularLinkOrder,
  circularLinkShape,
  circularLinkSide,
  circularReserve,
  stackCircularEnds,
} from "./circularLinks.js";
import type {
  CircularLinkInput,
  CircularNode,
  CircularLane,
  CircularShape,
} from "./circularLinks.js";

type Extent = [[number, number], [number, number]];

/** A circular link once laid out. */
export interface CircularLaidLink<N, D> {
  source: N;
  target: N;
  value: number;
  datum: D;
  width: number;
  y0: number;
  y1: number;
  /** The band's geometry (see `circularLinkShape`). */
  circular: CircularShape;
}

/**
    The pixels per unit of value the layout drew the nodes at: a node's
    height over its value (every node shares it), or 0 when no node has a
    value.
*/
export function sankeyScale(
  nodes: readonly {value?: number; y0: number; y1: number}[],
): number {
  const n = nodes.find(d => typeof d.value === "number" && d.value > 0);
  return n ? (n.y1 - n.y0) / (n.value as number) : 0;
}

/**
    Shrinks `reserve` (top + bottom, left + right) to at most half of the
    chart's height and width, so the nodes always keep room to draw.
*/
export function capReserve(
  reserve: {top: number; right: number; bottom: number; left: number},
  width: number,
  height: number,
): {top: number; right: number; bottom: number; left: number} {
  const fit = (a: number, b: number, room: number) => {
    const k = a + b > room / 2 ? room / 2 / (a + b) : 1;
    return [a * k, b * k];
  };
  const [top, bottom] = fit(reserve.top, reserve.bottom, height);
  const [left, right] = fit(reserve.left, reserve.right, width);
  return {top, right, bottom, left};
}

/**
    The pixels per unit of value the layout draws nodes at in an extent
    `height` tall, as d3-sankey sets it: the scale at which the fullest
    column, with `padding` between its nodes, fills the height.
    @param nodes The nodes, with the column (`layer`) and `value` a layout
    gave them.
*/
export function columnScale(
  nodes: readonly {layer: number; value?: number}[],
  height: number,
  padding: number,
): number {
  const columns = new Map<number, {count: number; total: number}>();
  for (const n of nodes) {
    const c = columns.get(n.layer) ?? {count: 0, total: 0};
    c.count++;
    c.total += typeof n.value === "number" ? n.value : 0;
    columns.set(n.layer, c);
  }
  const most = Math.max(0, ...Array.from(columns.values(), c => c.count));
  const py = Math.min(padding, height / (most - 1));
  let ky = Infinity;
  for (const {count, total} of columns.values())
    if (total > 0) ky = Math.min(ky, (height - (count - 1) * py) / total);
  return Number.isFinite(ky) ? Math.max(0, ky) : 0;
}

/**
    The largest scale `ky` at which the nodes, drawn in the height left after
    `reserve(ky)` (the room the circular links take at that scale), are
    drawn at `ky`: so the nodes fill what the lanes leave.
    @param scaleFor The scale nodes are drawn at in a height (see `columnScale`).
    @param reserve The height the circular links take at a scale.
    @param most The scale to search below.
*/
export function solveScale(
  scaleFor: (height: number) => number,
  reserve: (ky: number) => number,
  height: number,
  most: number,
): number {
  let lo = 0;
  let hi = Math.max(0, most);
  for (let k = 0; k < 48; k++) {
    const mid = (lo + hi) / 2;
    if (scaleFor(Math.max(0, height - reserve(mid))) >= mid) lo = mid;
    else hi = mid;
  }
  return lo;
}

/**
    Where each column's nodes sit across, in an extent from `x0` to `x1`, as
    d3-sankey spreads them: `lastLayer + 1` columns, `nodeWidth` wide.
*/
export function columnEdges(
  x0: number,
  x1: number,
  lastLayer: number,
  nodeWidth: number,
): (layer: number) => [number, number] {
  const kx = lastLayer > 0 ? (x1 - x0 - nodeWidth) / lastLayer : 0;
  return layer => [x0 + layer * kx, x0 + layer * kx + nodeWidth];
}

/** A circular link at one scale, with its ends as nodes. */
type Sized<N, D> = CircularLinkInput & {
  datum: D;
  i: number;
  source: N;
  target: N;
  y0?: number;
  y1?: number;
};
/** Each side's circular links, innermost first, and their lanes. */
type Placed<N, D> = {
  side: "top" | "bottom";
  links: Sized<N, D>[];
  lanes: CircularLane[];
}[];

/** Each placed circular link's band, around the nodes, by its index. */
function shapeLinks<N extends CircularNode, D>(
  placed: Placed<N, D>,
  nodes: readonly N[],
): Map<number, CircularLaidLink<N, D>> {
  const top = Math.min(...nodes.map(n => n.y0));
  const bottom = Math.max(...nodes.map(n => n.y1));
  const byIndex = new Map<number, CircularLaidLink<N, D>>();
  for (const {side, links, lanes} of placed) {
    links.forEach((l, k) => {
      const ends = l as Sized<N, D> & {y0: number; y1: number};
      byIndex.set(l.i, {
        source: l.source,
        target: l.target,
        value: l.value,
        datum: l.datum,
        width: l.width,
        y0: ends.y0,
        y1: ends.y1,
        circular: circularLinkShape(
          ends,
          lanes[k],
          side,
          side === "top" ? top : bottom,
        ),
      });
    });
  }
  return byIndex;
}

/**
    Runs `run` (the Sankey layout over the links that aren't circular) and
    returns the circular links, laid out around the nodes.
    @param run Lays the nodes out inside an extent.
    @param nodes The nodes, laid out in place by `run`.
    @param links The other links, laid out in place by `run`.
    @param circular The circular links, with node indices for ends.
    @param padding The gap between nodes in a column (`nodePadding`).
    @param stubFor How far a band runs straight from its node before turning,
    to hold an arrowhead at that width (0 for none).
*/
export function layOutCircular<
  N extends CircularNode & {value?: number; depth?: number},
  D,
>(opts: {
  run: (extent: Extent) => void;
  nodes: readonly N[];
  links: readonly {source: N; target: N; y0: number; y1: number}[];
  circular: readonly {
    source: number;
    target: number;
    value: number;
    datum: D;
    i: number;
  }[];
  width: number;
  height: number;
  padding: number;
  stubFor: (link: {datum: D; i: number}, width: number) => number;
}): CircularLaidLink<N, D>[] {
  const {run, nodes, links, circular, width, height, padding, stubFor} = opts;
  run([
    [0, 0],
    [width, height],
  ]);
  if (!circular.length || !nodes.length) return [];

  const sized = (ky: number): Sized<N, D>[] =>
    circular.map(l => ({
      index: l.i,
      i: l.i,
      datum: l.datum,
      source: nodes[l.source],
      target: nodes[l.target],
      value: l.value,
      width: Number.isFinite(l.value) ? Math.max(0, l.value) * ky : 0,
    }));
  // d3-sankey spreads its columns by depth (see `computeNodeLayers`).
  const lastLayer = Math.max(...nodes.map(n => n.depth ?? n.layer));
  const nodeWidth = nodes[0].x1 - nodes[0].x0;
  // The first pass decides each link's side and the lanes' order.
  const first = sized(sankeyScale(nodes));
  const sides = new Map(
    first.map(l => [l.i, circularLinkSide(l, 0, height)] as const),
  );
  const order = new Map(
    (["top", "bottom"] as const).flatMap(side =>
      circularLinkOrder(
        first.filter(l => sides.get(l.i) === side),
        side,
      ).map((l, k) => [l.i, k] as const),
    ),
  );
  const place = (
    ky: number,
    columnX: (layer: number) => [number, number],
  ): Placed<N, D> => {
    const laid = sized(ky);
    const stub = Math.max(0, ...laid.map(l => stubFor(l, l.width)));
    return (["top", "bottom"] as const).map(side => {
      const own = laid
        .filter(l => sides.get(l.i) === side)
        .sort((a, b) => (order.get(a.i) ?? 0) - (order.get(b.i) ?? 0));
      return {side, links: own, lanes: circularLanes(own, stub, columnX)};
    });
  };
  // The room the links take at a scale: their legs first, then the lanes
  // over the columns that sit between the legs.
  const roomAt = (ky: number) => {
    const edges = columnEdges(0, width, lastLayer, nodeWidth);
    const {left, right} = circularReserve(place(ky, edges), lastLayer);
    const inner = columnEdges(left, width - right, lastLayer, nodeWidth);
    return {...circularReserve(place(ky, inner), lastLayer), left, right};
  };
  const ky = solveScale(
    h => columnScale(nodes, h, padding),
    k => {
      const r = roomAt(k);
      return r.top + r.bottom;
    },
    height,
    sankeyScale(nodes),
  );
  const room = capReserve(roomAt(ky), width, height);
  run([
    [room.left, room.top],
    [width - room.right, height - room.bottom],
  ]);

  // The second pass draws at the scale the layout settled on.
  const columnX = new Map(nodes.map(n => [n.layer, [n.x0, n.x1]] as const));
  const placed = place(
    sankeyScale(nodes),
    layer => (columnX.get(layer) ?? [0, 0]) as [number, number],
  );
  stackCircularEnds(placed, links);
  const byIndex = shapeLinks(placed, nodes);
  return circular.map(l => byIndex.get(l.i) as CircularLaidLink<N, D>);
}
