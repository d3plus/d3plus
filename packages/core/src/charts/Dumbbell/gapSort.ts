/**
    Dumbbell's `gapSort`: orders the categories by their gap, the distance
    between each category's smallest and largest value.

    @module
*/

import type {DataPoint} from "@d3plus/data";
import {finite} from "@d3plus/math";

import type {VizInstance} from "../viz/vizTypes.js";

/** A row accessor. */
export type RowAccessor = (d: DataPoint, i: number) => unknown;

/** The `gapSort` setting. */
export type GapSort = false | "ascending" | "descending";

/** A category-axis comparator, as Plot's `xSort`/`ySort` take. */
export type CategoryComparator = (a: DataPoint, b: DataPoint) => number;

/** What `gapSort` last installed, so a user comparator is never overwritten. */
export interface GapSortState {
  axis?: "x" | "y";
  sort?: CategoryComparator;
}

/**
    Each category's gap: its largest value minus its smallest. A category
    with fewer than two numeric values has a gap of 0.
    @param rows The data rows.
    @param category Reads a row's category.
    @param value Reads a row's value.
*/
export function categoryGaps(
  rows: DataPoint[],
  category: RowAccessor,
  value: RowAccessor,
): Map<string, number> {
  const extents = new Map<string, [number, number]>();
  rows.forEach((d, i) => {
    const key = `${category(d, i)}`;
    const v = value(d, i);
    const extent = extents.get(key);
    if (!finite(v)) {
      if (!extent) extents.set(key, [NaN, NaN]);
      return;
    }
    if (!extent || !finite(extent[0])) extents.set(key, [v, v]);
    else extents.set(key, [Math.min(extent[0], v), Math.max(extent[1], v)]);
  });
  const gaps = new Map<string, number>();
  extents.forEach(([lo, hi], key) => gaps.set(key, finite(lo) ? hi - lo : 0));
  return gaps;
}

/**
    A comparator ordering rows (or a category's merged rows) by their
    category's gap. Categories missing from `gaps` count as a gap of 0; ties
    keep their order.
    @param gaps Each category's gap, from `categoryGaps`.
    @param order `"ascending"` puts the smallest gap first.
    @param category Reads a row's category.
*/
export function gapComparator(
  gaps: () => Map<string, number>,
  order: "ascending" | "descending",
  category: (d: DataPoint) => unknown,
): CategoryComparator {
  const gapOf = (d: DataPoint): number => gaps().get(`${category(d)}`) ?? 0;
  return (a, b) =>
    order === "ascending" ? gapOf(a) - gapOf(b) : gapOf(b) - gapOf(a);
}

/**
    Installs the `gapSort` comparator as the category axis's sort (`xSort` or
    `ySort`), or removes the one it installed earlier when `gapSort` is off.
    `"descending"` reads widest-first from the top of a vertical category axis
    and from the left of a horizontal one.
    A sort the user set on that axis wins. Gaps are read from the rows being
    drawn, so each small-multiples panel orders its own categories.
    @param viz The Dumbbell.
    @param state What this function installed last time.
*/
export function syncGapSort(viz: VizInstance, state: GapSortState): void {
  if (
    state.axis &&
    state.sort &&
    viz.schema[`${state.axis}Sort`] === state.sort
  )
    viz.schema[`${state.axis}Sort`] = undefined;
  state.axis = state.sort = undefined;
  const order = viz.schema.gapSort as GapSort;
  if (order !== "ascending" && order !== "descending") return;
  const axis = viz.schema.discrete === "x" ? "x" : "y";
  if (viz.schema[`${axis}Sort`]) return;
  const category = viz[`_${axis}`] as RowAccessor;
  const value = viz[`_${axis === "x" ? "y" : "x"}`] as RowAccessor;
  const cache = new WeakMap<DataPoint[], Map<string, number>>();
  const gaps = (): Map<string, number> => {
    const rows: DataPoint[] = viz._filteredData || [];
    let out = cache.get(rows);
    if (!out) cache.set(rows, (out = categoryGaps(rows, category, value)));
    return out;
  };
  // A vertical category axis lists its first category at the bottom.
  const flipped =
    axis === "y" ? (order === "ascending" ? "descending" : "ascending") : order;
  state.axis = axis;
  state.sort = viz.schema[`${axis}Sort`] = gapComparator(gaps, flipped, d =>
    category(d, 0),
  );
}
