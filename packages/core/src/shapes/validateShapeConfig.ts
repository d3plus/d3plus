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
    Warns about `shapeConfig` keys that no shape supports. A top-level key is
    valid if any shape class has it (the config is shared by every shape type);
    a key nested under a shape name (like `{Rect: {…}}`) must exist on that
    shape.
    @param owner The class name of the chart receiving the config.
    @param config The user-supplied `shapeConfig` object.
    @private
*/
export default function validateShapeConfig(owner: string, config: Record<string, unknown>): void {
  const label = `${owner}.shapeConfig()`;
  const all = shapeInstances();
  for (const key of Object.keys(config)) {
    const nested = all[key];
    if (nested) {
      if (!isObject(config[key])) continue;
      for (const k of Object.keys(config[key] as object)) {
        if (!(k in nested)) warnUnknownConfig(label, `${key}.${k}`);
      }
    } else if (!Object.values(all).some(shape => key in shape)) {
      warnUnknownConfig(label, key);
    }
  }
}
