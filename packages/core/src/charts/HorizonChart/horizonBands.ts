/**
    HorizonChart's band math: a series cut into equal value bands, each band
    folded down onto the row's baseline, and negative values mirrored upward.
*/

/** One band's outline along a stretch of the series. */
export interface HorizonSlice {
  /** The band, from 0 (nearest zero) up. */
  band: number;
  /** 1 for the positive bands, -1 for the mirrored negative ones. */
  sign: 1 | -1;
  /**
      The band's topline as `[x, height]` pairs, `height` the share of the
      row the band fills there (0 to 1). Its baseline is height 0.
  */
  points: [number, number][];
}

/** The steps a nice band size takes, within each power of ten. */
const NICE_STEPS = [1, 2, 2.5, 5, 10];

/**
    The smallest nice number (1, 2, 2.5, or 5 times a power of ten) at least
    `value`, so band edges read as round numbers. Zero for anything not
    positive.
    @param value The number to round up.
*/
export function niceCeil(value: number): number {
  if (!(value > 0) || !Number.isFinite(value)) return 0;
  const power = Math.pow(10, Math.floor(Math.log10(value)));
  // Absorbs float noise, so 0.3 / 0.1 stays a step of 3, not past it.
  const scaled = value / power - 1e-9;
  return (NICE_STEPS.find(step => step >= scaled) ?? 10) * power;
}

/**
    The value range each band spans: the largest absolute value divided into
    `bands` parts, rounded up to a nice number (see `niceCeil`), so every
    value fits in the bands and the band edges are round. Zero when there is
    nothing to draw.
    @param values Every value the bands are shared across.
    @param bands How many bands to cut each sign into.
*/
export function horizonBandSize(values: number[], bands: number): number {
  let peak = 0;
  for (const v of values)
    if (Number.isFinite(v)) peak = Math.max(peak, Math.abs(v));
  return bands >= 1 && peak > 0 ? niceCeil(peak / Math.floor(bands)) : 0;
}

/**
    The series' points with a point added wherever a straight segment
    crosses zero or a band edge (a multiple of `size`), so each band's
    clamped height runs straight between neighboring points.
*/
function withCrossings(
  run: [number, number][],
  size: number,
  bands: number,
): [number, number][] {
  const out: [number, number][] = [run[0]];
  for (let i = 1; i < run.length; i++) {
    const [x0, v0] = run[i - 1];
    const [x1, v1] = run[i];
    if (v0 !== v1) {
      const lo = Math.min(v0, v1),
        hi = Math.max(v0, v1);
      const edges: number[] = [];
      for (let k = -bands; k <= bands; k++) {
        const edge = k * size;
        if (edge > lo && edge < hi) edges.push(edge);
      }
      if (v1 < v0) edges.reverse();
      for (const edge of edges)
        out.push([x0 + ((edge - v0) / (v1 - v0)) * (x1 - x0), edge]);
    }
    out.push(run[i]);
  }
  return out;
}

/** The stretches of `points` with a finite x and value, split at each gap. */
function finiteRuns(points: [number, number][]): [number, number][][] {
  const runs: [number, number][][] = [];
  let run: [number, number][] = [];
  for (const p of points) {
    if (Number.isFinite(p[0]) && Number.isFinite(p[1])) run.push(p);
    else if (run.length) {
      runs.push(run);
      run = [];
    }
  }
  if (run.length) runs.push(run);
  return runs;
}

/**
    Slices a series into its horizon bands: for each band of each sign, the
    stretches where it holds any of the series, as toplines of row heights.
    Values past the top band fill it. A missing value (non-finite) breaks the
    series, and a stretch of a single point draws nothing.
    @param points The series as `[x, value]` pairs, in x order.
    @param bands How many bands to cut each sign into.
    @param size The value range each band spans (see `horizonBandSize`).
*/
export function horizonSlices(
  points: [number, number][],
  bands: number,
  size: number,
): HorizonSlice[] {
  const count = Math.floor(bands);
  if (!(size > 0) || count < 1) return [];
  const slices: HorizonSlice[] = [];
  for (const run of finiteRuns(points)) {
    if (run.length < 2) continue;
    const dense = withCrossings(run, size, count);
    for (const sign of [1, -1] as const) {
      for (let band = 0; band < count; band++) {
        const heights = dense.map(([, v]) =>
          Math.min(1, Math.max(0, (sign * v - band * size) / size)),
        );
        const first = heights.findIndex(h => h > 0);
        if (first < 0) continue;
        let last = heights.length - 1;
        while (heights[last] === 0) last--;
        // One zero point on either side keeps the band's ends on the baseline.
        const start = Math.max(0, first - 1),
          end = Math.min(heights.length - 1, last + 1);
        const out: [number, number][] = [];
        for (let i = start; i <= end; i++) out.push([dense[i][0], heights[i]]);
        slices.push({band, sign, points: out});
      }
    }
  }
  return slices;
}
