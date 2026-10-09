/**
    Draws `shapeConfig.backgroundImage` inside the shape nodes a chart's `emit`
    builds itself, the same way a Shape draws it in the Plot family.

    @module
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import {backgroundImageLayout, emitBackgroundImages} from "../../shapes/sceneSort.js";
import {resolveAccessor} from "./emitHelpers.js";

/**
    The background image for one emitted shape node, or null when the datum's
    `sc.backgroundImage` resolves to no URL or the node has no fillable area.

    `sc` is a shape-config record from `shapeConfigFor`, so a per-shape
    `shapeConfig.Rect.backgroundImage` applies as well as the top-level one;
    `backgroundImage` and `backgroundImageFit` resolve against `(d, i)` like the
    node's other paint props. The image uses the shape's own geometry (a rect,
    circle, or path) for its box and clip, so it fits exactly as it does on a
    Plot shape: `cover` fills the bounding box clipped to the outline, `contain`
    sits fully visible in the largest inscribed rectangle. Its wrapping group
    carries the node's datum, transform, and opacity, so it dims and animates
    with the shape, and it never takes pointer events from it.
*/
export function backgroundImageNode(
  sc: Record<string, unknown>,
  node: SceneNode,
  d: DataPoint,
  i: number | undefined,
): SceneNode | null {
  const url = resolveAccessor<unknown>(sc.backgroundImage, d, i);
  if (typeof url !== "string" || !url) return null;
  const fit = resolveAccessor<unknown>(sc.backgroundImageFit, d, i);
  const layout = backgroundImageLayout(
    node as unknown as Record<string, unknown>,
    [],
    fit === "contain" ? "contain" : "cover",
  );
  if (!layout || !(layout.box.width > 0) || !(layout.box.height > 0)) return null;
  const opacity = node.paint?.opacity;
  const [group] = emitBackgroundImages(
    [
      {
        key: node.key,
        index: node.index ?? i ?? 0,
        datum: node.datum,
        url,
        box: layout.box,
        clip: layout.clip,
        preserveAspectRatio: layout.preserveAspectRatio,
        opacity: typeof opacity === "number" ? opacity : undefined,
        transform: node.transform,
      },
    ],
    null,
    0,
  );
  return group;
}

/**
    The background images for a list of emitted shape nodes, in node order.
    `args(k)` returns the `(d, i)` that node `k`'s paint props resolve against.
    Returns `[]` without resolving anything when `sc.backgroundImage` is unset.
    Push the result after the shape nodes and before their labels, so each
    image paints over its shape's fill and under its label.
*/
export function backgroundImageNodes(
  sc: Record<string, unknown>,
  nodes: SceneNode[],
  args: (k: number) => [DataPoint, number | undefined],
): SceneNode[] {
  if (!sc.backgroundImage) return [];
  const out: SceneNode[] = [];
  nodes.forEach((node, k) => {
    const [d, i] = args(k);
    const image = backgroundImageNode(sc, node, d, i);
    if (image) out.push(image);
  });
  return out;
}
