/**
    Pure geometry for ArcDiagram: node order, node positions along the line,
    which side of the line each arc takes, how far arcs are flattened to fit,
    and each arc's path and arrowhead tip.
*/

import type {DataPoint} from "@d3plus/data";

/** How ArcDiagram orders its nodes along the line. */
export type NodeSort =
  | "data"
  | "label"
  | "group"
  | "degree"
  | ((a: DataPoint, b: DataPoint) => number);

/** Which side of the line ArcDiagram draws its arcs on. */
export type ArcSide = "above" | "below" | "both";

/** The direction ArcDiagram's line runs. */
export type ArcOrient = "horizontal" | "vertical";

/** A node, with everything `sortArcNodes` can order it by. */
export interface SortableNode {
  id: string;
  /** The node's row, passed to a comparator `nodeSort`. */
  datum: DataPoint;
  label: string;
  group?: unknown;
  degree: number;
  /** The node's position in `nodes`, which breaks every tie. */
  order: number;
}

/** A link between two node ids. */
export interface IdLink {
  source: {id: string};
  target: {id: string};
}

/**
    How many link ends touch each node: a link counts once at each end, so a
    link from a node to itself counts twice.
*/
export function nodeDegrees(links: readonly IdLink[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const l of links) {
    out.set(l.source.id, (out.get(l.source.id) ?? 0) + 1);
    out.set(l.target.id, (out.get(l.target.id) ?? 0) + 1);
  }
  return out;
}

/** Compares two values: numbers by size, anything else as text, with numbers inside text read as numbers. */
export function naturalCompare(a: unknown, b: unknown): number {
  const missing = (v: unknown) => v === undefined || v === null || v === "";
  if (missing(a) || missing(b)) return missing(a) ? (missing(b) ? 0 : 1) : -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, {numeric: true});
}

/**
    Orders nodes for the line: `"data"` keeps their order in `nodes`,
    `"label"` sorts by label, `"group"` by group and then label, `"degree"`
    puts the most connected first (then by label), and a comparator receives
    two node rows. Ties keep the `nodes` order. Returns a new array.
*/
export function sortArcNodes<T extends SortableNode>(
  nodes: readonly T[],
  sort: NodeSort | undefined,
): T[] {
  const byOrder = (a: T, b: T) => a.order - b.order;
  const byLabel = (a: T, b: T) => naturalCompare(a.label, b.label);
  const compare: (a: T, b: T) => number =
    typeof sort === "function"
      ? (a, b) => sort(a.datum, b.datum)
      : sort === "label"
        ? byLabel
        : sort === "group"
          ? (a, b) => naturalCompare(a.group, b.group) || byLabel(a, b)
          : sort === "degree"
            ? (a, b) => b.degree - a.degree || byLabel(a, b)
            : () => 0;
  return [...nodes].sort((a, b) => compare(a, b) || byOrder(a, b));
}

/**
    Evenly spaced positions for `count` nodes along a line of `length`
    pixels starting at `start`: each node sits in the middle of an equal slot,
    so neighbors are `length / count` apart and the end nodes sit half a slot
    in from the ends.
*/
export function slotPositions(
  count: number,
  start: number,
  length: number,
): number[] {
  if (count <= 0) return [];
  const step = length / count;
  return Array.from({length: count}, (_, i) => start + (i + 0.5) * step);
}

/**
    The side an arc takes. With `"both"`, a link running forward along the
    line (its source placed before its target) arcs above and a link running
    backward arcs below, so the two directions read apart.
*/
export function arcSideOf(
  sourceRank: number,
  targetRank: number,
  side: ArcSide | undefined,
): "above" | "below" {
  if (side === "below") return "below";
  if (side === "both") return sourceRank <= targetRank ? "above" : "below";
  return "above";
}

/**
    How much the arcs flatten to fit. A semicircle over the farthest-apart
    pair on a side rises half its span; `height` is the room both sides share.
    Every arc's height is `scale` times half its span, so heights stay
    proportional to spans on both sides, and `scale` is 1 (true semicircles)
    whenever they fit. Returns the scale and each side's tallest arc.
*/
export function arcScale(
  maxSpanAbove: number,
  maxSpanBelow: number,
  height: number,
): {scale: number; above: number; below: number} {
  const need = (Math.max(0, maxSpanAbove) + Math.max(0, maxSpanBelow)) / 2;
  const scale = need > 0 ? Math.max(0, Math.min(1, height / need)) : 1;
  return {
    scale,
    above: (scale * Math.max(0, maxSpanAbove)) / 2,
    below: (scale * Math.max(0, maxSpanBelow)) / 2,
  };
}

/** One arc: its ends along the line, the line's cross position, and its shape. */
export interface ArcGeometry {
  /** The source and target positions along the line. */
  from: number;
  to: number;
  /** The line's position across its direction (y when horizontal, x when vertical). */
  base: number;
  /** Arc height over half its span (1 draws a semicircle). */
  scale: number;
  side: "above" | "below";
  orient: ArcOrient;
}

const round = (n: number): number => Math.round(n * 100) / 100;

/** Maps a point along the line (`u`) and out from it toward the arc's side (`h`) to the screen. */
export function arcPoint(
  arc: ArcGeometry,
  u: number,
  h: number,
): [number, number] {
  const dir = arc.side === "above" ? 1 : -1;
  return arc.orient === "vertical"
    ? [arc.base + h * dir, u]
    : [u, arc.base - h * dir];
}

/**
    The arc's SVG path: half an ellipse from its source to its target, as wide
    as their span and `scale` times half the span tall. Horizontal arcs
    "above" rise toward the top; vertical arcs "above" bulge to the right.
*/
export function arcPathD(arc: ArcGeometry): string {
  const half = Math.abs(arc.to - arc.from) / 2;
  const height = half * arc.scale;
  const [x1, y1] = arcPoint(arc, arc.from, 0);
  const [x2, y2] = arcPoint(arc, arc.to, 0);
  const forward = arc.to > arc.from;
  // Clockwise on screen from the earlier end to the later one passes over
  // the top of a horizontal line and the right side of a vertical one.
  const sweep = forward === (arc.side === "above") ? 1 : 0;
  const [rx, ry] = arc.orient === "vertical" ? [height, half] : [half, height];
  return `M${round(x1)},${round(y1)}A${round(rx)},${round(ry)} 0 0,${sweep} ${round(x2)},${round(y2)}`;
}

/** The arc's highest point: midway between its ends, `scale` times half its span out from the line. */
export function arcApex(arc: ArcGeometry): [number, number] {
  const half = Math.abs(arc.to - arc.from) / 2;
  return arcPoint(arc, (arc.from + arc.to) / 2, half * arc.scale);
}

/**
    Where an arrowhead at one end of an arc sits: on the arc, `inset` pixels
    out from the line (clear of the node it points into), pointing along the
    arc toward that end. `angle` is in radians.
*/
export function arcEndTip(
  arc: ArcGeometry,
  end: "source" | "target",
  inset: number,
): {x: number; y: number; angle: number} {
  const [endU, otherU] =
    end === "target" ? [arc.to, arc.from] : [arc.from, arc.to];
  const a = Math.abs(endU - otherU) / 2;
  const b = a * arc.scale;
  const center = (endU + otherU) / 2;
  const toward = endU >= otherU ? 1 : -1;
  const sin = b > 0 ? Math.min(1, Math.max(0, inset) / b) : 0;
  const cos = Math.sqrt(1 - sin * sin);
  const [x, y] = arcPoint(arc, center + toward * a * cos, b * sin);
  // Travel along the arc toward its end: along the line toward `endU`, and
  // back down toward the line.
  const du = toward * a * sin;
  const dh = -b * cos;
  const dir = arc.side === "above" ? 1 : -1;
  const [dx, dy] = arc.orient === "vertical" ? [dh * dir, du] : [du, -dh * dir];
  return {x, y, angle: Math.atan2(dy, dx)};
}

/** The box an arc covers: its two ends and its highest point, as `[[x0, y0], [x1, y1]]`. */
export function arcBox(arc: ArcGeometry): [[number, number], [number, number]] {
  const points = [
    arcPoint(arc, arc.from, 0),
    arcPoint(arc, arc.to, 0),
    arcApex(arc),
  ];
  const xs = points.map(p => p[0]);
  const ys = points.map(p => p[1]);
  return [
    [Math.min(...xs), Math.min(...ys)],
    [Math.max(...xs), Math.max(...ys)],
  ];
}
