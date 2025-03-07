import lineIntersection from "./lineIntersection.js";
import segmentBoxContains from "./segmentBoxContains.js";

/**
    @function segmentsIntersect
    @desc Checks whether the line segments p1q1 && p2q2 intersect.
    @param {Array} p1 The first point of the first line segment, which should always be an `[x, y]` formatted Array.
    @param {Array} q1 The second point of the first line segment, which should always be an `[x, y]` formatted Array.
    @param {Array} p2 The first point of the second line segment, which should always be an `[x, y]` formatted Array.
    @param {Array} q2 The second point of the second line segment, which should always be an `[x, y]` formatted Array.
    @returns {Boolean}
*/
export default function(p1, q1, p2, q2) {

  const p = lineIntersection(p1, q1, p2, q2);
  if (!p) return false;
  return segmentBoxContains(p1, q1, p) && segmentBoxContains(p2, q2, p);

}
