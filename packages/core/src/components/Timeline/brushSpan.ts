/** The fewest and most ticks a Timeline's brush selection may span. */
export interface BrushSpan {
  min: number;
  max: number;
}

/** A `brushMin`/`brushMax` setting's value: a number, or a function returning one. */
const read = (value: unknown): unknown =>
  typeof value === "function" ? (value as () => unknown)() : value;

/**
    The fewest and most ticks a brush selection may span, from `brushMin` and
    `brushMax` (each a number, or a function returning one). An unset or
    non-finite `brushMax` is unlimited and a fractional one rounds down; one
    below `brushMin` rises to it, so `brushMin` wins when they conflict.
*/
export function brushSpan(brushMin: unknown, brushMax: unknown): BrushSpan {
  const lo = read(brushMin);
  const min = typeof lo === "number" && Number.isFinite(lo) ? lo : 1;
  const hi = read(brushMax);
  const max =
    typeof hi === "number" && Number.isFinite(hi)
      ? Math.max(Math.floor(hi), Math.ceil(min), 1)
      : Infinity;
  return {min, max};
}

/**
    A selection's end tick indices (`lo` to `hi`, out of `count` ticks), moved
    so it spans `span.min` to `span.max` ticks. Too short, its upper end moves
    out, then its lower end, as far as the ticks allow. Too long, it keeps the
    `anchor` end (the one being dragged) and pulls the other in.
*/
export function spanIndices(
  lo: number,
  hi: number,
  count: number,
  span: BrushSpan,
  anchor: "lo" | "hi" = "hi",
): [number, number] {
  const fewest = span.min - 1;
  let apart = Math.abs(hi - lo);
  if (apart < fewest) {
    hi = Math.min(count - 1, hi + (fewest - apart));
    apart = Math.abs(hi - lo);
    if (apart < fewest) lo = Math.max(0, lo - (fewest - apart));
  }
  const most = span.max - 1;
  if (hi - lo > most) {
    if (anchor === "lo") hi = lo + most;
    else lo = hi - most;
  }
  return [lo, hi];
}

/**
    A brushed selection fitted to `span`. `edges` are the period indices
    (earliest first) under the brush's left and right edges, which a
    reversed timeline holds latest first; `anchor` is the edge being dragged,
    which stays put when the selection is pulled in. Returns the fitted
    indices, earliest first.
*/
export function fitBrush(
  edges: [number, number],
  count: number,
  span: BrushSpan,
  anchor: "lo" | "hi",
): [number, number] {
  const lo = Math.min(...edges);
  const hi = Math.max(...edges);
  const dragged = edges[anchor === "lo" ? 0 : 1];
  return spanIndices(lo, hi, count, span, dragged === lo ? "lo" : "hi");
}

/** The index of the value in `values` nearest `value`. */
export function nearestIndex(values: number[], value: number): number {
  let best = -1;
  values.forEach((v, i) => {
    if (best < 0 || Math.abs(v - value) < Math.abs(values[best] - value))
      best = i;
  });
  return best;
}
