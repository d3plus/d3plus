/**
    The config a Geomap cartogram adds, and how small multiples share its
    sizes.

    @module
*/

import type {DataPoint} from "@d3plus/data";

import type {ConfigField} from "../../fluent.js";
import type {FacetHooks, FacetPanelContext} from "../facet/facetConfig.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {cartogramKind, cartogramValue} from "./cartogramLayout.js";

/** Geomap's cartogram fields. */
export function cartogramFields(): ConfigField[] {
  return [
    /**
        Redraws the map as a cartogram, its regions sized by `cartogramSize`:
        `"dorling"` draws each region as a circle and `"demers"` as a square,
        its area in proportion to the region's value, set at the region's
        center and nudged apart until none overlap. `false` draws the map.
        @type {"dorling" | "demers" | false}
    */
    {key: "cartogram", default: false},
    /**
        The gap left between neighboring cartogram shapes, in pixels.
        @type {number}
    */
    {key: "cartogramPadding", default: 1},
    /**
        The value that sizes each region in a `cartogram`: a data key or an
        accessor function. Defaults to the `colorScale` value.
        @type {string | function}
    */
    {key: "cartogramSize", coerce: "accessor"},
  ];
}

/** The sum of the values a panel's cartogram sizes. */
function panelTotal(viz: VizInstance, rows: DataPoint[]): number {
  return rows.reduce((sum, d, i) => {
    const v = cartogramValue(viz, d, i);
    return v > 0 ? sum + v : sum;
  }, 0);
}

/**
    Geomap's small-multiple hooks: with shared scales (the default), every
    panel's cartogram sizes its shapes against the panel with the largest
    total, so the same value draws the same size in every panel.
*/
export const geomapFacetHooks: FacetHooks = {
  share: (viz, panels) =>
    cartogramKind(viz)
      ? Math.max(0, ...panels.map(rows => panelTotal(viz, rows)))
      : undefined,
  panel: (viz: VizInstance, ctx: FacetPanelContext) => {
    const saved = viz.ctx.cartogramTotal;
    const total = ctx.shared ? (ctx.scales as number | undefined) : undefined;
    viz.ctx.cartogramTotal = total || undefined;
    return () => {
      viz.ctx.cartogramTotal = saved;
    };
  },
};
