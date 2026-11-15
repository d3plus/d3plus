import type {DataPoint} from "@d3plus/data";

type Point = [number, number];

/**
    The indices Largest-Triangle-Three-Buckets keeps of a run of points: the
    first and last, and from each of `target - 2` equal buckets between them
    the point making the largest triangle with the point kept before it and
    the next bucket's average. It keeps the peaks and dips a plain sample
    would skip. Every index when `target` is 3 or less, or reaches the
    point count.
    @param points The points, in drawing order.
    @param target How many to keep.
*/
export function lttbIndices(points: Point[], target: number): number[] {
  const n = points.length;
  const all = () => points.map((_, i) => i);
  if (!(target >= 3) || target >= n) return all();
  const keep = [0];
  const every = (n - 2) / (target - 2);
  let a = 0;
  for (let b = 0; b < target - 2; b++) {
    // The next bucket's average point.
    const nextStart = Math.floor((b + 1) * every) + 1;
    const nextEnd = Math.min(Math.floor((b + 2) * every) + 1, n);
    let avgX = 0,
      avgY = 0;
    for (let k = nextStart; k < nextEnd; k++) {
      avgX += points[k][0];
      avgY += points[k][1];
    }
    const count = nextEnd - nextStart || 1;
    avgX /= count;
    avgY /= count;
    // This bucket's point making the largest triangle.
    const [ax, ay] = points[a];
    const start = Math.floor(b * every) + 1;
    const end = Math.floor((b + 1) * every) + 1;
    let max = -1,
      pick = start;
    for (let k = start; k < end; k++) {
      const area = Math.abs(
        (ax - avgX) * (points[k][1] - ay) - (ax - points[k][0]) * (avgY - ay),
      );
      if (area > max) {
        max = area;
        pick = k;
      }
    }
    keep.push(pick);
    a = pick;
  }
  keep.push(n - 1);
  return keep;
}

/** A per-point accessor, as d3-shape's generators call them. */
type PointFn = (d: DataPoint, i: number) => unknown;

/** What {@link downsampleIndices} reads each point through. */
export interface DownsampleAccessors {
  /** The point's position along the line (the discrete axis), in pixels. */
  along: PointFn;
  /** Each edge's position across the line, in pixels: a line's one, or an area's two. */
  edges: PointFn[];
  /** Points it rejects break the path; each unbroken run is thinned apart. */
  defined?: PointFn;
}

/**
    The indices of the points a line or area keeps to draw at most about
    `target` of them, in order, or null when it has no more than `target`.
    It drops the points past the pixel `extent` along the line, all but the
    nearest on each side; each run between undefined points (which are
    kept, to break the path) shares `target` by its length and keeps its
    points by Largest-Triangle-Three-Buckets along each edge, so an area
    keeps the peaks of its top and its base. Null when nothing would be
    dropped.
    @param values The points, in drawing order.
    @param target The most points to draw.
    @param fns The point accessors.
    @param extent The pixel range along the line that shows, if any.
*/
export function downsampleIndices(
  values: DataPoint[],
  target: number,
  fns: DownsampleAccessors,
  extent?: [number, number] | null,
): number[] | null {
  const n = values.length;
  if (n <= target) return null;
  const along = values.map((v, i) => Number(fns.along(v, i)));
  const lo = extent ? Math.min(extent[0], extent[1]) : -Infinity;
  const hi = extent ? Math.max(extent[0], extent[1]) : Infinity;
  const inside = (i: number) => along[i] >= lo && along[i] <= hi;
  const shown = values.map(
    (_, i) =>
      inside(i) || (i > 0 && inside(i - 1)) || (i < n - 1 && inside(i + 1)),
  );
  const defined = values.map((v, i) => !fns.defined || !!fns.defined(v, i));

  // Runs of shown, defined points; undefined points between them stay.
  const runs: number[][] = [];
  let run: number[] = [];
  const kept: number[] = [];
  values.forEach((_, i) => {
    if (!shown[i]) return;
    if (defined[i]) run.push(i);
    else {
      if (run.length) runs.push(run);
      run = [];
      kept.push(i);
    }
  });
  if (run.length) runs.push(run);
  const total = runs.reduce((s, r) => s + r.length, 0);
  if (total <= target && kept.length + total === n) return null;

  for (const r of runs) {
    const share = Math.max(3, Math.round((target * r.length) / total));
    if (r.length <= share) {
      kept.push(...r);
      continue;
    }
    const picked = new Set<number>();
    for (const edge of fns.edges) {
      const points = r.map((i): Point => [
        along[i],
        Number(edge(values[i], i)),
      ]);
      // A flat edge (an area's baseline) has no shape to keep.
      if (points.every(p => p[1] === points[0][1])) continue;
      for (const k of lttbIndices(points, share)) picked.add(r[k]);
    }
    picked.add(r[0]);
    picked.add(r[r.length - 1]);
    kept.push(...picked);
  }
  return kept.sort((a, b) => a - b);
}

/**
    The points a Line or Area datum draws: those its downsampling kept
    (`drawn`), else all of them.
    @param d A grouped Line or Area datum.
*/
export function drawnValues(d: DataPoint): DataPoint[] {
  const drawn = (d as Record<string, unknown>).drawn;
  return (Array.isArray(drawn) ? drawn : d.values) as unknown as DataPoint[];
}

/** The Area config {@link downsampleAreas} reads. */
export interface AreaSchema {
  discrete?: string;
  downsample: number;
  downsampleExtent?: [number, number] | null;
  defined?: PointFn;
  x: PointFn;
  x0: PointFn;
  x1: PointFn | null;
  y: PointFn;
  y0: PointFn;
  y1: PointFn | null;
}

/**
    Thins a set of areas to draw (see `drawnValues`), keeping the same
    positions along the axis in every one: each area picks the points that
    keep the peaks of its top and base edges, and every area draws the union
    of their positions, so stacked areas still meet edge to edge.
    @param areas Grouped Area datums.
    @param schema The Area's accessors and downsampling config.
*/
export function downsampleAreas(areas: DataPoint[], schema: AreaSchema): void {
  const vertical = schema.discrete === "y";
  const along = vertical ? schema.y0 : schema.x0;
  const edges = vertical
    ? [schema.x0, schema.x1 ?? schema.x0]
    : [schema.y0, schema.y1 ?? schema.y0];
  const positions = new Set<number>();
  const picks = areas.map(d => {
    const values = d.values as unknown as DataPoint[];
    const keep = downsampleIndices(
      values,
      schema.downsample,
      {along, edges, defined: schema.defined},
      schema.downsampleExtent,
    );
    for (const i of keep ?? values.map((_, k) => k))
      positions.add(Number(along(values[i], i)));
    return keep;
  });
  if (picks.every(keep => !keep)) return;
  areas.forEach(d => {
    const values = d.values as unknown as DataPoint[];
    (d as Record<string, unknown>).drawn = values.filter(
      (v, i) =>
        positions.has(Number(along(v, i))) ||
        (schema.defined !== undefined && !schema.defined(v, i)),
    );
  });
}
