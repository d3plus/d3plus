const defaults = new WeakSet<object>();

/**
    Marks a config function seeded by the library itself, so code that layers
    config can tell it apart from one the user set.
    @private
*/
export function markDefault<T extends object>(value: T): T {
  defaults.add(value);
  return value;
}

/**
    Whether a config value is one registered with `markDefault`.
    @private
*/
export function isDefault(value: unknown): boolean {
  return typeof value === "function" && defaults.has(value);
}
