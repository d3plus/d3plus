import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import type Image from "./Image.js";

/** Follows the chart (`__d3plus__`) and shape (`__d3plusShape__`) wrappers back
    to the source datum, so a `sort` comparator sees the same object the other
    per-datum accessors receive. */
function unwrap(d: DataPoint): DataPoint {
  let cur = d;
  while (cur.__d3plus__ && cur.data) cur = cur.data as DataPoint;
  return cur.__d3plusShape__ ? (cur.data as DataPoint) : cur;
}

/**
    Ranks `data` by a `sort` layering comparator WITHOUT reordering it. Returns
    `rank[i]` = the paint position of datum `i` (lower = painted first = behind),
    which callers stamp onto each node's `z`; the render backends sort every
    group's children ascending by `z` (stably). Returns null when there is no
    comparator or nothing to reorder, so callers emit no `z` and the fast
    append-order path is preserved.
*/
export function sortRanks(
  data: DataPoint[],
  sortFn: ((a: DataPoint, b: DataPoint) => number) | null | undefined,
): number[] | null {
  if (!sortFn || data.length < 2) return null;
  const order = data.map((_d, i) => i);
  order.sort((ai, bi) => sortFn(unwrap(data[ai]), unwrap(data[bi])));
  const rank = new Array<number>(data.length);
  order.forEach((origIdx, pos) => (rank[origIdx] = pos));
  return rank;
}

/**
    Renders the per-datum background images collected during `Shape.toScene` as
    flat sibling nodes. When `rank` is set (a `sort` comparator is active) every
    returned node needs a `z` — otherwise the backend sort would collapse the
    images to 0 and interleave them among the geometry — so they are placed
    above all geometry (ranks span `0..dataLen-1`) while keeping their own order.
*/
export function emitBackgroundImages(
  bgClass: Image,
  imageData: DataPoint[],
  rank: number[] | null,
  dataLen: number,
): SceneNode[] {
  bgClass
    .data(imageData)
    .id((d: DataPoint) => `${(d as Record<string, unknown>).id}`)
    .url((d: DataPoint) => (d as Record<string, unknown>).url as string)
    .x((d: DataPoint) => (d as Record<string, unknown>).x as number)
    .y((d: DataPoint) => (d as Record<string, unknown>).y as number)
    .width((d: DataPoint) => (d as Record<string, unknown>).width as number)
    .height((d: DataPoint) => (d as Record<string, unknown>).height as number)
    .renderMode("compute");
  const imgScene = bgClass.toScene();
  if (!imgScene || !Array.isArray(imgScene.children)) return [];
  if (rank)
    imgScene.children.forEach((c, k) => ((c as SceneNode).z = dataLen + k));
  return imgScene.children;
}
