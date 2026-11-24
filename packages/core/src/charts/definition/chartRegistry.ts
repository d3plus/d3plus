/**
    The chart classes `makeChart` has built, by name, so a chart can be
    named by a string where an instance can't be passed (a Figure's
    `charts` given as plain config).

    @module
*/

/** A chart class, as the registry stores it. */
export type RegisteredChart = new () => unknown;

const registry = new Map<string, RegisteredChart>();

/** Records `Chart` under `name`, replacing any class registered under it before. */
export function registerChart(name: string, Chart: RegisteredChart): void {
  registry.set(name, Chart);
}

/** The chart class registered under `name`, or undefined. */
export function chartClass(name: string): RegisteredChart | undefined {
  return registry.get(name);
}
