/**
    The scale behind a bivariate ColorScale: each of two variables split into
    quantile bins, and the grid of colors the pair of bins picks from.
*/
import {ascending, bisectLeft, bisectRight} from "d3-array";
import {rgb} from "d3-color";
import {interpolateRgb} from "d3-interpolate";

/**
    Joshua Stevens' blue–red 3×3 scheme, from "Bivariate Choropleth Maps: A
    How-to Guide" (joshuastevens.net/cartography/make-a-bivariate-choropleth-map/),
    with the hex values as published in the R `pals` package
    (`stevens.bluered`). Row-major from the low/low corner: each row is one
    bin of the second variable (low to high), each column one bin of the
    first (low to high). The first variable rises toward red (#c85a5a), the
    second toward blue (#64acbe), and both together toward #574249. Each
    inner color is the two ramps multiplied over the shared #e8e8e8 base.
*/
export const BIVARIATE_COLORS: readonly string[] = [
  "#e8e8e8",
  "#e4acac",
  "#c85a5a",
  "#b0d5df",
  "#ad9ea5",
  "#985356",
  "#64acbe",
  "#627f8c",
  "#574249",
];

/** The fewest and most bins a bivariate ColorScale splits each variable into. */
export const BIVARIATE_MIN_BUCKETS = 2;
export const BIVARIATE_MAX_BUCKETS = 4;
/** The bins per variable when none is set. */
export const BIVARIATE_BUCKETS = 3;

/**
    The number of bins per variable: `value` rounded and held within 2–4, or
    3 when it isn't a number.
    @param value The configured bin count.
*/
export function bivariateBucketCount(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value))
    return BIVARIATE_BUCKETS;
  return Math.min(
    BIVARIATE_MAX_BUCKETS,
    Math.max(BIVARIATE_MIN_BUCKETS, Math.round(value)),
  );
}

/** The side of a square grid of `length` colors, or 0 when it isn't one of at least 2×2. */
function gridSide(length: number): number {
  const side = Math.round(Math.sqrt(length));
  return side >= 2 && side * side === length ? side : 0;
}

/**
    Resamples a square grid of colors (row-major, `k×k`) to `n×n`: a grid
    already `n×n` is returned as given, and any other is blended
    bilinearly between its nearest colors, so its corners stay put. A 3×3
    scheme resampled to 4×4 keeps its corners and blends its middle colors
    across the new cells; one resampled to 2×2 keeps only its corners.
    @param grid The colors, row-major.
    @param n The side of the grid to return.
*/
export function resampleGrid(grid: readonly string[], n: number): string[] {
  const k = gridSide(grid.length);
  if (!k) return [];
  if (k === n) return grid.slice();
  const at = (x: number, y: number): string => grid[y * k + x];
  const out: string[] = [];
  const position = (step: number): [number, number] => {
    const g = n > 1 ? (step * (k - 1)) / (n - 1) : 0;
    const lo = Math.min(k - 2, Math.floor(g));
    return [lo, g - lo];
  };
  for (let j = 0; j < n; j++) {
    const [y, ty] = position(j);
    for (let i = 0; i < n; i++) {
      const [x, tx] = position(i);
      const low = interpolateRgb(at(x, y), at(x + 1, y))(tx);
      const high = interpolateRgb(at(x, y + 1), at(x + 1, y + 1))(tx);
      out.push(rgb(interpolateRgb(low, high)(ty)).formatHex());
    }
  }
  return out;
}

/**
    The `n×n` colors a bivariate ColorScale paints with (row-major, as
    `BIVARIATE_COLORS`): `colors` when it is a square grid of at least 2×2
    color strings, resampled to `n×n` (see `resampleGrid`), else Stevens'
    3×3 scheme resampled the same way.
    @param colors The configured grid.
    @param n The bins per variable.
*/
export function bivariatePalette(colors: unknown, n: number): string[] {
  const valid =
    Array.isArray(colors) &&
    gridSide(colors.length) > 0 &&
    colors.every(c => typeof c === "string" && rgb(c).displayable());
  return resampleGrid(valid ? (colors as string[]) : BIVARIATE_COLORS, n);
}

/** One variable's bins, as `bivariateBins` returns them. */
export interface BivariateBins {
  /** The bin (0 to `n - 1`) a value falls in. */
  bin: (value: number) => number;
  /** Each bin's lowest and highest value in the data, or null for a bin holding none. */
  ranges: ([number, number] | null)[];
}

/**
    Splits one variable's values into `n` quantile bins by rank: a value's
    bin is its share of the values ranked below it (ties counted at their
    middle rank), so each bin holds about as many values as the next, and
    equal values always share a bin. A value outside the data ranks by
    where it would sort.
    @param values The variable's values (non-finite ones are ignored).
    @param n The number of bins.
*/
export function bivariateBins(values: number[], n: number): BivariateBins {
  const sorted = values.filter(Number.isFinite).sort(ascending);
  const count = sorted.length;
  const bin = (value: number): number => {
    if (!count || !Number.isFinite(value)) return 0;
    // Twice the tie group's middle rank, in whole numbers so a value right
    // on a bin's edge doesn't slip below it to float error.
    const ranks = bisectLeft(sorted, value) + bisectRight(sorted, value);
    return Math.min(n - 1, Math.floor((ranks * n) / (2 * count)));
  };
  const ranges: ([number, number] | null)[] = Array.from(
    {length: n},
    () => null,
  );
  for (const v of sorted) {
    const b = bin(v);
    const range = ranges[b];
    if (!range) ranges[b] = [v, v];
    else range[1] = v;
  }
  return {bin, ranges};
}

/** A value pair a bivariate ColorScale can place: two finite numbers. */
export type BivariatePair = [number, number];

/** Whether `value` is a pair of finite numbers. */
export function isBivariatePair(value: unknown): value is BivariatePair {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  );
}

/**
    A bivariate color scale: called with a value pair, it returns the color
    of the cell the pair's bins pick (undefined for anything else).
*/
export interface BivariateScale {
  (value: unknown): string | undefined;
  /** The cell `[column, row]` a pair falls in: its first variable's bin, then its second's. */
  cell(value: unknown): [number, number] | null;
  /** The bins per variable. */
  size: number;
  /** The first variable's bins. */
  x: BivariateBins;
  /** The second variable's bins. */
  y: BivariateBins;
  /** The `n×n` colors, row-major (see `BIVARIATE_COLORS`). */
  colors: string[];
  /** Every value pair the scale was built from. */
  domain(): BivariatePair[];
  /** The colors, as a d3 scale's `range`. */
  range(): string[];
}

/**
    Builds a bivariate color scale from the value pairs in the data: each
    variable binned into `n` quantiles (see `bivariateBins`), colored from
    `colors`, an `n×n` grid (see `bivariatePalette`).
    @param pairs The data's value pairs.
    @param n The bins per variable.
    @param colors The `n×n` colors, row-major.
*/
export function bivariateScale(
  pairs: BivariatePair[],
  n: number,
  colors: string[],
): BivariateScale {
  const x = bivariateBins(
    pairs.map(p => p[0]),
    n,
  );
  const y = bivariateBins(
    pairs.map(p => p[1]),
    n,
  );
  const cell = (value: unknown): [number, number] | null =>
    isBivariatePair(value) ? [x.bin(value[0]), y.bin(value[1])] : null;
  const scale = ((value: unknown) => {
    const c = cell(value);
    return c ? colors[c[1] * n + c[0]] : undefined;
  }) as BivariateScale;
  scale.cell = cell;
  scale.size = n;
  scale.x = x;
  scale.y = y;
  scale.colors = colors;
  scale.domain = () => pairs;
  scale.range = () => colors;
  return scale;
}
