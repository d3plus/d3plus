/**
    Small multiples for the Plot family (see `facet/facetConfig.ts`): shared
    x/y domains (and bubble size scale) across panels, axis labels only on
    the grid's outer edges, and the per-panel state Plot's hover reads.

    @module
*/
import type {DataPoint} from "@d3plus/data";

import type {D3Scale} from "../../utils/index.js";
import type {FacetHooks, FacetPanelContext} from "../facet/facetConfig.js";
import type {FacetSides} from "../facet/facetGutter.js";
import {runStages} from "../pipeline/stages.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {isSpanAxis} from "./discreteSpan.js";
import {AXES} from "./facetScales.js";
import type {DomainValue, PlotFacetScales} from "./facetScales.js";
import {
  computePlotAxisValues,
  computePlotInitialDomains,
  computePlotScales,
  extendPlotOppScales,
  formatPlotData,
  plotSizeScale,
} from "./pipeline.js";
import {computePlotTrendFits} from "./trendLines.js";


/** Whether an axis's domain is a list of values (a category axis) rather than an extent. */
export function listAxis(viz: VizInstance, axis: string): boolean {
  if (viz.schema[`${axis}Sort`]) return true;
  if (isSpanAxis(viz, axis)) return false;
  const time = (viz as unknown as Record<string, unknown>)[`_${axis}Time`];
  return viz.schema.discrete === axis.charAt(0) && !time;
}

/** The `[min, max]` covering every extent (dates stay dates); undefined when none are numeric. */
export function unionExtent(extents: DomainValue[][]): DomainValue[] | undefined {
  let lo: DomainValue | undefined, hi: DomainValue | undefined;
  for (const extent of extents) {
    for (const v of extent) {
      if (v === undefined || v === null || Number.isNaN(+v)) continue;
      if (lo === undefined || +v < +lo) lo = v;
      if (hi === undefined || +v > +hi) hi = v;
    }
  }
  return lo === undefined || hi === undefined ? undefined : [lo, hi];
}

/** Runs Plot's data + domain stages for one panel's rows. */
function panelDomains(viz: VizInstance, rows: DataPoint[]) {
  viz._filteredData = rows;
  const ctx = runStages({viz}, [formatPlotData, computePlotAxisValues, computePlotTrendFits, computePlotInitialDomains]);
  return {
    formatted: (ctx.plotFormattedData || []) as Record<string, unknown>[],
    domains: (ctx.plotInitialDomains || {}) as Record<string, DomainValue[]>,
  };
}

/**
    The domains (and size scale) that fit every panel's rows: a category axis
    lists every panel's categories, in the order one chart of all the rows
    would; a continuous axis spans every panel's extent, stacks included.
*/
export function sharePlotScales(viz: VizInstance, panels: DataPoint[][]): PlotFacetScales {
  const drawn = panels.filter(rows => rows.length).map(rows => panelDomains(viz, rows));
  const formatted = drawn.flatMap(d => d.formatted);
  const lists = runStages({viz, plotFormattedData: formatted, plotAxisData: formatted}, [computePlotAxisValues]);
  const domains: Record<string, DomainValue[]> = {};
  for (const axis of AXES) {
    if (!drawn.some(d => d.domains[axis])) continue;
    if (listAxis(viz, axis)) {
      const values = lists[`${axis}Data` as "xData"];
      if (values && values.length) domains[axis] = values as DomainValue[];
    }
    else {
      const extent = unionExtent(drawn.map(d => d.domains[axis] || []));
      if (extent) domains[axis] = extent;
    }
  }
  const sizes = viz._size ? formatted.map(d => viz._size!(d.data as DataPoint)) : [];
  const size = sizes.length ? plotSizeScale(viz, sizes) : undefined;
  return {domains, size, padded: paddedDomains(viz, formatted, domains, size)};
}

/**
    Runs Plot's scale stages over every panel's rows at once, from the shared
    data domains, and reads back the padded continuous domains: the room
    each panel's shapes need, met on every panel alike.
*/
function paddedDomains(
  viz: VizInstance,
  formatted: Record<string, unknown>[],
  domains: Record<string, DomainValue[]>,
  size: D3Scale | undefined,
): Record<string, DomainValue[]> {
  const sizeScale = viz._sizeScaleD3;
  if (size) viz._sizeScaleD3 = size;
  const ctx = runStages(
    {viz, plotFormattedData: formatted, plotAxisData: formatted, plotInitialDomains: {...domains}},
    [computePlotScales, extendPlotOppScales],
  );
  viz._sizeScaleD3 = sizeScale;
  const padded: Record<string, DomainValue[]> = {};
  const scales = ctx.plotScales;
  if (!scales) return padded;
  for (const axis of AXES) {
    const scale = scales[axis];
    if (scale && typeof scale.invert === "function") padded[axis] = scale.domain() as DomainValue[];
  }
  return padded;
}

type AxisConfig = Record<string, unknown> | undefined;

/**
    An axis config that draws its tick labels and title only when `show` is
    set. Both keys are always present: the axis keeps config between draws,
    so a labeled panel must undo an unlabeled one before it.
*/
export function panelAxisConfig(config: AxisConfig, show: boolean): Record<string, unknown> {
  const c = config || {};
  return {...c, labels: show ? c.labels : [], title: show ? c.title : false};
}

/** Puts an axis's labels and title back to its chart config after the panels draw. */
function resetAxis(axis: VizInstance["_xAxis"], config: AxisConfig): void {
  if (axis) axis.config({labels: config?.labels, title: config?.title} as Parameters<typeof axis.config>[0]);
}

/** Applies a panel's shared scales and axis-label visibility; returns the undo. */
export function plotFacetPanel(viz: VizInstance, ctx: FacetPanelContext): () => void {
  const saved = {scales: viz._plotFacetScales, x: viz._xConfig, y: viz._yConfig};
  viz._plotFacetScales = ctx.shared ? (ctx.scales as PlotFacetScales | undefined) : undefined;
  viz._xConfig = panelAxisConfig(saved.x, ctx.labels.x);
  viz._yConfig = panelAxisConfig(saved.y, ctx.labels.y);
  return () => {
    viz._plotFacetScales = saved.scales;
    viz._xConfig = saved.x;
    viz._yConfig = saved.y;
    resetAxis(viz._xAxis, saved.x);
    resetAxis(viz._yAxis, saved.y);
  };
}

/** The plot area's insets from the chart area, per side, for the panel just drawn. */
export function plotFacetInsets(viz: VizInstance): FacetSides {
  const area = viz._plotArea, t = viz._chartTransform;
  if (!area || !t) return {top: 0, right: 0, bottom: 0, left: 0};
  const x = area.x + (t.x ?? 0), y = area.y + (t.y ?? 0);
  return {
    top: y - viz._margin.top,
    right: viz.schema.width - viz._margin.right - (x + area.width),
    bottom: viz.schema.height - viz._margin.bottom - (y + area.height),
    left: x - viz._margin.left,
  };
}

/** Plot's small-multiple hooks. */
export const plotFacetHooks: FacetHooks = {
  aspect: 4 / 3,
  share: sharePlotScales,
  panel: plotFacetPanel,
  insets: plotFacetInsets,
  capture: viz => ({
    _plotArea: viz._plotArea,
    _plotAxisDomains: viz._plotAxisDomains,
    _xFunc: viz._xFunc,
    _yFunc: viz._yFunc,
    _trendFits: viz._trendFits,
  }),
};
