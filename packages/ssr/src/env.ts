import {GLOBAL_KEYS} from "./globalKeys.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
    @interface DomEnvOptions
    Options controlling the headless DOM `installDom` stands up.
*/
export interface DomEnvOptions {
  /**
      A ready-made `window` to render into (e.g. from `linkedom` for fast
      SVG-only rendering). When omitted, a fresh `jsdom` window is created —
      `jsdom` must then be installed (it is an optional peer dependency).
  */
  window?: any;
  /** HTML used to seed a freshly-created jsdom document. */
  html?: string;
}

/**
    @interface DomEnv
    A live headless DOM whose globals are currently mirrored onto `globalThis`.
    Always call {@link DomEnv.teardown} when finished to restore the prior state.
*/
export interface DomEnv {
  window: any;
  document: any;
  /** Restores every global `installDom` overrode to its prior value. */
  teardown(): void;
}

const DEFAULT_HTML =
  "<!doctype html><html><head><meta charset='utf-8'></head><body></body></html>";

/**
    Adds the browser APIs jsdom (and lighter DOMs) don't implement but d3plus
    touches while rendering. The SVG geometry methods have no layout engine
    behind them, so they return inert values — d3plus computes real geometry in
    pure JS and only calls these defensively. `ResizeObserver` is a no-op.
*/
function augmentWindow(window: any): void {
  if (!window.ResizeObserver) {
    window.ResizeObserver = class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    };
  }
  const proto = window.SVGElement && window.SVGElement.prototype;
  if (proto) {
    if (!proto.getTotalLength) proto.getTotalLength = () => 0;
    if (!proto.getPointAtLength) proto.getPointAtLength = () => ({x: 0, y: 0});
    if (!proto.getComputedTextLength) proto.getComputedTextLength = () => 0;
    if (!proto.getBBox)
      proto.getBBox = () => ({x: 0, y: 0, width: 0, height: 0});
  }
  // Stable id generation without a real crypto (matches the parity test's shim).
  const c = window.crypto || (globalThis as any).crypto;
  if (c && !c.randomUUID) {
    let n = 0;
    c.randomUUID = () =>
      "00000000-0000-4000-8000-" + String(n++).padStart(12, "0");
  }
}

/**
    Creates a fresh jsdom window. Imported dynamically so `jsdom` is only
    required when a caller doesn't bring their own `window`.
*/
async function createJsdomWindow(html: string): Promise<any> {
  let JSDOM: any;
  try {
    ({JSDOM} = await import("jsdom"));
  } catch {
    throw new Error(
      "@d3plus/ssr: no `window` was provided and the optional peer dependency " +
        "`jsdom` is not installed. Install jsdom, or pass your own `window` " +
        "(e.g. from linkedom) via the `window` option.",
    );
  }
  return new JSDOM(html).window;
}

/** Extra globals mirrored beyond {@link GLOBAL_KEYS} (window/document itself). */
const CORE_KEYS = ["window", "document", "navigator"];

/**
    Stands up a headless DOM and mirrors its globals onto `globalThis` so d3plus
    can render. Returns a {@link DomEnv} whose `teardown()` restores the previous
    global state exactly — nothing is left mutated after a render.

    Prefer {@link withDom} unless you need to manage the lifecycle yourself.
*/
export async function installDom(opts: DomEnvOptions = {}): Promise<DomEnv> {
  const window = opts.window ?? (await createJsdomWindow(opts.html ?? DEFAULT_HTML));
  augmentWindow(window);
  const {document} = window;

  const keys = [...new Set([...CORE_KEYS, ...GLOBAL_KEYS, "ResizeObserver"])];
  const g = globalThis as any;

  // Snapshot each global's current state up front so teardown restores it
  // exactly (rather than deleting — which would clobber Node natives some code
  // relies on, e.g. `URL`).
  const originals = keys.map(key => ({
    key,
    had: Object.prototype.hasOwnProperty.call(g, key),
    value: g[key],
  }));

  for (const key of keys) {
    // `window`/`document` resolve to themselves on the window. Some globals are
    // read-only natives on newer Node (e.g. `navigator`); skip those.
    try {
      g[key] = key === "window" ? window : window[key];
    } catch {
      /* read-only native global — leave as-is */
    }
  }

  return {
    window,
    document,
    teardown(): void {
      for (const {key, had, value} of originals) {
        try {
          if (!had) delete g[key];
          else g[key] = value;
        } catch {
          /* read-only native — leave as-is */
        }
      }
    },
  };
}

/**
    Runs `fn` with a headless DOM installed, tearing it down afterward even if
    `fn` throws. The `DomEnv` is passed to `fn` for access to `window`/`document`.
*/
export async function withDom<T>(
  opts: DomEnvOptions,
  fn: (env: DomEnv) => Promise<T> | T,
): Promise<T> {
  const env = await installDom(opts);
  try {
    return await fn(env);
  } finally {
    env.teardown();
  }
}
