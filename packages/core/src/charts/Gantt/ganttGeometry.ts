/**
    Pure Gantt geometry: the milestone diamond, a bar's progress split, a
    group's summary bracket, the elbow route of a dependency arrow, and the
    label column's width.
*/

/** A point, `[x, y]`. */
export type Point = [number, number];

/** A horizontal span, `x` to `x + width`. */
export interface Span {
  x: number;
  width: number;
}

const round = (n: number): number => Math.round(n * 100) / 100;

/**
    The SVG path of a diamond centered on `(cx, cy)`, `r` from its center to
    each tip.
*/
export function diamondPath(cx: number, cy: number, r: number): string {
  return `M${round(cx)},${round(cy - r)}L${round(cx + r)},${round(cy)}L${round(cx)},${round(cy + r)}L${round(cx - r)},${round(cy)}Z`;
}

/**
    Splits a bar into its done part (from its start) and the rest, by the
    share of it `progress` covers (clamped to 0–1).
    @param x The bar's left edge.
    @param width The bar's width.
    @param progress The share done.
*/
export function progressSplit(
  x: number,
  width: number,
  progress: number,
): {done: Span; rest: Span} {
  const p = Math.max(0, Math.min(1, progress));
  const done = width * p;
  return {
    done: {x, width: done},
    rest: {x: x + done, width: width - done},
  };
}

/**
    The SVG path of a group's summary bracket: a bar from `x0` to `x1`
    centered on `cy`, `h` tall, with a pointed foot hanging below each end.
*/
export function bracketPath(
  x0: number,
  x1: number,
  cy: number,
  h: number,
): string {
  const top = cy - h / 2,
    bottom = cy + h / 2;
  const foot = Math.min(h, Math.max(0, (x1 - x0) / 2));
  return `M${round(x0)},${round(top)}H${round(x1)}V${round(bottom + foot)}L${round(x1 - foot)},${round(bottom)}H${round(x0 + foot)}L${round(x0)},${round(bottom + foot)}Z`;
}

/**
    The route of a dependency arrow from a predecessor's end (`from`) to a
    dependent's start (`to`): right `stub` pixels, then down (or up) to the
    dependent's row, then right into its start. When the dependent starts
    too close to (or before) the predecessor's end for that, the route turns
    down (or up) to the edge of the predecessor's row (`step / 2` away),
    runs back left to `stub` before the dependent's start, and drops to its
    row from there. Points on one row join straight.
    @param from The predecessor's end.
    @param to The dependent's start.
    @param stub The length of the first and last legs.
    @param step The distance between neighboring row centers.
*/
export function elbowRoute(
  from: Point,
  to: Point,
  stub: number,
  step: number,
): Point[] {
  const [x0, y0] = from,
    [x1, y1] = to;
  if (y0 === y1 && x1 >= x0) return [from, to];
  const turn = x0 + stub;
  if (x1 - x0 >= 2 * stub) return [from, [turn, y0], [turn, y1], to];
  const dir = y1 > y0 ? 1 : -1;
  const mid = y0 + (dir * step) / 2;
  const back = x1 - stub;
  return [from, [turn, y0], [turn, mid], [back, mid], [back, y1], to];
}

/**
    The label column's width: the widest label plus padding on both sides,
    at most `limit` (a share of the chart's `width` when below 1, else
    pixels). Zero when there are no labels or no room.
    @param widest The widest label's width (with its indent).
    @param width The chart's width.
    @param limit The `labelWidth` setting.
    @param padding The space on each side of the labels.
*/
export function labelColumnWidth(
  widest: number,
  width: number,
  limit: number,
  padding: number,
): number {
  if (!(widest > 0) || !(limit > 0)) return 0;
  const most = limit <= 1 ? width * limit : limit;
  return Math.max(0, Math.min(Math.ceil(widest + padding * 2), most));
}
