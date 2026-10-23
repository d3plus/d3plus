/**
    The points a Plot's axis hover (#782) can snap to: a Line/Area's points, a
    Circle's center, and a Bar's end, read from the painted chart scene.
*/
import type {DataPoint} from "@d3plus/data";

import {nodeColor} from "../features/tooltipSwatch.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {ShapeNode} from "./sharedHover.js";

/** One of a Plot's four axes. */
export type AxisName = "x" | "x2" | "y" | "y2";

/** A plotted record as Plot wraps it: its axis values plus the source row. */
export type AnchorDatum = DataPoint & {
  data?: DataPoint;
  i?: number;
  id?: unknown;
  x?: unknown;
  x2?: unknown;
  y?: unknown;
  y2?: unknown;
};

/** A point a mark draws a value at, in chart content space. */
export interface AxisHoverAnchor {
  x: number;
  y: number;
  datum: AnchorDatum;
  color?: string;
  shape?: string;
  /** A bar's extent along its value axis, from its base to its end. */
  span?: [number, number];
}

type GeometryNode = ShapeNode & {
  key?: string | number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  cx?: number;
  cy?: number;
  transform?: {x?: number; y?: number};
};

/** Nodes drawn on behalf of another mark (hit targets, stems, error bars). */
const OWNED = /::(hit|stem|confidence)$/;

/**
    Which edge of a bar's rect is its end: the edge farther from the bar's
    base, which its transform sits on (a negative bar runs the other way).
    @param offset The rect's start along the value axis, relative to the base.
    @param length The rect's size along the value axis.
*/
export function barEndOffset(offset: number, length: number): number {
  return Math.abs(offset) >= Math.abs(offset + length)
    ? offset
    : offset + length;
}

/**
    Moves an anchor along its value axis to `end`, spanning from where it was
    (an Area's points sit on its baseline; its value is drawn at its top edge).
    @param anchor The anchor.
    @param end Its end along the value axis.
    @param valueAxis The axis the mark's values run along.
*/
export function liftAnchor(
  anchor: AxisHoverAnchor,
  end: number,
  valueAxis: "x" | "y",
): AxisHoverAnchor {
  if (!Number.isFinite(end)) return anchor;
  return {...anchor, [valueAxis]: end, span: [anchor[valueAxis], end]};
}

/**
    The anchors one mark node draws: each of a Line/Area's interaction points
    (an Area's sit on its baseline, see `liftAnchor`), a circle's center, a Bar's end (along `valueAxis`), or another rect's
    center. Nodes without a source datum, and those drawn for another mark,
    have none.
    @param node The mark's scene node.
    @param valueAxis The axis a Bar's length runs along.
    @param color The mark's color.
*/
export function markAnchors(
  node: ShapeNode,
  valueAxis: "x" | "y",
  color?: string,
): AxisHoverAnchor[] {
  const n = node as GeometryNode;
  const datum = n.datum as AnchorDatum | undefined;
  if (!datum || (typeof n.key === "string" && OWNED.test(n.key))) return [];
  const shape = n.shapeType;
  if (n.interactionPoints)
    return n.interactionPoints.map(p => ({
      x: p.x,
      y: p.y,
      datum: p.datum as AnchorDatum,
      color,
      shape,
    }));
  const tx = n.transform?.x ?? 0,
    ty = n.transform?.y ?? 0;
  if (n.type === "circle")
    return [{x: tx + (n.cx ?? 0), y: ty + (n.cy ?? 0), datum, color, shape}];
  if (n.type !== "rect") return [];
  const x = n.x ?? 0,
    y = n.y ?? 0,
    w = n.width ?? 0,
    h = n.height ?? 0;
  if (shape !== "Bar")
    return [{x: tx + x + w / 2, y: ty + y + h / 2, datum, color, shape}];
  if (valueAxis === "x") {
    const end = tx + barEndOffset(x, w);
    return [{x: end, y: ty + y + h / 2, datum, color, shape, span: [tx, end]}];
  }
  const end = ty + barEndOffset(y, h);
  return [{x: tx + x + w / 2, y: end, datum, color, shape, span: [ty, end]}];
}

/** Whether a scene node is a data mark the axis hover reads. */
export function isAnchorMark(node: ShapeNode | undefined): node is ShapeNode {
  return (
    !!node &&
    !!node.shapeType &&
    !!node.datum &&
    node.shapeType !== "Box" &&
    !node.interactionGroup &&
    node.interactive !== false &&
    !(node.datum as {__d3plusShape__?: boolean}).__d3plusShape__
  );
}

/** Every anchor the chart's marks draw (see `markAnchors`). */
export function collectAnchors(viz: VizInstance): AxisHoverAnchor[] {
  const valueAxis = viz.schema.discrete === "y" ? "x" : "y";
  const out: AxisHoverAnchor[] = [];
  const walk = (node: ShapeNode): void => {
    if (node.interactionGroup || node.interactive === false) return;
    if (node.children) node.children.forEach(c => walk(c as ShapeNode));
    if (isAnchorMark(node))
      out.push(...markAnchors(node, valueAxis, nodeColor(viz, node)));
  };
  (viz._chartScene || []).forEach(node => walk(node as ShapeNode));
  return out;
}

/**
    The anchor nearest `target` along one axis. A bar holding the target
    within its span counts as no distance away.
    @param anchors The candidates.
    @param axis The axis the distance is measured along.
    @param target The position, in chart content space.
*/
export function nearestAnchor(
  anchors: AxisHoverAnchor[],
  axis: "x" | "y",
  target: number,
): AxisHoverAnchor | null {
  let best: AxisHoverAnchor | null = null;
  let bestDist = Infinity;
  for (const a of anchors) {
    const span = a.span;
    const inside =
      span &&
      target >= Math.min(span[0], span[1]) &&
      target <= Math.max(span[0], span[1]);
    const dist = inside ? 0 : Math.abs(a[axis] - target);
    if (dist < bestDist) {
      bestDist = dist;
      best = a;
    }
  }
  return best;
}

/**
    The anchor nearest a point in both directions.
    @param anchors The candidates.
    @param point The position, in chart content space.
*/
export function closestAnchor(
  anchors: AxisHoverAnchor[],
  point: [number, number],
): AxisHoverAnchor | null {
  let best: AxisHoverAnchor | null = null;
  let bestDist = Infinity;
  for (const a of anchors) {
    const dist = Math.hypot(a.x - point[0], a.y - point[1]);
    if (dist < bestDist) {
      bestDist = dist;
      best = a;
    }
  }
  return best;
}

/**
    The axes a hovered anchor gets a guide and badge on: x and y, each the
    secondary axis when the record is plotted against it. A bar leaves out its
    discrete axis (its band is labeled already), a swarm leaves out the axis
    its circles are packed along, and `only` keeps just one direction.
    @param datum The anchor's record.
    @param options `discrete`: the chart's discrete axis; `bar`: whether the
    anchor is a Bar's end; `cross`: a swarm's packing axis; `only`: the one
    direction to keep (`axisHover: "x"` or `"y"`).
*/
export function anchorAxes(
  datum: AnchorDatum,
  options: {
    discrete?: "x" | "y";
    bar?: boolean;
    cross?: "x" | "y";
    only?: "x" | "y";
  },
): AxisName[] {
  const out: AxisName[] = [];
  for (const dim of ["x", "y"] as const) {
    if (options.bar && dim === (options.discrete ?? "x")) continue;
    if (options.cross === dim) continue;
    if (options.only && options.only !== dim) continue;
    out.push(datum[`${dim}2`] !== undefined ? `${dim}2` : dim);
  }
  return out;
}
