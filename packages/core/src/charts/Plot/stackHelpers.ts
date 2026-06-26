/**
    d3-stack ordering + offset helpers used by Plot's `stackOrder` /
    `stackOffset` accessors and their constructor defaults.
*/
import * as d3Shape from "d3-shape";

type Series = d3Shape.Series<Record<string, unknown>, string>;

/**
    Sums a single stack series, ignoring non-numeric segments.
*/
export function stackSum(series: Series): number {
  let i = -1,
    s = 0,
    v;
  const n = series.length;
  while (++i < n) if ((v = +series[i][1])) s += v;
  return s;
}

/**
    Stack order: ascending by series key, tie-broken by summed value.
*/
export function stackOrderAscending(series: Series[]): number[] {
  const sums = series.map(stackSum);
  const keys = series.map((d: Series) => d.key.split("_")[0]);
  // @types/d3-shape types the order accessors' param as a single `Series`,
  // though d3 passes the full stack array; cast to satisfy the signature.
  return d3Shape
    .stackOrderNone(series as unknown as Series)
    .sort((a: number, b: number) => keys[b].localeCompare(keys[a]) || sums[a] - sums[b]);
}

/**
    Stack order: the reverse of {@link stackOrderAscending}.
*/
export function stackOrderDescending(series: Series[]): number[] {
  return stackOrderAscending(series).reverse();
}

/**
    Diverging stack offset: positive segments stack upward from zero,
    negative segments stack downward.
*/
export function stackOffsetDiverging(series: Series[], order: number[]): void {
  let n;
  if (!((n = series.length) > 0)) return;
  let d, dy, i, yn, yp;
  const m = series[order[0]].length;
  for (let j = 0; j < m; ++j) {
    for (yp = yn = 0, i = 0; i < n; ++i) {
      if ((dy = (d = series[order[i]][j])[1] - d[0]) >= 0) {
        ((d[0] = yp), (d[1] = yp += dy));
      } else if (dy < 0) {
        ((d[1] = yn), (d[0] = yn += dy));
      } else {
        d[0] = yp;
      }
    }
  }
}
