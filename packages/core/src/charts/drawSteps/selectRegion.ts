/**
    The geometry of box and lasso selection: the region a drag draws, and
    which of a chart's marks fall inside it.

    @module
*/

import {polygonContains} from "d3-polygon";

import type {DataPoint} from "@d3plus/data";
import {path2polygon, segmentsIntersect} from "@d3plus/math";
import type {Bounds} from "@d3plus/math";
import type {SceneNode} from "@d3plus/render";

import {mapper} from "../features/sceneBounds.js";
import type {FocusTarget} from "../viz/focusTargets.js";
import type {Box, Point} from "./zoomDrag.js";
import {clampPoint, inBox, spanBox} from "./zoomDrag.js";

/** The kinds of region a drag draws: a box, or a freehand lasso. */
export type SelectTool = "box" | "lasso";

/** A drawn region, in surface coordinates. */
export interface SelectRegion {
  tool: SelectTool;
  /** The region's outline (a box's four corners, or the lasso's path). */
  points: Point[];
}

/** How far (px) the pointer moves before a lasso takes another point. */
export const LASSO_STEP = 3;

/** A box's outline, clockwise from its top-left corner. */
export function boxPolygon([[x0, y0], [x1, y1]]: Box): Point[] {
  return [
    [x0, y0],
    [x1, y0],
    [x1, y1],
    [x0, y1],
  ];
}

/**
    The region a drag from `start` through `path` draws, clamped to `area`:
    the box `start` and the last point span, or the lasso through every
    point.
    @param tool Which region to draw.
    @param start Where the drag began.
    @param path The points the pointer has moved through since.
    @param area The box the region stays within (the chart area or a panel).
*/
export function dragRegion(
  tool: SelectTool,
  start: Point,
  path: Point[],
  area: Box,
): SelectRegion {
  const from = clampPoint(start, area);
  if (tool === "box") {
    const to = clampPoint(path[path.length - 1] ?? start, area);
    return {tool, points: boxPolygon(spanBox(from, to))};
  }
  return {tool, points: [from, ...path.map(p => clampPoint(p, area))]};
}

/**
    Adds `point` to a lasso's path unless it lies within `LASSO_STEP` of the
    last one, which keeps a slow drag from piling up points.
    @param path The lasso's points so far (changed in place).
    @param point The pointer's position.
*/
export function extendLasso(path: Point[], point: Point): Point[] {
  const last = path[path.length - 1];
  if (!last || Math.hypot(point[0] - last[0], point[1] - last[1]) >= LASSO_STEP)
    path.push(point);
  return path;
}

/** An SVG path string for a region's outline, closed. */
export function regionPath(region: SelectRegion): string {
  const [first, ...rest] = region.points;
  if (!first) return "";
  return `M${first.join(",")}${rest.map(p => `L${p.join(",")}`).join("")}Z`;
}

/** The axis-aligned box around a region. */
export function regionBox(region: SelectRegion): Box {
  const xs = region.points.map(p => p[0]),
    ys = region.points.map(p => p[1]);
  return [
    [Math.min(...xs), Math.min(...ys)],
    [Math.max(...xs), Math.max(...ys)],
  ];
}

/** Whether a point lies inside a region (a box's edges included). */
export function regionContains(region: SelectRegion, point: Point): boolean {
  if (region.tool === "box") return inBox(point, regionBox(region));
  return region.points.length > 2 && polygonContains(region.points, point);
}

/**
    Whether a box overlaps a region: a corner of either lies inside the
    other, or their edges cross.
    @param b The box, as `{x, y, width, height}`.
    @param region The region.
*/
export function boundsTouchRegion(b: Bounds, region: SelectRegion): boolean {
  const box: Box = [
    [b.x, b.y],
    [b.x + b.width, b.y + b.height],
  ];
  const corners = boxPolygon(box);
  if (region.tool === "box") {
    const [[x0, y0], [x1, y1]] = regionBox(region);
    return (
      b.x <= x1 && b.x + b.width >= x0 && b.y <= y1 && b.y + b.height >= y0
    );
  }
  if (corners.some(c => regionContains(region, c))) return true;
  if (region.points.some(p => inBox(p, box))) return true;
  const edges = (poly: Point[]): [Point, Point][] =>
    poly.map((p, i) => [p, poly[(i + 1) % poly.length]]);
  const own = edges(corners);
  return edges(region.points).some(([a, b2]) =>
    own.some(([c, d]) => segmentsIntersect(a, b2, c, d)),
  );
}

/**
    The vertical extent of a polygon along the line `x`: the lowest and
    highest points where its edges cross it, or null where it doesn't
    reach.
    @param polygon The polygon's outline.
    @param x Where to slice it.
*/
export function polygonSlice(
  polygon: Point[],
  x: number,
): [number, number] | null {
  let lo = Infinity,
    hi = -Infinity;
  polygon.forEach((a, i) => {
    const b = polygon[(i + 1) % polygon.length];
    if ((a[0] - x) * (b[0] - x) > 0) return;
    const ys =
      a[0] === b[0]
        ? [a[1], b[1]]
        : [a[1] + ((x - a[0]) / (b[0] - a[0])) * (b[1] - a[1])];
    for (const y of ys) {
      lo = Math.min(lo, y);
      hi = Math.max(hi, y);
    }
  });
  return lo <= hi ? [lo, hi] : null;
}

/** Whether a scene node is a filled series (an Area), whose points span its height. */
function isArea(node: SceneNode): boolean {
  return node.type === "area" || node.shapeType === "Area";
}

/** An Area node's outline in surface coordinates. */
function areaOutline(target: FocusTarget): Point[] {
  const {node, chain} = target;
  const map = mapper(node.transform ? [...chain, node.transform] : chain);
  const local: Point[] =
    node.type === "area"
      ? [...node.topline, ...[...node.baseline].reverse()]
      : node.type === "path"
        ? (path2polygon(node.d, 5) as Point[])
        : [];
  return local.map(p => map(p));
}

/**
    Whether a mark falls inside a region: a bar or other rectangle when any
    part of it overlaps the region, a point of an Area when the area's
    height at that point crosses it, and every other mark (a point, a point
    of a Line, a path) when its center does.
    @param target The mark, as keyboard navigation reads it off the scene.
    @param region The region.
    @param outline For a point of an Area, the area's outline in surface coordinates.
*/
export function targetInRegion(
  target: FocusTarget,
  region: SelectRegion,
  outline?: Point[],
): boolean {
  if (target.pointIndex === undefined && target.node.type === "rect")
    return boundsTouchRegion(target.box, region);
  if (target.pointIndex !== undefined && outline && outline.length) {
    const x = target.center[0];
    const span = polygonSlice(outline, x);
    if (span)
      return boundsTouchRegion(
        {x, y: span[0], width: 0, height: span[1] - span[0]},
        region,
      );
  }
  return regionContains(region, target.center);
}

/** The source row a datum wraps (`datum.data ?? datum`). */
export function sourceRow(datum: unknown): DataPoint | undefined {
  const raw = datum as (DataPoint & {data?: DataPoint}) | undefined;
  return raw && raw.data ? raw.data : raw;
}

/** A mark a region selects: its row, and for a series point, its series' row. */
export interface RegionHit {
  row: DataPoint;
  /** The row of the Line or Area a selected point belongs to. */
  series?: DataPoint;
}

/**
    The marks among `targets` that fall inside a region (see
    `targetInRegion`): one hit per mark, or per point of a Line or Area,
    carrying the row it stands for.
    @param targets The chart's marks (see `focusTargets`).
    @param region The region.
*/
export function regionHits(
  targets: FocusTarget[],
  region: SelectRegion,
): RegionHit[] {
  const hits: RegionHit[] = [];
  const outlines = new Map<SceneNode, Point[]>();
  const outlineOf = (target: FocusTarget): Point[] | undefined => {
    const {node} = target;
    if (target.pointIndex === undefined || !isArea(node)) return undefined;
    if (!outlines.has(node)) outlines.set(node, areaOutline(target));
    return outlines.get(node);
  };
  for (const target of targets) {
    if (target.group !== "shape") continue;
    if (!targetInRegion(target, region, outlineOf(target))) continue;
    const {node, pointIndex} = target;
    if (pointIndex !== undefined) {
      const point = node.interactionPoints?.[pointIndex];
      const row = point && sourceRow(point.datum);
      if (row) hits.push({row, series: sourceRow(node.datum)});
      continue;
    }
    const row = sourceRow(node.datum);
    if (row) hits.push({row});
  }
  return hits;
}
