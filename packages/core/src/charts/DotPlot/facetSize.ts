/**
    One dot size for every small-multiples panel: each panel notes the
    diameter its own dots would fit at, and once every panel has drawn,
    the panels draw again at the smallest of them (see `FacetHooks.redraw`).
*/

import type {VizInstance} from "../viz/vizTypes.js";

/** The dot sizes noted across one small-multiples draw. */
export interface DotFacetSize {
  /** The diameter each panel (and probe panel) fit its dots at. */
  sizes: number[];
  /** The diameter every panel draws at, once settled. */
  shared?: number;
}

const facetSize = (viz: VizInstance): DotFacetSize | undefined =>
  (viz.ctx.dotPlot as {facet?: DotFacetSize} | undefined)?.facet;

/**
    Starts or ends a small-multiples draw's dot size as `_draw` runs: the
    chrome step starts a fresh one, and a draw outside small multiples
    drops it.
    @param viz The chart.
*/
export function trackFacetSize(viz: VizInstance): void {
  const state = viz.ctx.dotPlot as {facet?: DotFacetSize};
  if (viz._facetStep === "chrome") state.facet = {sizes: []};
  else if (!viz._facetStep) state.facet = undefined;
}

/**
    The diameter a panel's dots draw at: the settled shared size, else the
    panel's own fit (noted for settling). Outside small multiples, the fit.
    @param viz The chart.
    @param fitted The diameter this panel's dots fit at.
*/
export function panelDiameter(viz: VizInstance, fitted: number): number {
  const facet = facetSize(viz);
  if (!facet) return fitted;
  if (facet.shared !== undefined) return facet.shared;
  facet.sizes.push(fitted);
  return fitted;
}

/**
    Settles the panels' shared dot size on the smallest any panel fit.
    Returns true when a panel drew larger dots, so the panels draw again.
    @param viz The chart.
*/
export function settleFacetSize(viz: VizInstance): boolean {
  const facet = facetSize(viz);
  if (!facet || facet.shared !== undefined || !facet.sizes.length) return false;
  const smallest = Math.min(...facet.sizes);
  facet.shared = smallest;
  return facet.sizes.some(size => size > smallest);
}
