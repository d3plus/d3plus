/** A point represented as an `[x, y]` tuple. */
export type Point = [number, number];

/**
    Finds the intersection point (if there is one) of the lines p1q1 and p2q2.
    @param p1 The first point of the first line segment, which should always be an `[x, y]` formatted Array.
    @param q1 The second point of the first line segment, which should always be an `[x, y]` formatted Array.
    @param p2 The first point of the second line segment, which should always be an `[x, y]` formatted Array.
    @param q2 The second point of the second line segment, which should always be an `[x, y]` formatted Array.
*/
export default function (
  p1: Point,
  q1: Point,
  p2: Point,
  q2: Point,
): Point | null {
  // allow for some margins due to numerical errors
  const eps = 1e-9;

  // find the intersection point between the two infinite lines
  const dx1 = p1[0] - q1[0],
    dx2 = p2[0] - q2[0],
    dy1 = p1[1] - q1[1],
    dy2 = p2[1] - q2[1];

  const denom = dx1 * dy2 - dy1 * dx2;

  if (Math.abs(denom) < eps) return null;

  const cross1 = p1[0] * q1[1] - p1[1] * q1[0],
    cross2 = p2[0] * q2[1] - p2[1] * q2[0];

  const px = (cross1 * dx2 - cross2 * dx1) / denom,
    py = (cross1 * dy2 - cross2 * dy1) / denom;

  return [px, py];
}
