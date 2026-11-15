/**
    Wilkinson's dot-density layout (Wilkinson 1999, "Dot Plots"): values are
    swept in order into stacks no wider than one dot, each stack drawn at the
    mean of its values, its dots piled up from a baseline (or centered on it).
    Pure and deterministic: the same values always give the same stacks.
*/

/** Where a stack's dots pile: up from the baseline, or centered on it. */
export type StackDirection = "up" | "center";

/** The smallest dot diameter the auto size shrinks to, in pixels. */
export const MIN_DOT_DIAMETER = 2;
/** The largest dot diameter the auto size grows to, in pixels. */
export const MAX_DOT_DIAMETER = 20;

/**
    Sweeps `values` into Wilkinson stacks: the smallest value opens a stack,
    every value less than `width` past it joins, and the first value at or
    beyond that opens the next. Returns each stack's indices into `values`,
    ascending by value (ties in input order). Non-finite values are left
    out.
    @param values The values to stack.
    @param width The bin width, in the values' units.
*/
export function wilkinsonStacks(values: number[], width: number): number[][] {
  const order = values
    .map((_, i) => i)
    .filter(i => Number.isFinite(values[i]))
    .sort((a, b) => values[a] - values[b] || a - b);
  const stacks: number[][] = [];
  let start = -Infinity;
  for (const i of order) {
    if (stacks.length && values[i] - start < width)
      stacks[stacks.length - 1].push(i);
    else {
      start = values[i];
      stacks.push([i]);
    }
  }
  return stacks;
}

/**
    Each stack's position: the mean of its values.
    @param values The stacked values.
    @param stacks The stacks, as indices into `values`.
*/
export function stackCenters(values: number[], stacks: number[][]): number[] {
  return stacks.map(
    stack => stack.reduce((sum, i) => sum + values[i], 0) / stack.length,
  );
}

/**
    The tallest stack's dot count when `values` are stacked `width` wide.
    @param values The values to stack.
    @param width The bin width, in the values' units.
*/
export function tallestStack(values: number[], width: number): number {
  return wilkinsonStacks(values, width).reduce(
    (most, stack) => Math.max(most, stack.length),
    0,
  );
}

/** Options for `fitDotDiameter`. */
export interface DotFitOptions {
  /** The room each stack may fill across the value axis, in pixels. */
  extent: number;
  /** The smallest diameter to use (default `MIN_DOT_DIAMETER`). */
  min?: number;
  /** The largest diameter to use (default `MAX_DOT_DIAMETER`). */
  max?: number;
}

/**
    The largest dot diameter (in pixels, between `min` and `max`) at which
    every lane's tallest stack fits within `extent`, when each lane's pixel
    positions are stacked one diameter wide. Larger dots make wider bins, so
    the stacks grow taller as the dots grow; the diameter is found by
    bisection. `min` when even the smallest dots overflow.
    @param lanes Each lane's dot positions along the value axis, in pixels.
    @param options The room to fill and the diameter bounds.
*/
export function fitDotDiameter(
  lanes: number[][],
  options: DotFitOptions,
): number {
  const min = options.min ?? MIN_DOT_DIAMETER;
  const max = Math.max(
    min,
    Math.min(options.max ?? MAX_DOT_DIAMETER, options.extent),
  );
  const fits = (d: number) =>
    lanes.every(lane => tallestStack(lane, d) * d <= options.extent);
  if (fits(max)) return max;
  if (!fits(min)) return min;
  let lo = min,
    hi = max;
  for (let step = 0; step < 24 && hi - lo > 0.01; step++) {
    const mid = (lo + hi) / 2;
    if (fits(mid)) lo = mid;
    else hi = mid;
  }
  return lo;
}

/**
    Each dot's offset across the value axis, from the baseline, for a stack
    of `count` dots `diameter` apart: `"up"` piles the first dot's center
    half a diameter off the baseline and each next one a diameter further,
    and `"center"` spreads them evenly around it.
    @param count The stack's dot count.
    @param diameter The distance between dot centers.
    @param direction Where the dots pile.
*/
export function stackOffsets(
  count: number,
  diameter: number,
  direction: StackDirection = "up",
): number[] {
  return Array.from({length: count}, (_, k) =>
    direction === "center"
      ? (k - (count - 1) / 2) * diameter
      : (k + 0.5) * diameter,
  );
}

/** Orders group keys as the default legend does: natural, case-aware text order. */
const naturalOrder = (a: unknown, b: unknown): number =>
  `${a}`.localeCompare(`${b}`, undefined, {numeric: true});

/**
    A comparator that orders rows by their group path, level by level, each
    level's keys in natural text order (the default legend's order), so
    every stack lists its groups in the same order and their colors band
    across the stacks. Rows with no key at a level come first.
    @param paths Each row's group path (e.g. its groupBy ids, top level
    first).
*/
export function groupOrder(
  paths: unknown[][],
): (a: number, b: number) => number {
  const ranks: Map<unknown, number>[] = [];
  const depth = Math.max(0, ...paths.map(p => p.length));
  for (let level = 0; level < depth; level++) {
    const keys = Array.from(new Set(paths.map(p => p[level])))
      .filter(k => k !== undefined && k !== null)
      .sort(naturalOrder);
    ranks.push(new Map(keys.map((k, i) => [k, i])));
  }
  return (a, b) => {
    const pa = paths[a],
      pb = paths[b];
    for (let level = 0; level < depth; level++) {
      const diff =
        (ranks[level].get(pa[level]) ?? -1) -
        (ranks[level].get(pb[level]) ?? -1);
      if (diff) return diff;
    }
    return 0;
  };
}

/**
    One row per dot: each row whose `value` is `per` or more becomes
    `round(value / per)` copies of itself (rows that round to no dots are
    left out). Returns the copies and, for each, the row it came from.
    @param rows The rows.
    @param value Each row's value.
    @param per What one dot stands for, in the value's units.
*/
export function expandPer<T extends object>(
  rows: T[],
  value: (d: T, i: number) => unknown,
  per: number,
): {rows: T[]; source: Map<T, T>} {
  const out: T[] = [];
  const source = new Map<T, T>();
  rows.forEach((d, i) => {
    const count = Math.round(Number(value(d, i)) / per);
    if (!Number.isFinite(count)) return;
    for (let k = 0; k < count; k++) {
      const copy = {...d};
      out.push(copy);
      source.set(copy, d);
    }
  });
  return {rows: out, source};
}
