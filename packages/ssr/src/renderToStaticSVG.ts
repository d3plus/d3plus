import {withDom} from "./env.js";
import {resolveSize} from "./types.js";
import type {RenderableViz, StaticRenderOptions} from "./types.js";
import {resolveGeomapTiles} from "./geomapTiles.js";
import {installMeasureContext} from "./measure.js";

/**
    Renders a d3plus chart to a standalone SVG string in Node, with no browser.

    Works for every non-map chart out of the box, and for `Geomap` in vector-only
    mode (`.tiles(false)`); to include basemap tiles use {@link renderToStaticSVG}
    with a tiled Geomap, which fetches + inlines them (see the Geomap helper).

    The chart is rendered into a throwaway headless DOM that is fully torn down
    before this resolves — no globals are left mutated.

    @param viz A configured chart instance (data + accessors already set).
    @param opts Output size (required here or on the chart) and DOM options.
    @returns The serialized `<svg>` markup.

    @example
    ```js
    import {Treemap} from "@d3plus/core";
    import {renderToStaticSVG} from "@d3plus/ssr";
    const svg = await renderToStaticSVG(
      new Treemap().data(data).groupBy("id"),
      {width: 600, height: 400},
    );
    ```
*/
export async function renderToStaticSVG(
  viz: RenderableViz,
  opts: StaticRenderOptions = {},
): Promise<string> {
  const {width, height} = resolveSize(viz, opts);
  // Give the text-measurement engine a canvas context (via @napi-rs/canvas)
  // before rendering; restore globals afterward.
  const restoreMeasure = await installMeasureContext();
  try {
    return await withDom(opts, async ({document}) => {
      const container = document.createElement("div");
      document.body.appendChild(container);
      // `_ssr` tells Geomap to emit its ocean (and tiles) into the scene graph so
      // the serialized SVG is complete (those normally live in a separate <svg>).
      viz._ssr = true;
      viz
        .select(container)
        .renderer("svg")
        .width(width)
        .height(height)
        // detectVisible defers rendering until the container enters the viewport;
        // a headless container never does, so disable it. duration(0) skips the
        // animation timeline so the first paint is the final frame.
        .detectVisible(false)
        .duration(0);
      const render = (): Promise<void> =>
        new Promise<void>(resolve => viz.render(() => resolve()));
      await render();
      // Geomap only: fetch + inline basemap tiles, then re-render so they appear
      // in the scene. A no-op for other charts and vector-only maps.
      await resolveGeomapTiles(viz, opts, render);
      return viz.toSVGString();
    });
  } finally {
    restoreMeasure();
  }
}
