/**
    Small multiples for Funnel (see `facet/facetConfig.ts`). Each panel sizes
    its stages against its own largest stage by default, so panels compare
    shape, and its labels share one font size within the panel. With
    `facetConfig.scales` set to `"shared"`, every panel measures against the
    largest stage across all panels, so panels compare volume, and every
    panel's labels share one font size too.

    @module
*/
import type {DataPoint} from "@d3plus/data";

import {chartBounds} from "../features/chartGeometry.js";
import type {FacetHooks, FacetPanelContext} from "../facet/facetConfig.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {funnelOrder, funnelStages} from "./applyLayout.js";
import {largestValue} from "./funnelGeometry.js";
import {stageLabelSize} from "./labelNodes.js";

/** What every panel shares: the width scale and the label font size. */
export interface FunnelFacetScale {
  /** The largest stage value across panels. */
  max: number;
  /** The label font size every panel shares (0 when no panel draws a label). */
  fontSize: number;
}

/**
    The label font size every panel can share: the smallest of each panel's
    own shared size (see `planStageLabels`), with every panel laid out at
    the panel size (`share` runs with the chart area set to it) against the
    shared width scale `max`. 0 when labels are off or none is drawn.
*/
export function shareFunnelLabelSize(
  viz: VizInstance,
  panels: DataPoint[][],
  max: number,
): number {
  const userShape = (viz.schema.shapeConfig ?? {}) as {label?: unknown};
  if (userShape.label === false) return 0;
  const bounds = chartBounds(viz);
  const sizes = panels
    .filter(rows => rows.length)
    .map(rows => {
      const {stages, shared} = funnelStages(
        viz,
        funnelOrder(viz, rows),
        bounds,
        max,
      );
      return stageLabelSize(viz, stages, shared);
    })
    .filter(size => size > 0);
  return sizes.length ? Math.min(...sizes) : 0;
}

/** The width scale and label size every panel shares, from each panel's rows. */
export function shareFunnelScale(
  viz: VizInstance,
  panels: DataPoint[][],
): FunnelFacetScale {
  const valueFn = viz.schema.value as (d: DataPoint, i: number) => unknown;
  const values = panels.flatMap(rows =>
    rows.map((d, i) => Number(valueFn(d, i))),
  );
  const max = largestValue(values);
  return {max, fontSize: shareFunnelLabelSize(viz, panels, max)};
}

/** Applies what panels share (when they share scales) to a panel's draw; returns the undo. */
export function funnelFacetPanel(
  viz: VizInstance,
  ctx: FacetPanelContext,
): () => void {
  const savedMax = viz.ctx.funnelScaleMax;
  const savedSize = viz.ctx.funnelLabelSize;
  const scale = ctx.shared
    ? (ctx.scales as FunnelFacetScale | undefined)
    : undefined;
  viz.ctx.funnelScaleMax = scale ? scale.max : undefined;
  viz.ctx.funnelLabelSize = scale && scale.fontSize ? scale.fontSize : undefined;
  return () => {
    viz.ctx.funnelScaleMax = savedMax;
    viz.ctx.funnelLabelSize = savedSize;
  };
}

/** Funnel's small-multiple hooks: independent scales and label sizes unless asked to share. */
export const funnelFacetHooks: FacetHooks = {
  scales: "independent",
  share: shareFunnelScale,
  panel: funnelFacetPanel,
};
