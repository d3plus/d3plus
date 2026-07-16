import type {CanvasBackend} from "@d3plus/render";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
    @interface ServerCanvas
    The subset of a native (`@napi-rs/canvas`) canvas the raster helpers expose,
    so the public API doesn't leak the optional peer's types to consumers who
    haven't installed it.
*/
export interface ServerCanvas {
  readonly width: number;
  readonly height: number;
  /** Encode the surface to an image buffer (async). Resolves to a Node `Buffer`. */
  encode(format: "png" | "jpeg" | "webp" | "avif", quality?: number): Promise<Uint8Array>;
  /** Encode the surface to an image buffer (sync). Returns a Node `Buffer`. */
  toBuffer(mime: "image/png" | "image/jpeg", ...args: any[]): Uint8Array;
}

/**
    @interface NapiBackendOptions
    Raster-specific options for the native canvas backend.
*/
export interface NapiBackendOptions {
  /** Milliseconds to wait for one image/tile decode before skipping it. Default 15000. */
  imageTimeout?: number;
  /**
      Font files (`.ttf`/`.otf`/`.woff2`) to register before rendering, so canvas
      text matches the chart's font families. Without registration native canvas
      falls back to its built-in fonts and text metrics can diverge.
  */
  fonts?: string[];
}

/**
    @interface NapiHandle
    An installed native backend plus a `restore()` that undoes the globals it set.
*/
export interface NapiHandle {
  backend: CanvasBackend;
  restore(): void;
}

/**
    Dynamically imports `@napi-rs/canvas`, throwing a clear error when the
    optional peer dependency isn't installed.
*/
export async function loadNapiCanvas(): Promise<any> {
  try {
    return await import("@napi-rs/canvas");
  } catch {
    throw new Error(
      "@d3plus/ssr: PNG/canvas rendering requires the optional peer dependency " +
        "`@napi-rs/canvas`. Install it (e.g. `npm i @napi-rs/canvas`) to render " +
        "rasters, or use renderToStaticSVG for vector output.",
    );
  }
}

/**
    Builds a headless {@link CanvasBackend} backed by `@napi-rs/canvas` and binds
    the globals the canvas paint path reads (`Path2D`). Call {@link NapiHandle.restore}
    when done to undo those globals.
*/
export function createNapiBackend(
  napi: any,
  opts: NapiBackendOptions = {},
): NapiHandle {
  const timeout = opts.imageTimeout ?? 15000;

  if (opts.fonts && napi.GlobalFonts)
    for (const f of opts.fonts) napi.GlobalFonts.registerFromPath(f);

  const backend: CanvasBackend = {
    dom: false,
    createCanvas: (w, h) => napi.createCanvas(w, h) as unknown as HTMLCanvasElement,
    // Race the decode against a timeout so a hung remote URL can't stall
    // `whenSettled()` forever; a rejected load is skipped by the renderer.
    loadImage: src => {
      let timer: ReturnType<typeof setTimeout>;
      const timed = new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                `@d3plus/ssr: image load timed out after ${timeout}ms: ` +
                  `${String(src).slice(0, 80)}`,
              ),
            ),
          timeout,
        );
      });
      return Promise.race([napi.loadImage(src), timed]).finally(() =>
        clearTimeout(timer),
      ) as Promise<HTMLImageElement>;
    },
  };

  // canvasNodePaint builds `new Path2D(d)` (and clips) off the global scope.
  // jsdom provides none, so bind napi's for the duration of the render.
  const g = globalThis as any;
  const hadPath2D = Object.prototype.hasOwnProperty.call(g, "Path2D");
  const prevPath2D = g.Path2D;
  if (napi.Path2D) g.Path2D = napi.Path2D;

  return {
    backend,
    restore(): void {
      if (!hadPath2D) delete g.Path2D;
      else g.Path2D = prevPath2D;
    },
  };
}
