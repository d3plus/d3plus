import type {Point} from "./lineIntersection.js";
import lineIntersection from "./lineIntersection.js";
import segmentBoxContains from "./segmentBoxContains.js";

/**
    Checks whether the line segments p1q1 && p2q2 intersect.
    @param p1 The first point of the first line segment, which should always be an `[x, y]` formatted Array.
    @param q1 The second point of the first line segment, which should always be an `[x, y]` formatted Array.
    @param p2 The first point of the second line segment, which should always be an `[x, y]` formatted Array.
    @param q2 The second point of the second line segment, which should always be an `[x, y]` formatted Array.
*/
export default function (p1: Point, q1: Point, p2: Point, q2: Point): boolean {
  const p = lineIntersection(p1, q1, p2, q2);
  if (!p) return false;
  return segmentBoxContains(p1, q1, p) && segmentBoxContains(p2, q2, p);
}
