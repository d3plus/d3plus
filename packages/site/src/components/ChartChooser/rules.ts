import type {Column} from "./columns.js";
import type {Traits} from "./traits.js";
import {pickCategory} from "./traits.js";

/**
 * One requirement a branch or chart makes of the data: met, with what met
 * it (`"month is a date"`), or unmet, with what's missing (`"needs a date
 * column"`).
 */
export interface Check {
  ok: boolean;
  text: string;
}
export type Rule = (t: Traits) => Check;

/** A rule met when `test` returns a description of what met it. */
export function rule(
  missing: string | ((t: Traits) => string),
  test: (t: Traits) => string | false | undefined | null,
): Rule {
  return t => {
    const found = test(t);
    if (found) return {ok: true, text: found};
    return {
      ok: false,
      text: typeof missing === "string" ? missing : missing(t),
    };
  };
}

/** A column's name, quoted, for rule descriptions. */
export const q = (c: Column) => `“${c.key}”`;

/** The sum of a number column over every row. */
export function total(t: Traits, col: Column): number {
  return t.rows.reduce((sum, r) => {
    const v = r[col.key];
    return sum + (typeof v === "number" ? v : 0);
  }, 0);
}

export const hasValue = rule("needs a numeric column", t =>
  t.value ? `${q(t.value)} is a number` : null,
);

export const nonNegative = rule(
  "needs values that are all zero or more",
  t => t.value && (t.value.min ?? 0) >= 0 && `${q(t.value)} is never negative`,
);

/** A category with 2 to `max` values. */
export const categoryUpTo = (max: number, label = "categories") =>
  rule(
    t => {
      const finest = pickCategory(t);
      return finest
        ? `works best with ${max} or fewer ${label} (${q(finest)} has ${finest.unique})`
        : "needs a category column";
    },
    t => {
      const c = pickCategory(t, max);
      return c && `${q(c)} has ${c.unique} values`;
    },
  );

/** The items a headline chart would show: one per row, or per series over time. */
export const headlineItems = (t: Traits) =>
  t.date ? (t.series?.unique ?? 1) : t.rows.length;

export const headline = rule(
  t =>
    !t.value
      ? "needs a numeric column"
      : headlineItems(t) > 6
        ? `needs a handful of values (6 or fewer; yours has ${headlineItems(t)})`
        : "needs a category naming each value",
  t =>
    t.value &&
    headlineItems(t) <= 6 &&
    (t.rows.length === 1 || !!t.date || t.categories.length > 0) &&
    `${headlineItems(t)} value${headlineItems(t) === 1 ? "" : "s"} of ${q(t.value)}`,
);

export const hasCategory = rule(
  "needs a category column with 2 or more values",
  t => {
    const c = pickCategory(t);
    return c && `${q(c)} is a category`;
  },
);

export const oneRowEach = rule(
  "needs a category naming each row once (yours repeat)",
  t => t.item && `one row per ${q(t.item)}`,
);

export const hasDate = rule(
  "needs a date column (2024-03-01, 2024-03, 2024 Q1, or a year)",
  t => t.date && `${q(t.date)} is a date`,
);

export const numbersAtLeast = (n: number) =>
  rule(`needs ${n} or more numeric columns`, t =>
    t.numbers.length >= n
      ? t.numbers.slice(0, n).map(q).join(", ") + " are numbers"
      : null,
  );

export const rowsAtLeast = (n: number, why: string) =>
  rule(
    t => `needs ${n} or more rows ${why} (yours has ${t.rows.length})`,
    t => t.rows.length >= n && `${t.rows.length} rows`,
  );

export const rowsAtMost = (n: number) =>
  rule(
    t => `works best with ${n} or fewer rows (yours has ${t.rows.length})`,
    t => t.rows.length <= n && `${t.rows.length} rows`,
  );

export const hasSeries = rule(
  "needs a category splitting the rows into series",
  t =>
    t.series && `${q(t.series)} splits the rows into ${t.series.unique} series`,
);

export const hasGroups = rule(
  "needs a category splitting the rows into 2–12 groups of 5 or more",
  t =>
    t.groups && `${q(t.groups)} splits the rows into ${t.groups.unique} groups`,
);
