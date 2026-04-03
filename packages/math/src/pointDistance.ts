import type {Point} from "./lineIntersection.js";
import pointDistanceSquared from "./pointDistanceSquared.js";

/**
    Calculates the pixel distance between two points.
    @param p1 The first point, which should always be an `[x, y]` formatted Array.
    @param p2 The second point, which should always be an `[x, y]` formatted Array.
*/
export default function (p1: Point, p2: Point): number {
  return Math.sqrt(pointDistanceSquared(p1, p2));
}
