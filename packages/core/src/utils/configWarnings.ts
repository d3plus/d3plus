const shared = new WeakSet<object>();
const warned = new Set<string>();
const warnedBy = new WeakMap<object, Set<string>>();
let enabled = true;

/**
    Toggles the console warnings d3plus logs when a class receives a config
    property it does not support (like a misspelled key passed to `.config()`
    or `shapeConfig`), or a config key names a data field that no row of the
    chart's data has (like `y: "vlaue"`). Warnings are on by default and the
    setting applies to every chart on the page. With no argument, returns the
    current setting.

@example
import {configWarnings} from "@d3plus/core";
configWarnings(false);
*/
export function configWarnings(): boolean;
export function configWarnings(_: boolean): void;
export function configWarnings(_?: boolean): boolean | void {
  if (!arguments.length) return enabled;
  enabled = !!_;
}

/**
    Marks a config object as shared across several classes, so keys meant for
    other targets (like a `shapeConfig` carrying both `r` and `width`) are
    applied where supported without `BaseClass.config()` warning about the rest.
    @private
*/
export function markSharedConfig<T extends object>(config: T): T {
  shared.add(config);
  return config;
}

/** @private */
export function isSharedConfig(config: unknown): boolean {
  return typeof config === "object" && config !== null && shared.has(config);
}

/**
    Warns that `owner` was given a config key it does not support. Each message
    is logged once, so re-renders (and framework wrappers re-applying the same
    config) don't flood the console.
    @private
*/
export function warnUnknownConfig(owner: string, key: string): void {
  warnConfig(`${owner} received unknown property "${key}".`);
}

/**
    Logs a config warning once, unless `configWarnings(false)` turned them off.
    @private
*/
export function warnConfig(message: string): void {
  if (!enabled || warned.has(message)) return;
  warned.add(message);
  console.warn(message);
}

/**
    Logs a config warning once per `owner` and `id`, unless
    `configWarnings(false)` turned them off. Use it for warnings about one
    chart's own config and data, so each chart warns for itself however many
    times it redraws.
    @param owner The instance the warning is about.
    @param id What the warning is about, so a changed message (like a longer
    field list) doesn't log again.
    @param message The warning.
    @private
*/
export function warnConfigOnce(
  owner: object,
  id: string,
  message: string,
): void {
  if (!enabled) return;
  let ids = warnedBy.get(owner);
  if (!ids) warnedBy.set(owner, (ids = new Set()));
  if (ids.has(id)) return;
  ids.add(id);
  console.warn(message);
}

/**
    Whether `warnConfigOnce` would log for `owner` and `id`.
    @private
*/
export function canWarnOnce(owner: object, id: string): boolean {
  return enabled && !warnedBy.get(owner)?.has(id);
}
