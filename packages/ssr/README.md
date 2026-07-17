# @d3plus/ssr

[![NPM version](https://img.shields.io/npm/v/@d3plus/ssr.svg)](https://www.npmjs.com/package/@d3plus/ssr)

Server-side rendering for d3plus visualizations. Render any chart to an **SVG string** or a **PNG buffer** in Node — with no browser.

Every chart type is supported, including **Geomap** (basemap tiles are fetched and inlined server-side) and the **canvas** backend (raster output). Output is self-contained: no remote references, no client-side hydration required.

## Installing

```bash
npm install @d3plus/ssr @d3plus/core
```

`@d3plus/ssr` has two optional peer dependencies, loaded on demand:

- **[`jsdom`](https://www.npmjs.com/package/jsdom)** — the default headless DOM (or bring your own `window`).
- **[`@napi-rs/canvas`](https://www.npmjs.com/package/@napi-rs/canvas)** — text measurement and PNG rasterization (prebuilt binaries, no system libraries required).

```bash
npm install jsdom @napi-rs/canvas
```

Both are needed for SVG output (jsdom builds the SVG, `@napi-rs/canvas` measures text). PNG output uses `@napi-rs/canvas` for rasterization as well.

## Quick start

### SVG string

```js
import {Treemap} from "@d3plus/core";
import {renderToStaticSVG} from "@d3plus/ssr";

const svg = await renderToStaticSVG(
  new Treemap()
    .data([
      {parent: "Group A", id: "alpha", value: 29},
      {parent: "Group A", id: "beta", value: 10},
      {parent: "Group B", id: "gamma", value: 22},
    ])
    .groupBy(["parent", "id"]),
  {width: 600, height: 400},
);
// -> "<svg xmlns=…>…</svg>"
```

### PNG buffer

```js
import {BarChart} from "@d3plus/core";
import {renderToStaticPNG} from "@d3plus/ssr";
import {writeFileSync} from "node:fs";

const png = await renderToStaticPNG(
  new BarChart().data(data).groupBy("id").x("id").y("value"),
  {width: 600, height: 400, pixelRatio: 2},
);
writeFileSync("chart.png", png); // PNG bytes (a Node Buffer)
```

### Geomap with basemap tiles

Tiles are fetched over the network at render time, decoded, and inlined into the
output — the resulting SVG/PNG is fully self-contained.

```js
import {Geomap} from "@d3plus/core";
import {renderToStaticPNG} from "@d3plus/ssr";

const png = await renderToStaticPNG(
  new Geomap()
    .data([{city: "Tokyo", coords: [139.7, 35.7], value: 14}])
    .point(d => d.coords)
    .pointSize(d => d.value)
    .groupBy("city"),
  {width: 800, height: 500},
);
```

Call `.tiles(false)` for a vector-only map (no network). Provide a `fetchTile`
option to add caching, an API key, or a proxy:

```js
await renderToStaticPNG(map, {
  width: 800,
  height: 500,
  fetchTile: async url => myCache.get(url) ?? fetch(url).then(r => r.arrayBuffer()),
});
```

## API

### `renderToStaticSVG(viz, options?) => Promise<string>`

Renders `viz` to a standalone SVG string.

### `renderToStaticPNG(viz, options?) => Promise<Uint8Array>`

Renders `viz` to PNG bytes (a Node `Buffer`, typed as the `Uint8Array` it extends).

### `renderToCanvas(viz, options?) => Promise<ServerCanvas>`

Renders `viz` to a native `@napi-rs/canvas` canvas — use it to encode other
formats (`canvas.encode("jpeg")`, `canvas.toBuffer("image/png")`) or to pipe.

#### Options

| Option | Type | Applies to | Description |
| --- | --- | --- | --- |
| `width` | `number` | all | Output width (required here or via `viz.width()`). |
| `height` | `number` | all | Output height (required here or via `viz.height()`). |
| `pixelRatio` | `number` | PNG/canvas | Backing-store scale. Default `2`. |
| `fonts` | `string[]` | PNG/canvas | Font files to register for accurate text. |
| `window` | `Window` | all | A custom DOM window (e.g. from `linkedom`); defaults to jsdom. |
| `tileConcurrency` | `number` | Geomap | Max concurrent tile fetches. Default `8`. |
| `tileTimeout` | `number` | Geomap | Per-tile fetch timeout (ms). Default `15000`. |
| `fetchTile` | `(url) => Promise<bytes>` | Geomap | Custom tile fetcher (cache/proxy/auth). |

### Lower-level helpers

- `installDom(options?) => Promise<DomEnv>` — stand up a headless DOM and mirror
  its globals; call `env.teardown()` when finished.
- `withDom(options, fn)` — run `fn` with a headless DOM installed, torn down
  afterward (even on throw).

## Notes

- **Dimensions are required.** Pass `width`/`height` (or set them on the chart);
  a headless DOM has no layout to auto-size against.
- **Fonts.** For pixel-accurate PNG text, register the chart's fonts via the
  `fonts` option — otherwise `@napi-rs/canvas` uses its built-in fonts.
- **Globals are restored.** Each render installs a temporary DOM and tears it
  down afterward; nothing is left mutated on `globalThis`.
