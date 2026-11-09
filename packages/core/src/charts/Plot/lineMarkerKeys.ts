import type {PlotDatum} from "../features/plotPaint.js";

/**
    A unique scene key for each line marker. A marker is its series and its
    discrete value, or its x/y position when the chart has no discrete axis;
    a series that repeats one of those numbers its repeats, so no two markers
    share a key (the renderer keeps one node per key, which would give every
    marker that shares one the last one's datum).
    @param values The markers' points.
    @param discrete The chart's discrete axis, if any.
*/
export function lineMarkerKeys(
  values: PlotDatum[],
  discrete: unknown,
): Map<PlotDatum, string> {
  const seen = new Map<string, number>();
  const keys = new Map<PlotDatum, string>();
  for (const d of values) {
    const base = discrete ? `${d.id}_${d.discrete}` : `${d.id}_${d.x}_${d.y}`;
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    keys.set(d, n ? `${base}_${n}` : base);
  }
  return keys;
}
