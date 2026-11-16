/**
    The drawn lines outlier labels keep clear of: each line's path, and each
    area's top edge, sampled along its curve into short segments in plot
    space, and the check of a label's box against them.
*/
import {line} from "d3-shape";

import {path2polygon} from "@d3plus/math";
import type {CurveName, SceneNode, Transform} from "@d3plus/render";
import {curveFor} from "@d3plus/render";

import type {CircleLabelBox} from "../features/circleLabelPlacement.js";
import {mapper} from "../features/sceneBounds.js";

type Point = [number, number];

/** A straight piece of a drawn line. */
export type LineSegment = [Point, Point];

/** How far apart, in pixels, a curve is sampled. */
export const OUTLIER_LINE_STEP = 4;

/**
    A drawn series' segments: its points joined by its curve, sampled every
    `step` pixels and mapped into plot space.
    @param points The series' points (a line, or an area's top edge), in its own space.
    @param curve The curve it's drawn with.
    @param map Maps a point into plot space.
    @param step The sampling distance.
*/
export function seriesSegments(
  points: Point[],
  curve: CurveName | undefined,
  map: (p: Point) => Point = p => p,
  step = OUTLIER_LINE_STEP,
): LineSegment[] {
  if (points.length < 2) return [];
  const d = line().curve(curveFor(curve))(points) ?? "";
  const sampled = path2polygon(d, step).map(p => map([p[0], p[1]]));
  const out: LineSegment[] = [];
  for (let k = 1; k < sampled.length; k++)
    out.push([sampled[k - 1], sampled[k]]);
  return out;
}

/**
    The segments of every line and area top edge under `nodes`: each path
    drawn through a `series`, other than a hit area.
    @param nodes Scene nodes.
*/
export function lineSegments(nodes: SceneNode[]): LineSegment[] {
  const out: LineSegment[] = [];
  const walk = (list: SceneNode[], chain: Transform[]) => {
    for (const node of list) {
      if (String(node.key).endsWith("::hit")) continue;
      const next = node.transform ? [...chain, node.transform] : chain;
      if (node.type === "group") walk(node.children, next);
      else if (node.type === "path" && node.series)
        out.push(
          ...seriesSegments(node.series.top, node.series.curve, mapper(next)),
        );
    }
  };
  walk(nodes, []);
  return out;
}

/**
    Whether a segment passes through a box (touching its edge doesn't
    count): Liang-Barsky clipping of the segment to the box's interior.
    @param box The box.
    @param segment The segment.
*/
export function boxCrossesSegment(
  box: CircleLabelBox,
  [[x0, y0], [x1, y1]]: LineSegment,
): boolean {
  const eps = 1e-6;
  const dx = x1 - x0,
    dy = y1 - y0;
  let t0 = 0,
    t1 = 1;
  const edges: [number, number][] = [
    [-dx, x0 - (box.x + eps)],
    [dx, box.x + box.width - eps - x0],
    [-dy, y0 - (box.y + eps)],
    [dy, box.y + box.height - eps - y0],
  ];
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return false;
      continue;
    }
    const t = q / p;
    if (p < 0) {
      if (t > t1) return false;
      if (t > t0) t0 = t;
    } else {
      if (t < t0) return false;
      if (t < t1) t1 = t;
    }
  }
  return t0 <= t1;
}
