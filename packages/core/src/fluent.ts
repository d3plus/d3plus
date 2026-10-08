/**
    Generate the fluent chart API from a schema.

    `installFluent` mixes generated `(value?) => value | this` accessors onto
    a class instance, storing each field as `this.schema.<key>`. Each accessor's
    `arguments.length` overload + coercion lives in this one factory instead
    of being copy-pasted per chart.

    `createFluent` is the standalone variant — returns a plain object with
    the same accessor surface plus `config()`. Used where a chart shape is
    handed back as a value (not bound to a Viz instance).
*/

import type {VizInstance} from "./charts/viz/vizTypes.js";
import accessor from "./utils/accessor.js";
import constant from "./utils/constant.js";
import RESET from "./utils/RESET.js";

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return (
    v !== null &&
    typeof v === "object" &&
    !Array.isArray(v) &&
    Object.getPrototypeOf(v) === Object.prototype
  );
}

/**
    Marks a setter that resolves `RESET` tokens in its own argument, so
    `BaseClass.config()` hands such values through untouched.
    @private
*/
export const RESOLVES_RESET = Symbol("d3plus.resolvesReset");

/** Copies plain objects deeply and arrays shallowly; other values pass through. */
function cloneConfig(value: unknown): unknown {
  if (isPlainObject(value)) return mergeInto({}, value);
  if (Array.isArray(value)) return value.slice();
  return value;
}

function mergeInto(
  target: Record<string, unknown>,
  patch: Record<string, unknown>,
  defaults?: unknown,
): Record<string, unknown> {
  for (const k of Object.keys(patch)) {
    const value = patch[k];
    const fallback = isPlainObject(defaults) ? defaults[k] : undefined;
    if (value === RESET) {
      if (fallback === undefined) delete target[k];
      else target[k] = cloneConfig(fallback);
    } else if (isPlainObject(value)) {
      const current = target[k];
      target[k] = mergeInto(isPlainObject(current) ? current : {}, value, fallback);
    } else target[k] = cloneConfig(value);
  }
  return target;
}

/**
    Deep-merges `patch` over `base` into a new object, leaving both inputs
    untouched. Plain objects merge key by key at every depth; arrays are
    replaced by a copy; functions, primitives, and class instances are
    replaced. A `RESET` value restores the matching entry of `defaults` (or
    removes the key when `defaults` has none).
    @param base The current value.
    @param patch The values to merge over it.
    @param defaults The value `RESET` tokens in `patch` restore from.
*/
export function mergeConfig(
  base: Record<string, unknown>,
  patch: Record<string, unknown>,
  defaults?: unknown,
): Record<string, unknown> {
  return mergeInto(cloneConfig(base) as Record<string, unknown>, patch, defaults);
}

function containsReset(value: unknown): boolean {
  if (value === RESET) return true;
  return isPlainObject(value) && Object.values(value).some(containsReset);
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
  coerce?: "identity" | "accessor" | "const" | ((value: unknown) => unknown);
  /** Static default applied to `schema.<key>` when unset. */
  default?: unknown;
  /**
      Viz-bound default. Called with the live `viz` at init so the value
      can close over instance state (e.g. tooltip cells that read live config).
      Mutually exclusive with `default`.
  */
  factory?: (viz: VizInstance) => unknown;
  /**
      Config-bag semantics, for keys like `shapeConfig` and `axisConfig`.
      Both the default/factory output (over the value a parent class seeded)
      and every setter argument are deep-merged over the stored value with
      `mergeConfig`: nested plain objects merge key by key, while arrays,
      functions, and primitives replace. The stored value is always a fresh
      object, so neither the caller's argument nor a shared default is ever
      mutated. A `RESET` token, for the whole value or at any depth inside it,
      restores that entry of the `config()` default snapshot.
  */
  merge?: boolean;
  /** Side-effect run after the value is stored, both at init and on every set. */
  onSet?: (viz: VizInstance, value: unknown) => void;
  /** One-shot wrap of the default value at init time; result is stored. */
  decorate?: (viz: VizInstance, value: unknown) => unknown;
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

interface FluentHost {
  schema: Record<string, unknown>;
  _defaultConfig?: () => Record<string, unknown>;
}

function mergeFieldValue(host: FluentHost, key: string, value: unknown): unknown {
  const defaults = containsReset(value) ? host._defaultConfig?.()[key] : undefined;
  if (value === RESET) return cloneConfig(defaults);
  if (!isPlainObject(value)) return value;
  const existing = host.schema[key];
  return mergeConfig(isPlainObject(existing) ? existing : {}, value, defaults);
}

/**
    Class-instance variant: mixes generated accessors onto an existing `this`,
    storing each field as `this.schema.<key>`. A chart class inherits its
    accessor surface from a `ChartDefinition`'s schema, and the rest of the
    chart body reads the same values through `this.schema.<key>`.

    Seeds `this.schema.<key>` from `defaults` (with the same coercion) only if
    the field isn't already set — so an `extends Viz` chain that already wrote
    `this.schema.sum = constant(...)` in `Viz`'s constructor is respected.

    Methods are installed on the target's **prototype**, once per key (skipped
    if the prototype already owns that method). This is load-bearing for
    `BaseClass.config()` reflection — its `getAllMethods(Object.getPrototypeOf(this))`
    only sees prototype methods, so per-instance methods would be invisible to
    it (causing the React wrapper's hash() to miss user-set values like
    `.padAngle(0.05)`). The methods close over the schema and read/write
    `this.schema.<key>`, so per-instance state is preserved.

    @param target Object to install methods on (typically a class instance).
    @param schema Same field schema `createFluent` consumes.
    @param defaults Default values (applied to `this.schema.<key>` when unset).
*/
export function installFluent(
  // `target` is any instance that stores fluent values on `target.schema`
  // (every shape/component/Viz, plus the non-BaseClass `Image`). `any` is the
  // structural escape hatch for this heterogeneous, prototype-mutating helper.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target: any,
  schema: ConfigField[],
  defaults: Record<string, unknown> = {},
): void {
  // Storage lives on `target.schema.<key>`. Accessors (installed on the
  // prototype below) and all chart code read/write through `schema`
  // directly.
  if (!target.schema) target.schema = {};

  for (const field of schema) {
    const key = field.key;

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
        field.merge && isPlainObject(value)
          ? mergeConfig(isPlainObject(existing) ? existing : {}, value)
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
    proto[key] = function (this: FluentHost, ...args: unknown[]) {
      if (!args.length) return this.schema[key];
      const value = coerceValue(field, args[0]);
      const next = field.merge ? mergeFieldValue(this, key, value) : value;
      this.schema[key] = next;
      // `onSet` is declared only by Viz chart defs; at runtime `this` is that
      // Viz instance, so the cast across the generic accessor body is sound.
      field.onSet?.(this as unknown as VizInstance, next);
      return this;
    };
    if (field.merge) proto[key][RESOLVES_RESET] = true;
  }
}
