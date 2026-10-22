/**
    Axis titles from a chart's `value` key: a string `value` becomes an
    accessor that remembers its key, so the value axis can be titled with it
    until the user sets a title of their own.
*/

import accessor from "../../utils/accessor.js";

/** Data keys behind string `value` accessors. */
const valueKeys = new WeakMap<object, string>();

/**
    `accessor(key)` that remembers its key (see `valueKeyOf`).
    @param key The data key to read.
*/
export function keyedAccessor(key: string) {
  const fn = accessor(key);
  valueKeys.set(fn, key);
  return fn;
}

/**
    The data key behind an accessor built by `keyedAccessor`, if any.
    @param fn The accessor.
*/
export function valueKeyOf(fn: unknown): string | undefined {
  return typeof fn === "function" ? valueKeys.get(fn) : undefined;
}

/**
    Sets an axis title to `next` unless the user has configured their own: one
    that is neither unset nor the `previous` title set this way.
    @param config The axis config to title.
    @param previous The title last set automatically.
    @param next The title to set.
*/
export function autoTitle(
  config: Record<string, unknown> | undefined,
  previous: string | undefined,
  next: string | undefined,
): void {
  if (config && (config.title === undefined || config.title === previous))
    config.title = next;
}
