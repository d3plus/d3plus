/**
    Small multiples for the polar charts (see `facet/facetConfig.ts`). Each
    panel fits its value domain (rings, ticks) to its own rows by default, so
    panels compare shape. With `facetConfig.scales` set to `"shared"`, every
    panel's domain also covers the values of every other panel, so the panels
    share one domain and compare magnitude.

    @module
*/
import type {DataPoint} from "@d3plus/data";

import type {FacetHooks, FacetPanelContext} from "../facet/facetConfig.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** The values a panel's domain is fit to, given its rows. */
export type PolarDomainValues = (
  viz: VizInstance,
  rows: DataPoint[],
) => number[];

/** The value domain every panel shares: the extent of all panels' domain values. */
export interface PolarFacetScale {
  /** `[min, max]`, or empty when no panel has a finite value. */
  extent: number[];
}

/** The extent of every panel's domain values. */
export function sharePolarScale(
  viz: VizInstance,
  panels: DataPoint[][],
  domainValues: PolarDomainValues,
): PolarFacetScale {
  const values = panels
    .flatMap(rows => domainValues(viz, rows))
    .filter(Number.isFinite);
  return {
    extent: values.length ? [Math.min(...values), Math.max(...values)] : [],
  };
}

/** Applies the shared domain (when panels share one) to a panel's draw; returns the undo. */
export function polarFacetPanel(
  viz: VizInstance,
  ctx: FacetPanelContext,
): () => void {
  const saved = viz.ctx.polarSharedExtent;
  const scale = ctx.scales as PolarFacetScale | undefined;
  viz.ctx.polarSharedExtent = ctx.shared && scale ? scale.extent : undefined;
  return () => {
    viz.ctx.polarSharedExtent = saved;
  };
}

/**
    The values a layout fits its domain to, beyond its own: the shared
    extent while a small-multiples panel draws with shared scales, else none.
*/
export function polarSharedExtent(viz: VizInstance): number[] {
  const extent = viz.ctx.polarSharedExtent;
  return Array.isArray(extent) ? (extent as number[]) : [];
}

/**
    A polar chart's small-multiple hooks: square-ish panels, each fit to its
    own values unless `facetConfig.scales` asks them to share one domain.
*/
export function polarFacetHooks(domainValues: PolarDomainValues): FacetHooks {
  return {
    aspect: 1,
    scales: "independent",
    share: (viz, panels) => sharePolarScale(viz, panels, domainValues),
    panel: polarFacetPanel,
  };
}
