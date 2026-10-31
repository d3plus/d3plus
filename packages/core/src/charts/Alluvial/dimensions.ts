/**
    Alluvial dimensions: the `dimensions` config resolved to one accessor and
    title per column, and the `colorBy` config resolved to a column index.
*/

import type {DataPoint} from "@d3plus/data";

import {fieldAccessor} from "../../utils/fieldAccessor.js";

/** A category accessor: reads a row's category on one dimension. */
export type AlluvialAccessor = (d: DataPoint, i: number) => unknown;

/** One entry of `dimensions`: a data key, an accessor, or an accessor with a title. */
export type AlluvialDimensionInput =
  | string
  | AlluvialAccessor
  | {value: string | AlluvialAccessor; title?: string};

/** A resolved dimension: its column's accessor and title. */
export interface AlluvialDimension {
  /** Reads a row's category on this dimension. */
  accessor: AlluvialAccessor;
  /** The column's title: the data key, or the given title (empty for a bare accessor). */
  title: string;
  /** The data key it reads, when it reads one. */
  key?: string;
}

/** A dimension from one `dimensions` entry, or null for an entry that names nothing. */
function resolveOne(input: unknown): AlluvialDimension | null {
  if (typeof input === "string")
    return {accessor: fieldAccessor(input), title: input, key: input};
  if (typeof input === "function")
    return {accessor: input as AlluvialAccessor, title: ""};
  if (input && typeof input === "object" && "value" in input) {
    const {value, title} = input as {value: unknown; title?: unknown};
    const inner = resolveOne(value);
    if (!inner) return null;
    return typeof title === "string" ? {...inner, title} : inner;
  }
  return null;
}

/**
    The columns `dimensions` describes, in order. Entries that are neither a
    key, an accessor, nor a `{value, title}` object are skipped.
    @param input The `dimensions` config.
*/
export function resolveAlluvialDimensions(input: unknown): AlluvialDimension[] {
  if (!Array.isArray(input)) return [];
  return input
    .map(resolveOne)
    .filter((d): d is AlluvialDimension => d !== null);
}

/**
    Whether a category value is missing: `undefined`, `null`, an empty
    string, or `NaN`. A row missing any dimension is left out of the chart.
    @param value The category value.
*/
export function isMissingCategory(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (typeof value === "number" && isNaN(value))
  );
}

/**
    The column `colorBy` names: a column index, or a dimension's data key or
    title. Anything else, or a name no dimension has, is the first column.
    @param colorBy The `colorBy` config.
    @param dims The resolved dimensions.
*/
export function resolveColorBy(
  colorBy: unknown,
  dims: AlluvialDimension[],
): number {
  if (!dims.length) return 0;
  if (typeof colorBy === "number" && Number.isInteger(colorBy))
    return colorBy >= 0 && colorBy < dims.length ? colorBy : 0;
  if (typeof colorBy === "string") {
    const byKey = dims.findIndex(d => d.key === colorBy);
    if (byKey >= 0) return byKey;
    const byTitle = dims.findIndex(d => d.title === colorBy);
    if (byTitle >= 0) return byTitle;
  }
  return 0;
}
