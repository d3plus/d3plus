/** Options for `movingAverage`. */
export interface MovingAverageOptions {
  /** How many points each average spans. Defaults to 5. */
  window?: number;
  /**
      Centers each window on its point instead of ending it there. Defaults to
      `false`: each point averages itself and the `window − 1` points before it.
  */
  center?: boolean;
  /**
      How many standard deviations the bands sit either side of the average
      (Bollinger bands). Defaults to 2; `0` draws no bands.
  */
  deviations?: number;
}

/** One point of a moving average. */
export interface MovingAveragePoint {
  /** The point's x value. */
  x: number;
  /** The mean of the y values in its window. */
  mean: number;
  /** The standard deviation of the y values in its window (population). */
  deviation: number;
  /** The lower band: `mean − deviations · deviation`. */
  lower: number;
  /** The upper band: `mean + deviations · deviation`. */
  upper: number;
}

/** A moving average of a set of points. */
export interface MovingAverageResult {
  type: "movingAverage";
  /** How many points each average spans. */
  window: number;
  /** Whether each window is centered on its point. */
  center: boolean;
  /** How many standard deviations the bands sit from the average. */
  deviations: number;
  /** The averages, by x, at every point with a full window. */
  points: MovingAveragePoint[];
  /** The number of distinct x values averaged. */
  n: number;
  /** The smallest and largest x values averaged. */
  extent: [number, number];
}

/**
    The window of points averaged at index `i` of `length` sorted points, as
    `[start, end]` indices (inclusive), or null when the window would run past
    either end. A trailing window ends at `i`; a centered one starts
    `floor(window / 2)` points before it.
    @param i The point's index.
    @param length The number of points.
    @param window How many points the window spans.
    @param center Whether the window is centered on the point.
*/
export function movingWindow(
  i: number,
  length: number,
  window: number,
  center = false,
): [number, number] | null {
  const start = center ? i - Math.floor(window / 2) : i - window + 1;
  const end = start + window - 1;
  return start < 0 || end >= length ? null : [start, end];
}

/**
    Computes a rolling mean over `points` (ordered by x), with bands a set
    number of standard deviations either side of it (Bollinger bands). Points
    sharing an x value are first averaged into one, so the window counts
    distinct x values; non-finite pairs are ignored. Points without a full
    window (the first `window − 1`, or the ends of a centered window) have no
    average. Returns `null` when no point has a full window.
    @param points An array of `[x, y]` pairs.
    @param options The window, its alignment, and the band width.
*/
export default function movingAverage(
  points: [number, number][],
  options: MovingAverageOptions = {},
): MovingAverageResult | null {
  const window = Math.max(1, Math.floor(Number(options.window ?? 5)) || 1);
  const center = Boolean(options.center);
  const deviations = Number.isFinite(options.deviations)
    ? Math.max(0, options.deviations as number)
    : 2;
  const byX = new Map<number, [number, number]>();
  for (const [x, y] of points) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const sum = byX.get(x);
    if (sum) {
      sum[0] += y;
      sum[1] += 1;
    } else byX.set(x, [y, 1]);
  }
  const series = Array.from(byX, ([x, [sum, count]]) => [x, sum / count]).sort(
    (a, b) => a[0] - b[0],
  );
  const out: MovingAveragePoint[] = [];
  series.forEach(([x], i) => {
    const span = movingWindow(i, series.length, window, center);
    if (!span) return;
    const values = series.slice(span[0], span[1] + 1).map(p => p[1]);
    const mean = values.reduce((s, v) => s + v, 0) / window;
    const deviation = Math.sqrt(
      values.reduce((s, v) => s + (v - mean) ** 2, 0) / window,
    );
    out.push({
      x,
      mean,
      deviation,
      lower: mean - deviations * deviation,
      upper: mean + deviations * deviation,
    });
  });
  if (!out.length) return null;
  return {
    type: "movingAverage",
    window,
    center,
    deviations,
    points: out,
    n: series.length,
    extent: [series[0][0], series[series.length - 1][0]],
  };
}
