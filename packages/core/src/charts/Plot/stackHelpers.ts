/**
    d3-stack ordering + offset helpers used by Plot's `stackOrder` /
    `stackOffset` accessors and their constructor defaults.
*/
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as d3Shape from "d3-shape";

/**
    Sums a single stack series, ignoring non-numeric segments.
*/
export function stackSum(series: any) {
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
export function stackOrderAscending(series: any) {
  const sums = series.map(stackSum);
  const keys = series.map((d: any) => d.key.split("_")[0]);
  return d3Shape
    .stackOrderNone(series)
    .sort((a: any, b: any) => keys[b].localeCompare(keys[a]) || sums[a] - sums[b]);
}

/**
    Stack order: the reverse of {@link stackOrderAscending}.
*/
export function stackOrderDescending(series: any) {
  return stackOrderAscending(series).reverse();
}

/**
    Diverging stack offset: positive segments stack upward from zero,
    negative segments stack downward.
*/
export function stackOffsetDiverging(series: any, order: any) {
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
