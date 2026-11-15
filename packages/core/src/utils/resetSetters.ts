import {isFluentAccessor, resetArg, RESOLVES_RESET} from "../fluent.js";
import type {FluentHost} from "../fluent.js";
import RESET from "./RESET.js";

type Method = ((this: FluentHost, ...args: unknown[]) => unknown) & {
  [RESOLVES_RESET]?: boolean;
};

/** Public methods that are not config accessors, left out of `getAllMethods`. */
const REFLECT_SKIP = new Set([
  "append",
  "config",
  "constructor",
  "destroy",
  "layout",
  "measure",
  "parent",
  "render",
  "renderMode",
  "toCanvas",
  "toSVGString",
  "toScene",
  "zoomBrush",
  "zoomIn",
  "zoomOut",
  "zoomReset",
]);

/**
    Whether a method is left out of config reflection (and of `resetSetters`): private methods, and
    side-effect or lifecycle methods. Invoking them as no-arg getters would
    run real work. `measure` runs the full axis-layout pass; `destroy` tears
    down the scene renderer (which defeats keyed reconcile and forces a full
    remount on the next draw); `toSVGString` serializes the drawn chart
    (through a throwaway SVG backend on Canvas), `layout` recomputes a
    SizeLegend's layout, `append` adds rows and redraws, and the zoom
    methods zoom a rendered chart.
*/
export function notSetter(key: string): boolean {
  return key.indexOf("_") === 0 || REFLECT_SKIP.has(key);
}

/** The prototypes (and chart instances) whose setters already take `RESET`. */
const wrapped = new WeakSet<object>();

/**
    Lets every hand-written setter on `target` and its prototypes take
    `RESET` directly: `x.key(RESET)` calls the setter with the default that
    `config({key: RESET})` restores (see `resetArg`). Generated accessors,
    setters that resolve `RESET` themselves (see `resolvesReset`), and the
    methods `skip` names are left as they are. Each object is wrapped once.
    @param target The prototype of the class being constructed, or an
    instance holding setters of its own.
    @param skip Whether a method is not a config setter.
    @private
*/
export function resetSetters(
  target: object,
  skip: (key: string) => boolean,
): void {
  for (
    let p: object | null = target;
    p && p !== Object.prototype && !wrapped.has(p);
    p = Object.getPrototypeOf(p)
  ) {
    wrapped.add(p);
    for (const key of Object.getOwnPropertyNames(p)) {
      if (skip(key)) continue;
      const descriptor = Object.getOwnPropertyDescriptor(p, key)!;
      const setter = descriptor.value as Method | undefined;
      if (
        typeof setter !== "function" ||
        !descriptor.writable ||
        isFluentAccessor(setter) ||
        setter[RESOLVES_RESET]
      )
        continue;
      // Passes `arguments` on as given, so a setter still reads how many
      // arguments it was called with.
      /* eslint-disable prefer-rest-params */
      const method = function (this: FluentHost) {
        if (arguments[0] !== RESET)
          return setter.apply(this, arguments as never);
        const args = Array.from(arguments);
        args[0] = resetArg(this, key, RESET);
        return setter.apply(this, args);
      };
      /* eslint-enable prefer-rest-params */
      Object.defineProperty(p, key, {...descriptor, value: method});
    }
  }
}
