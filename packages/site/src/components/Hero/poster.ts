import * as core from "@d3plus/core";
import {renderToStaticSVG} from "@d3plus/ssr";
import type {RenderableViz} from "@d3plus/ssr";
import {fontFamily, fontFamilyStringify} from "@d3plus/text";

import type {Scene} from "./scenes.js";

type Chart = new () => RenderableViz & {
  config(config: Record<string, unknown>): RenderableViz;
};

/** The size a poster is drawn at, the desktop stage's; it scales to fit. */
export const POSTER_SIZE = {width: 570, height: 416};

/**
 * Makes an `<svg>` scale with its box: full width and height, its aspect kept,
 * and hidden from assistive technology (the poster only decorates).
 */
export function fitSvg(svg: string): string {
  return svg.replace(/^<svg\b[^>]*>/, tag =>
    tag
      .replace(/\swidth="[^"]*"/, ' width="100%"')
      .replace(/\sheight="[^"]*"/, ' height="100%"')
      .replace(
        />$/,
        ' preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">',
      ),
  );
}

const STACK = fontFamilyStringify(fontFamily).replace(/"/g, "'");

/**
 * Puts d3plus's whole font list back where the render wrote the one font it
 * found on the build machine, so each browser picks from the list the way a
 * live chart does instead of falling back to its default serif.
 */
export function fontStack(svg: string): string {
  return svg.replace(/font-family="([^"]*)"/g, (attr, family) =>
    fontFamily.includes(family) ? `font-family="${STACK}"` : attr,
  );
}

const posters = new Map<string, Promise<string>>();

/**
 * A scene drawn to static SVG at build time, so the hero shows a chart before
 * `@d3plus/core` has loaded in the browser. Each scene renders once per build.
 */
export function renderPoster(scene: Scene): Promise<string> {
  const key = scene.chart;
  if (!posters.has(key)) {
    const Chart = (core as unknown as Record<string, Chart>)[scene.chart];
    posters.set(
      key,
      renderToStaticSVG(new Chart().config(scene.config), POSTER_SIZE).then(
        svg => fontStack(fitSvg(svg)),
      ),
    );
  }
  return posters.get(key)!;
}
