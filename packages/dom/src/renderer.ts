import assign from "./assign.js";

/**
    A minimal structural interface for the d3plus class instances that the
    framework wrappers drive. Every visualization, component, and shape exposes
    `.config()`; charts additionally expose `.render()` and `.destroy()`, plus
    loader methods (`data()`, `links()`, …) for their data-like fields.
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
    Config fields that pair with a `<field>Format` loader argument. When both a
    field and its `*Format` are supplied, they are routed to the instance's
    matching loader method (which takes the formatter as its second argument)
    instead of through `config()`.
*/
const FORMAT_FIELDS = ["data", "links", "nodes", "topojson"] as const;

/**
    Merges the supplied config objects over a fresh `{select: node}` target,
    routes any `<field>` + `<field>Format` pairs to their loader methods, then
    applies whatever remains via `instance.config()`. Shared by every d3plus
    framework wrapper so this routing lives in exactly one place.
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
    ...configs.filter(Boolean) as Record<string, unknown>[],
  ) as Record<string, unknown>;

  FORMAT_FIELDS.forEach(field => {
    if (c[`${field}Format`] && c[field]) {
      (instance[field] as (data: unknown, format: unknown) => void)(
        c[field],
        c[`${field}Format`],
      );
      delete c[field];
      delete c[`${field}Format`];
    }
  });

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
  }
  catch {
    return String(val);
  }
}
