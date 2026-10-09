import {group} from "d3-array";

import type {DataPoint} from "./DataPoint.js";

interface NestEntry {
  key: string | number | boolean | undefined;
  values: NestEntry[] | DataPoint[];
}

type KeyAccessor = (d: DataPoint) => string | number | boolean | undefined;

/**
    Groups a flat array of data by one or more key accessors into nested {key, values} entries, one level per accessor. A row whose keys run out before the last level becomes a leaf at the depth where they stopped instead of leaving an empty level.
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
    Bubbles up values that do not nest to the furthest key: an entry whose next
    level resolved to no key is replaced by its leaf row, so rows whose keys run
    out early become leaves at that depth instead of an empty level.
    @param values The entries of one nest level.
    @param depth The number of key levels from `values` down, inclusive.
    @private
*/
function bubble(values: NestEntry[], depth: number): NestEntry[] {
  if (depth < 2) return values;
  return values.map(d => {
    if (d.key && d.values) {
      const children = d.values as NestEntry[];
      const first = children[0];
      if (first && (first.key === undefined || first.key === "undefined"))
        return first.values[0] as unknown as NestEntry;
      else d.values = bubble(children, depth - 1);
    }

    return d;
  });
}
