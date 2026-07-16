/* eslint-disable @typescript-eslint/no-explicit-any */

/**
    @interface RenderableViz
    The structural surface `@d3plus/ssr` drives on a chart. Every d3plus chart
    (`Treemap`, `BarChart`, `Geomap`, …) satisfies it; the index signature keeps
    the helpers usable with any subclass without importing concrete classes.
*/
export interface RenderableViz {
  select(el: any): any;
  width(): number | undefined;
  width(v: number): any;
  height(): number | undefined;
  height(v: number): any;
  detectVisible(v: boolean): any;
  duration(v: number): any;
  renderer(v: "svg" | "canvas"): any;
  render(cb?: () => void): any;
  toSVGString(): string;
  toCanvas(): unknown;
  [key: string]: any;
}

/**
    @interface GeomapTileOptions
    Server-side basemap tile fetching options, applied when rendering a `Geomap`
    with tiles enabled. Ignored for other charts.
*/
export interface GeomapTileOptions {
  /** Max tiles to fetch concurrently. Default 8. */
  tileConcurrency?: number;
  /** Per-tile fetch timeout in milliseconds. Default 15000. */
  tileTimeout?: number;
  /**
      Custom tile fetcher — return the raw image bytes (or `null`/throw to skip)
      for a tile URL. Use this to add a cache, an API key, or a proxy. Defaults
      to the global `fetch`.
  */
  fetchTile?: (url: string) => Promise<ArrayBuffer | Uint8Array | null>;
}

/**
    @interface StaticRenderOptions
    Options shared by the static render helpers.
*/
export interface StaticRenderOptions extends GeomapTileOptions {
  /**
      Output width in pixels. Falls back to the chart's configured `width()`.
      Required (here or on the chart): without an explicit size a headless DOM
      has no layout to measure and the chart would silently size to the jsdom
      window (1024×768).
  */
  width?: number;
  /** Output height in pixels. Falls back to the chart's configured `height()`. */
  height?: number;
  /**
      A ready-made `window` to render into (e.g. from `linkedom`). Defaults to a
      fresh `jsdom` window (the optional `jsdom` peer dependency must be present).
  */
  window?: any;
  /** HTML used to seed a freshly-created jsdom document. */
  html?: string;
}

/**
    Resolves and validates output dimensions from options, falling back to the
    chart's configured size. Throws when neither yields a positive number.
*/
export function resolveSize(
  viz: RenderableViz,
  opts: StaticRenderOptions,
): {width: number; height: number} {
  const width = opts.width ?? viz.width();
  const height = opts.height ?? viz.height();
  if (!isPositive(width) || !isPositive(height))
    throw new Error(
      "@d3plus/ssr: an explicit width and height are required for server-side " +
        "rendering. Pass them via options (renderToStaticSVG(viz, {width, " +
        "height})) or set them on the chart (viz.width(...).height(...)).",
    );
  return {width, height};
}

function isPositive(n: unknown): n is number {
  return typeof n === "number" && isFinite(n) && n > 0;
}
