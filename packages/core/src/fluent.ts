/**
    E4 (RFC §3.3): generate the fluent chart API from a schema.

    Replaces the ~80 hand-written `arguments.length`-overloaded accessor
    methods per chart with one factory that generates them from a config
    schema. The `arguments.length` getter/setter dance + the
    `typeof === "function" ? _ : coerce(_)` pattern live in **one place**
    instead of being copy-pasted across every chart file.

    Status: **shipping in v4** — the factory is real and unit-tested
    (see test/fluent-test.js) and is the implementation behind the
    public `barChart()` / `treemap()` / etc. factories
    (`./factories.ts`). Applying it as the SOLE accessor source for
    every chart subclass (replacing the per-class accessor definitions)
    is a follow-on that requires:
      1. Bit-exact reproduction of `BaseClass.config()`'s reflection
         contract (the React wrapper's `hash()` depends on it) — the
         conformance test pins this.
      2. Schema declarations for every chart's full accessor surface
         (today the schemas exist for the v4 reference subset; growing
         them to cover every legacy accessor is mechanical but
         per-chart).
    Both class and factory surfaces remain valid v4 entry points; the
    factory uses installFluent on the chart classes themselves so
    `new BarChart()` and `barChart()` produce config-equivalent
    instances.
*/

import accessor from "./utils/accessor.js";
import constant from "./utils/constant.js";

/**
    @interface ConfigField
    Declares one config key the fluent factory will generate an accessor for.
*/
export interface ConfigField {
  key: string;
  /**
      How to coerce a setter argument before storing it:
      - `"identity"` (default): store as-is.
      - `"accessor"`: a string is wrapped in `accessor(string)`; a non-function
        in `constant(...)`. Use for value-accessor configs like `x`, `y`, `r`,
        `width`, `fill`, etc.
      - `"const"`: a non-function value is wrapped in `constant(value)`. Use
        for accessors that don't accept a string key, only a function or a
        literal (e.g. `rotate`, `opacity`).
  */
  coerce?: "identity" | "accessor" | "const";
}

/**
    @interface FluentInstance
    The shape a `createFluent` factory returns. Mirrors `BaseClass.config()`'s
    public contract.
*/
export interface FluentInstance<C = Record<string, unknown>> {
  /** Get the current config object (a shallow copy). */
  config(): C;
  /** Apply a partial config and return for chaining. */
  config(_: Partial<C>): this;
}

function coerceValue(field: ConfigField, value: unknown): unknown {
  switch (field.coerce) {
    case "accessor":
      if (typeof value === "function") return value;
      if (typeof value === "string") return accessor(value);
      return constant(value as never);
    case "const":
      if (typeof value === "function") return value;
      return constant(value as never);
    case "identity":
    default:
      return value;
  }
}

/**
    Build a fluent instance from a config schema. Every field in the schema
    becomes a `(value?) => value | this` accessor on the returned object,
    identical in shape to d3plus's hand-written `arguments.length`-overloaded
    methods — but generated.

    The returned instance also exposes `config()` for getting/setting in one
    shot, matching the `BaseClass.config()` contract.

    @param schema The config fields the chart supports.
    @param defaults Seed values (applied with the schema's coercions).
*/
export function createFluent<C extends Record<string, unknown>>(
  schema: ConfigField[],
  defaults: Partial<C> = {},
): FluentInstance<C> & Record<string, (value?: unknown) => unknown> {
  const fields = new Map(schema.map(f => [f.key, f]));
  const config: Record<string, unknown> = {};
  for (const f of schema) {
    if (f.key in defaults) {
      config[f.key] = coerceValue(f, (defaults as Record<string, unknown>)[f.key]);
    }
  }

  const api: Record<string, unknown> = {};

  for (const f of schema) {
    api[f.key] = function (...args: unknown[]) {
      if (!args.length) return config[f.key];
      config[f.key] = coerceValue(f, args[0]);
      return api;
    };
  }

  api.config = function (...args: unknown[]) {
    if (!args.length) return {...config};
    const patch = args[0] as Record<string, unknown>;
    for (const k in patch) {
      if (!Object.prototype.hasOwnProperty.call(patch, k)) continue;
      const field = fields.get(k);
      config[k] = field ? coerceValue(field, patch[k]) : patch[k];
    }
    return api;
  };

  return api as FluentInstance<C> & Record<string, (value?: unknown) => unknown>;
}

/**
    Class-instance variant: mixes generated accessors onto an existing `this`,
    storing each field as `this._<key>`. Lets a legacy chart class inherit
    its accessor surface from a `ChartDefinition`'s schema while keeping the
    legacy `this._sum`, `this._tile`, … direct-read pattern intact for the
    rest of the chart body.

    Seeds `this._<key>` from `defaults` (with the same coercion) only if the
    field isn't already set — so an `extends Viz` chain that already wrote
    `this._sum = constant(...)` in `Viz`'s constructor is respected.

    Methods are installed on the target's **prototype**, once per prototype
    (idempotent via a WeakSet). This is load-bearing for `BaseClass.config()`
    reflection — its `getAllMethods(Object.getPrototypeOf(this))` only sees
    prototype methods, so per-instance methods would be invisible to it
    (causing the React wrapper's hash() to miss user-set values like
    `.padAngle(0.05)`). The methods themselves close over the schema and use
    `this._<key>` for storage, so per-instance state is preserved.

    @param target Object to install methods on (typically a class instance).
    @param schema Same field schema `createFluent` consumes.
    @param defaults Default values (applied to `this._<key>` when unset).
*/
export function installFluent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target: any,
  schema: ConfigField[],
  defaults: Record<string, unknown> = {},
): void {
  // Per-instance defaults seeding (preserves the parent-constructor-set values).
  for (const field of schema) {
    const slot = `_${field.key}`;
    if (target[slot] === undefined && field.key in defaults) {
      target[slot] = coerceValue(field, defaults[field.key]);
    }
  }

  // Prototype-level method installation. Each method closes over the schema
  // field and reads/writes `this._<key>` so per-instance state is honored.
  // Visible to `BaseClass.config()`'s `getAllMethods` reflection because it
  // walks the prototype chain. Per-key idempotence (instead of per-proto):
  // a single prototype may receive multiple installFluent calls (e.g. Treemap
  // gets both vizSchema via super() and treemapSchema in its own constructor),
  // and we want each schema's keys installed once.
  const proto = Object.getPrototypeOf(target);
  if (proto) {
    for (const field of schema) {
      if (Object.prototype.hasOwnProperty.call(proto, field.key)) continue;
      const slot = `_${field.key}`;
      proto[field.key] = function (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this: any,
        ...args: unknown[]
      ) {
        if (!args.length) return this[slot];
        this[slot] = coerceValue(field, args[0]);
        return this;
      };
    }
  }
}
