/**
    The `confidence` and `confidenceConfig` settings' input handling: the
    `[lower, upper]` accessor pair, and which keys `confidenceConfig` accepts.
*/
import validateShapeConfig from "../../shapes/validateShapeConfig.js";
import accessor from "../../utils/accessor.js";
import type {ConfidenceAccessor, VizInstance} from "../viz/vizTypes.js";

/**
    The shapes `confidenceConfig` styles: a line's band (an Area) and a bar's
    error bar (a Path), each also configurable alone under its own key.
*/
const scope = {
  method: "confidenceConfig",
  shapes: {Area: "Area", Bar: "Path"},
  extra: {"": ["capWidth", "tooltip"], Bar: ["capWidth"]},
};

/**
    Warns about `confidenceConfig` keys that neither the band nor the error
    bar accepts (top level), or that the shape a nested `Area`/`Bar` config
    styles doesn't (e.g. `Bar.strok`).
    @param owner The class name of the chart receiving the config.
    @param config The user-supplied `confidenceConfig` patch.
*/
export function validateConfidenceConfig(owner: string, config: unknown): void {
  if (config && typeof config === "object" && Object.getPrototypeOf(config) === Object.prototype)
    validateShapeConfig(owner, config as Record<string, unknown>, scope);
}

/**
    The stored `confidence` setting for a setter argument: a `[lower, upper]`
    pair of accessors (a data key becomes an accessor, anything else `false`),
    or `false` when neither side has one.
    @param value The setter's argument.
*/
export function resolveConfidence(value: unknown): VizInstance["_confidence"] {
  const bound = (b: unknown): ConfidenceAccessor | false =>
    typeof b === "function"
      ? (b as ConfidenceAccessor)
      : typeof b === "string" && b
        ? (accessor(b) as ConfidenceAccessor)
        : false;
  const pair: [ConfidenceAccessor | false, ConfidenceAccessor | false] = Array.isArray(value)
    ? [bound(value[0]), bound(value[1])]
    : [false, false];
  return pair[0] || pair[1] ? pair : false;
}
