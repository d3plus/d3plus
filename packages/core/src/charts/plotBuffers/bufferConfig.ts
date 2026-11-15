import constant from "../../utils/constant.js";

/**
    The shape config keys a Shape reads per datum through an accessor (each
    is `coerce: "accessor"` on the Shape), which a buffer calls with a row.
*/
const ACCESSOR_KEYS = ["height", "id", "r", "width", "x", "y"];

/** A shape config as a Plot buffer reads it: its accessor keys are functions. */
export type BufferConfig = Record<string, (...args: unknown[]) => unknown>;

/**
    A shape's config for a Plot buffer, with each accessor key given as a
    plain value (`width: 12`) wrapped as a constant, as the Shape itself
    would, so the buffer can call it with each row. Leaves `config` itself
    untouched.
    @param config The shape's `shapeConfig` entry (`shapeConfig.Rect`).
*/
export function bufferConfig(config: unknown): BufferConfig | undefined {
  if (!config || typeof config !== "object") return undefined;
  const out = {...(config as Record<string, unknown>)};
  for (const key of ACCESSOR_KEYS)
    if (out[key] !== undefined && typeof out[key] !== "function")
      out[key] = constant(out[key]);
  return out as BufferConfig;
}
