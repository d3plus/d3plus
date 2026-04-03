import type {Point} from "./lineIntersection.js";
import pointDistanceSquared from "./pointDistanceSquared.js";

/**
    square distance from a point to a segment

    @param segmentAnchor2 @private
*/
function getSqSegDist(p: Point, p1: Point, p2: Point): number {
  let x = p1[0],
    y = p1[1];

  let dx = p2[0] - x,
    dy = p2[1] - y;

  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);

    if (t > 1) {
      x = p2[0];
      y = p2[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = p[0] - x;
  dy = p[1] - y;

  return dx * dx + dy * dy;
}

/**
    basic distance-based simplification

    @private
*/
function simplifyRadialDist(poly: Point[], sqTolerance: number): Point[] {
  let point: Point,
    prevPoint: Point = poly[0];

  const newPoints: Point[] = [prevPoint];

  for (let i = 1, len = poly.length; i < len; i++) {
    point = poly[i];

    if (pointDistanceSquared(point, prevPoint) > sqTolerance) {
      newPoints.push(point);
      prevPoint = point;
    }
  }

  if (prevPoint !== point!) newPoints.push(point!);

  return newPoints;
}

/**


    @param simplified @private
*/
function simplifyDPStep(
  poly: Point[],
  first: number,
  last: number,
  sqTolerance: number,
  simplified: Point[],
): void {
  let index: number | undefined,
    maxSqDist = sqTolerance;

  for (let i = first + 1; i < last; i++) {
    const sqDist = getSqSegDist(poly[i], poly[first], poly[last]);

    if (sqDist > maxSqDist) {
      index = i;
      maxSqDist = sqDist;
    }
  }

  if (maxSqDist > sqTolerance) {
    if (index! - first > 1)
      simplifyDPStep(poly, first, index!, sqTolerance, simplified);
    simplified.push(poly[index!]);
    if (last - index! > 1)
      simplifyDPStep(poly, index!, last, sqTolerance, simplified);
  }
}

/**
    simplification using Ramer-Douglas-Peucker algorithm

    @private
*/
function simplifyDouglasPeucker(poly: Point[], sqTolerance: number): Point[] {
  const last = poly.length - 1;

  const simplified: Point[] = [poly[0]];
  simplifyDPStep(poly, 0, last, sqTolerance, simplified);
  simplified.push(poly[last]);

  return simplified;
}

/**
    Simplifies the points of a polygon using both the Ramer-Douglas-Peucker algorithm and basic distance-based simplification. Adapted to an ES6 module from the excellent [Simplify.js](http://mourner.github.io/simplify-js/).
    @author Vladimir Agafonkin
    @param poly An Array of points that represent a polygon.
    @param tolerance Affects the amount of simplification (in the same metric as the point coordinates).
    @param highestQuality Excludes distance-based preprocessing step which leads to highest quality simplification but runs ~10-20 times slower.
*/
export default function (
  poly: Point[],
  tolerance: number = 1,
  highestQuality: boolean = false,
): Point[] {
  if (poly.length <= 2) return poly;

  const sqTolerance = tolerance * tolerance;

  poly = highestQuality ? poly : simplifyRadialDist(poly, sqTolerance);
  poly = simplifyDouglasPeucker(poly, sqTolerance);

  return poly;
}
