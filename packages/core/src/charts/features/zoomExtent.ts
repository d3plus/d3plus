/**
    Automatic maximum zoom scale (#85): how far a chart can zoom depends on
    what it draws. A network of a few large nodes needs little zoom, while a
    detailed map should be able to zoom all the way into its smallest path.

    @module
*/

import {pathBounds} from "@d3plus/math";
import {areaPath, linePath} from "@d3plus/render";
import type {SceneNode} from "@d3plus/render";

/**
    Width/height of each measurable piece of a scene node's own geometry
    (before its transform). A Line/Area series spans the whole chart, so its
    detail is the segment between consecutive data points rather than the
    series' own extent.
*/
function nodeSizes(node: SceneNode): [number, number][] {
  const pts = node.interactionPoints;
  if (pts && pts.length > 1) {
    const sizes: [number, number][] = [];
    for (let i = 1; i < pts.length; i++)
      sizes.push([Math.abs(pts[i].x - pts[i - 1].x), Math.abs(pts[i].y - pts[i - 1].y)]);
    return sizes;
  }
  const size = nodeSize(node);
  return size ? [size] : [];
}

/** Width/height of a scene node's own geometry (before its transform). */
function nodeSize(node: SceneNode): [number, number] | null {
  switch (node.type) {
    case "rect":
    case "image":
      return [node.width, node.height];
    case "circle":
      return [node.r * 2, node.r * 2];
    case "path": {
      const b = pathBounds(node.d);
      return [b.width, b.height];
    }
    case "line": {
      const b = pathBounds(linePath(node));
      return [b.width, b.height];
    }
    case "area": {
      const b = pathBounds(areaPath(node));
      return [b.width, b.height];
    }
    default:
      return null;
  }
}

/**
    The zoom scale at which the chart's smallest data shape fills the chart
    area (less `padding` on each side, matching `zoomToBounds`), floored at 1.

    Data shapes are the top-level datum-bearing nodes of `_chartScene` (a
    Line/Area series is measured per segment — see `nodeSizes`). Chart
    decorations (axes, gridlines, radar spokes, …) are nested in groups, text
    labels scale with the shapes they annotate, and `::hit` nodes duplicate
    the geometry of the shape they belong to, so none of those are measured.

    @param nodes The chart's `_chartScene`.
    @param width Chart-area width.
    @param height Chart-area height.
    @param padding Pixel padding kept around a shape zoomed to fill the area.
    @param baseScale Any scale the chart's own transform already applies.
*/
export function autoZoomMax(
  nodes: SceneNode[],
  width: number,
  height: number,
  padding: number,
  baseScale: number = 1,
): number {
  const fitW = Math.max(1, width - padding * 2),
    fitH = Math.max(1, height - padding * 2);
  let max = 1;
  for (const node of nodes) {
    if (node.datum === undefined || node.type === "group" || node.type === "text") continue;
    if (String(node.key).endsWith("::hit")) continue;
    const s = baseScale * (node.transform?.scale ?? 1);
    for (const [w, h] of nodeSizes(node)) {
      // A zero-width (or -height) shape only constrains the other dimension;
      // one with no extent at all can't be zoomed into.
      const k = Math.min(w > 0 ? fitW / (w * s) : Infinity, h > 0 ? fitH / (h * s) : Infinity);
      if (Number.isFinite(k) && k > max) max = k;
    }
  }
  return max;
}
