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

/**
    Whether `v` is a plain object literal (not an array, function, or class
    instance).
    @private
*/
export function isPlainObject(v: unknown): v is Record<string, unknown> {
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

/**
    Whether `value` is `RESET` or a plain object holding one at any depth.
    @private
*/
export function containsReset(value: unknown): boolean {
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

/**
    @interface FluentHost
    An object that stores its fluent config on `schema`, and (for every
    `BaseClass`) exposes the default snapshot `RESET` restores from.
*/
export interface FluentHost {
  schema: Record<string, unknown>;
  _defaultConfig?: () => Record<string, unknown>;
}

/**
    The value a config-bag setter stores: `patch` deep-merged over the current
    bag into a fresh object. Pair it with `resolvesReset` on the setter.

    - Plain objects merge key by key at every depth, so siblings of a patched
      key survive however deeply they are nested.
    - Arrays are replaced by a shallow copy; functions, primitives, and class
      instances are replaced by reference.
    - The result is always a new object: neither `current` nor `patch` (nor
      any object nested in them) is mutated or shared with it.
    - `RESET` at any depth restores that entry from the host's
      `_defaultConfig()` snapshot under `key` (the getter values taken the
      first time a `RESET` or `config()` call needed them), or removes the
      entry when the snapshot has none. A top-level `RESET` restores a copy of
      the whole snapshot value (`{}` when there is none).
    - Any other non-object `patch` leaves the bag unchanged (as a fresh copy).

    @param host The instance that owns the bag.
    @param key The setter's name, which is also the key of its defaults snapshot.
    @param patch The setter's argument.
    @param current The stored bag, when it lives somewhere other than
    `host.schema[key]` (such as Plot's `_xConfig`); passing it, even as
    `undefined`, replaces the `schema` lookup.
    @returns The new bag for the caller to store.

@example
class Shape extends BaseClass {
  labelConfig(_?: Record<string, unknown>) {
    return arguments.length
      ? ((this.schema.labelConfig = mergeConfigBag(this, "labelConfig", _)), this)
      : this.schema.labelConfig;
  }
}
resolvesReset(Shape.prototype, "labelConfig");
*/
export function mergeConfigBag(
  host: FluentHost,
  key: string,
  patch: unknown,
  current?: unknown,
): Record<string, unknown> {
  const defaults = containsReset(patch) ? host._defaultConfig?.()[key] : undefined;
  if (patch === RESET) return isPlainObject(defaults) ? mergeConfig({}, defaults) : {};
  const bag = arguments.length > 3 ? current : host.schema[key];
  const base = isPlainObject(bag) ? bag : {};
  return mergeConfig(base, isPlainObject(patch) ? patch : {}, defaults);
}

type ResetResolver = ((...args: never[]) => unknown) & {[RESOLVES_RESET]?: boolean};

/**
    Tags hand-written setters that resolve `RESET` themselves (typically via
    `mergeConfigBag`), so `BaseClass.config()` passes their argument through
    untouched instead of substituting defaults into it first. A subclass that
    overrides a tagged setter must tag its own override.
    @param proto The class prototype that defines the setters.
    @param keys The setter names.
*/
export function resolvesReset<T extends object>(proto: T, ...keys: (keyof T & string)[]): void {
  for (const key of keys) {
    const setter = proto[key];
    if (typeof setter !== "function") throw new Error(`resolvesReset: "${key}" is not a method`);
    (setter as ResetResolver)[RESOLVES_RESET] = true;
  }
}

function mergeFieldValue(host: FluentHost, key: string, value: unknown): unknown {
  if (value === RESET) return cloneConfig(host._defaultConfig?.()[key]);
  if (!isPlainObject(value)) return value;
  return mergeConfigBag(host, key, value);
}

const FLUENT_ACCESSOR = Symbol("d3plus.fluentAccessor");

/** The schemas already installed on each prototype. */
const installedSchemas = new WeakMap<object, WeakSet<ConfigField[]>>();

/**
    Whether `value` is an accessor generated by `installFluent`, as opposed to
    a hand-written method.
    @param value The value to test, typically a prototype method.
*/
export function isFluentAccessor(value: unknown): boolean {
  return typeof value === "function" && FLUENT_ACCESSOR in value;
}

/**
    Whether `key` resolves from `proto` (or an ancestor short of
    `Object.prototype`) to anything other than a generated accessor.
*/
function isHandWritten(proto: object, key: string): boolean {
  for (let p: object | null = proto; p && p !== Object.prototype; p = Object.getPrototypeOf(p)) {
    const descriptor = Object.getOwnPropertyDescriptor(p, key);
    if (descriptor) return !isFluentAccessor(descriptor.value);
  }
  return false;
}

/**
    Class-instance variant: mixes generated accessors onto an existing `this`,
    storing each field as `this.schema.<key>`. A chart class inherits its
    accessor surface from a `ChartDefinition`'s schema, and the rest of the
    chart body reads the same values through `this.schema.<key>`.

    Seeds `this.schema.<key>` from `defaults` (with the same coercion) only if
    the field isn't already set — so an `extends Viz` chain that already wrote
    `this.schema.sum = constant(...)` in `Viz`'s constructor is respected.

    Methods are installed on the target's **prototype**, once per schema. This
    is load-bearing for `BaseClass.config()` reflection — its
    `getAllMethods(Object.getPrototypeOf(this))` only sees prototype methods,
    so per-instance methods would be invisible to it (causing the React
    wrapper's hash() to miss user-set values like `.padAngle(0.05)`). The
    methods close over the schema and read/write `this.schema.<key>`, so
    per-instance state is preserved.

    A field whose key resolves on the prototype chain to a hand-written method
    (like `BaseClass.on` or `VizBase.shapeConfig`) gets no accessor: it seeds
    `schema.<key>` and the hand-written method stays the public API, so its
    coercion, merging, and validation apply to every set. A key that resolves
    to a generated accessor is re-installed, so a subclass's schema (which its
    constructor installs after its parent's) replaces the parent's accessor.

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
  // can see them.
  const proto = Object.getPrototypeOf(target);
  if (!proto) return;
  let done = installedSchemas.get(proto);
  if (!done) installedSchemas.set(proto, (done = new WeakSet()));
  if (done.has(schema)) return;
  done.add(schema);
  for (const field of schema) {
    if (isHandWritten(proto, field.key)) continue;
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
    Object.defineProperty(proto[key], FLUENT_ACCESSOR, {value: true});
  }
}
