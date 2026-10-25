import type {DataPoint} from "@d3plus/data";

import accessor from "./accessor.js";

/** The data field each user-named accessor reads. */
const fieldNames = new WeakMap<object, string>();

/**
    `accessor(key)` for a field name the user gave a config key, remembered so
    the chart can warn when no row of its data has that field (see
    `fieldNameOf`). A non-string key gives a plain `accessor`.
    @param key The data field to read.
    @private
*/
export function fieldAccessor(
  key: string,
): (d: DataPoint) => DataPoint[keyof DataPoint] {
  const fn = accessor(key);
  if (typeof key === "string") fieldNames.set(fn, key);
  return fn;
}

/**
    Remembers that `fn`, a function built from a user's field name (such as a
    comparator ranking rows by it), reads the data field `key`.
    @param fn The function.
    @param key The data field it reads.
    @private
*/
export function markField<T extends object>(fn: T, key: string): T {
  fieldNames.set(fn, key);
  return fn;
}

/**
    The data field behind a function built by `fieldAccessor` or `markField`,
    if any.
    @param fn The value to look up.
    @private
*/
export function fieldNameOf(fn: unknown): string | undefined {
  return typeof fn === "function" ? fieldNames.get(fn) : undefined;
}
