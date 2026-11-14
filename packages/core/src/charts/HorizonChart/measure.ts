/**
    What HorizonChart measures from all of its data, before the timeline,
    `filter`, and hidden rows cut it down: its series and their order, the
    band size every row shares, and the rows each draw lays out, so shades
    and rows hold still while those change.
*/
import {rollup} from "d3-array";

import {merge, type DataPoint} from "@d3plus/data";

import {facetActive, type FacetAccessor} from "../facet/facetConfig.js";
import {facetKey, toFacetValue} from "../facet/facetData.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {horizonBandSize} from "./horizonBands.js";
import {horizonPalette, type HorizonColorConfig} from "./horizonColors.js";
import {bandKeyRows, horizonState, rowValue, seriesId} from "./state.js";

/** How many bands each sign is cut into. */
export function bandCount(viz: VizInstance): number {
  const n = Math.floor(Number(viz.schema.bands));
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

/** The small-multiples panel a row is drawn in, or "" without `facet`. */
function panelOf(viz: VizInstance, d: DataPoint, i: number): string {
  if (!facetActive(viz)) return "";
  const facet = viz.schema.facet as FacetAccessor;
  return facetKey(toFacetValue(facet(d, i)));
}

/** An x value as a grouping key. */
const xKey = (v: unknown): string => (v instanceof Date ? `${+v}` : `${v}`);

/**
    After Plot's pre-draw, from all of the data: each series' order, label,
    first row, and panels; the band size every row shares (rounded up to a
    nice number, unless `bandSize` sets it), measured from each series'
    values rolled up per x as the chart draws them; the band colors; and the
    band key's rows.
*/
export function measureBands(viz: VizInstance): void {
  const state = horizonState(viz);
  const data: DataPoint[] = viz._data || [];
  state.order = new Map();
  state.labels = new Map();
  state.first = new Map();
  state.panels = new Map();
  data.forEach((d, i) => {
    const id = seriesId(viz, d, i);
    if (!state.order.has(id)) {
      state.order.set(id, state.order.size);
      state.labels.set(id, `${viz._drawLabel(d, i)}`);
      state.first.set(id, d);
      state.panels.set(id, new Set());
    }
    state.panels.get(id)!.add(panelOf(viz, d, i));
  });

  const merged = rollup(
    data,
    leaves => merge(leaves, viz.schema.aggs) as DataPoint,
    (d: DataPoint, i: number) =>
      [seriesId(viz, d, i), panelOf(viz, d, i), xKey(viz._x!(d, i))].join(
        "\u0000",
      ),
  );
  const values: number[] = [];
  let positive = false,
    negative = false;
  merged.forEach(d => {
    const v = rowValue(viz, d, 0);
    if (!Number.isFinite(v)) return;
    values.push(v);
    if (v > 0) positive = true;
    if (v < 0) negative = true;
  });

  const bands = bandCount(viz);
  state.size =
    Number(viz.schema.bandSize) > 0
      ? Number(viz.schema.bandSize)
      : horizonBandSize(values, bands);
  state.signs = {positive, negative};
  state.palette = horizonPalette(
    viz._theme,
    bands,
    viz.schema.colors as HorizonColorConfig | undefined,
    viz.schema.colorDefaults,
  );
  viz._legendData = bandKeyRows(state, bands);
}

/**
    The rows a draw lays out, top to bottom: every series, hidden ones
    included so their labels stay to click back on, or in a small-multiples
    panel, every series drawn in that panel.
    @param viz The chart.
    @param panel The panel's key, when drawing one.
*/
export function rowDomain(viz: VizInstance, panel?: string): string[] {
  const state = horizonState(viz);
  return Array.from(state.order.keys()).filter(
    id => panel === undefined || state.panels.get(id)?.has(panel),
  );
}

/**
    Sets the y axis's domain to the rows this draw lays out (see
    `rowDomain`), unless the user set a domain of their own.
*/
export function applyRowDomain(viz: VizInstance): void {
  const state = horizonState(viz);
  const config = viz._yConfig as {domain?: unknown} | undefined;
  if (!config) return;
  if (config.domain !== undefined && config.domain !== state.domain) return;
  const rows: DataPoint[] = viz._filteredData || [];
  const panel =
    viz._facetStep === "panel" && rows.length
      ? panelOf(viz, rows[0], 0)
      : undefined;
  state.domain = rowDomain(viz, panel);
  config.domain = state.domain;
}
