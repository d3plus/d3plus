/**
    ScatterMatrix's panels: small multiples on a square grid, one panel per
    pair of dimensions, every panel's x axis reading its column's
    dimension and its y axis its row's, labeled (and titled with the
    dimension) along the grid's left and bottom edges.

    @module
*/
import type {FacetHooks, FacetPanelContext} from "../facet/facetConfig.js";
import type {PlotFacetScales} from "../Plot/facetScales.js";
import {plotFacetPanel} from "../Plot/plotFacet.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {matrixMeta} from "./matrixData.js";

/** What the panels read from the chart: each dimension's title and shared domain. */
export interface MatrixAxes {
  titles: string[];
  domains: ([number, number] | undefined)[];
}

/**
    The scales a panel draws with: its column's dimension's domain on x and
    its row's on y.
*/
export function panelScales(
  axes: MatrixAxes,
  i: number,
  j: number,
): PlotFacetScales {
  const domains: PlotFacetScales["domains"] = {};
  const x = axes.domains[j],
    y = axes.domains[i];
  if (x) domains.x = x;
  // A y domain runs from the top of the plot down.
  if (y) domains.y = [y[1], y[0]];
  return {domains, padded: {...domains}};
}

/**
    Applies a panel's dimensions: its shared scales, its axis titles (the
    dimensions' names, shown where the panel labels an axis), and the axis
    labels `plotFacetPanel` shows on the grid's edges. Reads the panel from
    its rows. Returns the undo.
*/
export function matrixFacetPanel(
  viz: VizInstance,
  ctx: FacetPanelContext,
  axes: MatrixAxes,
): () => void {
  const meta = matrixMeta(viz._filteredData?.[0]);
  const saved = {x: viz._xConfig, y: viz._yConfig};
  if (meta) {
    viz._xConfig = {...saved.x, title: axes.titles[meta.j]};
    viz._yConfig = {...saved.y, title: axes.titles[meta.i]};
  }
  const undo = plotFacetPanel(viz, ctx);
  if (meta) viz._plotFacetScales = panelScales(axes, meta.i, meta.j);
  return () => {
    undo();
    viz._xConfig = saved.x;
    viz._yConfig = saved.y;
  };
}

/** The axes a chart's panels read, as its last data prep left them (see `index.ts`). */
export function matrixAxes(viz: VizInstance): MatrixAxes {
  const state = viz.ctx.scatterMatrix as {axes?: MatrixAxes} | undefined;
  return state?.axes ?? {titles: [], domains: []};
}

/** ScatterMatrix's small-multiple hooks, over Plot's. */
export const matrixFacetHooks: FacetHooks = {
  // Each row labels its own dimension, so the left column's labels differ
  // in width: every panel is lined up with the others.
  align: true,
  aspect: 1,
  // Each panel takes its own row's and column's domains (see `panel`).
  share: () => ({domains: {}, padded: {}}),
  panel: (viz, ctx) => matrixFacetPanel(viz, ctx, matrixAxes(viz)),
};
