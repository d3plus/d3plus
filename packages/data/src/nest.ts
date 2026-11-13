import {group} from "d3-array";

import type {DataPoint} from "./DataPoint.js";

interface NestEntry {
  key: string | number | boolean | undefined;
  values: NestEntry[] | DataPoint[];
}

type KeyAccessor = (d: DataPoint) => string | number | boolean | undefined;

/**
    Groups a flat array of data by one or more key accessors into nested {key, values} entries, one level per accessor. A row whose keys run out before the last level (a key of `undefined`, `null` or `""`) becomes a leaf of the group where they stopped, beside that group's other rows and sub-groups, and a group holding only that one row is replaced by it. Rows without a first-level key stay grouped under that missing key.
    @param data The flat data array to nest.
    @param keys One key accessor, or an array of them, one per nest level.
*/
export default function (
  data: DataPoint[],
  keys: KeyAccessor | KeyAccessor[],
): NestEntry[] {
  if (!(keys instanceof Array)) keys = [keys];

  const nestedData = nestGroups(data, keys);

  return bubble(nestedData, keys.length);
}

/**
    Recursively groups data by each key function, producing {key, values} objects compatible with d3-hierarchy.
    @param data The flat data array to nest.
    @param fns An array of key accessor functions, one per nesting level.
*/
export function nestGroups(data: DataPoint[], fns: KeyAccessor[]): NestEntry[] {
  if (!fns.length) return data as unknown as NestEntry[];
  return [...group(data, fns[0])].map(([key, values]) => ({
    key,
    values: nestGroups(values, fns.slice(1)),
  }));
}

/**
    Bubbles up the rows whose keys run out early: a row with no key at some
    level becomes a leaf of the group above that level, beside the group's
    other rows and sub-groups. A group that holds nothing but one such row is
    replaced by the row, so it is a leaf at that depth instead of an empty
    level. `undefined`, `null` and `""` are no key (as is the string
    `"undefined"` below the first level); `0` and `false` are keys like any
    other. An entry at the first level without a key is left as it is.
    @param values The entries of one nest level.
    @param depth The number of key levels from `values` down, inclusive.
    @private
*/
function bubble(values: NestEntry[], depth: number): NestEntry[] {
  if (depth < 2) return values;
  return values.map(d => {
    if (noKey(d.key) || !d.values) return d;
    const children = d.values as NestEntry[];
    const keyless = children.filter(c => noKey(c.key) || c.key === "undefined");
    const kept = children.flatMap(c =>
      keyless.includes(c) ? rowsOf(c, depth - 2) : bubble([c], depth - 1),
    );
    if (keyless.length === children.length && kept.length === 1) return kept[0];
    d.values = kept;
    return d;
  });
}

/**
    Every row under a nest entry, at any depth.
    @param entry The entry to collect the rows of.
    @param levels The number of entry levels inside `entry.values`.
    @private
*/
function rowsOf(entry: NestEntry, levels: number): NestEntry[] {
  const values = entry.values as NestEntry[];
  return levels < 1 ? values : values.flatMap(e => rowsOf(e, levels - 1));
}

/**
    Whether a nest key stands for no key at all: `undefined`, `null` or `""`.
    @private
*/
function noKey(key: NestEntry["key"] | null): boolean {
  return key === undefined || key === null || key === "";
}
