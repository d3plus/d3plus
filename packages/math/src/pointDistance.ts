import type {Point} from "./lineIntersection.js";
import pointDistanceSquared from "./pointDistanceSquared.js";

/**
    @function pointDistance
    @desc Calculates the pixel distance between two points.
    @param {Array} p1 The first point, which should always be an `[x, y]` formatted Array.
    @param {Array} p2 The second point, which should always be an `[x, y]` formatted Array.
    @returns {Number}
*/
export default (p1: Point, p2: Point): number =>
  Math.sqrt(pointDistanceSquared(p1, p2));
