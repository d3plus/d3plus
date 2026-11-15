/**
    Reading Venn rows: the sets a row names, its size, the row that stands
    for one set, and the colors of regions where sets overlap.
*/

import {lab} from "d3-color";

import {colorAssign} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";

import {linkedColorDefaults} from "../viz/linkGroup.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** What joins set names in a region's default label ("A ∩ B"). */
export const SET_SEPARATOR = " \u2229 ";

/**
    A row's set names as a list: an array of names as given, a lone name
    as a list of one, and anything else as no sets. Merged rows hold a lone
    set as a plain value, so both forms read the same.
*/
export function setList(value: unknown): string[] {
  const list = Array.isArray(value) ? value : value == null ? [] : [value];
  return [
    ...new Set(
      list
        .filter(v => typeof v === "string" || typeof v === "number")
        .map(v => `${v}`),
    ),
  ];
}

/**
    Merges rows' sets into one list of every set they name, so a merged
    row of one set still holds a list (`["A"]`), not a lone name.
*/
export function mergeSets(
  rows: DataPoint[],
  accessor: (d: DataPoint) => unknown,
): string[] {
  return setList(rows.flatMap(d => setList(accessor(d))));
}

/** Unwraps a scene datum (a label's or a merged row's wrapper) to its source row. */
export function sourceRow(d: DataPoint): DataPoint {
  let row = d as DataPoint & {__d3plus__?: boolean; data?: DataPoint};
  while (row && row.__d3plus__ && row.data) row = row.data as typeof row;
  return row;
}

/** The set names a row stands for, through the chart's `sets` accessor. */
export function rowSets(viz: VizInstance, d: DataPoint, i: number): string[] {
  const sets = viz.schema.sets as
    ((d: DataPoint, i: number) => unknown) | undefined;
  if (!d || typeof sets !== "function") return [];
  return setList(sets(sourceRow(d), i));
}

/** A row's size, through the chart's `value` accessor (NaN when it has none). */
export function rowSize(viz: VizInstance, d: DataPoint, i: number): number {
  const value = viz.schema.value as (d: DataPoint, i: number) => unknown;
  const v = typeof value === "function" ? value(d, i) : undefined;
  return v == null || v === "" ? NaN : Number(v);
}

/** Whether `outer` names every set in `inner`. */
export function coversSets(outer: string[], inner: string[]): boolean {
  return inner.length > 0 && inner.every(s => outer.includes(s));
}

/** The drawn row that stands for the set `name` alone, if any. */
export function setRow(
  viz: VizInstance,
  name: string,
): {row: DataPoint; i: number} | undefined {
  const rows = (viz._filteredData ?? []) as DataPoint[];
  for (let i = 0; i < rows.length; i++) {
    const sets = rowSets(viz, rows[i], i);
    if (sets.length === 1 && sets[0] === name) return {row: rows[i], i};
  }
  return undefined;
}

/**
    The color where `colors` overlap: their average in CIELAB, so the mix
    sits between them the way the eye blends them. Colors that don't parse
    are left out; with none left, undefined.
*/
export function blendColors(colors: unknown[]): string | undefined {
  const parsed = colors
    .filter((c): c is string => typeof c === "string")
    .map(c => lab(c))
    .filter(c => Number.isFinite(c.l));
  if (!parsed.length) return undefined;
  const mean = (k: "l" | "a" | "b") =>
    parsed.reduce((s, c) => s + (Number.isFinite(c[k]) ? c[k] : 0), 0) /
    parsed.length;
  return lab(mean("l"), mean("a"), mean("b")).formatHex();
}

/**
    Wraps a fill accessor so a region where sets overlap takes the blend of
    those sets' fills (each read from the row that stands for the set
    alone, or the color the set's name is assigned when it has no row of
    its own). A region of one set, and any fill a colorScale gives, are
    left as `fill` has them.
*/
export function blendedFill(
  viz: VizInstance,
  fill: (d: DataPoint, i: number) => unknown,
): (d: DataPoint, i: number) => unknown {
  return (d: DataPoint, i: number) => {
    const sets = rowSets(viz, d, i);
    if (sets.length < 2 || viz.schema.colorScale) return fill(d, i);
    return blendColors(
      sets.map(name => {
        const found = setRow(viz, name);
        return found
          ? fill(found.row, found.i)
          : colorAssign(name, linkedColorDefaults(viz));
      }),
    );
  };
}

/**
    The rows a Venn draws, or (given the same list twice) the rows its
    legend lists. The legend lists each set on its own. A drawn region
    leaves out every set the legend hides, and when the legend shows only
    some sets, the regions within them: their circles and the overlaps
    among them. With small multiples, whose `all` spans every panel, a
    panel keeps to its own rows, so it leaves out the overlaps among the
    shown sets.
*/
export function vennRows(
  viz: VizInstance,
  data: DataPoint[],
  all?: DataPoint[],
): DataPoint[] {
  if (all && data === all)
    return data.filter((d, i) => rowSets(viz, d, i).length === 1);
  const hidden = (viz._hidden ?? []).map(String);
  const solo = (viz._solo ?? []).map(String);
  const source = solo.length && all && !viz.schema.facet ? all : data;
  return source.filter((d, i) => {
    const sets = rowSets(viz, d, i);
    if (sets.some(s => hidden.includes(s))) return false;
    return !solo.length || sets.every(s => solo.includes(s));
  });
}
