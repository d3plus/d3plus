import {isObject} from "@d3plus/dom";
import {warnUnknownConfig} from "../utils/configWarnings.js";
import * as shapes from "./index.js";

const shapeClasses = shapes as unknown as Record<string, new () => object>;

// One instance per shape class, created on first use: fluent accessors are
// installed onto the prototype by the constructor, so `key in instance`
// matches exactly what `BaseClass.config()` accepts.
let instances: Record<string, object> | undefined;
function shapeInstances(): Record<string, object> {
  if (!instances) {
    instances = {};
    for (const [name, Cls] of Object.entries(shapeClasses)) instances[name] = new Cls();
  }
  return instances;
}

/**
    Which shapes a config styles, for validating a config other than
    `shapeConfig` (e.g. Plot's `confidenceConfig`).
*/
export interface ShapeConfigScope {
  /** The setter named in warnings. Defaults to `"shapeConfig"`. */
  method?: string;
  /**
      The shapes the config styles, keyed by the name that nests a config for
      that shape alone (e.g. `{Bar: "Path"}`). Defaults to every shape, each
      under its own name.
  */
  shapes?: Record<string, string>;
  /** Keys accepted beyond the shapes' own: `""` for the top level, else per nested name. */
  extra?: Record<string, string[]>;
}

/**
    Warns about `shapeConfig` keys that no shape supports. A top-level key is
    valid if any shape class has it (the config is shared by every shape type);
    a key nested under a shape name (like `{Rect: {…}}`) must exist on that
    shape. A `scope` narrows this to the shapes another config styles.
    @param owner The class name of the chart receiving the config.
    @param config The user-supplied config object.
    @param scope The shapes, extra keys, and setter name, when not `shapeConfig`.
    @private
*/
export default function validateShapeConfig(
  owner: string,
  config: Record<string, unknown>,
  scope: ShapeConfigScope = {},
): void {
  const label = `${owner}.${scope.method ?? "shapeConfig"}()`;
  const all = shapeInstances();
  const names = scope.shapes ?? Object.fromEntries(Object.keys(all).map(name => [name, name]));
  const extra = scope.extra ?? {};
  const styled = Object.values(names).map(name => all[name]);
  for (const key of Object.keys(config)) {
    const nested = names[key] && all[names[key]];
    if (nested) {
      if (!isObject(config[key])) continue;
      for (const k of Object.keys(config[key] as object)) {
        if (!(k in nested) && !extra[key]?.includes(k)) warnUnknownConfig(label, `${key}.${k}`);
      }
    } else if (!extra[""]?.includes(key) && !styled.some(shape => key in shape)) {
      warnUnknownConfig(label, key);
    }
  }
}
