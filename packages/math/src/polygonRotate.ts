import type {Point} from "./lineIntersection.js";
import pointRotate from "./pointRotate.js";

/**
    Rotates a point around a given origin.
    @param poly The polygon to be rotated, which should be an Array of `[x, y]` values.
    @param alpha The angle in radians to rotate.
    @param origin The origin point of the rotation, which should be an `[x, y]` formatted Array.
*/
export default function (
  poly: Point[],
  alpha: number,
  origin: Point = [0, 0],
): Point[] {
  return poly.map(p => pointRotate(p, alpha, origin));
}
