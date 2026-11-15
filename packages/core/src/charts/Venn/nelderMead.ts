/**
    A Nelder–Mead simplex minimizer, for the Venn layout's loss and its
    label placement. Deterministic: the same start always finds the same
    minimum.
*/

/** Options for {@link nelderMead}. */
export interface NelderMeadOptions {
  /** The most steps to take. Defaults to 200 per dimension. */
  maxIterations?: number;
  /** Stops once the best and worst values differ by less than this. */
  minErrorDelta?: number;
  /** ...and the best two points differ by less than this in every coordinate. */
  minTolerance?: number;
}

/** A minimum {@link nelderMead} found: where, and the value there. */
export interface NelderMeadResult {
  x: number[];
  fx: number;
}

interface Vertex {
  x: number[];
  fx: number;
}

/** `a * p + b * q`, coordinate by coordinate. */
function mix(a: number, p: number[], b: number, q: number[]): number[] {
  return p.map((v, k) => a * v + b * q[k]);
}

/**
    Finds a local minimum of `f` near `x0` by the Nelder–Mead method:
    reflecting, expanding, contracting and shrinking a simplex of
    `x0.length + 1` points until it settles.
    @param f The function to minimize.
    @param x0 The starting point.
    @param options Step and tolerance limits.
*/
export function nelderMead(
  f: (x: number[]) => number,
  x0: number[],
  options: NelderMeadOptions = {},
): NelderMeadResult {
  const n = x0.length;
  if (!n) return {x: [], fx: f([])};
  const maxIterations = options.maxIterations ?? n * 200;
  const minErrorDelta = options.minErrorDelta ?? 1e-6;
  const minTolerance = options.minTolerance ?? 1e-5;
  const vertex = (x: number[]): Vertex => ({x, fx: f(x)});

  const simplex: Vertex[] = [vertex(x0.slice())];
  for (let i = 0; i < n; i++) {
    const point = x0.slice();
    point[i] = point[i] ? point[i] * 1.05 : 0.001;
    simplex.push(vertex(point));
  }

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    simplex.sort((a, b) => a.fx - b.fx);
    let spread = 0;
    for (let k = 0; k < n; k++)
      spread = Math.max(spread, Math.abs(simplex[0].x[k] - simplex[1].x[k]));
    if (
      Math.abs(simplex[0].fx - simplex[n].fx) < minErrorDelta &&
      spread < minTolerance
    )
      break;

    const centroid = new Array<number>(n).fill(0);
    for (let i = 0; i < n; i++)
      for (let k = 0; k < n; k++) centroid[k] += simplex[i].x[k] / n;

    const worst = simplex[n];
    const reflected = vertex(mix(2, centroid, -1, worst.x));
    if (reflected.fx < simplex[0].fx) {
      const expanded = vertex(mix(3, centroid, -2, worst.x));
      simplex[n] = expanded.fx < reflected.fx ? expanded : reflected;
    } else if (reflected.fx >= simplex[n - 1].fx) {
      const contracted =
        reflected.fx > worst.fx
          ? vertex(mix(0.5, centroid, 0.5, worst.x))
          : vertex(mix(1.5, centroid, -0.5, worst.x));
      if (contracted.fx < Math.min(reflected.fx, worst.fx))
        simplex[n] = contracted;
      else
        for (let i = 1; i <= n; i++)
          simplex[i] = vertex(mix(0.5, simplex[0].x, 0.5, simplex[i].x));
    } else simplex[n] = reflected;
  }

  simplex.sort((a, b) => a.fx - b.fx);
  return {x: simplex[0].x, fx: simplex[0].fx};
}
