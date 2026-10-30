/**
    A time scale whose domain skips hidden stretches of time (see
    `RangeBreakRule`): weekends, nights, holidays, or explicit ranges close
    up so the times on either side sit next to each other. A gap whose rule
    asks for a marker keeps a short fixed stretch of pixels, where an axis
    draws its break marker.
*/
import {bisectRight, quantile} from "d3-array";
import {scaleTime, scaleUtc} from "d3-scale";

import type {D3Scale} from "../../utils/index.js";
import {
  gapIndex,
  offsetVisible,
  rangeBreakGaps,
  visibleBetween,
  type RangeBreakRule,
  type TimeGap,
} from "./rangeBreaks.js";

/** Options for `brokenTimeScale`. */
export interface BrokenTimeScaleOptions {
  /** Read the rules' calendar in UTC instead of local time. */
  utc?: boolean;
  /** Pixels each marked gap inside the domain occupies (default 0). */
  space?: number;
}

/** A hidden stretch inside the scale's domain, with the pixels it occupies. */
export interface ScaleTimeGap extends TimeGap {
  /** Pixels the gap occupies: `space` for a marked gap, else 0. */
  space: number;
}

/** A continuous time scale whose mapping skips hidden time. */
export interface BrokenTimeScale extends D3Scale {
  /** The rules the scale hides time by. */
  rangeBreaks: RangeBreakRule[];
  /** The hidden stretches inside the domain, clipped to it, ascending. */
  gaps(): ScaleTimeGap[];
  /** Whether a time is hidden. */
  isHidden(t: number | Date): boolean;
  /** The visible time (ms) between two times, signed like `b - a`. */
  visible(a: number | Date, b: number | Date): number;
  /** The time `ms` of visible time after (or, when negative, before) `t`. */
  offset(t: number | Date, ms: number): Date;
  /** A d3 time tick format for the scale's domain. */
  tickFormat(count?: number, specifier?: string): (d: Date) => string;
}

/** Whether `scale` is a broken time scale. */
export const isBrokenTimeScale = (scale: unknown): scale is BrokenTimeScale =>
  typeof scale === "function" && "rangeBreaks" in scale;

/**
    The time between `a` and `b` on `scale` (`b - a`, in ms): on a broken
    time scale, only the time it shows.
*/
export const scaleTimeStep = (
  scale: unknown,
  a: number | Date,
  b: number | Date,
): number => (isBrokenTimeScale(scale) ? scale.visible(a, b) : +b - +a);

/**
    The time `ms` after `t` (before it, when negative) on `scale`: on a
    broken time scale, stepping over the time it hides.
*/
export const scaleTimeShift = (
  scale: unknown,
  t: number | Date,
  ms: number,
): Date => (isBrokenTimeScale(scale) ? scale.offset(t, ms) : new Date(+t + ms));

/** The layout of a domain over a range: its gaps and pixel rate. */
interface Layout {
  lo: number;
  hi: number;
  /** Pixel of `lo`, and the direction pixels run as time grows. */
  start: number;
  dir: number;
  /** Pixels the whole domain spans. */
  length: number;
  /** Pixels per visible ms (0 when nothing is visible). */
  rate: number;
  /** The gaps overlapping the domain, unclipped. */
  all: TimeGap[];
  /** The gaps inside the domain, clipped to it. */
  gaps: ScaleTimeGap[];
  /** Pixel offset (from `start`) of each clipped gap's start. */
  at: number[];
  /** Whether nothing between `lo` and `hi` is visible. */
  empty: boolean;
}

function layout(
  rules: RangeBreakRule[],
  domain: number[],
  range: number[],
  utc: boolean,
  space: number,
): Layout {
  const [d0, d1] = domain;
  const lo = Math.min(d0, d1);
  const hi = Math.max(d0, d1);
  const [r0, r1] = range;
  const start = d0 <= d1 ? r0 : r1;
  const end = d0 <= d1 ? r1 : r0;
  const dir = Math.sign(end - start) || 1;
  const length = Math.abs(end - start);
  const all = rangeBreakGaps(rules, lo, hi, utc);
  const clipped = all
    .map(g => ({...g, start: Math.max(g.start, lo), end: Math.min(g.end, hi)}))
    .filter(g => g.end > g.start);
  const marked = clipped.filter(g => g.marker && g.start > lo && g.end < hi);
  // Marked gaps keep their space while it leaves the data twice that room.
  const room = length - marked.length * space >= space * 2 ? space : 0;
  const gaps: ScaleTimeGap[] = clipped.map(g => ({
    ...g,
    space: g.marker && g.start > lo && g.end < hi ? room : 0,
  }));
  const hidden = gaps.reduce((s, g) => s + g.end - g.start, 0);
  const visibleMs = hi - lo - hidden;
  const spaced = gaps.reduce((s, g) => s + g.space, 0);
  const empty = !(visibleMs > 0);
  const rate = empty ? 0 : (length - spaced) / visibleMs;
  const at: number[] = [];
  let seen = lo,
    px = 0;
  gaps.forEach(g => {
    px += (g.start - seen) * rate;
    at.push(px);
    px += g.space;
    seen = g.end;
  });
  return {lo, hi, start, dir, length, rate, all, gaps, at, empty};
}

/** Pixel offset of a time from the domain's low end. */
function offsetOf(
  lay: Layout,
  rules: RangeBreakRule[],
  utc: boolean,
  t: number,
): number {
  const {lo, hi, length, rate, gaps, at} = lay;
  if (t < lo) return -visibleBetween(rules, t, lo, utc) * rate;
  if (t > hi) return length + visibleBetween(rules, hi, t, utc) * rate;
  const i = gapIndex(gaps, t);
  if (i < 0) return (t - lo) * rate;
  const g = gaps[i];
  if (t < g.end) return at[i] + (g.space * (t - g.start)) / (g.end - g.start);
  return at[i] + g.space + (t - g.end) * rate;
}

/** The time at a pixel; a closed gap's pixel reads as the time after it. */
function invertAt(
  lay: Layout,
  rules: RangeBreakRule[],
  utc: boolean,
  px: number,
): Date {
  const {lo, hi, start, dir, rate, gaps, at, empty} = lay;
  if (empty || !rate) return new Date(lo);
  const o = (px - start) * dir;
  if (o < 0) return new Date(offsetVisible(rules, lo, o / rate, utc));
  const i = bisectRight(at, o) - 1;
  let t: number;
  if (i < 0) t = lo + o / rate;
  else {
    const g = gaps[i];
    const into = o - at[i];
    t =
      into < g.space
        ? g.start + (into / g.space) * (g.end - g.start)
        : g.end + (into - g.space) / rate;
  }
  // Past the last gap, time beyond `hi` steps over the rules' gaps.
  return new Date(t > hi ? offsetVisible(rules, hi, t - hi, utc) : t);
}

/**
    About `count` tick times (ms, ascending) for a laid-out domain, none of
    them hidden: d3's time ticks, asked for more as more time is hidden,
    with each tick inside a gap moved to the gap's end.
*/
function layoutTicks(
  lay: Layout,
  count: number,
  time: {ticks(count: number): Date[]},
  scale: BrokenTimeScale,
): number[] {
  const {lo, hi, all, gaps, empty} = lay;
  // A single shown time ticks itself, as d3's time scale does.
  if (empty) return lo === hi && !scale.isHidden(lo) ? [lo] : [];
  const visibleMs = hi - lo - gaps.reduce((s, g) => s + g.end - g.start, 0);
  const asked = Math.max(1, Math.round((count * (hi - lo)) / visibleMs));
  const base = time.ticks(asked).map(Number);
  const ticks = new Map<number, boolean>();
  for (const tick of base) {
    const i = gapIndex(all, tick);
    const moved = i >= 0 && tick < all[i].end;
    const t = moved ? all[i].end : tick;
    if (t <= hi) ticks.set(t, moved || ticks.get(t) === true);
  }
  // A moved tick opens a stretch of shown time (a day after a night, a
  // week after a weekend), so a plain tick crowding it gives way.
  const steps = base.slice(1).map((t, k) => t - base[k]);
  const half = steps.length ? quantile(steps, 0.5)! / 2 : 0;
  const moved = [...ticks].filter(([, m]) => m).map(([t]) => t);
  return [...ticks]
    .filter(
      ([t, m]) => m || !moved.some(o => Math.abs(scale.visible(o, t)) < half),
    )
    .map(([t]) => t)
    .sort((a, b) => a - b);
}

/**
    Builds a time scale that hides the time `rules` describe. It reads like
    d3's `scaleTime` — `domain`, `range`, `ticks`, `tickFormat`, `invert`,
    and `copy` — but visible time shares one pixel rate and hidden time
    takes none (or a marked gap's `space`). A hidden time maps to where its
    gap sits; a pixel at a closed gap inverts to the time after it. Times
    past the domain extrapolate through the rules' gaps, so a scale can be
    padded or zoomed out.
*/
export function brokenTimeScale(
  rules: RangeBreakRule[],
  options: BrokenTimeScaleOptions = {},
): BrokenTimeScale {
  const utc = Boolean(options.utc);
  const space = Math.max(0, options.space ?? 0);
  let domain: number[] = [+new Date(2000, 0, 1), +new Date(2000, 0, 2)];
  let range: number[] = [0, 1];
  let lay = layout(rules, domain, range, utc, space);
  const rebuild = () => {
    lay = layout(rules, domain, range, utc, space);
  };

  const scale = ((value: number | string | Date) => {
    const t = +value;
    if (!Number.isFinite(t)) return NaN;
    const {start, dir, empty} = lay;
    if (empty) return (range[0] + range[1]) / 2;
    return start + dir * offsetOf(lay, rules, utc, t);
  }) as BrokenTimeScale;

  scale.rangeBreaks = rules;
  scale.domain = ((d?: Iterable<number | string | Date>) => {
    if (d === undefined) return domain.map(t => new Date(t));
    domain = Array.from(d, v => +v).slice(0, 2);
    rebuild();
    return scale;
  }) as BrokenTimeScale["domain"];
  scale.range = ((r?: Iterable<number>) => {
    if (r === undefined) return range.slice();
    range = Array.from(r, Number).slice(0, 2);
    rebuild();
    return scale;
  }) as BrokenTimeScale["range"];
  scale.copy = () =>
    brokenTimeScale(rules, options).domain(domain).range(range);

  scale.invert = ((px: number) =>
    invertAt(lay, rules, utc, px)) as unknown as BrokenTimeScale["invert"];

  scale.gaps = () => lay.gaps.map(g => ({...g}));
  scale.isHidden = value => {
    const t = +value;
    const {lo, hi, all} = lay;
    if (t < lo || t > hi)
      return rangeBreakGaps(rules, t, t, utc).some(
        g => g.start <= t && t < g.end,
      );
    const i = gapIndex(all, t);
    return i >= 0 && t < all[i].end;
  };
  scale.visible = (a, b) => {
    const x = +a,
      y = +b;
    return x <= y
      ? visibleBetween(rules, x, y, utc)
      : -visibleBetween(rules, y, x, utc);
  };
  scale.offset = (t, ms) => new Date(offsetVisible(rules, +t, ms, utc));

  const timeScale = () =>
    (utc ? scaleUtc : scaleTime)().domain([lay.lo, lay.hi]);

  scale.ticks = ((count = 10) => {
    const out = layoutTicks(lay, count, timeScale(), scale).map(
      t => new Date(t),
    );
    if (domain[0] > domain[1]) out.reverse();
    return out;
  }) as unknown as BrokenTimeScale["ticks"];
  scale.tickFormat = (count, specifier) =>
    timeScale().tickFormat(count, specifier);

  return scale;
}
