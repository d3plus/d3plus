/**
    Pareto's math: each category's total, its share of the grand total, and
    the running (cumulative) share once the categories are sorted largest
    first, with a `threshold` bucket ("Other") always last.

    @module
*/
import type {DataPoint} from "@d3plus/data";

/** A row accessor, as d3plus passes them. */
export type RowAccessor = (d: DataPoint, i: number) => unknown;

/** One category of a Pareto chart, in drawing order. */
export interface ParetoStep {
  /** The category (its discrete-axis value). */
  category: unknown;
  /** The category's comparison key (see `categoryKey`). */
  key: string;
  /** Its position along the category axis, largest first. */
  index: number;
  /** The category's total: the sum of its rows' values. */
  value: number;
  /** Its share of every category's total (0–1). */
  share: number;
  /** The running total through this category. */
  cumulative: number;
  /** The running total's share of every category's total (0–1). */
  cumulativeShare: number;
  /** Whether the category is a `threshold` bucket, which sorts last. */
  other: boolean;
}

/** The accessors `paretoSteps` reads. */
export interface ParetoAccessors {
  /** The discrete-axis value of each row. */
  category: RowAccessor;
  /** The numeric value of each row. */
  value: RowAccessor;
  /** Marks a `threshold` bucket's rows, which sort after every category. */
  other?: (d: DataPoint) => boolean;
  /**
      Orders the categories in place of largest-first, compared by each
      category's first row (a user's `xSort`/`ySort`).
  */
  order?: (a: DataPoint, b: DataPoint) => number;
}

/** A category's comparison key: dates by their time, everything else as text. */
export const categoryKey = (c: unknown): string =>
  c instanceof Date ? `${+c}` : `${c}`;

/** A row value as a number to sum: non-finite values count as 0. */
const amount = (v: unknown): number => {
  const n = typeof v === "number" ? v : Number.NaN;
  return Number.isFinite(n) ? n : 0;
};

/**
    The categories of `rows` in Pareto order: largest total first, any
    `threshold` bucket last, and ties in the order they first appear (or in
    the given `order`). Each
    step carries its total, its share of the grand total, and the running
    share through it, which ends at 1 (100%). With no positive grand total,
    every share is 0.
    @param rows The drawn rows.
    @param accessors How to read each row's category and value.
*/
export function paretoSteps(
  rows: DataPoint[],
  accessors: ParetoAccessors,
): ParetoStep[] {
  const {category, value, other, order} = accessors;
  const byKey = new Map<
    string,
    {
      category: unknown;
      value: number;
      other: boolean;
      first: number;
      row: DataPoint;
    }
  >();
  rows.forEach((d, i) => {
    const c = category(d, i);
    const key = categoryKey(c);
    const entry = byKey.get(key);
    const v = amount(value(d, i));
    const isOther = other ? other(d) : false;
    if (entry) {
      entry.value += v;
      entry.other = entry.other || isOther;
    } else
      byKey.set(key, {category: c, value: v, other: isOther, first: i, row: d});
  });
  const entries = Array.from(byKey, ([key, e]) => ({key, ...e})).sort(
    (a, b) =>
      (order
        ? order(a.row, b.row)
        : Number(a.other) - Number(b.other) || b.value - a.value) ||
      a.first - b.first,
  );
  const grand = entries.reduce((sum, e) => sum + e.value, 0);
  const ratio = (v: number) => (grand > 0 ? v / grand : 0);
  let running = 0;
  return entries.map((e, index) => {
    running += e.value;
    return {
      category: e.category,
      key: e.key,
      index,
      value: e.value,
      share: ratio(e.value),
      cumulative: running,
      cumulativeShare: ratio(running),
      other: e.other,
    };
  });
}

/**
    A category-axis comparator (as Plot's `xSort`/`ySort` take) placing rows
    in Pareto order. Rows of categories missing from `steps` sort last.
    @param steps The steps to order by, read when comparing.
    @param category Reads a row's category.
    @param reverse Runs the order backward: a vertical category axis lists its
    first category at the bottom, so its largest category sorts last.
*/
export function paretoComparator(
  steps: () => ParetoStep[],
  category: (d: DataPoint) => unknown,
  reverse = false,
): (a: DataPoint, b: DataPoint) => number {
  let cached: ParetoStep[] | undefined;
  let ranks = new Map<string, number>();
  const rank = (d: DataPoint) => {
    const list = steps();
    if (list !== cached) {
      cached = list;
      ranks = new Map(list.map(s => [s.key, s.index]));
    }
    return ranks.get(categoryKey(category(d))) ?? list.length;
  };
  return (a, b) => (reverse ? rank(b) - rank(a) : rank(a) - rank(b));
}
