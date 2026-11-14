/**
    CyclePlot's panels: Plot's small-multiple hooks, with room inside each
    panel's ends (enough, when it can be, for the first and last cycles'
    labels), each panel's x axis labeling only its first and last cycle,
    and the inner panels' y axes reduced to the line between neighboring
    panels, so the panels touch.

    @module
*/
import {textWidth} from "@d3plus/dom";
import {fontFamilyStringify} from "@d3plus/text";

import type {FacetHooks, FacetPanelContext} from "../facet/facetConfig.js";
import type {DomainValue, PlotFacetScales} from "../Plot/facetScales.js";
import {plotFacetPanel, sharePlotScales} from "../Plot/plotFacet.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** The room inside each end of a panel, as a fraction of the span of cycles it plots. */
export const CYCLE_INSET = 0.1;

/** The most room inside each end of a panel CyclePlot makes for the end labels. */
export const CYCLE_INSET_MAX = 0.5;

/** The space kept clear around each end label, in pixels. */
export const END_LABEL_GAP = 6;

/** An axis's default tick label size (see `Axis`). */
const AXIS_FONT_SIZE = 12;

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

/** Where a cycle at the end of a domain widened by `inset` sits, as a fraction of the panel from its nearer end. */
const endPlace = (inset: number): number => inset / (1 + 2 * inset);

/**
    The room inside each end of a panel (as `insetDomain`'s fraction) that
    keeps the first and last cycles' labels, centered on their cycles,
    inside a panel `width` pixels wide and apart from each other: at least
    `CYCLE_INSET`, at most `CYCLE_INSET_MAX`. `fits` is false when no room
    in that range does, and the panel draws no end labels.
    @param width The panel's plot width, in pixels.
    @param labels The two labels' widths, in pixels.
*/
export function endLabelInset(
  width: number,
  labels: [number, number],
): {inset: number; fits: boolean} {
  const [a, b] = labels;
  if (!(width > 0)) return {inset: CYCLE_INSET, fits: false};
  const need = (Math.max(a, b) / 2 + END_LABEL_GAP) / width;
  const most = Math.min(
    endPlace(CYCLE_INSET_MAX),
    (1 - ((a + b) / 2 + END_LABEL_GAP) / width) / 2,
  );
  const least = endPlace(CYCLE_INSET);
  if (Math.max(least, need) > most) return {inset: CYCLE_INSET, fits: false};
  if (need <= least) return {inset: CYCLE_INSET, fits: true};
  return {inset: need / (1 - 2 * need), fits: true};
}

/** What a CyclePlot's panels read of its cycles (see `index.ts`). */
interface CycleAxisState {
  /** The first and last cycles every panel shows, and their labels, when they fit. */
  ends?: Date[];
  endLabels?: string[];
  endLabel?: (cycle: Date) => string;
}

/** The chart's cycle state, as its panels read it. */
const axisState = (viz: VizInstance) => (viz.ctx.cycle ?? {}) as CycleAxisState;

/** How wide `text` draws at the x axis's label style, in pixels. */
function labelWidth(viz: VizInstance, text: string): number {
  const label = (
    viz._xConfig?.shapeConfig as {labelConfig?: Record<string, unknown>}
  )?.labelConfig;
  const size =
    typeof label?.fontSize === "number" ? label.fontSize : AXIS_FONT_SIZE;
  const own = label?.fontFamily;
  const family =
    typeof own === "string" || Array.isArray(own) ? own : viz.schema.fontFamily;
  return Number(
    textWidth(text, {
      "font-family": fontFamilyStringify(family as string | string[]),
      "font-size": size,
    }),
  );
}

/**
    The scales every panel shares (see `sharePlotScales`), with room inside
    each panel's ends: enough for the first and last cycles' labels when it
    can be (see `endLabelInset`), measured at the panels' size. Notes the
    end cycles and, when they fit, their labels.
*/
export function shareCycleScales(
  viz: VizInstance,
  panels: Parameters<typeof sharePlotScales>[1],
): PlotFacetScales {
  const scales = sharePlotScales(viz, panels);
  const state = axisState(viz);
  const ends = (scales.domains.x ?? []).filter(
    (d): d is Date => d instanceof Date,
  );
  let inset = CYCLE_INSET;
  state.ends = ends.length === 2 && +ends[0] !== +ends[1] ? ends : undefined;
  state.endLabels = undefined;
  if (state.ends && state.endLabel) {
    const texts = state.ends.map(state.endLabel);
    const width = viz.schema.width - viz._margin.left - viz._margin.right;
    const fit = endLabelInset(width, [
      labelWidth(viz, texts[0]),
      labelWidth(viz, texts[1]),
    ]);
    inset = fit.inset;
    if (fit.fits) state.endLabels = texts;
  }
  const domains = {...scales.domains};
  const padded = {...scales.padded};
  const x = insetDomain(domains.x, inset);
  if (x) domains.x = x;
  const px = insetDomain(padded.x, inset);
  if (px) padded.x = px;
  return {...scales, domains, padded};
}

/**
    The x axis config a panel draws with: ticks at the first and last
    cycles, labeled when the panel labels its x axis and the labels fit,
    unless the user's `xConfig` sets its own `ticks` or `labels`. Every key
    is always set: the axis keeps config between draws.
*/
export function cycleXConfig(
  config: Record<string, unknown> | undefined,
  user: Record<string, unknown> | undefined,
  state: CycleAxisState,
  labeled: boolean,
): Record<string, unknown> {
  const c = config || {};
  if (user && (user.ticks !== undefined || user.labels !== undefined)) return c;
  const ends = state.ends ?? [];
  const format = state.endLabel;
  return {
    ...c,
    labels: labeled && state.endLabels ? ends : [],
    ticks: ends,
    ...(format && user?.tickFormat === undefined
      ? {
          tickFormat: (d: unknown) =>
            d instanceof Date || typeof d === "number"
              ? format(new Date(+d))
              : `${d}`,
        }
      : {}),
  };
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

/** Applies a panel's shared scales and axis labels (see `plotFacetPanel`), and its x and y axis configs; returns the undo. */
export function cycleFacetPanel(
  viz: VizInstance,
  ctx: FacetPanelContext,
): () => void {
  const saved = viz._yConfig;
  const savedX = viz._xConfig;
  const undo = plotFacetPanel(viz, ctx);
  viz._yConfig = cycleYConfig(viz._yConfig, ctx.labels.y);
  viz._xConfig = cycleXConfig(
    viz._xConfig,
    savedX,
    axisState(viz),
    ctx.labels.x,
  );
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
