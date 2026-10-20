/**
    ParallelCoordinates dimensions: which data keys get an axis, whether each
    is numeric or categorical, and the domain each axis spans.
*/

import {extent} from "d3-array";

import type {DataPoint} from "@d3plus/data";

/** A numeric dimension reads on a linear (or log) axis; a categorical one on a point axis. */
export type DimensionType = "numeric" | "categorical";

/** Per-dimension options: any Axis config key, plus `reverse` and `title`. */
export interface DimensionOptions extends Record<string, unknown> {
  /** The axis domain. For a numeric axis, either end may be `undefined` to come from the data. */
  domain?: unknown[];
  /** Flips the axis, so its largest value (or last category) sits at the start. */
  reverse?: boolean;
  /** The label drawn above (or beside) the axis. Defaults to the dimension's key. */
  title?: string;
}

/** A dimension resolved for one draw. */
export interface ParallelDimension {
  key: string;
  title: string;
  type: DimensionType;
  /** Numeric: `[min, max]`. Categorical: every category, in axis order. */
  domain: (number | string)[];
  reverse: boolean;
}

/** Whether `v` reads as a finite number. */
export function isNumeric(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/** Whether `v` is missing (no axis position). */
export function isMissing(v: unknown): boolean {
  return v === undefined || v === null || v === "" || (typeof v === "number" && !Number.isFinite(v));
}

/**
    The data keys that hold a number in every row that has them, in the order
    they first appear. Keys in `exclude` and keys starting with an underscore
    (d3plus internals) are skipped.
*/
export function detectDimensions(rows: DataPoint[], exclude: string[] = []): string[] {
  const skip = new Set(exclude);
  const order: string[] = [];
  const numeric = new Map<string, boolean>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (skip.has(key) || key.startsWith("_")) continue;
      const v = row[key];
      if (!numeric.has(key)) {
        numeric.set(key, true);
        order.push(key);
      }
      if (!isMissing(v) && !isNumeric(v)) numeric.set(key, false);
    }
  }
  return order.filter(key => numeric.get(key) && rows.some(row => isNumeric(row[key])));
}

/** A dimension is numeric when each value present is a number; otherwise categorical. */
export function dimensionType(values: unknown[]): DimensionType {
  const present = values.filter(v => !isMissing(v));
  return present.length && present.every(isNumeric) ? "numeric" : "categorical";
}

/**
    The domain for a dimension's values. Numeric: the data's `[min, max]`,
    with either end replaced by `config.domain`'s when given. Categorical:
    `config.domain` when given, otherwise each distinct value sorted
    naturally (numbers by value, text alphabetically).
*/
export function dimensionDomain(
  values: unknown[],
  type: DimensionType,
  config: Pick<DimensionOptions, "domain"> = {},
): (number | string)[] {
  const user = Array.isArray(config.domain) ? config.domain : undefined;
  if (type === "numeric") {
    const [lo, hi] = extent(values.filter(isNumeric));
    const min = user && isNumeric(user[0]) ? user[0] : lo ?? 0;
    const max = user && isNumeric(user[user.length - 1]) ? (user[user.length - 1] as number) : hi ?? 0;
    return [min, max];
  }
  if (user) return user.map(String);
  const unique = Array.from(new Set(values.filter(v => !isMissing(v)).map(String)));
  return unique.sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));
}

/**
    Resolves every dimension for a draw: its type, domain, title, and
    direction. `shared` domains (small multiples with shared scales) win
    over the ones read from `rows`.
*/
export function resolveDimensions(
  keys: string[],
  rows: DataPoint[],
  config: Record<string, DimensionOptions | undefined> = {},
  shared?: Record<string, (number | string)[]>,
): ParallelDimension[] {
  return keys.map(key => {
    const opts = config[key] ?? {};
    const values = rows.map(row => row[key]);
    const type = opts.scale === "point" || opts.scale === "band"
      ? "categorical"
      : dimensionType(values);
    const domain = shared?.[key] ?? dimensionDomain(values, type, opts);
    return {
      key,
      title: typeof opts.title === "string" ? opts.title : key,
      type,
      domain,
      reverse: Boolean(opts.reverse),
    };
  });
}

/**
    The domains every small-multiple panel shares: each dimension's domain
    over all panels' rows together.
*/
export function sharedDomains(
  keys: string[],
  rows: DataPoint[],
  config: Record<string, DimensionOptions | undefined> = {},
): Record<string, (number | string)[]> {
  const out: Record<string, (number | string)[]> = {};
  for (const dim of resolveDimensions(keys, rows, config)) out[dim.key] = dim.domain;
  return out;
}

/**
    The line opacity for `count` rows when `lineOpacity` is `"auto"`: opaque
    up to 50 lines, then fading with the square root of the count so dense
    data reads as density, never below 0.1.
*/
export function autoLineOpacity(count: number): number {
  if (count <= 50) return 1;
  return Math.max(0.1, Math.round(Math.sqrt(50 / count) * 100) / 100);
}

/** `count` evenly spaced positions from `start` to `end` (one sits at the middle). */
export function axisPositions(count: number, start: number, end: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [(start + end) / 2];
  const step = (end - start) / (count - 1);
  return Array.from({length: count}, (_, i) => start + step * i);
}
