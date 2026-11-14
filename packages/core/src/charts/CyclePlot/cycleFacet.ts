/**
    CyclePlot's panels: Plot's small-multiple hooks, with room inside each
    panel's ends and the inner panels' y axes reduced to the line between
    neighboring panels, so the panels touch.

    @module
*/
import type {FacetHooks, FacetPanelContext} from "../facet/facetConfig.js";
import type {DomainValue, PlotFacetScales} from "../Plot/facetScales.js";
import {plotFacetPanel, sharePlotScales} from "../Plot/plotFacet.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** The room inside each end of a panel, as a fraction of the span of cycles it plots. */
export const CYCLE_INSET = 0.1;

/** An axis's default tick length and label padding (see `Axis`). */
const AXIS_TICK_SIZE = 8;
const AXIS_PADDING = 5;

/**
    `domain` widened at each end by `fraction` of its span, keeping Dates as
    Dates. A domain without a span (a single cycle) is returned as is.
*/
export function insetDomain(
  domain: DomainValue[] | undefined,
  fraction: number,
): DomainValue[] | undefined {
  if (!domain || domain.length !== 2) return domain;
  const [lo, hi] = domain.map(Number);
  const pad = (hi - lo) * fraction;
  if (!Number.isFinite(pad) || pad <= 0) return domain;
  const out = [lo - pad, hi + pad];
  return domain[0] instanceof Date ? out.map(v => new Date(v)) : out;
}

/** The scales every panel shares (see `sharePlotScales`), with room inside each panel's ends. */
export function shareCycleScales(
  viz: VizInstance,
  panels: Parameters<typeof sharePlotScales>[1],
): PlotFacetScales {
  const scales = sharePlotScales(viz, panels);
  const domains = {...scales.domains};
  const padded = {...scales.padded};
  const x = insetDomain(domains.x, CYCLE_INSET);
  if (x) domains.x = x;
  const px = insetDomain(padded.x, CYCLE_INSET);
  if (px) padded.x = px;
  return {...scales, domains, padded};
}

/**
    The y axis config a panel draws with: an unlabeled panel's axis has no
    ticks and no padding, so its line is the edge it shares with the panel
    before it. Both keys are always set: the axis keeps config between
    draws.
*/
export function cycleYConfig(
  config: Record<string, unknown> | undefined,
  labeled: boolean,
): Record<string, unknown> {
  const c = config || {};
  return {
    ...c,
    padding: labeled ? (c.padding ?? AXIS_PADDING) : 0,
    tickSize: labeled ? (c.tickSize ?? AXIS_TICK_SIZE) : 0,
  };
}

/** Applies a panel's shared scales and axis labels (see `plotFacetPanel`), and its y axis config; returns the undo. */
export function cycleFacetPanel(
  viz: VizInstance,
  ctx: FacetPanelContext,
): () => void {
  const saved = viz._yConfig;
  const undo = plotFacetPanel(viz, ctx);
  viz._yConfig = cycleYConfig(viz._yConfig, ctx.labels.y);
  return () => {
    undo();
    const restored = cycleYConfig(saved, true);
    viz._yAxis?.config({
      padding: restored.padding,
      tickSize: restored.tickSize,
    } as Parameters<NonNullable<VizInstance["_yAxis"]>["config"]>[0]);
  };
}

/** CyclePlot's small-multiple hooks, layered over Plot's. */
export const cycleFacetHooks: FacetHooks = {
  share: shareCycleScales,
  panel: cycleFacetPanel,
};
