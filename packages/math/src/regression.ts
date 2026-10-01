export type RegressionType =
  | "linear"
  | "exponential"
  | "logarithmic"
  | "power"
  | "polynomial";

export interface RegressionResult {
  /** The type of regression that was fit. */
  type: RegressionType;
  /**
      The fitted coefficients, in original units:
      - linear / polynomial: `[c0, c1, …]` for `y = c0 + c1·x + c2·x² …`
      - exponential: `[a, b]` for `y = a·e^(b·x)`
      - logarithmic: `[a, b]` for `y = a + b·ln(x)`
      - power: `[a, b]` for `y = a·x^b`
  */
  coefficients: number[];
  /** Predicts y for a given x. */
  predict: (x: number) => number;
  /** The coefficient of determination, measured in original y units. */
  r2: number;
  /** The number of points used in the fit. */
  n: number;
  /** The smallest and largest x values used in the fit. */
  extent: [number, number];
}

export interface RegressionOptions {
  /** The polynomial order (degree), used when `type` is "polynomial". Defaults to 2. */
  order?: number;
}

/** Ordinary least squares fit of `y = a + b·x`, or null when x has no variance. */
function ols(xs: number[], ys: number[]): [number, number] | null {
  const n = xs.length;
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < n; i++) {
    sxx += (xs[i] - mx) ** 2;
    sxy += (xs[i] - mx) * (ys[i] - my);
  }
  if (!(sxx > 0)) return null;
  const b = sxy / sxx;
  return [my - b * mx, b];
}

/** Solves `A·x = b` by Gaussian elimination with partial pivoting. */
function solve(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++)
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    if (Math.abs(M[pivot][col]) < 1e-12) return null;
    [M[col], M[pivot]] = [M[pivot], M[col]];
    for (let r = col + 1; r < n; r++) {
      const f = M[r][col] / M[col][col];
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  const out = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let c = r + 1; c < n; c++) s -= M[r][c] * out[c];
    out[r] = s / M[r][r];
  }
  return out;
}

/** Binomial coefficient C(n, k). */
function choose(n: number, k: number): number {
  let r = 1;
  for (let i = 1; i <= k; i++) r = r * (n - k + i) / i;
  return r;
}

/**
    Polynomial least squares. Fits on standardized x for numerical stability
    (e.g. millisecond timestamps), then expands the coefficients back into
    original units for display; `predict` uses the standardized form.
*/
function polyfit(
  xs: number[],
  ys: number[],
  order: number,
): {coefficients: number[]; predict: (x: number) => number} | null {
  const n = xs.length;
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const sd = Math.sqrt(xs.reduce((s, v) => s + (v - mx) ** 2, 0) / n);
  if (!(sd > 0)) return null;
  const us = xs.map(x => (x - mx) / sd);
  const size = order + 1;
  const A = Array.from({length: size}, () => new Array(size).fill(0));
  const b = new Array(size).fill(0);
  for (let i = 0; i < n; i++) {
    const pows = [1];
    for (let k = 1; k <= 2 * order; k++) pows.push(pows[k - 1] * us[i]);
    for (let r = 0; r < size; r++) {
      b[r] += pows[r] * ys[i];
      for (let c = 0; c < size; c++) A[r][c] += pows[r + c];
    }
  }
  const beta = solve(A, b);
  if (!beta) return null;
  const coefficients = new Array(size).fill(0);
  beta.forEach((bk, k) => {
    for (let j = 0; j <= k; j++)
      coefficients[j] += bk * choose(k, j) * (-mx) ** (k - j) / sd ** k;
  });
  const predict = (x: number) => {
    const u = (x - mx) / sd;
    return beta.reduceRight((acc, c) => acc * u + c, 0);
  };
  return {coefficients, predict};
}

/**
    Fits a regression model to a set of `[x, y]` points. Points with non-finite values, or that fall outside a model's domain (y ≤ 0 for exponential, x ≤ 0 for logarithmic, either for power), are ignored. Returns `null` when there are too few usable points or the x values do not vary.
    @param points An array of `[x, y]` pairs.
    @param type The regression model: "linear", "exponential", "logarithmic", "power", or "polynomial".
    @param options Additional options, such as the polynomial `order`.
*/
export default function regression(
  points: [number, number][],
  type: RegressionType = "linear",
  options: RegressionOptions = {},
): RegressionResult | null {
  const order = type === "polynomial" ? Math.max(1, Math.round(options.order ?? 2)) : 1;
  const usable = (points || []).filter(([x, y]) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
    if ((type === "exponential" || type === "power") && y <= 0) return false;
    if ((type === "logarithmic" || type === "power") && x <= 0) return false;
    return true;
  });
  if (usable.length < Math.max(2, order + 1)) return null;
  const xs = usable.map(d => d[0]);
  const ys = usable.map(d => d[1]);

  let coefficients: number[];
  let predict: (x: number) => number;
  if (type === "polynomial") {
    const fit = polyfit(xs, ys, order);
    if (!fit) return null;
    ({coefficients, predict} = fit);
  }
  else {
    const tx = type === "logarithmic" || type === "power" ? xs.map(Math.log) : xs;
    const ty = type === "exponential" || type === "power" ? ys.map(Math.log) : ys;
    const fit = ols(tx, ty);
    if (!fit) return null;
    const [a, b] = fit;
    if (type === "exponential") {
      coefficients = [Math.exp(a), b];
      predict = x => Math.exp(a + b * x);
    }
    else if (type === "logarithmic") {
      coefficients = [a, b];
      predict = x => a + b * Math.log(x);
    }
    else if (type === "power") {
      coefficients = [Math.exp(a), b];
      predict = x => Math.exp(a) * x ** b;
    }
    else {
      coefficients = [a, b];
      predict = x => a + b * x;
    }
  }

  const my = ys.reduce((s, v) => s + v, 0) / ys.length;
  let ssRes = 0;
  let ssTot = 0;
  usable.forEach(([x, y]) => {
    ssRes += (y - predict(x)) ** 2;
    ssTot += (y - my) ** 2;
  });
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : ssRes === 0 ? 1 : 0;

  return {
    type,
    coefficients,
    predict,
    r2,
    n: usable.length,
    extent: xs.reduce<[number, number]>(
      ([lo, hi], x) => [Math.min(lo, x), Math.max(hi, x)],
      [Infinity, -Infinity],
    ),
  };
}
