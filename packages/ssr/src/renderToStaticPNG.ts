import {setCanvasBackend} from "@d3plus/render";

import {withDom} from "./env.js";
import {resolveSize} from "./types.js";
import type {RenderableViz, StaticRenderOptions} from "./types.js";
import {createNapiBackend, loadNapiCanvas} from "./napiBackend.js";
import type {NapiBackendOptions, ServerCanvas} from "./napiBackend.js";
import {resolveGeomapTiles} from "./geomapTiles.js";
import {installMeasureContext} from "./measure.js";

/**
    @interface RasterRenderOptions
    Options for the raster (canvas/PNG) helpers.
*/
export interface RasterRenderOptions
  extends StaticRenderOptions,
    NapiBackendOptions {
  /**
      Device-pixel ratio (backing-store scale) for the output. Higher values
      yield sharper, larger rasters. Defaults to 2.
  */
  pixelRatio?: number;
}

/**
    Renders a d3plus chart to a native canvas in Node using `@napi-rs/canvas`,
    with no browser. Returns the canvas so callers can encode to any supported
    format (`canvas.encode("png")`, `.toBuffer("image/jpeg")`, …) or pipe it.

    Prefer {@link renderToStaticPNG} when you just want PNG bytes.

    @param viz A configured chart instance (data + accessors already set).
    @param opts Output size, pixelRatio, fonts, and DOM options.
*/
export async function renderToCanvas(
  viz: RenderableViz,
  opts: RasterRenderOptions = {},
): Promise<ServerCanvas> {
  const {width, height} = resolveSize(viz, opts);
  const napi = await loadNapiCanvas();
  const handle = createNapiBackend(napi, opts);
  setCanvasBackend(handle.backend);
  // Measure text with the same (skia) engine that paints, so widths match.
  const restoreMeasure = await installMeasureContext();
  try {
    return await withDom(opts, async ({document}) => {
      const container = document.createElement("div");
      document.body.appendChild(container);
      // Fixes the backing-store scale (read by Viz at renderer mount).
      viz._scenePixelRatio = opts.pixelRatio ?? 2;
      // `_ssr` tells Geomap to composite its ocean/tiles into the scene (canvas).
      viz._ssr = true;
      viz
        .select(container)
        .renderer("canvas")
        .width(width)
        .height(height)
        .detectVisible(false)
        .duration(0);
      const render = (): Promise<void> =>
        new Promise<void>(resolve => viz.render(() => resolve()));
      await render();
      // Geomap only: fetch + inline basemap tiles, then re-render into the scene.
      await resolveGeomapTiles(viz, opts, render);
      // Wait for async images/textures/tiles to decode before reading pixels.
      const r = viz._sceneRenderer;
      if (r && typeof r.whenSettled === "function") await r.whenSettled();
      const canvas = viz.toCanvas();
      if (!canvas)
        throw new Error(
          "@d3plus/ssr: the canvas backend produced no surface — ensure the " +
            "chart supports canvas rendering.",
        );
      return canvas as unknown as ServerCanvas;
    });
  } finally {
    // Restore the default (browser) backend + any globals napi bound.
    setCanvasBackend(null);
    handle.restore();
    restoreMeasure();
  }
}

/**
    Renders a d3plus chart to a PNG `Buffer` in Node, with no browser.

    @param viz A configured chart instance (data + accessors already set).
    @param opts Output size, pixelRatio, fonts, and DOM options.
    @returns PNG image bytes (a Node `Buffer`, typed as the `Uint8Array` it
    extends so consumers don't need `@types/node`).

    @example
    ```js
    import {Treemap} from "@d3plus/core";
    import {renderToStaticPNG} from "@d3plus/ssr";
    import {writeFileSync} from "node:fs";
    const png = await renderToStaticPNG(
      new Treemap().data(data).groupBy("id"),
      {width: 600, height: 400, pixelRatio: 2},
    );
    writeFileSync("chart.png", png);
    ```
*/
export async function renderToStaticPNG(
  viz: RenderableViz,
  opts: RasterRenderOptions = {},
): Promise<Uint8Array> {
  const canvas = await renderToCanvas(viz, opts);
  return canvas.encode("png");
}
