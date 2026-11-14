/**
    How sharply a label's path bends, and smoothing it so the text can follow.
    Glyphs placed along a path turn with it, so along the inside of a tight
    bend their tops crowd together (and along the outside they fan apart):
    a label's path is smoothed of kinks shorter than its letters, and a
    stretch that still bends too tightly (see `bendStrain`) is passed over
    for a straighter one.
*/
import {polylineLength, PolylineRuler} from "./pathLabelGeometry.js";
import type {Pt} from "./pathLabelGeometry.js";

/** How far around each point a label's path is averaged (see `smoothPolyline`), in ems. */
export const PATH_LABEL_SMOOTHING = 1;

/** The tightest a label's path may bend toward its text, as a radius in ems, measured over one em of it. */
export const PATH_LABEL_INNER_RADIUS = 4;

/** The tightest a label's path may bend away from its text, as a radius in ems, measured over one em of it. */
export const PATH_LABEL_OUTER_RADIUS = 2;

/**
    How much a stretch bends: the sum of its turns, in radians.
    @param points The stretch.
*/
export function curvature(points: Pt[]): number {
  let total = 0;
  let prev: number | null = null;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i][0] - points[i - 1][0],
      dy = points[i][1] - points[i - 1][1];
    if (!dx && !dy) continue;
    const angle = Math.atan2(dy, dx);
    if (prev !== null) {
      let turn = Math.abs(angle - prev);
      if (turn > Math.PI) turn = 2 * Math.PI - turn;
      total += turn;
    }
    prev = angle;
  }
  return total;
}

/**
    The most a polyline turns along any `span` pixels of it, in radians: a
    circle of radius `r` turns `span / r`. With a `side`, only the turns
    toward that side of its direction count: `"left"` (where text along it
    sits) or `"right"`.
    @param points The polyline.
    @param span The length of the stretches measured.
    @param side Which way the turns counted go, or both when omitted.
*/
export function sharpestTurn(
  points: Pt[],
  span: number,
  side?: "left" | "right",
): number {
  const at: number[] = [];
  const turns: number[] = [];
  let walked = 0;
  let prev: number | null = null;
  for (let k = 1; k < points.length; k++) {
    const dx = points[k][0] - points[k - 1][0],
      dy = points[k][1] - points[k - 1][1];
    const len = Math.hypot(dx, dy);
    if (!len) continue;
    const angle = Math.atan2(dy, dx);
    if (prev !== null) {
      let turn = angle - prev;
      if (turn > Math.PI) turn -= 2 * Math.PI;
      else if (turn < -Math.PI) turn += 2 * Math.PI;
      // With y pointing down, a turn to the left lowers the angle.
      const toward = side === "left" ? -turn : side === "right" ? turn : 0;
      at.push(walked);
      turns.push(side ? Math.max(0, toward) : Math.abs(turn));
    }
    prev = angle;
    walked += len;
  }
  let best = 0;
  let sum = 0;
  let lo = 0;
  for (let hi = 0; hi < turns.length; hi++) {
    sum += turns[hi];
    while (at[hi] - at[lo] > span) sum -= turns[lo++];
    best = Math.max(best, sum);
  }
  return best;
}

/** The share of the turn a bend of radius `minRadius` makes over `span` pixels (see `holdsBends`) that the polyline's sharpest such span takes. */
function bendShare(
  points: Pt[],
  minRadius: number,
  span: number,
  side?: "left" | "right",
): number {
  const s = Math.min(span, polylineLength(points));
  return sharpestTurn(points, s, side) / ((s + 2) / minRadius);
}

/**
    Whether a polyline bends no tighter than a circle of radius `minRadius`
    over any `span` pixels of it (or all of it, when it is shorter): over
    that span, a bend that tight turns `span / minRadius`, and a vertex's
    worth more is allowed.
    @param points The polyline.
    @param minRadius The tightest bend allowed, in pixels.
    @param span The length of the stretches measured. Defaults to `minRadius`.
    @param side Which way the bends measured turn, or both when omitted (see `sharpestTurn`).
*/
export function holdsBends(
  points: Pt[],
  minRadius: number,
  span = minRadius,
  side?: "left" | "right",
): boolean {
  return !(minRadius > 0) || bendShare(points, minRadius, span, side) <= 1;
}

/**
    How near a label's path comes to bending too tightly for its text, over
    any em of it: its sharpest turn toward the text (where the letters'
    tops crowd together) as a share of what a bend of
    `PATH_LABEL_INNER_RADIUS` makes, or its sharpest turn away from the text
    (where they fan apart) as a share of what one of
    `PATH_LABEL_OUTER_RADIUS` makes, whichever is more. The text follows the
    path when this is 1 or less.
    @param points The label's path, the text on its left.
    @param fontSize The label's font size.
*/
export function bendStrain(points: Pt[], fontSize: number): number {
  return Math.max(
    bendShare(points, PATH_LABEL_INNER_RADIUS * fontSize, fontSize, "left"),
    bendShare(points, PATH_LABEL_OUTER_RADIUS * fontSize, fontSize, "right"),
  );
}

/**
    Whether a label's path bends gently enough for its text to follow
    without its letters crowding or fanning apart (see `bendStrain`).
    @param points The label's path, the text on its left.
    @param fontSize The label's font size.
*/
export function textFollows(points: Pt[], fontSize: number): boolean {
  return bendStrain(points, fontSize) <= 1;
}

/** Averages each value with the `half` on either side of it, fewer near the ends (so they stay put), or wrapping round a closed ring. */
function boxFilter(values: number[], half: number, closed: boolean): number[] {
  const n = values.length;
  const sums = [0];
  for (let k = 0; k < n; k++) sums.push(sums[k] + values[k]);
  if (closed) {
    const lap = sums[n];
    // The sum of values[a] to values[b - 1], reading round the ring.
    const range = (a: number, b: number) => {
      const wraps = Math.floor(a / n);
      const a0 = a - wraps * n,
        b0 = b - wraps * n;
      if (b0 <= n) return sums[b0] - sums[a0];
      return lap - sums[a0] + sums[b0 - n];
    };
    const h = Math.min(half, Math.floor((n - 1) / 2));
    return values.map((_, k) => range(k - h + n, k + h + 1 + n) / (2 * h + 1));
  }
  return values.map((_, k) => {
    const h = Math.min(half, k, n - 1 - k);
    return (sums[k + h + 1] - sums[k - h]) / (2 * h + 1);
  });
}

/**
    The polyline with its kinks rounded off: resampled evenly and each point
    averaged with its neighbors up to `radius` pixels along it either way
    (nearer ones weighing more), so a turn spreads over about twice
    `radius`. Its ends stay where they are, unless it is a closed ring (its
    last point repeating its first), which is smoothed all the way round.
    A polyline that never turns comes back as it is.
    @param points The polyline.
    @param radius How far around each point it is averaged, in pixels.
*/
export function smoothPolyline(points: Pt[], radius: number): Pt[] {
  if (points.length < 3 || !(radius > 0) || !curvature(points)) return points;
  const ruler = new PolylineRuler(points);
  // Points no more than 2px apart, so `holdsBends` reads the turns true.
  const step = Math.min(2, Math.max(0.5, radius / 4));
  const n = Math.ceil(ruler.length / step);
  if (n < 2) return points;
  const first = points[0],
    last = points[points.length - 1];
  const closed = first[0] === last[0] && first[1] === last[1];
  const count = closed ? n : n + 1;
  const xs: number[] = [],
    ys: number[] = [];
  for (let k = 0; k < count; k++) {
    const p = ruler.at((k * ruler.length) / n) ?? last;
    xs.push(p[0]);
    ys.push(p[1]);
  }
  // Two passes of a box half as wide make a triangle `radius` wide.
  const half = Math.max(1, Math.round(radius / step / 2));
  let sx = xs,
    sy = ys;
  for (let pass = 0; pass < 2; pass++) {
    sx = boxFilter(sx, half, closed);
    sy = boxFilter(sy, half, closed);
  }
  const out = sx.map((x, k): Pt => [x, sy[k]]);
  if (closed) out.push(out[0]);
  return out;
}
