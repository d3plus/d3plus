import assign from "./assign.js";

/**
    A minimal structural interface for the d3plus class instances that the
    framework wrappers drive. Every visualization, component, and shape exposes
    `.config()`; charts additionally expose `.render()` and `.destroy()`.
*/
export interface D3plusInstance {
  config(c: Record<string, unknown>): unknown;
  render?(callback?: () => void): unknown;
  destroy?(): unknown;
  [key: string]: unknown;
}

/** Constructor type for d3plus visualization, component, and shape classes. */
export type D3plusConstructor = new (...args: any[]) => D3plusInstance;

/**
    Merges the supplied config objects over a fresh `{select: node}` target and
    applies the result via `instance.config()`. Shared by every d3plus
    framework wrapper. Loader formatters (`dataFormat`, `linksFormat`,
    `nodesFormat`, `topojsonFormat`) are ordinary config keys, so they pass
    through with the rest.
    @param instance A d3plus class instance.
    @param node The DOM element the visualization renders into (its `select`).
    @param configs One or more config objects, merged left-to-right (later
    objects win); `undefined`/`null` entries are ignored.
*/
export function applyConfig(
  instance: D3plusInstance,
  node: Element,
  ...configs: (Record<string, unknown> | undefined)[]
): D3plusInstance {
  const c = assign(
    {select: node},
    ...(configs.filter(Boolean) as Record<string, unknown>[]),
  ) as Record<string, unknown>;
  instance.config(c);
  return instance;
}

/**
    Stable hash that serializes functions by their source, so function-valued
    config props (accessors, formatters) still register as changed when their
    body changes. Wrappers use this to diff config across a framework's render
    cycles — two structurally identical config objects hash equal, so an
    unchanged config skips a re-render.
    @param val Any config value.
*/
export function hash(val: unknown): string {
  const seen = new WeakSet();
  try {
    return JSON.stringify(val, (_, v) => {
      if (typeof v === "function") return v.toString();
      if (typeof v === "object" && v !== null) {
        if (seen.has(v)) return "[Circular]";
        seen.add(v);
      }
      return v;
    });
  } catch {
    return String(val);
  }
}
