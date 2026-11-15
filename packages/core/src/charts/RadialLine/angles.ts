/**
    The angular axis of RadialLine and RadialArea: where each `x` value sits
    around the circle, and which values the axis labels. Angles follow
    d3-shape's convention: radians, 0 at 12 o'clock, increasing clockwise.

    Numbers spread around the circle by value, over a period that ends where
    it starts (hours over `[0, 24]`, so 23 sits just before 0). Any other
    values (names, dates) are categories, spaced evenly in order.
*/

import {scaleLinear} from "d3-scale";

const TAU = Math.PI * 2;

/** The most `x` values the angular axis labels before it thins them to round values. */
export const RADIAL_MAX_TICKS = 24;

/** One labeled position on the angular axis. */
export interface RadialTick {
  /** The value's key (see `radialKey`). */
  key: string;
  /** The `x` value. */
  value: unknown;
  /** Its angle, in radians. */
  angle: number;
}

/** Where `x` values sit around the circle. */
export interface RadialAngleScale {
  /** Whether `x` values spread by value (numbers) rather than as categories. */
  continuous: boolean;
  /** The labeled positions, in angle order. */
  ticks: RadialTick[];
  /** The angle (radians) of an `x` value, or undefined for a value off the axis. */
  angleOf: (x: unknown) => number | undefined;
  /** The categories, in order (empty for a continuous axis). */
  categories: unknown[];
  /** The `[start, end]` a continuous axis wraps over (undefined for categories). */
  period?: [number, number];
}

/** Options for `radialAngleScale`. */
export interface RadialAngleOptions {
  /** Where the axis starts, in radians clockwise from 12 o'clock. */
  start?: number;
  /** Whether values advance clockwise (default) or counterclockwise. */
  clockwise?: boolean;
  /**
      For numbers, the `[start, end]` period the circle spans (either end may
      be undefined to come from the data); for categories, the categories
      to show, in order.
  */
  domain?: unknown[];
  /** The most values to label before thinning (default `RADIAL_MAX_TICKS`). */
  maxTicks?: number;
}

/** A value's identity on the axis: a date by its time, anything else as text. */
export function radialKey(value: unknown): string {
  return value instanceof Date ? `${value.getTime()}` : `${value}`;
}

/** Whether every value is a finite number (and there is at least one). */
const allNumbers = (values: unknown[]): values is number[] =>
  values.length > 0 &&
  values.every(v => typeof v === "number" && Number.isFinite(v));

/**
    The period a continuous axis wraps over: `domain`'s ends where set, else
    the data's minimum, and its maximum plus one step (the smallest gap
    between neighboring values), so the last value sits one step short of
    the first.
*/
export function radialPeriod(
  values: number[],
  domain: unknown[] = [],
): [number, number] {
  const sorted = Array.from(new Set(values)).sort((a, b) => a - b);
  const gaps = sorted.slice(1).map((v, k) => v - sorted[k]);
  const step = gaps.length ? Math.min(...gaps) : 1;
  const [userLo, userHi] = domain;
  const lo =
    typeof userLo === "number" && Number.isFinite(userLo)
      ? userLo
      : (sorted[0] ?? 0);
  const hi =
    typeof userHi === "number" && Number.isFinite(userHi)
      ? userHi
      : (sorted[sorted.length - 1] ?? lo) + step;
  return hi > lo ? [lo, hi] : [lo, lo + step];
}

/** Every `stride`th entry, starting with the first, so at most `max` remain. */
export function radialThin<T>(items: T[], max: number): T[] {
  if (items.length <= max || max < 1) return items;
  const stride = Math.ceil(items.length / max);
  return items.filter((_v, k) => k % stride === 0);
}

/** The categories in axis order: `domain` when given, else dates by time and anything else as first seen. */
function categoriesOf(values: unknown[], domain: unknown[] | undefined) {
  if (domain && domain.length) {
    const seen = new Set<string>();
    return domain.filter(v => {
      const key = radialKey(v);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  const byKey = new Map<string, unknown>();
  for (const v of values) {
    const key = radialKey(v);
    if (!byKey.has(key)) byKey.set(key, v);
  }
  const unique = Array.from(byKey.values());
  return unique.length && unique.every(v => v instanceof Date)
    ? (unique as Date[]).sort((a, b) => a.getTime() - b.getTime())
    : unique;
}

/**
    Lays the `x` values around the circle. Numbers spread by value over
    their period (see `radialPeriod`) and are labeled at each value, or at
    round values when there are more than `maxTicks`; categories each get an
    even share of the circle, the first at `start`, and are thinned to
    every few once there are more than `maxTicks`.
*/
export function radialAngleScale(
  values: unknown[],
  opts: RadialAngleOptions = {},
): RadialAngleScale {
  const start = opts.start ?? 0;
  const dir = opts.clockwise === false ? -1 : 1;
  const max = opts.maxTicks ?? RADIAL_MAX_TICKS;
  const present = values.filter(v => v !== undefined && v !== null);

  if (allNumbers(present)) {
    const period = radialPeriod(present, opts.domain);
    const [lo, hi] = period;
    const angleOf = (x: unknown): number | undefined => {
      const v = typeof x === "number" ? x : Number.NaN;
      if (!Number.isFinite(v)) return undefined;
      // Values outside the period wrap around it.
      const t = (((v - lo) / (hi - lo)) % 1) + 1;
      return start + dir * (t % 1) * TAU;
    };
    const unique = Array.from(new Set(present)).sort((a, b) => a - b);
    const tickValues =
      unique.length <= max
        ? unique
        : scaleLinear()
            .domain([lo, hi])
            .ticks(Math.max(2, Math.round(max / 2)))
            .filter(v => v >= lo && v < hi);
    return {
      continuous: true,
      ticks: tickValues.map(value => ({
        key: radialKey(value),
        value,
        angle: angleOf(value)!,
      })),
      angleOf,
      categories: [],
      period,
    };
  }

  const categories = categoriesOf(present, opts.domain);
  const index = new Map(categories.map((v, k) => [radialKey(v), k]));
  const n = categories.length;
  const angleOf = (x: unknown): number | undefined => {
    const k = index.get(radialKey(x));
    return k === undefined ? undefined : start + (dir * k * TAU) / n;
  };
  return {
    continuous: false,
    ticks: radialThin(categories, max).map(value => ({
      key: radialKey(value),
      value,
      angle: angleOf(value)!,
    })),
    angleOf,
    categories,
  };
}
