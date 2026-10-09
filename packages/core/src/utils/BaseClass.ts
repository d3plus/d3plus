import {colorDefaults, type ColorDefaults} from "@d3plus/color";
import {assign, isObject} from "@d3plus/dom";
import {scaleOrdinal} from "d3-scale";
import {
  findLocale,
  translateLocale as dictionaries,
  type TranslationStrings,
} from "@d3plus/locales";

import type {ColorDefaultsConfig, D3plusConfig} from "./D3plusConfig.js";
import RESET from "./RESET.js";
import {containsReset, isPlainObject, mergeConfigBag, resolvesReset, RESOLVES_RESET} from "../fluent.js";
import {isSharedConfig, warnUnknownConfig} from "./configWarnings.js";

/**
    Swaps every nested `RESET` in a config value for the matching entry of
    `defaults`, dropping the key when that default is `undefined`. Objects
    holding a `RESET` are copied on the way down, so the caller's value is
    untouched; any other value passes through as is.
    @private
*/
function nestedReset(value: unknown, defaults: unknown): unknown {
  if (!isPlainObject(value) || !containsReset(value)) return value;
  const out: Record<string, unknown> = {...value};
  const fallbacks = isObject(defaults) ? (defaults as Record<string, unknown>) : {};
  for (const key of Object.keys(out)) {
    if (key.startsWith("_")) continue;
    if (out[key] === RESET) {
      if (fallbacks[key] === undefined) delete out[key];
      else out[key] = fallbacks[key];
    } else out[key] = nestedReset(out[key], fallbacks[key]);
  }
  return out;
}

type Setter = ((v: unknown) => unknown) & {[RESOLVES_RESET]?: boolean};

/**
    finds all prototype methods of a class and it's parent classes
    @param obj
    @private
*/
function getAllMethods(obj: object): string[] {
  let props: string[] = [];
  do {
    props = props.concat(Object.getOwnPropertyNames(obj));
    obj = Object.getPrototypeOf(obj);
  } while (obj && obj !== Object.prototype);
  return props.filter(
    e =>
      e.indexOf("_") !== 0 &&
      // Side-effect/lifecycle methods excluded from config reflection: invoking
      // them as no-arg getters would run real work. `measure` runs the full
      // axis-layout pass; `destroy` tears down the scene renderer (which defeats
      // keyed reconcile and forces a full remount on the next draw).
      !["config", "constructor", "destroy", "measure", "parent", "render", "renderMode", "renderScene", "toScene"].includes(e),
  );
}

/**
    Merges color overrides into an instance and every BaseClass it owns (own
    properties and `ctx` entries), so a Viz's legend, tooltip, axes, and
    shapes pick them up too.
    @private
*/
function cascadeColorDefaults(
  obj: BaseClass,
  overrides: Partial<ColorDefaults>,
  seen: WeakSet<BaseClass>,
): void {
  if (seen.has(obj)) return;
  seen.add(obj);
  obj.schema.colorDefaults = {...obj.schema.colorDefaults, ...overrides};
  for (const child of [...Object.values(obj), ...Object.values(obj.ctx)]) {
    if (child instanceof BaseClass) cascadeColorDefaults(child, overrides, seen);
  }
}

/**
    Provides shared configuration, event handling, and locale management inherited by all d3plus classes.
*/
export default class BaseClass {
  /**
      Post-coercion fluent storage (`.sum(...)`, `.x(...)`, …). `any` is
      deliberate and load-bearing: `installFluent` coerces accessor/const
      fields into functions, so call sites invoke `schema.fill(d, i)` and
      index `schema.groupBy[i]`. It is NOT `D3plusConfig` (that describes
      the pre-coercion user input). Typing it as a coerced `ResolvedSchema`
      interface is the only way to drop the `any`; until then it stays.
  */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: Record<string, any>;
  /** Chart-internal scratch (d3 layout instances, computed derived state). */
  ctx: Record<string, unknown>;

  _uuid: string;
  _configDefault?: D3plusConfig;

  /**
      Invoked when creating a new class instance, and sets any default parameters.
      @private
*/
  constructor() {
    this.schema = {};
    this.ctx = {};
    this.schema.colorDefaults = {...colorDefaults};
    this.schema.locale = "en-US";
    this.schema.on = {};
    this.schema.parent = {};
    this.schema.translate = (
      d: string,
      locale: string = this.schema.locale,
    ): string => {
      const dictionary: TranslationStrings | undefined = dictionaries[locale];
      const key = d as keyof TranslationStrings;
      return dictionary && dictionary[key] ? dictionary[key] : d;
    };
    this._uuid = crypto.randomUUID();
  }

  /**
      Methods that correspond to the key/value pairs and returns this class.
*/
  config(): D3plusConfig;
  config(_: D3plusConfig): this;
  config(_?: D3plusConfig): D3plusConfig | this {
    const defaults = this._defaultConfig();

    if (arguments.length) {
      for (const k in _) {
        if ({}.hasOwnProperty.call(_, k)) {
          if (k in this) {
            const v = _![k];
            const setter = (this as unknown as Record<string, Setter>)[k];
            if (v === RESET && k === "on") this.schema.on = defaults[k];
            else if (setter[RESOLVES_RESET]) setter.call(this, v);
            else if (v === RESET) setter.call(this, defaults[k]);
            else setter.call(this, nestedReset(v, defaults[k]));
          } else if (!isSharedConfig(_)) {
            warnUnknownConfig(`${this.constructor.name}.config()`, k);
          }
        }
      }
      return this;
    } else {
      const config: D3plusConfig = {};
      getAllMethods(Object.getPrototypeOf(this)).forEach(k => {
        config[k] = (this as unknown as Record<string, () => unknown>)[k]();
      });
      return config;
    }
  }

  /**
      The snapshot of every getter's value that `RESET` restores from, taken
      the first time it is needed.
      @private
  */
  _defaultConfig(): D3plusConfig {
    if (!this._configDefault) {
      const config: D3plusConfig = {};
      getAllMethods(Object.getPrototypeOf(this)).forEach(k => {
        const v = (this as unknown as Record<string, () => unknown>)[k]();
        if (v !== this) config[k] = isObject(v) ? assign({}, v as Record<string, unknown>) : v;
      });
      this._configDefault = config;
    }
    return this._configDefault;
  }

  /**
      The locale used for all text and number formatting. Supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be a complex Object, a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale.

@example
      {
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "\u00b5", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
*/
  locale(): string;
  locale(_: string | object): this;
  locale(_?: string | object): string | this {
    return arguments.length
      ? ((this.schema.locale = findLocale(_ as string)), this)
      : this.schema.locale;
  }

  /**
      Overrides the default colors used when assigning fills from data and choosing legible text colors: `dark` and `light` (the text colors picked for contrast against a background), `missing` (null/undefined values), `on`/`off` (`true`/`false` values), `sequential` (the anchor hue for magnitude ramps), and `scale` (the categorical palette, given as a d3 ordinal scale or an array of colors). Keys are merged into the current defaults, and a Viz passes its overrides down to the shapes and components it draws.

@example
new Treemap()
  .colorDefaults({
    dark: "#222",
    light: "#fff",
    scale: ["#1b9e77", "#d95f02", "#7570b3"]
  })
*/
  colorDefaults(): ColorDefaults;
  colorDefaults(_: ColorDefaultsConfig): this;
  colorDefaults(_?: ColorDefaultsConfig): ColorDefaults | this {
    if (!arguments.length) return this.schema.colorDefaults;
    const {scale, ...rest} = _ ?? {};
    const next: Partial<ColorDefaults> = {...rest};
    if (Array.isArray(scale)) next.scale = scaleOrdinal<string>().range(scale);
    else if (scale) next.scale = scale;
    cascadeColorDefaults(this, next, new WeakSet());
    return this;
  }

  /**
      Event listener for the specified event *typenames*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.

@example <caption>By default, listeners apply globally to all objects, however, passing a namespace with the class name gives control over specific elements:</caption>
new Plot
  .on("click.Shape", function(d) {
    console.log("data for shape clicked:", d);
  })
  .on("click.Legend", function(d) {
    console.log("data for legend clicked:", d);
  })
*/
  on(): Record<string, (...args: unknown[]) => unknown>;
  on(_: string): ((...args: unknown[]) => unknown) | undefined;
  on(_: string, f: (...args: unknown[]) => unknown): this;
  on(_: Record<string, (...args: unknown[]) => unknown>): this;
  on(
    _?: string | Record<string, (...args: unknown[]) => unknown>,
    f?: (...args: unknown[]) => unknown,
  ):
    | Record<string, (...args: unknown[]) => unknown>
    | ((...args: unknown[]) => unknown)
    | undefined
    | this {
    return arguments.length === 2
      ? ((this.schema.on[_ as string] = f!), this)
      : arguments.length
        ? typeof _ === "string"
          ? this.schema.on[_]
          : ((this.schema.on = Object.assign({}, this.schema.on, _)), this)
        : this.schema.on;
  }

  /**
      Parent config used by the wrapper.
*/
  parent(): unknown;
  parent(_: unknown): this;
  parent(_?: unknown): unknown {
    return arguments.length
      ? ((this.schema.parent = _!), this)
      : this.schema.parent;
  }

  /**
      Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.

@example <caption>For example, if we wanted to only change the string "Back" and allow all other string to return in English:</caption>
.translate(function(d) {
  return d === "Back" ? "Get outta here" : d;
})
*/
  translate(): (d: string, locale?: string) => string;
  translate(_: (d: string, locale?: string) => string): this;
  translate(
    _?: (d: string, locale?: string) => string,
  ): ((d: string, locale?: string) => string) | this {
    return arguments.length
      ? ((this.schema.translate = _!), this)
      : this.schema.translate;
  }

  /**
      Configuration object with key/value pairs applied as method calls on each shape.
*/
  shapeConfig(): D3plusConfig;
  shapeConfig(_: D3plusConfig): this;
  shapeConfig(_?: D3plusConfig): D3plusConfig | this {
    return arguments.length
      ? ((this.schema.shapeConfig = mergeConfigBag(this, "shapeConfig", _)), this)
      : (this.schema.shapeConfig as D3plusConfig);
  }
}

resolvesReset(BaseClass.prototype, "shapeConfig");
