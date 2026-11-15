import type {DataPoint} from "@d3plus/data";
import {hasCurve} from "@d3plus/render";
import type {PathSeries} from "@d3plus/render";

/** A per-point accessor, as d3-shape's line and area generators call them. */
type PointFn = (d: DataPoint, i: number) => unknown;

/** What {@link pathSeries} reads each point through. */
export interface PathSeriesAccessors {
  /** Each point's stable key; no series without one. */
  key?: PointFn | null;
  /** The curve's name. */
  curve: string;
  /** Points it rejects break the path, which then takes no series. */
  defined?: PointFn;
  /** The line's point, or an area's top edge. */
  x: PointFn;
  y: PointFn;
  /** An area's base edge; absent for a line. */
  x0?: PointFn;
  y0?: PointFn;
  /** The path's local origin, subtracted from every point. */
  cx: number;
  cy: number;
}

/**
    The keyed points a Line or Area path is drawn through (see
    `PathNode.series`), as a spreadable scene-node fragment, so the renderer
    tweens a redraw point by point by key. Empty (spreads to nothing) when
    the shape sets no `pointKey`, a point is undefined, not finite, or has
    no key, two points share a key, or the backends don't know the curve.
    @param values The path's points.
    @param fns The point accessors and the path's local origin.
*/
export function pathSeries(
  values: DataPoint[],
  fns: PathSeriesAccessors,
): {series?: PathSeries} {
  const {key, curve, defined, x, y, x0, y0, cx, cy} = fns;
  if (typeof key !== "function" || !values.length || !hasCurve(curve))
    return {};
  const area = Boolean(x0 && y0);
  const keys: PathSeries["keys"] = [];
  const top: [number, number][] = [];
  const base: [number, number][] = [];
  const seen = new Set<unknown>();
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (defined && !defined(v, i)) return {};
    const raw = key(v, i);
    const k = raw instanceof Date ? +raw : raw;
    if ((typeof k !== "string" && typeof k !== "number") || seen.has(k))
      return {};
    seen.add(k);
    const px = Number(x(v, i)) - cx,
      py = Number(y(v, i)) - cy;
    if (!Number.isFinite(px) || !Number.isFinite(py)) return {};
    keys.push(k);
    top.push([px, py]);
    if (area) {
      const bx = Number(x0!(v, i)) - cx,
        by = Number(y0!(v, i)) - cy;
      if (!Number.isFinite(bx) || !Number.isFinite(by)) return {};
      base.push([bx, by]);
    }
  }
  return {series: {keys, top, ...(area ? {base} : {}), curve}};
}
