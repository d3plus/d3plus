/**
    Keeps a key entry's highlight while the pointer crosses the gap between
    two entries of a key (a colorScale's swatches or bivariate cells, or the
    legend's entries): leaving a lit entry for a point still inside the
    key's outline holds its highlight until the pointer reaches the next
    entry or leaves that outline.
*/
import {polygonContains, polygonHull} from "d3-polygon";
import type {DataPoint} from "@d3plus/data";
import type {SceneEvent, SceneNode, Transform} from "@d3plus/render";

import type {VizInstance} from "../viz/vizTypes.js";
import {colorScaleBucketOf} from "./colorScaleBucket.js";
import {mapper, ownBoxes} from "./sceneBounds.js";

type Point = [number, number];

/** A chart's keys: the colorScale's swatches, and the legend's entries. */
export type KeyName = "colorScale" | "legend";

/**
    The key a scene node is an entry of, or null for anything else.
    @param node A scene node.
*/
export function keyOf(node: SceneNode | null | undefined): KeyName | null {
  if (!node || node.type === "text" || node.type === "group") return null;
  if (colorScaleBucketOf(node.datum)) return "colorScale";
  const group = (node as {interactionGroup?: string}).interactionGroup;
  return group === "legend" && node.datum !== undefined ? "legend" : null;
}

/**
    Every entry of `key` drawn in `root` (its swatches and their hit areas,
    not their labels), each with its box's corners in the scene's
    coordinates.
    @param root The painted scene's root node.
    @param key The key.
*/
export function keyEntries(
  root: SceneNode | undefined,
  key: KeyName,
): {node: SceneNode; points: Point[]}[] {
  const entries: {node: SceneNode; points: Point[]}[] = [];
  const walk = (node: SceneNode, chain: Transform[]): void => {
    const next = node.transform ? [...chain, node.transform] : chain;
    if (node.type === "group") {
      for (const child of node.children) walk(child, next);
      return;
    }
    if (keyOf(node) !== key) return;
    const map = mapper(next);
    const points: Point[] = [];
    for (const b of ownBoxes(node)) {
      if (![b.x, b.y, b.width, b.height].every(Number.isFinite)) continue;
      points.push(
        map([b.x, b.y]),
        map([b.x + b.width, b.y]),
        map([b.x, b.y + b.height]),
        map([b.x + b.width, b.y + b.height]),
      );
    }
    if (points.length) entries.push({node, points});
  };
  if (root) walk(root, []);
  return entries;
}

/**
    The convex outline, in the scene's coordinates, around every entry of
    `key` drawn in `root`: the region an entry's highlight holds across.
    Null when fewer than three points bound it.
    @param root The painted scene's root node.
    @param key The key.
*/
export function keyHull(
  root: SceneNode | undefined,
  key: KeyName,
): Point[] | null {
  const points = keyEntries(root, key).flatMap(e => e.points);
  return points.length >= 3 ? polygonHull(points) : null;
}

/**
    Holds and releases a key entry's highlight for a pointer event, ahead of
    the chart's own enter and leave handlers. Leaving the entry that is lit
    for a point inside its key's outline (see `keyHull`) holds it, and
    `mouseleave` then leaves it lit. Reaching another entry of that key
    releases the hold to the entry's own highlight; leaving the outline, or
    the chart, releases it and clears the highlight.
    @param viz The chart.
    @param event The pointer event.
*/
export function holdKeyHover(viz: VizInstance, event: SceneEvent): void {
  // A leave between two nodes carries the move that crossed; the chart's
  // own leave carries a native mouseleave.
  const inChart = event.nativeEvent?.type !== "mouseleave";
  const hold = viz._keyHold;
  if (event.type === "mouseleave" && !hold) {
    const pick = viz._lastScenePick;
    const key = keyOf(pick?.node);
    const lit = viz._hover;
    if (!inChart || !key || typeof lit !== "function") return;
    if (!lit(pick!.d as DataPoint, pick!.i)) return;
    const hull = keyHull(viz._paintedScene?.root, key);
    if (hull && polygonContains(hull, event.point)) viz._keyHold = {key, hull};
    return;
  }
  if (!hold) return;
  if (keyOf(event.pick?.node) === hold.key) {
    viz._keyHold = undefined;
    return;
  }
  if (inChart && polygonContains(hold.hull, event.point)) return;
  viz._keyHold = undefined;
  viz._hoverBucket = false;
  viz.hover?.(false);
}
