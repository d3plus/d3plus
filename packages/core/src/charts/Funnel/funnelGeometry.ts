/**
    Pure geometry for Funnel, in an orientation-free frame: `s` runs along
    the stage order (top to bottom, or left to right) and `w` is a width
    across it, centered on the funnel's axis. The funnel's outline is one
    width profile over `s`; each stage and each neck between two stages is
    the slice of that profile over its own span.
*/

import type {Orient} from "../../shapes/shapeConfig.js";

/** How the profile's width changes between two knots. */
export type FunnelCurve = "linear" | "smooth";

/** One stage's span along the stage order. */
export interface StageSpan {
  start: number;
  end: number;
}

/** A point of the width profile, with its slope for smooth curves. */
export interface ProfileKnot {
  s: number;
  w: number;
  m: number;
}

/** A sampled profile point: a position along the stage order and its width. */
export type ProfilePoint = [number, number];

/**
    Splits `length` into `n` stage spans separated by `n - 1` gaps, each gap
    `padding` (0–1) of one stage's slot.
*/
export function stageSpans(
  n: number,
  length: number,
  padding: number,
): StageSpan[] {
  if (n <= 0 || !(length > 0)) return [];
  const p = n > 1 ? Math.min(0.95, Math.max(0, padding || 0)) : 0;
  const slot = length / (n - p);
  const size = slot * (1 - p);
  return Array.from({length: n}, (_, i) => ({
    start: i * slot,
    end: i * slot + size,
  }));
}

/**
    Each stage's width across a `breadth`, proportional to its value against
    the largest value. Negative and non-finite values are drawn at zero width.
*/
export function stageWidths(values: number[], breadth: number): number[] {
  const clean = values.map(v => (Number.isFinite(v) && v > 0 ? v : 0));
  const max = Math.max(0, ...clean);
  return clean.map(v => (max > 0 ? (v / max) * breadth : 0));
}

/**
    Monotone (Fritsch–Carlson) slopes for knots sorted by `s`, so a smooth
    curve through them never overshoots between two knots.
*/
export function monotoneSlopes(points: {s: number; w: number}[]): number[] {
  const n = points.length;
  if (n < 2) return points.map(() => 0);
  const delta: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const ds = points[i + 1].s - points[i].s;
    delta.push(ds > 0 ? (points[i + 1].w - points[i].w) / ds : 0);
  }
  const m = points.map((_, i) => {
    if (i === 0) return delta[0];
    if (i === n - 1) return delta[n - 2];
    const a = delta[i - 1],
      b = delta[i];
    return a * b <= 0 ? 0 : (a + b) / 2;
  });
  for (let i = 0; i < n - 1; i++) {
    const d = delta[i];
    if (d === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d,
      b = m[i + 1] / d;
    const h = a * a + b * b;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      m[i] = t * a * d;
      m[i + 1] = t * b * d;
    }
  }
  return m;
}

/**
    The knots of the funnel's width profile. Without `taper`, every stage
    holds its own width across its whole span and the width changes only in
    the gap after it, with flat ends, so a smooth curve eases in and out.
    With `taper`, the width runs continuously from each stage's start to the
    next stage's start (the last stage keeps its own width), giving a
    straight- or smooth-sided funnel.
*/
export function profileKnots(
  spans: StageSpan[],
  widths: number[],
  taper: boolean,
): ProfileKnot[] {
  if (!spans.length) return [];
  if (!taper)
    return spans.flatMap((span, i) => [
      {s: span.start, w: widths[i], m: 0},
      {s: span.end, w: widths[i], m: 0},
    ]);
  const last = spans.length - 1;
  const points = spans.map((span, i) => ({s: span.start, w: widths[i]}));
  points.push({s: spans[last].end, w: widths[last]});
  const slopes = monotoneSlopes(points);
  return points.map((p, i) => ({...p, m: slopes[i]}));
}

/** The width at `s` within the segment from knot `a` to knot `b`. */
export function segmentWidth(
  a: ProfileKnot,
  b: ProfileKnot,
  s: number,
  curve: FunnelCurve,
): number {
  const h = b.s - a.s;
  if (!(h > 0)) return a.w;
  const t = Math.min(1, Math.max(0, (s - a.s) / h));
  if (curve !== "smooth") return a.w + (b.w - a.w) * t;
  const t2 = t * t,
    t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * a.w +
    (t3 - 2 * t2 + t) * h * a.m +
    (-2 * t3 + 3 * t2) * b.w +
    (t3 - t2) * h * b.m
  );
}

/** Whether a segment's width never changes, so it needs no samples. */
function flat(a: ProfileKnot, b: ProfileKnot): boolean {
  return a.w === b.w && a.m === 0 && b.m === 0;
}

/**
    Samples the profile from `from` to `to`: both ends, every knot between,
    and, for a smooth curve, `steps` points per changing segment. Each
    segment is read on its own, so a width that steps at a shared knot
    (stages with no gap) reads correctly on both sides.
*/
export function profileSlice(
  knots: ProfileKnot[],
  from: number,
  to: number,
  curve: FunnelCurve,
  steps = 12,
): ProfilePoint[] {
  const out: ProfilePoint[] = [];
  if (!(to > from)) return out;
  for (let j = 0; j < knots.length - 1; j++) {
    const a = knots[j],
      b = knots[j + 1];
    const lo = Math.max(from, a.s),
      hi = Math.min(to, b.s);
    if (!(hi > lo) || !(b.s > a.s)) continue;
    const n =
      curve === "smooth" && !flat(a, b)
        ? Math.max(1, Math.ceil((steps * (hi - lo)) / (b.s - a.s)))
        : 1;
    for (let k = 0; k <= n; k++) {
      const s = lo + ((hi - lo) * k) / n;
      const w = segmentWidth(a, b, s, curve);
      const prev = out[out.length - 1];
      if (!prev || prev[0] !== s || prev[1] !== w) out.push([s, w]);
    }
  }
  return out;
}

const round = (v: number): number => Math.round(v * 100) / 100;

/**
    An SVG path for a profile slice: down one side and back up the other,
    centered on `center` across the stage order.
*/
export function slicePath(
  points: ProfilePoint[],
  center: number,
  orient: Orient,
): string {
  if (points.length < 2) return "";
  const xy = (s: number, c: number): string =>
    orient === "horizontal"
      ? `${round(s)},${round(c)}`
      : `${round(c)},${round(s)}`;
  const side = points.map(([s, w]) => xy(s, center - w / 2));
  const back = points
    .slice()
    .reverse()
    .map(([s, w]) => xy(s, center + w / 2));
  return `M${side.join("L")}L${back.join("L")}Z`;
}

/** The narrowest and widest points of a profile slice. */
export function sliceExtent(points: ProfilePoint[]): {
  min: number;
  max: number;
} {
  if (!points.length) return {min: 0, max: 0};
  const ws = points.map(p => p[1]);
  return {min: Math.min(...ws), max: Math.max(...ws)};
}

/** Each stage's value as a fraction of the first stage's and of the previous stage's. */
export function conversionRates(values: number[]): {
  first: number[];
  previous: number[];
} {
  const ratio = (a: number, b: number): number =>
    Number.isFinite(a) && Number.isFinite(b) && b !== 0 ? a / b : NaN;
  return {
    first: values.map(v => ratio(v, values[0])),
    previous: values.map((v, i) => (i ? ratio(v, values[i - 1]) : NaN)),
  };
}
