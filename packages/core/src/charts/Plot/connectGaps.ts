/**
    Pure helpers behind a Plot's `connectGaps`: reading the setting, finding
    where a line skips a missing value, measuring how far along its curve each
    point lies, and the dash arrays that break a line at its gaps or draw a
    bridge across them.
*/
import {line as d3Line} from "d3-shape";

import {parseDash} from "../../shapes/Shape.js";
import {curveFactory} from "./lineCurve.js";

type Point = [number, number];

/** A stretch of a path, as `[start, end]` lengths along it. */
export type Interval = [number, number];

/** The style object `connectGaps` takes for a bridge. */
export interface ConnectGapsConfig {
  stroke?: string;
  strokeDasharray?: string | number | number[] | false;
  strokeWidth?: number;
  opacity?: number;
}

/** Everything `connectGaps` takes. */
export type ConnectGaps = boolean | "solid" | "dashed" | ConnectGapsConfig;

/** How a bridge across a gap is drawn. Unset keys take the line's own style. */
export interface GapBridge {
  stroke?: string;
  strokeDasharray?: number[];
  strokeWidth?: number;
  opacity: number;
}

/** The dash pattern `"dashed"` bridges a gap with: short and sparse, unlike a forecast's `"6 4"`. */
export const GAP_DASH = [2, 4];

/**
    What a `connectGaps` setting asks for: null when lines run through their
    gaps as one continuous line (`true`, `"solid"`, unset), otherwise lines
    break at each gap and `bridge` is the style of the line drawn across it,
    or null to leave the gap empty (`false`).
    @param value The setting.
*/
export function resolveConnectGaps(
  value: unknown,
): {bridge: GapBridge | null} | null {
  if (value === false) return {bridge: null};
  if (value === "dashed")
    return {bridge: {strokeDasharray: GAP_DASH, opacity: 1}};
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const config = value as ConnectGapsConfig;
  const dash =
    config.strokeDasharray === undefined
      ? GAP_DASH
      : config.strokeDasharray === false
        ? undefined
        : parseDash(
            Array.isArray(config.strokeDasharray)
              ? config.strokeDasharray.join(" ")
              : config.strokeDasharray,
          );
  const bridge: GapBridge = {
    opacity:
      typeof config.opacity === "number" && Number.isFinite(config.opacity)
        ? config.opacity
        : 1,
  };
  if (dash && dash.some(v => v > 0)) bridge.strokeDasharray = dash;
  if (typeof config.stroke === "string" && config.stroke)
    bridge.stroke = config.stroke;
  if (typeof config.strokeWidth === "number")
    bridge.strokeWidth = config.strokeWidth;
  return {bridge};
}

/**
    The indices `k` of a line's points that a gap follows: some missing value
    lies strictly between point `k` and point `k + 1` along the discrete axis.
    A missing value before the first point or after the last makes no gap.
    @param ranks Each drawn point's position along the discrete axis, in drawn order.
    @param missing The positions with no value: every step any line has, and
      the line's own rows with no plottable value.
*/
export function gapsAfter(ranks: number[], missing: number[]): number[] {
  const steps = Array.from(new Set(missing.filter(Number.isFinite))).sort(
    (a, b) => a - b,
  );
  const out: number[] = [];
  for (let k = 0; k < ranks.length - 1; k++) {
    const lo = Math.min(ranks[k], ranks[k + 1]);
    const hi = Math.max(ranks[k], ranks[k + 1]);
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) continue;
    // The first step above lo, by binary search.
    let a = 0,
      b = steps.length;
    while (a < b) {
      const m = (a + b) >> 1;
      if (steps[m] <= lo) a = m + 1;
      else b = m;
    }
    if (a < steps.length && steps[a] < hi) out.push(k);
  }
  return out;
}

/**
    How far along a polyline it first reaches each of `targets` along one
    axis, searching on from where it reached the one before, and its total
    length. A target it never reaches lies at its full length.
    @param line The polyline (see `curvePolyline`).
    @param axis `0` to measure along x, `1` along y.
    @param targets The positions to reach, in order along the line.
*/
export function pointLengths(
  line: Point[],
  axis: 0 | 1,
  targets: number[],
): {at: number[]; total: number} {
  const cumulative = [0];
  for (let k = 1; k < line.length; k++)
    cumulative.push(
      cumulative[k - 1] +
        Math.hypot(line[k][0] - line[k - 1][0], line[k][1] - line[k - 1][1]),
    );
  const total = cumulative[cumulative.length - 1] ?? 0;
  let j = 0;
  const at = targets.map(target => {
    for (; j < line.length - 1; j++) {
      const p = line[j][axis],
        q = line[j + 1][axis];
      if (p === target) return cumulative[j];
      if ((p - target) * (q - target) < 0) {
        const t = (target - p) / (q - p);
        return cumulative[j] + t * (cumulative[j + 1] - cumulative[j]);
      }
    }
    return total;
  });
  return {at, total};
}

/**
    The stretches a dash pattern draws between `from` and `to`, starting the
    pattern at `from`. No pattern (or one that draws nothing) draws the
    whole stretch.
    @param dash The pattern, as `[dash, gap, …]`.
    @param from Where the stretch starts.
    @param to Where it ends.
*/
export function patternIntervals(
  dash: number[] | undefined,
  from: number,
  to: number,
): Interval[] {
  if (!(to > from)) return [];
  const pattern = dash && dash.length % 2 ? dash.concat(dash) : dash;
  const period = pattern ? pattern.reduce((a, b) => a + b, 0) : 0;
  if (!pattern || !(period > 0) || !pattern.some((v, k) => !(k % 2) && v > 0))
    return [[from, to]];
  const out: Interval[] = [];
  let at = from;
  for (let k = 0; at < to; k = (k + 1) % pattern.length) {
    const end = Math.min(to, at + pattern[k]);
    if (!(k % 2) && end > at) out.push([at, end]);
    at = end;
  }
  return out;
}

/**
    Where two lists of stretches overlap.
    @param a Sorted, non-overlapping stretches.
    @param b Sorted, non-overlapping stretches.
*/
export function intersectIntervals(a: Interval[], b: Interval[]): Interval[] {
  const out: Interval[] = [];
  let i = 0,
    j = 0;
  while (i < a.length && j < b.length) {
    const start = Math.max(a[i][0], b[j][0]);
    const end = Math.min(a[i][1], b[j][1]);
    if (end > start) out.push([start, end]);
    if (a[i][1] < b[j][1]) i++;
    else j++;
  }
  return out;
}

/**
    The stretches of `[0, total]` a list of stretches leaves out.
    @param intervals Sorted, non-overlapping stretches.
    @param total The path's length.
*/
export function complementIntervals(
  intervals: Interval[],
  total: number,
): Interval[] {
  const out: Interval[] = [];
  let at = 0;
  intervals.forEach(([start, end]) => {
    if (start > at) out.push([at, start]);
    at = Math.max(at, end);
  });
  if (total > at) out.push([at, total]);
  return out;
}

/**
    The dash array that draws a path along exactly the given stretches and
    nothing else, ending in a gap long enough that the pattern never repeats.
    @param intervals Sorted, non-overlapping stretches to draw.
    @param total The path's length.
*/
export function intervalsDash(intervals: Interval[], total: number): number[] {
  const round = (v: number) => +Math.max(0, v).toFixed(2);
  const out: number[] = [];
  let at = 0;
  intervals.forEach(([start, end], k) => {
    // A zero-length first dash opens with the gap before the first stretch.
    if (k) out.push(round(start - at));
    else if (round(start) > 0) out.push(0, round(start));
    out.push(round(end - start));
    at = end;
  });
  if (!out.length) return [0, round(total) + 1];
  out.push(round(total - at) + round(total) + 1);
  return out;
}

/**
    A line's path with a separate subpath for each run of points between its
    gaps, so nothing spans a gap. A point between two gaps gets a short tick
    along the discrete axis.
    @param points The line's points, in drawn order.
    @param gaps The indices a gap follows (see `gapsAfter`).
    @param curve The line's curve name.
    @param axis `0` when the discrete axis is x, `1` when it is y.
    @param stub Half the length of a lone point's tick.
*/
export function runPath(
  points: Point[],
  gaps: number[],
  curve: string,
  axis: 0 | 1,
  stub = 3,
): string {
  const breaks = new Set(gaps);
  const runs: Point[][] = [[]];
  points.forEach((p, k) => {
    runs[runs.length - 1].push(p);
    if (breaks.has(k) && k < points.length - 1) runs.push([]);
  });
  const gen = d3Line().curve(curveFactory(curve));
  return runs
    .map(run => {
      if (run.length > 1) return gen(run) || "";
      const [x, y] = run[0];
      return axis
        ? `M${x},${y - stub}L${x},${y + stub}`
        : `M${x - stub},${y}L${x + stub},${y}`;
    })
    .join("");
}

/**
    Each run of points between a line's gaps, as its `[first, last]` point
    indices.
    @param count The line's point count.
    @param gaps The indices a gap follows (see `gapsAfter`).
*/
export function runIndices(count: number, gaps: number[]): Interval[] {
  if (!count) return [];
  const out: Interval[] = [];
  let start = 0;
  [...gaps]
    .sort((a, b) => a - b)
    .forEach(k => {
      if (k < start || k >= count - 1) return;
      out.push([start, k]);
      start = k + 1;
    });
  out.push([start, count - 1]);
  return out;
}
