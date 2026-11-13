/** Options for `movingAverage`. */
export interface MovingAverageOptions {
  /** How many points each average spans, unless `span` is given. Defaults to 7. */
  window?: number;
  /**
      Spans each average across a stretch of x instead of a number of points:
      given a point's x, returns where the stretch ending at it starts (such
      as 30 days earlier). The stretch runs from just after that start up to
      the point, or, with `center`, is as long and centered on it. Every point
      has an average: where its stretch reaches past the data, it averages
      the points it holds so far.
  */
  span?: (x: number) => number;
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
  /** How many points each average spans (0 when it spans a stretch of x). */
  window: number;
  /** Whether each average spans a stretch of x (`span`) rather than a number of points. */
  spanned: boolean;
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
    The points averaged at index `i` of the ordered x values `xs` when each
    average spans a stretch of x, as `[start, end]` indices (inclusive), or
    null when the stretch has no length. A trailing stretch runs from just
    after `span(x)` up to x; a centered one is as long and centered on x,
    from just after its start up to its end. A stretch reaching past the
    first or last x holds the points it covers so far.
    @param xs The x values, in ascending order.
    @param i The point's index.
    @param span Returns where the stretch ending at an x starts.
    @param center Whether the stretch is centered on the point.
*/
export function movingSpan(
  xs: number[],
  i: number,
  span: (x: number) => number,
  center = false,
): [number, number] | null {
  const x = xs[i];
  const length = x - span(x);
  if (!(length > 0)) return null;
  const from = center ? x - length / 2 : x - length;
  const to = center ? x + length / 2 : x;
  let start = i;
  while (start > 0 && xs[start - 1] > from) start--;
  let end = i;
  while (end < xs.length - 1 && xs[end + 1] <= to) end++;
  return [start, end];
}

/**
    Computes a rolling mean over `points` (ordered by x), with bands a set
    number of standard deviations either side of it (Bollinger bands). Points
    sharing an x value are first averaged into one, so the window counts
    distinct x values; non-finite pairs are ignored. Points without a full
    window (the first `window − 1`, or the ends of a centered window) have no
    average. With a `span`, each average takes the points within a stretch
    of x instead (see `movingSpan`), so gaps and uneven spacing average over
    the same length of x, and every point has one: where the stretch reaches
    past the data, it averages the points it holds so far (a lone point has
    a deviation of 0). Returns `null` when no point has an average.
    @param points An array of `[x, y]` pairs.
    @param options The window, its alignment, and the band width.
*/
export default function movingAverage(
  points: [number, number][],
  options: MovingAverageOptions = {},
): MovingAverageResult | null {
  const window = Math.max(1, Math.floor(Number(options.window ?? 7)) || 1);
  const {span} = options;
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
  const xs = series.map(p => p[0]);
  const out: MovingAveragePoint[] = [];
  series.forEach(([x], i) => {
    const range = span
      ? movingSpan(xs, i, span, center)
      : movingWindow(i, series.length, window, center);
    if (!range) return;
    const values = series.slice(range[0], range[1] + 1).map(p => p[1]);
    const count = values.length;
    const mean = values.reduce((s, v) => s + v, 0) / count;
    const deviation = Math.sqrt(
      values.reduce((s, v) => s + (v - mean) ** 2, 0) / count,
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
    window: span ? 0 : window,
    spanned: Boolean(span),
    center,
    deviations,
    points: out,
    n: series.length,
    extent: [series[0][0], series[series.length - 1][0]],
  };
}
