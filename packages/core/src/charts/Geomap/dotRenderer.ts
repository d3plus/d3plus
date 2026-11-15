/**
    How a Geomap picks its renderer for `dotDensity`: past the dots SVG
    draws quickly, a chart whose `renderer` was never set draws on Canvas,
    and back on SVG once its dots fit again.

    @module
*/

import type {VizInstance} from "../viz/vizTypes.js";

/** The most dots drawn on SVG before a chart switches itself to Canvas. */
export const DOT_SVG_MAX = 20000;

/** The charts whose `renderer` was set by the user. */
const chosen = new WeakSet<object>();
/** The charts drawing on Canvas because of their dots. */
const switched = new WeakSet<object>();
/** The charts that have logged their switch to Canvas. */
const noted = new WeakSet<object>();

/**
    Remembers when the chart's `renderer` is set, so the dots never
    override a renderer the user chose.
    @param viz The Geomap.
*/
export function trackRendererChoice(viz: VizInstance): void {
  const host = viz as unknown as {renderer: (_?: unknown) => unknown};
  const base = host.renderer.bind(viz);
  host.renderer = function (_?: unknown) {
    if (!arguments.length) return base();
    chosen.add(viz);
    switched.delete(viz);
    return base(_);
  };
}

/** Whether the chart's renderer was set by the user. */
export function rendererChosen(viz: VizInstance): boolean {
  return chosen.has(viz);
}

/**
    Switches a chart whose `renderer` was never set to Canvas when it draws
    more than `DOT_SVG_MAX` dots, logging it once, and back to SVG when it
    draws fewer. A small-multiples panel only switches to Canvas, so one
    panel with few dots doesn't undo another's switch.
    @param viz The Geomap.
    @param dots How many dots the draw places.
*/
export function syncDotRenderer(viz: VizInstance, dots: number): void {
  if (chosen.has(viz)) return;
  if (dots > DOT_SVG_MAX) {
    if (viz._renderer === "canvas") return;
    viz._renderer = "canvas";
    switched.add(viz);
    if (!noted.has(viz)) {
      noted.add(viz);
      console.info(
        `d3plus: Geomap draws its ${dots} dots on Canvas, past the ${DOT_SVG_MAX} it draws on SVG. Set \`renderer\` to choose one.`,
      );
    }
  } else if (switched.has(viz) && viz._facetStep !== "panel") {
    viz._renderer = "svg";
    switched.delete(viz);
  }
}
