/**
    Pure polar geometry shared by PolarArea and RadialBar: the value → radius
    mapping, equal-angle slots, stacked segments per slot, and pixel padding
    converted to an angle. Angles follow d3-shape's convention: radians, 0 at
    12 o'clock, increasing clockwise, so a point at angle `a` and radius `r`
    sits at `(r·sin a, −r·cos a)`.
*/

import {scaleLinear} from "d3-scale";

import {radarLevels} from "../Radar/levels.js";
import type {RadarLevels} from "../Radar/levels.js";

/** How values map onto radii: `"sqrt"` keeps area proportional to value. */
export type PolarScale = "sqrt" | "linear";

/** An angular slot: one category's share of the sweep. */
export interface PolarSlot {
  startAngle: number;
  endAngle: number;
  /** The slot's center angle. */
  angle: number;
}

/** One stacked segment's place in its slot, in value space. */
export interface PolarStackSegment {
  slot: number;
  /** Cumulative value where the segment starts. */
  y0: number;
  /** Cumulative value where the segment ends. */
  y1: number;
}

/** A `domain` setting: `[min, max]`, where either end may be left to the data. */
export type PolarDomainInput =
  [number | null | undefined, number | null | undefined] | undefined;

/**
    Maps `value` onto a radius between `inner` and `outer` for `domain`,
    clamped to the domain. `"linear"` spaces values evenly along the radius;
    `"sqrt"` spaces them by area, so the ring between `inner` and a value's
    radius covers an area proportional to how far the value is into the
    domain. A non-finite value maps to `inner`.
*/
export function polarRadius(
  value: number,
  domain: [number, number],
  inner: number,
  outer: number,
  scale: PolarScale = "sqrt",
): number {
  const span = domain[1] - domain[0];
  const t = Number.isFinite(value) && span ? (value - domain[0]) / span : 0;
  const k = Math.max(0, Math.min(1, t));
  if (scale === "linear") return inner + k * (outer - inner);
  return Math.sqrt(inner * inner + k * (outer * outer - inner * inner));
}

/**
    Splits the sweep from `start` (radians) over `sweep` radians into `count`
    equal slots, in order.
*/
export function polarSlots(
  count: number,
  start = 0,
  sweep = Math.PI * 2,
): PolarSlot[] {
  const n = Math.max(0, Math.floor(count));
  const step = n ? sweep / n : 0;
  return Array.from({length: n}, (_v, i) => ({
    startAngle: start + i * step,
    endAngle: start + (i + 1) * step,
    angle: start + (i + 0.5) * step,
  }));
}

/**
    Stacks values outward within their slots, in the order given: each
    segment starts where the previous segment in the same slot ended.
    Negative and non-finite values take no room.
*/
export function polarStack(
  values: {slot: number; value: number}[],
): PolarStackSegment[] {
  const tops = new Map<number, number>();
  return values.map(({slot, value}) => {
    const y0 = tops.get(slot) ?? 0;
    const y1 = y0 + (Number.isFinite(value) && value > 0 ? value : 0);
    tops.set(slot, y1);
    return {slot, y0, y1};
  });
}

/**
    The pad angle between neighboring wedges: `padAngle` (radians) when set,
    else the angle `padPixel` spans at `radius`.
*/
export function polarPadAngle(
  padAngle: number,
  padPixel: number,
  radius: number,
): number {
  if (padAngle > 0) return padAngle;
  return padPixel > 0 && radius > 0 ? padPixel / radius : 0;
}

/**
    The radial domain and gridline values: the data's nice domain and ticks
    (see `radarLevels`), with any end the user set in `domain` replacing the
    data's and the ticks recomputed for that range.
*/
export function polarLevels(
  values: number[],
  levels: number | number[],
  domain: PolarDomainInput = undefined,
): RadarLevels {
  const base = radarLevels(values, levels);
  const [userLo, userHi] = domain ?? [];
  const hasLo = typeof userLo === "number" && Number.isFinite(userLo);
  const hasHi = typeof userHi === "number" && Number.isFinite(userHi);
  if (!hasLo && !hasHi) return base;
  const lo = hasLo ? userLo : base.domain[0];
  const hi = hasHi ? userHi : base.domain[1];
  if (!(hi > lo)) return base;
  const ticks = Array.isArray(levels)
    ? base.ticks.filter(t => t >= lo && t <= hi)
    : scaleLinear()
        .domain([lo, hi])
        .ticks(Math.max(1, Math.round(levels)));
  return {domain: [lo, hi], ticks};
}

/**
    Resolves an `innerRadius` setting against the outer radius: a number is
    pixels, a function receives the outer radius. Clamped to `[0, outer)`.
*/
export function polarInnerRadius(setting: unknown, outer: number): number {
  const raw =
    typeof setting === "function"
      ? Number((setting as (outer: number) => unknown)(outer))
      : Number(setting);
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return Math.min(raw, outer * 0.95);
}
