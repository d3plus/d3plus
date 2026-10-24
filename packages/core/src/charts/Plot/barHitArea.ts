/**
    Bar hit areas: a transparent hover target behind each side-by-side bar
    that fills the bar's slot along the discrete axis and the whole plot along
    the value axis, so a short bar is as easy to hover and click as a tall
    one. Grouped bars each take their own column of the slot. Stacked bars
    already fill their slot and take none. `shapeConfig.Bar.hitArea: false`
    turns them off.

    @module
*/
import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import type {Shape} from "../../shapes/index.js";

/** Rect bounds in a bar's own coordinates (relative to its transform). */
export interface HitBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
    A bar's column of its slot along the discrete axis, as offsets from the
    bar's own center. A lone bar takes the whole slot. Grouped bars split it
    at the midpoints between their centers, and the outermost reach the
    slot's edges, so no column overlaps a neighboring bar.
    @param step The slot's width: the distance between neighboring categories.
    @param count How many bars share the slot.
    @param index The bar's position in the slot.
    @param reach How far the outermost bars' centers sit from the slot's center.
*/
export function hitColumn(
  step: number,
  count: number,
  index: number,
  reach: number,
): [number, number] {
  const half = step / 2;
  if (count < 2) return [-half, half];
  const gap = (2 * reach) / (count - 1);
  const center = -reach + index * gap;
  const lo = index <= 0 ? -half : center - gap / 2;
  const hi = index >= count - 1 ? half : center + gap / 2;
  return [lo - center, hi - center];
}

/**
    A bar's hit rect in its own coordinates: its `column` along the discrete
    axis, and the plot's `valueExtent` along the value axis, both sides of
    the baseline.
    @param discrete The discrete axis.
    @param column The column, as offsets from the bar's center (see `hitColumn`).
    @param valueExtent The value axis's pixel span, in shape coordinates.
    @param origin The bar's transform.
*/
export function hitBounds(
  discrete: "x" | "y",
  column: [number, number],
  valueExtent: [number, number],
  origin: {x?: number; y?: number},
): HitBounds {
  const [lo, hi] = column;
  const [vlo, vhi] = valueExtent;
  return discrete === "x"
    ? {x: lo, y: vlo - (origin.y ?? 0), width: hi - lo, height: vhi - vlo}
    : {x: vlo - (origin.x ?? 0), y: lo, width: vhi - vlo, height: hi - lo};
}

/**
    Gives a Bar shape its slot-filling hit areas (see `hitBounds`). Set
    before the user's `shapeConfig`, so `hitArea` there (or `false`) wins.
    @param s The Bar shape.
    @param discrete The discrete axis.
    @param valueExtent The value axis's pixel span, in shape coordinates.
    @param column Each bar's column (see `hitColumn`).
*/
export function applyBarHitArea(
  s: Shape,
  discrete: "x" | "y",
  valueExtent: [number, number] | undefined,
  column: (d: DataPoint, i: number) => [number, number],
): void {
  if (!valueExtent) return;
  s.config({
    hitArea: (d: DataPoint, i: number) =>
      hitBounds(
        discrete,
        column(d, i),
        valueExtent,
        s._sceneTransform(d, i),
      ) as unknown as Record<string, unknown>,
  });
}

/** Whether a scene node is a Bar's hit area. */
const isBarHit = (node: SceneNode): boolean =>
  node.shapeType === "Bar" && String(node.key).endsWith("::hit");

/**
    `nodes` with every Bar hit area moved to the front (painted first), so
    each sits behind every mark: a bar's slot never covers another bar, nor
    the lines, points, and areas drawn over it.
*/
export function barHitsFirst(nodes: SceneNode[]): SceneNode[] {
  if (!nodes.some(isBarHit)) return nodes;
  return [...nodes.filter(isBarHit), ...nodes.filter(node => !isBarHit(node))];
}
