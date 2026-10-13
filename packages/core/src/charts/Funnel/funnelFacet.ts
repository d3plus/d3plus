/**
    Small multiples for Funnel (see `facet/facetConfig.ts`). Each panel sizes
    its stages against its own largest stage by default, so panels compare
    shape. With `facetConfig.scales` set to `"shared"`, every panel measures
    against the largest stage across all panels, so panels compare volume.

    @module
*/
import type {DataPoint} from "@d3plus/data";

import type {FacetHooks, FacetPanelContext} from "../facet/facetConfig.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {largestValue} from "./funnelGeometry.js";

/** The width scale every panel shares: the largest stage value across panels. */
export interface FunnelFacetScale {
  max: number;
}

/** The largest stage value across every panel's rows. */
export function shareFunnelScale(
  viz: VizInstance,
  panels: DataPoint[][],
): FunnelFacetScale {
  const valueFn = viz.schema.value as (d: DataPoint, i: number) => unknown;
  const values = panels.flatMap(rows =>
    rows.map((d, i) => Number(valueFn(d, i))),
  );
  return {max: largestValue(values)};
}

/** Applies the shared width scale (when panels share one) to a panel's draw; returns the undo. */
export function funnelFacetPanel(
  viz: VizInstance,
  ctx: FacetPanelContext,
): () => void {
  const saved = viz.ctx.funnelScaleMax;
  const scale = ctx.scales as FunnelFacetScale | undefined;
  viz.ctx.funnelScaleMax = ctx.shared && scale ? scale.max : undefined;
  return () => {
    viz.ctx.funnelScaleMax = saved;
  };
}

/** Funnel's small-multiple hooks: independent width scales unless asked to share. */
export const funnelFacetHooks: FacetHooks = {
  scales: "independent",
  share: shareFunnelScale,
  panel: funnelFacetPanel,
};
