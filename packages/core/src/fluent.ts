/**
    Generate the fluent chart API from a schema.

    `installFluent` mixes generated `(value?) => value | this` accessors onto
    a class instance, storing each field as `this._<key>`. Each accessor's
    `arguments.length` overload + coercion lives in this one factory instead
    of being copy-pasted per chart.

    `createFluent` is the standalone variant — returns a plain object with
    the same accessor surface plus `config()`. Used where a chart shape is
    handed back as a value (not bound to a Viz instance).
*/

import accessor from "./utils/accessor.js";
import constant from "./utils/constant.js";

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return (
    v !== null &&
    typeof v === "object" &&
    !Array.isArray(v) &&
    Object.getPrototypeOf(v) === Object.prototype
  );
}

/**
    @interface ConfigField
    Declares one config key the fluent factory will generate an accessor for.
*/
export interface ConfigField {
  key: string;
  /**
      Setter-argument coercion:
      - `"identity"` (default): store as-is.
      - `"accessor"`: string → `accessor(string)`, non-function → `constant(...)`.
      - `"const"`: non-function → `constant(value)`.
      - function form: full custom coercion (receives the raw value, returns the stored value).
  */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  coerce?: "identity" | "accessor" | "const" | ((value: unknown) => any);
  /** Static default applied to `schema.<key>` when unset. */
  default?: unknown;
  /**
      Viz-bound default. Called with the live `viz` at init so the value
      can close over instance state (e.g. tooltip cells that read live config).
      Mutually exclusive with `default`.
  */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  factory?: (viz: any) => unknown;
  /**
      Merge semantics: when set, default/factory output is merged into the
      existing value (shallow assign) instead of replacing it. Use for
      config bags (`shapeConfig`, `tooltipConfig`) that should extend the
      parent's defaults rather than overwrite them.
  */
  merge?: boolean;
  /** Side-effect run after the value is stored, both at init and on every set. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSet?: (viz: any, value: unknown) => void;
  /** One-shot wrap of the default value at init time; result is stored. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  decorate?: (viz: any, value: unknown) => unknown;
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
  if (typeof field.coerce === "function") return field.coerce(value);
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
  // Storage canonically lives on `target.schema.<key>`. `_<key>` is installed
  // as a per-instance getter/setter alias so existing code that still reads
  // `viz._sum` keeps working until each call site migrates.
  if (!target.schema) target.schema = {};

  for (const field of schema) {
    const key = field.key;
    const slot = `_${key}`;

    // Install the underscore alias once per instance. If a parent
    // constructor already wrote `target._<key> = X` as a data property,
    // migrate that value into `schema` and replace the data prop with
    // the alias so subsequent reads/writes route through `schema`.
    const existing = Object.getOwnPropertyDescriptor(target, slot);
    if (!existing || "value" in existing) {
      if (existing && "value" in existing && target.schema[key] === undefined) {
        target.schema[key] = existing.value;
      }
      Object.defineProperty(target, slot, {
        configurable: true,
        enumerable: false,
        get(this: {schema: Record<string, unknown>}) {
          return this.schema[key];
        },
        set(this: {schema: Record<string, unknown>}, v: unknown) {
          this.schema[key] = v;
        },
      });
    }

    // Two seed sources with different precedence:
    //   - field.default / field.factory: declared by the chart def; an
    //     explicit claim that overrides any parent-set value.
    //   - defaults parameter: caller-supplied seed; only applies when unset.
    const fieldHasSeed = "default" in field || field.factory !== undefined;
    const paramHasSeed = key in defaults;

    if (fieldHasSeed) {
      const raw =
        "default" in field ? field.default : (field.factory as (v: typeof target) => unknown)(target);
      let value = coerceValue(field, raw);
      if (field.decorate) value = field.decorate(target, value);
      const existing = target.schema[key];
      const merged =
        field.merge && isPlainObject(existing) && isPlainObject(value)
          ? Object.assign({}, existing, value)
          : value;
      target.schema[key] = merged;
      field.onSet?.(target, merged);
    } else if (paramHasSeed && target.schema[key] === undefined) {
      const value = coerceValue(field, defaults[key]);
      target.schema[key] = value;
      field.onSet?.(target, value);
    }
  }

  // Methods are installed on the prototype so `BaseClass.config()` reflection
  // can see them. Per-key idempotence.
  const proto = Object.getPrototypeOf(target);
  if (!proto) return;
  for (const field of schema) {
    if (Object.prototype.hasOwnProperty.call(proto, field.key)) continue;
    const key = field.key;
    proto[key] = function (
      this: {schema: Record<string, unknown>},
      ...args: unknown[]
    ) {
      if (!args.length) return this.schema[key];
      const value = coerceValue(field, args[0]);
      const existing = this.schema[key];
      const next =
        field.merge && isPlainObject(existing) && isPlainObject(value)
          ? Object.assign({}, existing, value)
          : value;
      this.schema[key] = next;
      field.onSet?.(this, next);
      return this;
    };
  }
}
