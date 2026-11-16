/**
    A function in `groupBy` reads a row's fields, but merging rows (for the
    legend, a Treemap's group headers, a threshold bucket, …) sums their
    numbers and lists their strings, so the function read on a merged row
    can name another group. Each merged row keeps the value the function
    gave its rows, under a key of its own (`groupLevelKey`), and the
    accessor `groupBy` installs reads it back.
*/
import type {DataPoint} from "@d3plus/data";
import {unique} from "@d3plus/data";

import {INTERNAL_KEY_PREFIX} from "../features/shareKey.js";

type Accessor = (d: DataPoint, i: number) => DataPoint[keyof DataPoint];

/** The row key a merged row keeps groupBy level `level`'s value under. */
export const groupLevelKey = (level: number): string =>
  `${INTERNAL_KEY_PREFIX}GroupBy${level}`;

/** The accessors `groupLevelAccessor` made. */
const levelAccessors = new WeakSet<Accessor>();

/** One value when every item is the same, else the unique items. */
function collapse(values: unknown[]): DataPoint[keyof DataPoint] {
  const flat = unique(values.flat());
  return (flat.length === 1 ? flat[0] : flat) as DataPoint[keyof DataPoint];
}

/**
    The accessor `groupBy` installs for a function at level `level`: the
    value a merged row kept for the level, else the function's.
    @param fn The user's function.
    @param level Its groupBy level.
*/
export function groupLevelAccessor(fn: Accessor, level: number): Accessor {
  const key = groupLevelKey(level);
  const accessor: Accessor = (d, i) =>
    d && typeof d === "object" && key in d ? d[key] : fn(d, i);
  levelAccessors.add(accessor);
  return accessor;
}

/**
    The `aggs` entry that merges a level's kept values: the one they share,
    else the unique ones.
    @param rows The rows being merged.
    @param value Reads a row's kept value.
*/
export function groupLevelAgg(
  rows: DataPoint[],
  value: (d: DataPoint) => DataPoint[keyof DataPoint],
): DataPoint[keyof DataPoint] {
  return collapse(rows.map(value));
}

/**
    Keeps on `merged` the value each function in `groupBy` gives `leaves`,
    the rows it merges.
    @param groupBy The chart's groupBy accessors.
    @param merged The merged row.
    @param leaves The rows it merges.
    @param index Each leaf's index in the chart's data.
*/
export function keepGroupLevels(
  groupBy: Accessor[],
  merged: DataPoint,
  leaves: DataPoint[],
  index: (d: DataPoint) => number,
): void {
  if (leaves.includes(merged)) return;
  groupBy.forEach((accessor, level) => {
    if (!levelAccessors.has(accessor)) return;
    merged[groupLevelKey(level)] = collapse(
      leaves.map(leaf => accessor(leaf, index(leaf))),
    );
  });
}
