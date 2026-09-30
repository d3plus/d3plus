const shared = new WeakSet<object>();
const warned = new Set<string>();
let enabled = true;

/**
    Toggles the console warnings d3plus logs when a class receives a config
    property it does not support (like a misspelled key passed to `.config()`
    or `shapeConfig`). Warnings are on by default and the setting applies to
    every chart on the page. With no argument, returns the current setting.

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
  if (!enabled) return;
  const message = `${owner} received unknown property "${key}".`;
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(message);
}
