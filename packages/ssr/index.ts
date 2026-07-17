/**
    @module @d3plus/ssr
    Server-side rendering for d3plus visualizations. Renders any chart to an SVG
    string or a PNG buffer in Node, with no browser — see {@link renderToStaticSVG}
    and {@link renderToStaticPNG}. Lower-level helpers ({@link installDom},
    {@link withDom}) expose the headless-DOM lifecycle for advanced use.
*/

export {renderToStaticSVG} from "./src/renderToStaticSVG.js";
export {renderToStaticPNG, renderToCanvas} from "./src/renderToStaticPNG.js";
export type {RasterRenderOptions} from "./src/renderToStaticPNG.js";
export type {ServerCanvas, NapiBackendOptions} from "./src/napiBackend.js";
export {installDom, withDom} from "./src/env.js";
export type {DomEnv, DomEnvOptions} from "./src/env.js";
export type {RenderableViz, StaticRenderOptions, GeomapTileOptions} from "./src/types.js";
