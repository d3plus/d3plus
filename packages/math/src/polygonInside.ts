import {polygonContains} from "d3-polygon";

import type {Point} from "./lineIntersection.js";
import segmentsIntersect from "./segmentsIntersect.js";

/**
    Checks if one polygon is inside another polygon.
    @param polyA An Array of `[x, y]` points to be used as the inner polygon, checking if it is inside polyA.
    @param polyB An Array of `[x, y]` points to be used as the containing polygon.
*/
export default function (polyA: Point[], polyB: Point[]): boolean {
  let iA = -1;
  const nA = polyA.length;
  const nB = polyB.length;
  let bA = polyA[nA - 1];

  while (++iA < nA) {
    const aA = bA;
    bA = polyA[iA];

    let iB = -1;
    let bB = polyB[nB - 1];
    while (++iB < nB) {
      const aB = bB;
      bB = polyB[iB];
      if (segmentsIntersect(aA, bA, aB, bB)) return false;
    }
  }

  return polygonContains(polyB, polyA[0]);
}
