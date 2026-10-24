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
    so it spans `span.min` to `span.max` ticks. Too short, it keeps its `fixed`
    end and moves the other out, then the fixed end too where the ticks run
    out. Too long, it keeps the `anchor` end (the one being dragged) and pulls
    the other in.
*/
export function spanIndices(
  lo: number,
  hi: number,
  count: number,
  span: BrushSpan,
  anchor: "lo" | "hi" = "hi",
  fixed: "lo" | "hi" = "lo",
): [number, number] {
  const fewest = span.min - 1;
  if (Math.abs(hi - lo) < fewest) {
    if (fixed === "lo") {
      hi = Math.min(count - 1, lo + fewest);
      lo = Math.max(0, hi - fewest);
    } else {
      lo = Math.max(0, hi - fewest);
      hi = Math.min(count - 1, lo + fewest);
    }
  }
  const most = span.max - 1;
  if (hi - lo > most) {
    if (anchor === "lo") hi = lo + most;
    else lo = hi - most;
  }
  return [lo, hi];
}

/**
    The end a selection keeps while it grows to `brushMin`: the end being
    dragged (`anchor`), or its first when it is a single period (a click).
*/
export const growFrom = (
  lo: number,
  hi: number,
  anchor: "lo" | "hi",
): "lo" | "hi" => (lo === hi ? "lo" : anchor);

/**
    A Timeline's brush span (see `brushSpan`); a single-period Timeline
    (`brushing: false`) has no `brushMin` to meet.
*/
export function timelineBrushSpan(schema: Record<string, unknown>): BrushSpan {
  const span = brushSpan(schema.brushMin, schema.brushMax);
  return schema.brushing === false ? {...span, min: 1} : span;
}

/**
    A brushed selection fitted to `span`. `edges` are the period indices
    (earliest first) under the brush's left and right edges, which a
    reversed timeline holds latest first; `anchor` is the edge being dragged.
    Pulled in, the dragged end stays put. Pushed out, the first period does,
    or with `keepDragged` the dragged end (a click's period). Returns the
    fitted indices, earliest first.
*/
export function fitBrush(
  edges: [number, number],
  count: number,
  span: BrushSpan,
  anchor: "lo" | "hi",
  keepDragged = false,
): [number, number] {
  const lo = Math.min(...edges);
  const hi = Math.max(...edges);
  const dragged = edges[anchor === "lo" ? 0 : 1] === lo ? "lo" : "hi";
  const fixed = keepDragged ? growFrom(lo, hi, dragged) : "lo";
  return spanIndices(lo, hi, count, span, dragged, fixed);
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
