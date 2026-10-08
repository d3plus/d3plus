/**
    Piecewise ("broken") linear scales for axis breaks. A break removes a value
    range from the axis and draws it as a fixed pixel gap; the values that
    remain keep one shared pixels-per-unit rate. The automatic baseline break
    is the edge case of the same idea: the range from the baseline to the
    domain sits just outside the domain, at the baseline end of the axis.
*/
import {scaleLinear} from "d3-scale";

import type {D3Scale} from "../../utils/index.js";

/** A value range removed from an axis, `[start, end]` with `start < end`. */
export type BreakRange = [number, number];

/** The baseline end of a broken axis (see `resolveBaselineBreak`). */
export interface ScaleEdgeBreak {
  /** The baseline value, drawn at the axis end. */
  value: number;
  /** Pixel position of the baseline (the axis end). */
  position: number;
  /** The domain bound nearest the baseline: the first value after the break. */
  edge: number;
  /** Pixel position of `edge`. */
  edgePosition: number;
}

/** Everything a broken scale is built from. */
export interface BrokenScaleSpec {
  /** The axis domain (2 values, in the axis's orientation). */
  domain: number[];
  /** The pixel range the domain spans, matching `domain`'s orientation. */
  range: number[];
  /** Normalized interior breaks (see `normalizeBreaks`), ascending. */
  breaks: BreakRange[];
  /** Pixels each interior break occupies. */
  space: number;
  /** The baseline break at the axis end, if any. */
  edge?: ScaleEdgeBreak | null;
}

/** One unbroken stretch of a broken scale: its values and their pixels. */
export interface ScaleSegment {
  domain: [number, number];
  range: [number, number];
}

/** A continuous scale whose mapping skips its breaks. */
export interface BrokenScale extends D3Scale {
  /** The spec the scale was built from. */
  brokenSpec: BrokenScaleSpec;
  /** The unbroken stretches of the domain, in the domain's orientation. */
  segments(): ScaleSegment[];
}

/** Whether `scale` is a broken scale. */
export const isBrokenScale = (scale: unknown): scale is BrokenScale =>
  typeof scale === "function" && "brokenSpec" in scale;

/**
    Reads a break setting — a single `[start, end]`, a list of them, or a
    falsy value — into sorted, merged ranges that lie strictly inside the
    `[lo, hi]` domain. Reversed pairs are flipped; empty, non-numeric, and
    out-of-domain ranges (including any that would swallow a domain end) are
    dropped.
*/
export function normalizeBreaks(input: unknown, lo: number, hi: number): BreakRange[] {
  if (!Array.isArray(input) || !input.length) return [];
  const list = (Array.isArray(input[0]) ? input : [input]) as unknown[];
  const ranges = list
    .filter((b): b is unknown[] => Array.isArray(b) && b.length === 2)
    .map(b => b.map(Number))
    .filter(b => b.every(Number.isFinite) && b[0] !== b[1])
    .map(b => (b[0] < b[1] ? [b[0], b[1]] : [b[1], b[0]]) as BreakRange)
    .sort((a, b) => a[0] - b[0]);
  const merged: BreakRange[] = [];
  for (const b of ranges) {
    const last = merged[merged.length - 1];
    if (last && b[0] <= last[1]) last[1] = Math.max(last[1], b[1]);
    else merged.push([b[0], b[1]]);
  }
  return merged.filter(([a, b]) => a > lo && b < hi);
}

/** The value → pixel breakpoints of the interior breaks, ascending by value. */
function breakpoints(spec: BrokenScaleSpec): {values: number[]; pixels: number[]} {
  const [d0, d1] = spec.domain;
  const lo = Math.min(d0, d1);
  const hi = Math.max(d0, d1);
  const rLo = d0 <= d1 ? spec.range[0] : spec.range[1];
  const rHi = d0 <= d1 ? spec.range[1] : spec.range[0];
  const sign = Math.sign(rHi - rLo) || 1;
  const removed = spec.breaks.reduce((s, [a, b]) => s + b - a, 0);
  const rate = (Math.abs(rHi - rLo) - spec.breaks.length * spec.space) / (hi - lo - removed);
  const values = [lo];
  const pixels = [rLo];
  let prev = lo;
  for (const [a, b] of spec.breaks) {
    const pa = pixels[pixels.length - 1] + sign * rate * (a - prev);
    values.push(a, b);
    pixels.push(pa, pa + sign * spec.space);
    prev = b;
  }
  values.push(hi);
  pixels.push(rHi);
  return {values, pixels};
}

/**
    Builds a broken scale. It reports `domain()`/`range()` as given — so it
    reads like the plain linear scale it replaces — while mapping values
    through the breaks: each interior break spans `space` pixels, and values
    past the domain on the baseline side run through the edge break.
*/
export function brokenScale(spec: BrokenScaleSpec): BrokenScale {
  let {values, pixels} = breakpoints(spec);
  let poly = scaleLinear().domain(values).range(pixels);

  const edgeMap = (v: number): number | undefined => {
    const e = spec.edge;
    if (!e) return undefined;
    const t = (v - e.value) / (e.edge - e.value);
    if (!(t < 1)) return undefined;
    if (t <= 0) return e.position;
    return e.position + t * (e.edgePosition - e.position);
  };

  const scale = ((v: number | string | Date) => {
    const n = +v;
    const edged = edgeMap(n);
    return edged !== undefined ? edged : poly(n);
  }) as BrokenScale;

  const rebuild = () => {
    ({values, pixels} = breakpoints(spec));
    poly = scaleLinear().domain(values).range(pixels);
  };

  scale.brokenSpec = spec;
  scale.domain = ((d?: Iterable<number | string | Date>) => {
    if (d === undefined) return spec.domain.slice();
    spec.domain = Array.from(d, Number);
    rebuild();
    return scale;
  }) as BrokenScale["domain"];
  scale.range = ((r?: Iterable<number>) => {
    if (r === undefined) return spec.range.slice();
    spec.range = Array.from(r, Number);
    rebuild();
    return scale;
  }) as BrokenScale["range"];
  scale.copy = () => brokenScale({...spec, breaks: spec.breaks.map(b => [b[0], b[1]] as BreakRange)});
  scale.invert = (px: number) => {
    const e = spec.edge;
    if (e) {
      const t = (px - e.position) / (e.edgePosition - e.position);
      if (t <= 0) return e.value;
      if (t < 1) return e.value + t * (e.edge - e.value);
    }
    return poly.invert(px);
  };
  scale.segments = () => {
    const out: ScaleSegment[] = [];
    for (let i = 0; i < values.length; i += 2)
      out.push({domain: [values[i], values[i + 1]], range: [pixels[i], pixels[i + 1]]});
    const descending = spec.domain[0] > spec.domain[1];
    return descending
      ? out.reverse().map(s => ({domain: [s.domain[1], s.domain[0]], range: [s.range[1], s.range[0]]}))
      : out;
  };
  scale.ticks = (count?: number) => {
    const ticks = scaleLinear().domain([values[0], values[values.length - 1]]).ticks(count);
    return ticks.filter(t => !spec.breaks.some(([a, b]) => t > a && t < b));
  };
  return scale;
}

/**
    Tick values for a broken scale: each unbroken segment is ticked as its
    own small axis (via `segmentTicks`, which sees a plain linear scale over
    that segment), then both edges of every interior break are added so each
    side of a break is labeled.
*/
export function brokenScaleTicks(
  scale: BrokenScale,
  segmentTicks: (segment: D3Scale) => unknown[],
): unknown[] {
  const seen = new Set<number>();
  const out: unknown[] = [];
  const add = (v: unknown) => {
    const n = Number(v);
    if (!seen.has(n)) {
      seen.add(n);
      out.push(v);
    }
  };
  for (const s of scale.segments()) {
    const segment = scaleLinear().domain(s.domain).range(s.range) as unknown as D3Scale;
    segmentTicks(segment).forEach(add);
  }
  scale.brokenSpec.breaks.forEach(([a, b]) => {
    add(a);
    add(b);
  });
  return out;
}
