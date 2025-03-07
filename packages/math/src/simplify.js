import pointDistanceSquared from "./pointDistanceSquared.js";

/**
    @desc square distance from a point to a segment
    @param {Array} point
    @param {Array} segmentAnchor1
    @param {Array} segmentAnchor2
    @private
*/
function getSqSegDist(p, p1, p2) {

  let x = p1[0],
      y = p1[1];

  let dx = p2[0] - x,
      dy = p2[1] - y;

  if (dx !== 0 || dy !== 0) {

    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);

    if (t > 1) {
      x = p2[0];
      y = p2[1];

    }
    else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }

  }

  dx = p[0] - x;
  dy = p[1] - y;

  return dx * dx + dy * dy;

}

/**
    @desc basic distance-based simplification
    @param {Array} polygon
    @param {Number} sqTolerance
    @private
*/
function simplifyRadialDist(poly, sqTolerance) {

  let point,
      prevPoint = poly[0];

  const newPoints = [prevPoint];

  for (let i = 1, len = poly.length; i < len; i++) {
    point = poly[i];

    if (pointDistanceSquared(point, prevPoint) > sqTolerance) {
      newPoints.push(point);
      prevPoint = point;
    }
  }

  if (prevPoint !== point) newPoints.push(point);

  return newPoints;
}

/**
    @param {Array} polygon
    @param {Number} first
    @param {Number} last
    @param {Number} sqTolerance
    @param {Array} simplified
    @private
*/
function simplifyDPStep(poly, first, last, sqTolerance, simplified) {

  let index, maxSqDist = sqTolerance;

  for (let i = first + 1; i < last; i++) {
    const sqDist = getSqSegDist(poly[i], poly[first], poly[last]);

    if (sqDist > maxSqDist) {
      index = i;
      maxSqDist = sqDist;
    }
  }

  if (maxSqDist > sqTolerance) {
    if (index - first > 1) simplifyDPStep(poly, first, index, sqTolerance, simplified);
    simplified.push(poly[index]);
    if (last - index > 1) simplifyDPStep(poly, index, last, sqTolerance, simplified);
  }
}

/**
    @desc simplification using Ramer-Douglas-Peucker algorithm
    @param {Array} polygon
    @param {Number} sqTolerance
    @private
*/
function simplifyDouglasPeucker(poly, sqTolerance) {
  const last = poly.length - 1;

  const simplified = [poly[0]];
  simplifyDPStep(poly, 0, last, sqTolerance, simplified);
  simplified.push(poly[last]);

  return simplified;
}

/**
    @function largestRect
    @desc Simplifies the points of a polygon using both the Ramer-Douglas-Peucker algorithm and basic distance-based simplification. Adapted to an ES6 module from the excellent [Simplify.js](http://mourner.github.io/simplify-js/).
    @author Vladimir Agafonkin
    @param {Array} poly An Array of points that represent a polygon.
    @param {Number} [tolerance = 1] Affects the amount of simplification (in the same metric as the point coordinates).
    @param {Boolean} [highestQuality = false] Excludes distance-based preprocessing step which leads to highest quality simplification but runs ~10-20 times slower.

*/
export default (poly, tolerance = 1, highestQuality = false) => {

  if (poly.length <= 2) return poly;

  const sqTolerance = tolerance * tolerance;

  poly = highestQuality ? poly : simplifyRadialDist(poly, sqTolerance);
  poly = simplifyDouglasPeucker(poly, sqTolerance);

  return poly;

};
