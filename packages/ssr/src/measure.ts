/* eslint-disable @typescript-eslint/no-explicit-any */

/**
    @module measure
    Ensures the text-measurement engine (`@chenglou/pretext`, used by
    `@d3plus/dom`) has a canvas 2D context in Node.

    pretext looks for a global `OffscreenCanvas`, then falls back to
    `document.createElement('canvas')`. Node has neither natively. We shim
    `OffscreenCanvas` over `@napi-rs/canvas` so:
      - measurement works with just jsdom + @napi-rs/canvas (no separate `canvas`
        package), matching the declared peer dependencies; and
      - text is measured by the SAME engine (skia) that paints the PNG, so
        measured widths match rendered widths exactly.

    If `@napi-rs/canvas` isn't installed we leave the environment untouched and
    let pretext fall back to a DOM canvas (jsdom + the `canvas` package), or throw
    its own clear error if neither is available.
*/
export async function installMeasureContext(): Promise<() => void> {
  const g = globalThis as any;
  // A usable measure context already exists (real browser, worker, or a prior
  // shim) — nothing to do.
  if (typeof g.OffscreenCanvas !== "undefined") return () => {};

  let createCanvas: ((w: number, h: number) => any) | undefined;
  try {
    ({createCanvas} = await import("@napi-rs/canvas"));
  } catch {
    // No native canvas — defer to pretext's document.createElement fallback.
    return () => {};
  }
  if (!createCanvas) return () => {};

  const had = Object.prototype.hasOwnProperty.call(g, "OffscreenCanvas");
  const prev = g.OffscreenCanvas;
  // A constructor returning an object yields that object from `new`, so
  // `new OffscreenCanvas(w, h)` produces a native canvas pretext can measure on.
  function OffscreenCanvasShim(this: any, w: number, h: number): any {
    return createCanvas!(w, h);
  }
  g.OffscreenCanvas = OffscreenCanvasShim;

  return () => {
    if (!had) delete g.OffscreenCanvas;
    else g.OffscreenCanvas = prev;
  };
}
