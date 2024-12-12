import lineIntersection from "./lineIntersection.js";
import segmentBoxContains from "./segmentBoxContains.js";
import pointDistanceSquared from "./pointDistanceSquared.js";

/**
    @function polygonRayCast
    @desc Gives the two closest intersection points between a ray cast from a point inside a polygon. The two points should lie on opposite sides of the origin.
    @param {Array} poly The polygon to test against, which should be an `[x, y]` formatted Array.
    @param {Array} origin The origin point of the ray to be cast, which should be an `[x, y]` formatted Array.
    @param {Number} [alpha = 0] The angle in radians of the ray.
    @returns {Array} An array containing two values, the closest point on the left and the closest point on the right. If either point cannot be found, that value will be `null`.
*/
export default function(poly, origin, alpha = 0) {

  const eps = 1e-9;
  origin = [origin[0] + eps * Math.cos(alpha), origin[1] + eps * Math.sin(alpha)];
  const [x0, y0] = origin;
  const shiftedOrigin = [x0 + Math.cos(alpha), y0 + Math.sin(alpha)];

  let idx = 0;
  if (Math.abs(shiftedOrigin[0] - x0) < eps) idx = 1;
  let i = -1;
  const n = poly.length;
  let b = poly[n - 1];
  let minSqDistLeft = Number.MAX_VALUE;
  let minSqDistRight = Number.MAX_VALUE;
  let closestPointLeft = null;
  let closestPointRight = null;
  while (++i < n) {
    const a = b;
    b = poly[i];
    const p = lineIntersection(origin, shiftedOrigin, a, b);
    if (p && segmentBoxContains(a, b, p)) {
      const sqDist = pointDistanceSquared(origin, p);
      if (p[idx] < origin[idx]) {
        if (sqDist < minSqDistLeft) {
          minSqDistLeft = sqDist;
          closestPointLeft = p;
        }
      }
      else if (p[idx] > origin[idx]) {
        if (sqDist < minSqDistRight) {
          minSqDistRight = sqDist;
          closestPointRight = p;
        }
      }
    }
  }

  return [closestPointLeft, closestPointRight];

}
