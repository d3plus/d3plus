import {deviation, extent, mean, quantileSorted} from "d3-array";

/** A kernel function of the scaled distance `u = (x - xi) / bandwidth`. */
export type Kernel = (u: number) => number;

/** The built-in kernels, by name. */
export type KernelName = "gaussian" | "epanechnikov";

/** One evaluated point of a density curve: `[value, density]`. */
export type DensityPoint = [number, number];

export interface KernelDensityOptions {
  /** The kernel: `"gaussian"` (default), `"epanechnikov"`, or a custom kernel function. */
  kernel?: KernelName | Kernel;
  /**
      The bandwidth (smoothing window) in data units, or a function that
      returns one for the finite input values. Defaults to Silverman's rule of
      thumb (see `silvermanBandwidth`).
  */
  bandwidth?: number | ((values: number[]) => number);
  /** How many evenly spaced points to evaluate the density at. Defaults to 100 (minimum 2). */
  points?: number;
  /**
      How far past the smallest and largest value to evaluate, in bandwidths.
      Defaults to 3, where a gaussian density has fallen to about 1% of its
      peak. Use 0 to stop at the data's extent. Ignored when `extent` is set.
  */
  cut?: number;
  /** An explicit `[min, max]` range to evaluate across. */
  extent?: [number, number];
}

const SQRT_2PI = Math.sqrt(2 * Math.PI);

/**
    The standard normal (gaussian) kernel: `e^(-u²/2) / √(2π)`.
    @param u The scaled distance from an observation.
*/
export function gaussianKernel(u: number): number {
  return Math.exp(-0.5 * u * u) / SQRT_2PI;
}

const SQRT_5 = Math.sqrt(5);

/**
    The Epanechnikov kernel, scaled to unit variance like the gaussian kernel
    so a bandwidth smooths about as much with either:
    `3 / (4√5) · (1 - u²/5)` for `|u| ≤ √5`, otherwise 0. Its density reaches
    exactly zero √5 bandwidths past the outermost observations.
    @param u The scaled distance from an observation.
*/
export function epanechnikovKernel(u: number): number {
  return Math.abs(u) < SQRT_5 ? (0.75 / SQRT_5) * Math.max(0, 1 - (u * u) / 5) : 0;
}

const kernels: Record<KernelName, Kernel> = {
  epanechnikov: epanechnikovKernel,
  gaussian: gaussianKernel,
};

/** The finite numbers in `values`. */
const finite = (values: readonly unknown[]): number[] =>
  values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));

/**
    Silverman's rule-of-thumb bandwidth for a gaussian kernel density estimate:
    `0.9 · min(σ, IQR / 1.34) · n^(-1/5)`. When one of the two spreads is zero
    the other is used; when the values don't vary at all (including a single
    value) the spread falls back to a tenth of their magnitude, or 1 for zeros.
    Non-finite values are ignored. Returns NaN when there are no values.
    @param values The observations.
*/
export function silvermanBandwidth(values: readonly number[]): number {
  const v = finite(values).sort((a, b) => a - b);
  const n = v.length;
  if (!n) return NaN;
  const sd = n > 1 ? (deviation(v) as number) : 0;
  const iqr = ((quantileSorted(v, 0.75) as number) - (quantileSorted(v, 0.25) as number)) / 1.34;
  let spread = sd && iqr ? Math.min(sd, iqr) : sd || iqr;
  if (!spread) spread = Math.abs(mean(v) as number) / 10 || 1;
  return 0.9 * spread * Math.pow(n, -0.2);
}

/** `count` evenly spaced values from `lo` to `hi`, inclusive. */
function grid(lo: number, hi: number, count: number): number[] {
  if (lo === hi) return [lo];
  const step = (hi - lo) / (count - 1);
  return Array.from({length: count}, (_, i) => (i === count - 1 ? hi : lo + i * step));
}

/**
    Estimates the probability density of a set of observations with a kernel
    density estimate, evaluated on an evenly spaced grid. Each observation
    contributes one kernel scaled to the bandwidth, and the sum is normalized
    so the curve's area is 1. Non-finite values are ignored; an empty input
    returns an empty array.
    @param values The observations.
    @param options The kernel, bandwidth, and evaluation grid.
    @returns The `[value, density]` points, in ascending value order.
*/
export default function kernelDensity(
  values: readonly number[],
  options: KernelDensityOptions = {},
): DensityPoint[] {
  const v = finite(values);
  const n = v.length;
  if (!n) return [];

  const kernel = typeof options.kernel === "function"
    ? options.kernel
    : kernels[options.kernel ?? "gaussian"] ?? gaussianKernel;
  const requested = typeof options.bandwidth === "function" ? options.bandwidth(v) : options.bandwidth;
  const h = requested !== undefined && requested > 0 && Number.isFinite(requested)
    ? requested
    : silvermanBandwidth(v);

  let lo: number, hi: number;
  if (options.extent) [lo, hi] = extent(options.extent) as [number, number];
  else {
    const cut = Math.max(0, options.cut ?? 3);
    const [min, max] = extent(v) as [number, number];
    lo = min - cut * h;
    hi = max + cut * h;
  }
  const count = Math.max(2, Math.round(options.points ?? 100));

  const scale = 1 / (n * h);
  return grid(lo, hi, count).map(x => {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += kernel((x - v[i]) / h);
    return [x, sum * scale];
  });
}
