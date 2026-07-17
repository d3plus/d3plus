/**
    @module canvas/backend
    A small injection seam so the Canvas backend can run outside a browser.

    In the browser the surface is a real `<canvas>` element and images decode
    via `new Image()`. On a server there is no DOM `<canvas>`; a native canvas
    implementation (e.g. `@napi-rs/canvas`) supplies a structurally-compatible
    canvas + an async image loader. `CanvasRenderer` obtains both through the
    active backend rather than touching `document`/`Image` directly, so the same
    paint code runs in both places. The default backend is the browser one, so
    nothing changes unless a caller installs a different backend.
*/

/**
    The canvas surface `CanvasRenderer` paints into. A browser `HTMLCanvasElement`
    and a native canvas both satisfy this; server backends return a native canvas
    cast to `HTMLCanvasElement` (the renderer only touches DOM-specific members —
    `style`, `className`, `remove`, listeners — behind the `dom` flag below).
*/
export interface CanvasBackend {
  /**
      Create a drawing surface. The browser backend returns a detached
      `<canvas>` (sized later by `resize`); native backends should honor the
      passed dimensions.
  */
  createCanvas(width: number, height: number): HTMLCanvasElement;
  /** Decode an image source (URL or `data:` URI) to a drawable, ready image. */
  loadImage(src: string): Promise<HTMLImageElement>;
  /**
      Whether created canvases are real DOM elements that can be inserted into a
      container, styled, and receive pointer listeners. Defaults to `true`.
      Server backends set this `false`: the renderer then skips all DOM mounting
      and interaction wiring and only produces pixels.
  */
  dom?: boolean;
}

/** The browser backend: a real `<canvas>` and `Image`-based decoding. */
const domBackend: CanvasBackend = {
  dom: true,
  createCanvas: () => document.createElement("canvas"),
  loadImage: src =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    }),
};

let current: CanvasBackend = domBackend;

/**
    Install the canvas backend `CanvasRenderer` uses. Pass `null` to restore the
    default browser backend. Server code (e.g. `@d3plus/ssr`) installs a native
    backend before rendering and restores the default afterward.
*/
export function setCanvasBackend(backend: CanvasBackend | null): void {
  current = backend ?? domBackend;
}

/** The currently-active canvas backend. */
export function getCanvasBackend(): CanvasBackend {
  return current;
}
