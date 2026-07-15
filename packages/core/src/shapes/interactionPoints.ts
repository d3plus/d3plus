import type {DataPoint} from "@d3plus/data";
import type {InteractionPoint} from "@d3plus/render";
import type {AccessorFn} from "../utils/index.js";

/**
    For a nested shape datum (Line/Area, whose datum wraps many points) returns a
    spreadable scene-node fragment carrying each point's content-space position
    paired with its source datum, so the pointer bridge can report the point
    nearest the cursor rather than the whole-series aggregate. Points the
    `defined` accessor rejects, or whose position isn't finite (a missing value),
    are skipped — so the nearest match is always a real, defined point. Returns
    an empty object for non-nested data (spreads to nothing).
*/
export function interactionPoints(
  d: DataPoint,
  x: AccessorFn,
  y: AccessorFn,
  defined?: AccessorFn,
): {interactionPoints?: InteractionPoint[]} {
  if (!d.__d3plusShape__ || !Array.isArray(d.values)) return {};
  const values = d.values as unknown as DataPoint[];
  const points: InteractionPoint[] = [];
  values.forEach((v, k) => {
    if (typeof defined === "function" && defined(v, k) === false) return;
    const px = Number(x(v, k));
    const py = Number(y(v, k));
    if (!Number.isFinite(px) || !Number.isFinite(py)) return;
    points.push({
      x: px,
      y: py,
      datum: v,
      index: typeof v.i === "number" ? (v.i as number) : k,
    });
  });
  return points.length ? {interactionPoints: points} : {};
}
