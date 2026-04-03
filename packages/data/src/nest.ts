import {group} from "d3-array";

import type {DataPoint} from "./DataPoint.js";

interface NestEntry {
  key: string | number | boolean;
  values: NestEntry[] | DataPoint[];
}

type KeyAccessor = (d: DataPoint) => string | number | boolean;

/**
    @summary Extends the base behavior of d3.nest to allow for multiple depth levels.
    @param keys An array of key accessors that signify each nest level.
    @private
*/
export default function (
  data: DataPoint[],
  keys: KeyAccessor | KeyAccessor[],
): NestEntry[] {
  if (!(keys instanceof Array)) keys = [keys];

  const nestedData = nestGroups(data, keys);

  return bubble(nestedData);
}

/**
    Recursively groups data by each key function, producing {key, values} objects compatible with d3-hierarchy.
    @param data The flat data array to nest.
    @param fns An array of key accessor functions, one per nesting level.
*/
export function nestGroups(data: DataPoint[], fns: KeyAccessor[]): NestEntry[] {
  if (!fns.length) return data as unknown as NestEntry[];
  return [...group(data, fns[0])].map(([key, values]) => ({
    key: key as string | number | boolean,
    values: nestGroups(values, fns.slice(1)),
  }));
}

/**
    Bubbles up values that do not nest to the furthest key.
    @param values The "values" of a nest object.
    @private
*/
function bubble(values: NestEntry[]): NestEntry[] {
  return values.map(d => {
    if (d.key && d.values) {
      if ((d.values[0] as NestEntry).key === "undefined")
        return (d.values[0] as NestEntry).values[0] as unknown as NestEntry;
      else d.values = bubble(d.values as NestEntry[]);
    }

    return d;
  });
}
