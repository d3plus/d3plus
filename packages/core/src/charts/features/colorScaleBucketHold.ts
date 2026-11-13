/**
    Keeps a colorScale bucket's highlight while the pointer crosses the gap
    between two swatches (or two cells of a bivariate key): leaving a swatch
    for a point still inside the swatches' outline holds its highlight until
    the pointer reaches the next swatch or leaves that outline.
*/
import {polygonContains, polygonHull} from "d3-polygon";
import type {SceneEvent, SceneNode, Transform} from "@d3plus/render";

import type {VizInstance} from "../viz/vizTypes.js";
import {colorScaleBucketOf} from "./colorScaleBucket.js";
import {mapper, ownBoxes} from "./sceneBounds.js";

type Point = [number, number];

/**
    The convex outline, in the scene's coordinates, around every colorScale
    swatch (and its hit area) drawn in `root`: the region a bucket's
    highlight holds across. Null when fewer than three points bound it.
    @param root The painted scene's root node.
*/
export function bucketSwatchHull(root: SceneNode | undefined): Point[] | null {
  if (!root) return null;
  const points: Point[] = [];
  const walk = (node: SceneNode, chain: Transform[]): void => {
    const next = node.transform ? [...chain, node.transform] : chain;
    if (node.type === "group") {
      for (const child of node.children) walk(child, next);
      return;
    }
    if (node.type === "text" || !colorScaleBucketOf(node.datum)) return;
    const map = mapper(next);
    for (const b of ownBoxes(node)) {
      if (![b.x, b.y, b.width, b.height].every(Number.isFinite)) continue;
      points.push(
        map([b.x, b.y]),
        map([b.x + b.width, b.y]),
        map([b.x, b.y + b.height]),
        map([b.x + b.width, b.y + b.height]),
      );
    }
  };
  walk(root, []);
  return points.length >= 3 ? polygonHull(points) : null;
}

/**
    Holds and releases a colorScale bucket's highlight for a pointer event,
    ahead of the chart's own enter and leave handlers. Leaving a highlighted
    swatch for a point inside the swatches' outline (see `bucketSwatchHull`)
    holds it, and `mouseleave` then leaves it lit. Reaching a swatch
    releases the hold to that swatch's own highlight; leaving the outline,
    or the chart, releases it and clears the highlight.
    @param viz The chart.
    @param event The pointer event.
*/
export function holdColorScaleBucket(
  viz: VizInstance,
  event: SceneEvent,
): void {
  // A leave between two nodes carries the move that crossed; the chart's
  // own leave carries a native mouseleave.
  const inChart = event.nativeEvent?.type !== "mouseleave";
  if (event.type === "mouseleave" && !viz._bucketHold) {
    const pick = viz._lastScenePick;
    if (!inChart || !viz._hoverBucket || !colorScaleBucketOf(pick?.d)) return;
    const hull = bucketSwatchHull(viz._paintedScene?.root);
    if (hull && polygonContains(hull, event.point)) viz._bucketHold = hull;
    return;
  }
  const hull = viz._bucketHold;
  if (!hull) return;
  if (colorScaleBucketOf(event.pick?.node?.datum)) {
    viz._bucketHold = undefined;
    return;
  }
  if (inChart && polygonContains(hull, event.point)) return;
  viz._bucketHold = undefined;
  if (viz._hoverBucket) {
    viz._hoverBucket = false;
    viz.hover?.(false);
  }
}
