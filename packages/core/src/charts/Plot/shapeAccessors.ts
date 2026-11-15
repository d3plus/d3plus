/**
    A Plot reads the per-datum keys of its `shapeConfig` (a shape's `width`,
    `height`, `r`, `x`, `y`, and `id`) as the Shape's own setters do: a
    function as given, a string as the data field to read from each row, and
    any other value as a constant.
*/
import accessor from "../../utils/accessor.js";
import constant from "../../utils/constant.js";

/** The keys a Shape reads per datum through an accessor (each is `coerce: "accessor"` on the Shape). */
const ACCESSOR_KEYS = ["height", "id", "r", "width", "x", "y"];

/** A shape config whose accessor keys are functions, as a Plot buffer calls them with a row. */
export type BufferConfig = Record<string, (...args: unknown[]) => unknown>;

/**
    One accessor key's value as a function: a function as given, a string as
    the data field it names, and anything else (but `undefined`) as a
    constant.
    @param value The key's value.
*/
export function shapeAccessor(value: unknown): unknown {
  if (value === undefined || typeof value === "function") return value;
  return typeof value === "string" ? accessor(value) : constant(value);
}

/**
    A copy of one shape's config (`shapeConfig.Rect`, or the shared keys)
    with each accessor key made a function (see `shapeAccessor`); every other
    key is kept as given.
    @param config The shape's config.
*/
export function withShapeAccessors(config: unknown): BufferConfig | undefined {
  if (!config || typeof config !== "object") return undefined;
  const out = {...(config as Record<string, unknown>)};
  for (const key of ACCESSOR_KEYS)
    if (key in out) out[key] = shapeAccessor(out[key]);
  return out as BufferConfig;
}

/**
    A copy of a Plot's `shapeConfig` with the accessor keys made functions
    (see `shapeAccessor`), both the shared ones and those of each shape
    (`Rect`, `Circle`, …). Nested configs such as `labelConfig` are kept as
    given.
    @param shapeConfig The Plot's shape config.
*/
export function plotShapeAccessors<T extends object>(shapeConfig: T): T {
  const out = withShapeAccessors(shapeConfig) as Record<string, unknown>;
  if (!out) return shapeConfig;
  for (const key of Object.keys(out)) {
    const value = out[key];
    if (
      /^[A-Z]/.test(key) &&
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    )
      out[key] = withShapeAccessors(value);
  }
  return out as T;
}
