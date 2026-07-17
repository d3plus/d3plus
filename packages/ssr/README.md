# @d3plus/ssr

[![NPM version](https://img.shields.io/npm/v/@d3plus/ssr.svg)](https://www.npmjs.com/package/@d3plus/ssr)
[![codecov](https://codecov.io/gh/d3plus/d3plus/graph/badge.svg?flag=ssr)](https://codecov.io/gh/d3plus/d3plus/flags)

Server-side rendering for d3plus visualizations — render charts to SVG strings and PNG buffers in Node, with no browser.

## Installing

If using npm, `npm install @d3plus/ssr`. Otherwise, you can download the [latest release from GitHub](https://github.com/d3plus/d3plus/releases/latest) or load from a [CDN](https://cdn.jsdelivr.net/npm/@d3plus/ssr).

```js
import {*} from "@d3plus/ssr";
```

In a vanilla environment, a `d3plus` global is exported from the pre-bundled version:

```html
<script src="https://cdn.jsdelivr.net/npm/@d3plus/ssr"></script>
<script>
  console.log(d3plus);
</script>
```

## Examples

Live examples can be found on [d3plus.org](https://d3plus.org/), which includes a collection of example visualizations using [@d3plus/react](https://github.com/d3plus/d3plus/tree/main/packages/react).

## API Reference

| Functions | Description |
| --- | --- |
| [`installDom`](#installdom) | Stands up a headless DOM and mirrors its globals onto `globalThis` so d3plus |
| [`renderToCanvas`](#rendertocanvas) | Renders a d3plus chart to a native canvas in Node using `@napi-rs/canvas`, |
| [`renderToStaticPNG`](#rendertostaticpng) | Renders a d3plus chart to a PNG `Buffer` in Node, with no browser. |
| [`renderToStaticSVG`](#rendertostaticsvg) | Renders a d3plus chart to a standalone SVG string in Node, with no browser. |
| [`withDom`](#withdom) | Runs `fn` with a headless DOM installed, tearing it down afterward even if |

| Interfaces | Description |
| --- | --- |
| [`DomEnv`](#domenv) | DomEnv |
| [`DomEnvOptions`](#domenvoptions) | DomEnvOptions |
| [`GeomapTileOptions`](#geomaptileoptions) | GeomapTileOptions |
| [`NapiBackendOptions`](#napibackendoptions) | NapiBackendOptions |
| [`RasterRenderOptions`](#rasterrenderoptions) | RasterRenderOptions |
| [`RenderableViz`](#renderableviz) | RenderableViz |
| [`ServerCanvas`](#servercanvas) | ServerCanvas |
| [`StaticRenderOptions`](#staticrenderoptions) | StaticRenderOptions |

## Functions

<a id="installdom"></a>

### installDom()

> **installDom**(`opts?`: [`DomEnvOptions`](#domenvoptions)): `Promise`\<[`DomEnv`](#domenv)\>

Defined in: [env.ts:94](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/env.ts#L94)

Stands up a headless DOM and mirrors its globals onto `globalThis` so d3plus
can render. Returns a [DomEnv](#domenv) whose `teardown()` restores the previous
global state exactly — nothing is left mutated after a render.

Prefer [withDom](#withdom) unless you need to manage the lifecycle yourself.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`DomEnvOptions`](#domenvoptions) |

#### Returns

`Promise`\<[`DomEnv`](#domenv)\>

***

<a id="rendertocanvas"></a>

### renderToCanvas()

> **renderToCanvas**(`viz`: [`RenderableViz`](#renderableviz), `opts?`: [`RasterRenderOptions`](#rasterrenderoptions)): `Promise`\<[`ServerCanvas`](#servercanvas)\>

Defined in: [renderToStaticPNG.ts:35](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/renderToStaticPNG.ts#L35)

Renders a d3plus chart to a native canvas in Node using `@napi-rs/canvas`,
with no browser. Returns the canvas so callers can encode to any supported
format (`canvas.encode("png")`, `.toBuffer("image/jpeg")`, …) or pipe it.

Prefer [renderToStaticPNG](#rendertostaticpng) when you just want PNG bytes.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `viz` | [`RenderableViz`](#renderableviz) | A configured chart instance (data + accessors already set). |
| `opts` | [`RasterRenderOptions`](#rasterrenderoptions) | Output size, pixelRatio, fonts, and DOM options. |

#### Returns

`Promise`\<[`ServerCanvas`](#servercanvas)\>

***

<a id="rendertostaticpng"></a>

### renderToStaticPNG()

> **renderToStaticPNG**(`viz`: [`RenderableViz`](#renderableviz), `opts?`: [`RasterRenderOptions`](#rasterrenderoptions)): `Promise`\<`Uint8Array`\<`ArrayBufferLike`\>\>

Defined in: [renderToStaticPNG.ts:104](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/renderToStaticPNG.ts#L104)

Renders a d3plus chart to a PNG `Buffer` in Node, with no browser.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `viz` | [`RenderableViz`](#renderableviz) | A configured chart instance (data + accessors already set). |
| `opts` | [`RasterRenderOptions`](#rasterrenderoptions) | Output size, pixelRatio, fonts, and DOM options. |

#### Returns

`Promise`\<`Uint8Array`\<`ArrayBufferLike`\>\>

PNG image bytes (a Node `Buffer`, typed as the `Uint8Array` it
extends so consumers don't need `@types/node`).

#### Example

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

***

<a id="rendertostaticsvg"></a>

### renderToStaticSVG()

> **renderToStaticSVG**(`viz`: [`RenderableViz`](#renderableviz), `opts?`: [`StaticRenderOptions`](#staticrenderoptions)): `Promise`\<`string`\>

Defined in: [renderToStaticSVG.ts:31](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/renderToStaticSVG.ts#L31)

Renders a d3plus chart to a standalone SVG string in Node, with no browser.

Works for every non-map chart out of the box, and for `Geomap` in vector-only
mode (`.tiles(false)`); to include basemap tiles use [renderToStaticSVG](#rendertostaticsvg)
with a tiled Geomap, which fetches + inlines them (see the Geomap helper).

The chart is rendered into a throwaway headless DOM that is fully torn down
before this resolves — no globals are left mutated.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `viz` | [`RenderableViz`](#renderableviz) | A configured chart instance (data + accessors already set). |
| `opts` | [`StaticRenderOptions`](#staticrenderoptions) | Output size (required here or on the chart) and DOM options. |

#### Returns

`Promise`\<`string`\>

The serialized `<svg>` markup.

#### Example

```js
import {Treemap} from "@d3plus/core";
import {renderToStaticSVG} from "@d3plus/ssr";
const svg = await renderToStaticSVG(
  new Treemap().data(data).groupBy("id"),
  {width: 600, height: 400},
);
```

***

<a id="withdom"></a>

### withDom()

> **withDom**\<`T`\>(`opts`: [`DomEnvOptions`](#domenvoptions), `fn`: (`env`: [`DomEnv`](#domenv)) => `T` \| `Promise`\<`T`\>): `Promise`\<`T`\>

Defined in: [env.ts:141](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/env.ts#L141)

Runs `fn` with a headless DOM installed, tearing it down afterward even if
`fn` throws. The `DomEnv` is passed to `fn` for access to `window`/`document`.

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`DomEnvOptions`](#domenvoptions) |
| `fn` | (`env`: [`DomEnv`](#domenv)) => `T` \| `Promise`\<`T`\> |

#### Returns

`Promise`\<`T`\>

## Interfaces

<a id="domenv"></a>

### DomEnv

Defined in: [env.ts:25](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/env.ts#L25)

DomEnv
A live headless DOM whose globals are currently mirrored onto `globalThis`.
Always call [DomEnv.teardown](#teardown) when finished to restore the prior state.

#### Methods

<a id="teardown"></a>

##### teardown()

> **teardown**(): `void`

Defined in: [env.ts:29](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/env.ts#L29)

Restores every global `installDom` overrode to its prior value.

###### Returns

`void`

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-document"></a> `document` | `any` | [env.ts:27](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/env.ts#L27) |
| <a id="property-window"></a> `window` | `any` | [env.ts:26](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/env.ts#L26) |

***

<a id="domenvoptions"></a>

### DomEnvOptions

Defined in: [env.ts:9](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/env.ts#L9)

DomEnvOptions
Options controlling the headless DOM `installDom` stands up.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-html"></a> `html?` | `string` | HTML used to seed a freshly-created jsdom document. | [env.ts:17](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/env.ts#L17) |
| <a id="property-window-1"></a> `window?` | `any` | A ready-made `window` to render into (e.g. from `linkedom` for fast SVG-only rendering). When omitted, a fresh `jsdom` window is created — `jsdom` must then be installed (it is an optional peer dependency). | [env.ts:15](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/env.ts#L15) |

***

<a id="geomaptileoptions"></a>

### GeomapTileOptions

Defined in: [types.ts:29](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/types.ts#L29)

GeomapTileOptions
Server-side basemap tile fetching options, applied when rendering a `Geomap`
with tiles enabled. Ignored for other charts.

#### Extended by

- [`StaticRenderOptions`](#staticrenderoptions)

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-fetchtile"></a> `fetchTile?` | (`url`: `string`) => `Promise`\<`ArrayBuffer` \| `Uint8Array`\<`ArrayBufferLike`\> \| `null`\> | Custom tile fetcher — return the raw image bytes (or `null`/throw to skip) for a tile URL. Use this to add a cache, an API key, or a proxy. Defaults to the global `fetch`. | [types.ts:39](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/types.ts#L39) |
| <a id="property-tileconcurrency"></a> `tileConcurrency?` | `number` | Max tiles to fetch concurrently. Default 8. | [types.ts:31](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/types.ts#L31) |
| <a id="property-tiletimeout"></a> `tileTimeout?` | `number` | Per-tile fetch timeout in milliseconds. Default 15000. | [types.ts:33](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/types.ts#L33) |

***

<a id="napibackendoptions"></a>

### NapiBackendOptions

Defined in: [napiBackend.ts:24](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/napiBackend.ts#L24)

NapiBackendOptions
Raster-specific options for the native canvas backend.

#### Extended by

- [`RasterRenderOptions`](#rasterrenderoptions)

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-fonts"></a> `fonts?` | `string`[] | Font files (`.ttf`/`.otf`/`.woff2`) to register before rendering, so canvas text matches the chart's font families. Without registration native canvas falls back to its built-in fonts and text metrics can diverge. | [napiBackend.ts:32](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/napiBackend.ts#L32) |
| <a id="property-imagetimeout"></a> `imageTimeout?` | `number` | Milliseconds to wait for one image/tile decode before skipping it. Default 15000. | [napiBackend.ts:26](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/napiBackend.ts#L26) |

***

<a id="rasterrenderoptions"></a>

### RasterRenderOptions

Defined in: [renderToStaticPNG.ts:15](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/renderToStaticPNG.ts#L15)

RasterRenderOptions
Options for the raster (canvas/PNG) helpers.

#### Extends

- [`StaticRenderOptions`](#staticrenderoptions).[`NapiBackendOptions`](#napibackendoptions)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-fetchtile-1"></a> `fetchTile?` | (`url`: `string`) => `Promise`\<`ArrayBuffer` \| `Uint8Array`\<`ArrayBufferLike`\> \| `null`\> | Custom tile fetcher — return the raw image bytes (or `null`/throw to skip) for a tile URL. Use this to add a cache, an API key, or a proxy. Defaults to the global `fetch`. | [`StaticRenderOptions`](#staticrenderoptions).[`fetchTile`](#property-fetchtile-2) | [types.ts:39](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/types.ts#L39) |
| <a id="property-fonts-1"></a> `fonts?` | `string`[] | Font files (`.ttf`/`.otf`/`.woff2`) to register before rendering, so canvas text matches the chart's font families. Without registration native canvas falls back to its built-in fonts and text metrics can diverge. | [`NapiBackendOptions`](#napibackendoptions).[`fonts`](#property-fonts) | [napiBackend.ts:32](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/napiBackend.ts#L32) |
| <a id="property-height"></a> `height?` | `number` | Output height in pixels. Falls back to the chart's configured `height()`. | [`StaticRenderOptions`](#staticrenderoptions).[`height`](#property-height-2) | [types.ts:55](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/types.ts#L55) |
| <a id="property-html-1"></a> `html?` | `string` | HTML used to seed a freshly-created jsdom document. | [`StaticRenderOptions`](#staticrenderoptions).[`html`](#property-html-2) | [types.ts:62](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/types.ts#L62) |
| <a id="property-imagetimeout-1"></a> `imageTimeout?` | `number` | Milliseconds to wait for one image/tile decode before skipping it. Default 15000. | [`NapiBackendOptions`](#napibackendoptions).[`imageTimeout`](#property-imagetimeout) | [napiBackend.ts:26](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/napiBackend.ts#L26) |
| <a id="property-pixelratio"></a> `pixelRatio?` | `number` | Device-pixel ratio (backing-store scale) for the output. Higher values yield sharper, larger rasters. Defaults to 2. | - | [renderToStaticPNG.ts:22](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/renderToStaticPNG.ts#L22) |
| <a id="property-tileconcurrency-1"></a> `tileConcurrency?` | `number` | Max tiles to fetch concurrently. Default 8. | [`StaticRenderOptions`](#staticrenderoptions).[`tileConcurrency`](#property-tileconcurrency-2) | [types.ts:31](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/types.ts#L31) |
| <a id="property-tiletimeout-1"></a> `tileTimeout?` | `number` | Per-tile fetch timeout in milliseconds. Default 15000. | [`StaticRenderOptions`](#staticrenderoptions).[`tileTimeout`](#property-tiletimeout-2) | [types.ts:33](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/types.ts#L33) |
| <a id="property-width"></a> `width?` | `number` | Output width in pixels. Falls back to the chart's configured `width()`. Required (here or on the chart): without an explicit size a headless DOM has no layout to measure and the chart would silently size to the jsdom window (1024×768). | [`StaticRenderOptions`](#staticrenderoptions).[`width`](#property-width-2) | [types.ts:53](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/types.ts#L53) |
| <a id="property-window-2"></a> `window?` | `any` | A ready-made `window` to render into (e.g. from `linkedom`). Defaults to a fresh `jsdom` window (the optional `jsdom` peer dependency must be present). | [`StaticRenderOptions`](#staticrenderoptions).[`window`](#property-window-3) | [types.ts:60](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/types.ts#L60) |

***

<a id="renderableviz"></a>

### RenderableViz

Defined in: [types.ts:9](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/types.ts#L9)

RenderableViz
The structural surface `@d3plus/ssr` drives on a chart. Every d3plus chart
(`Treemap`, `BarChart`, `Geomap`, …) satisfies it; the index signature keeps
the helpers usable with any subclass without importing concrete classes.

#### Indexable

> \[`key`: `string`\]: `any`

#### Methods

<a id="detectvisible"></a>

##### detectVisible()

> **detectVisible**(`v`: `boolean`): `any`

Defined in: [types.ts:15](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/types.ts#L15)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `v` | `boolean` |

###### Returns

`any`

<a id="duration"></a>

##### duration()

> **duration**(`v`: `number`): `any`

Defined in: [types.ts:16](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/types.ts#L16)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `v` | `number` |

###### Returns

`any`

<a id="height"></a>

##### height()

###### Call Signature

> **height**(): `number` \| `undefined`

Defined in: [types.ts:13](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/types.ts#L13)

###### Returns

`number` \| `undefined`

###### Call Signature

> **height**(`v`: `number`): `any`

Defined in: [types.ts:14](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/types.ts#L14)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `v` | `number` |

###### Returns

`any`

<a id="render"></a>

##### render()

> **render**(`cb?`: () => `void`): `any`

Defined in: [types.ts:18](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/types.ts#L18)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `cb?` | () => `void` |

###### Returns

`any`

<a id="renderer"></a>

##### renderer()

> **renderer**(`v`: `"svg"` \| `"canvas"`): `any`

Defined in: [types.ts:17](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/types.ts#L17)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `v` | `"svg"` \| `"canvas"` |

###### Returns

`any`

<a id="select"></a>

##### select()

> **select**(`el`: `any`): `any`

Defined in: [types.ts:10](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/types.ts#L10)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `el` | `any` |

###### Returns

`any`

<a id="tocanvas"></a>

##### toCanvas()

> **toCanvas**(): `unknown`

Defined in: [types.ts:20](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/types.ts#L20)

###### Returns

`unknown`

<a id="tosvgstring"></a>

##### toSVGString()

> **toSVGString**(): `string`

Defined in: [types.ts:19](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/types.ts#L19)

###### Returns

`string`

<a id="width"></a>

##### width()

###### Call Signature

> **width**(): `number` \| `undefined`

Defined in: [types.ts:11](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/types.ts#L11)

###### Returns

`number` \| `undefined`

###### Call Signature

> **width**(`v`: `number`): `any`

Defined in: [types.ts:12](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/types.ts#L12)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `v` | `number` |

###### Returns

`any`

***

<a id="servercanvas"></a>

### ServerCanvas

Defined in: [napiBackend.ts:11](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/napiBackend.ts#L11)

ServerCanvas
The subset of a native (`@napi-rs/canvas`) canvas the raster helpers expose,
so the public API doesn't leak the optional peer's types to consumers who
haven't installed it.

#### Methods

<a id="encode"></a>

##### encode()

> **encode**(`format`: `"png"` \| `"jpeg"` \| `"webp"` \| `"avif"`, `quality?`: `number`): `Promise`\<`Uint8Array`\<`ArrayBufferLike`\>\>

Defined in: [napiBackend.ts:15](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/napiBackend.ts#L15)

Encode the surface to an image buffer (async). Resolves to a Node `Buffer`.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `format` | `"png"` \| `"jpeg"` \| `"webp"` \| `"avif"` |
| `quality?` | `number` |

###### Returns

`Promise`\<`Uint8Array`\<`ArrayBufferLike`\>\>

<a id="tobuffer"></a>

##### toBuffer()

> **toBuffer**(`mime`: `"image/png"` \| `"image/jpeg"`, ...`args`: `any`[]): `Uint8Array`

Defined in: [napiBackend.ts:17](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/napiBackend.ts#L17)

Encode the surface to an image buffer (sync). Returns a Node `Buffer`.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `mime` | `"image/png"` \| `"image/jpeg"` |
| ...`args` | `any`[] |

###### Returns

`Uint8Array`

#### Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-height-1"></a> `height` | `readonly` | `number` | [napiBackend.ts:13](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/napiBackend.ts#L13) |
| <a id="property-width-1"></a> `width` | `readonly` | `number` | [napiBackend.ts:12](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/napiBackend.ts#L12) |

***

<a id="staticrenderoptions"></a>

### StaticRenderOptions

Defined in: [types.ts:46](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/types.ts#L46)

StaticRenderOptions
Options shared by the static render helpers.

#### Extends

- [`GeomapTileOptions`](#geomaptileoptions)

#### Extended by

- [`RasterRenderOptions`](#rasterrenderoptions)

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-fetchtile-2"></a> `fetchTile?` | (`url`: `string`) => `Promise`\<`ArrayBuffer` \| `Uint8Array`\<`ArrayBufferLike`\> \| `null`\> | Custom tile fetcher — return the raw image bytes (or `null`/throw to skip) for a tile URL. Use this to add a cache, an API key, or a proxy. Defaults to the global `fetch`. | [`GeomapTileOptions`](#geomaptileoptions).[`fetchTile`](#property-fetchtile) | [types.ts:39](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/types.ts#L39) |
| <a id="property-height-2"></a> `height?` | `number` | Output height in pixels. Falls back to the chart's configured `height()`. | - | [types.ts:55](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/types.ts#L55) |
| <a id="property-html-2"></a> `html?` | `string` | HTML used to seed a freshly-created jsdom document. | - | [types.ts:62](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/types.ts#L62) |
| <a id="property-tileconcurrency-2"></a> `tileConcurrency?` | `number` | Max tiles to fetch concurrently. Default 8. | [`GeomapTileOptions`](#geomaptileoptions).[`tileConcurrency`](#property-tileconcurrency) | [types.ts:31](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/types.ts#L31) |
| <a id="property-tiletimeout-2"></a> `tileTimeout?` | `number` | Per-tile fetch timeout in milliseconds. Default 15000. | [`GeomapTileOptions`](#geomaptileoptions).[`tileTimeout`](#property-tiletimeout) | [types.ts:33](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/types.ts#L33) |
| <a id="property-width-2"></a> `width?` | `number` | Output width in pixels. Falls back to the chart's configured `width()`. Required (here or on the chart): without an explicit size a headless DOM has no layout to measure and the chart would silently size to the jsdom window (1024×768). | - | [types.ts:53](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/types.ts#L53) |
| <a id="property-window-3"></a> `window?` | `any` | A ready-made `window` to render into (e.g. from `linkedom`). Defaults to a fresh `jsdom` window (the optional `jsdom` peer dependency must be present). | - | [types.ts:60](https://github.com/d3plus/d3plus/blob/main/packages/ssr/src/types.ts#L60) |
