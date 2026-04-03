import type {Point} from "./lineIntersection.js";

/**
    Rotates a point around a given origin.
    @param p The point to be rotated, which should always be an `[x, y]` formatted Array.
    @param alpha The angle in radians to rotate.
    @param origin The origin point of the rotation, which should always be an `[x, y]` formatted Array.
*/
export default function (
  p: Point,
  alpha: number,
  origin: Point = [0, 0],
): Point {
  const cosAlpha = Math.cos(alpha),
    sinAlpha = Math.sin(alpha),
    xshifted = p[0] - origin[0],
    yshifted = p[1] - origin[1];

  return [
    cosAlpha * xshifted - sinAlpha * yshifted + origin[0],
    sinAlpha * xshifted + cosAlpha * yshifted + origin[1],
  ];
}
