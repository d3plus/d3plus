/**
    Walk a nested hierarchy, collecting every descendant into a flat array.
    Used by Pack's hover handlers to highlight the subtree under a hovered
    node.
*/

import type {DataPoint} from "@d3plus/data";

export function recursionCircles(
  d: DataPoint,
  arr: DataPoint[] = [],
): DataPoint[] {
  if (d.values) {
    (d.values as DataPoint[]).forEach(h => {
      arr.push(h);
      recursionCircles(h, arr);
    });
  } else {
    arr.push(d);
  }
  return arr;
}
