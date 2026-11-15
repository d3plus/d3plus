/**
    Re-bins a Geomap's `hexbin` as the map zooms, so each hexagon keeps its
    pixel radius and zooming in shows finer detail, as the Hexbin chart
    does: the points are binned at the radius divided by the zoom scale,
    and the colorScale refits to the bins in view.

    @module
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import {chartBounds} from "../features/chartGeometry.js";
import {colorScaleValue} from "../features/colorScaleValue.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {PixelPoint} from "../Hexbin/binning.js";
import {emitBins} from "./densityEmit.js";
import {
  geoBinColorRows,
  geoBinMeta,
  geoBinOrigin,
  geoBinPoints,
  geoBinRows,
  geoHexbinSettings,
  geoPointRows,
} from "./geoHexbin.js";
import type {GeoHexbinSettings} from "./geoHexbin.js";

/** A zoom: its scale and translate. */
export interface GeoZoom {
  k: number;
  x: number;
  y: number;
}

/** What a draw keeps to re-bin its points at another zoom. */
export interface GeoBinState {
  /** The points, projected. */
  points: PixelPoint[];
  /** The zoom scale the bins were made at. */
  k: number;
  /** The bins. */
  bins: DataPoint[];
}

/** The chart's zoom, or none in a small-multiples panel. */
export function geoZoom(viz: VizInstance): GeoZoom {
  const t = viz._zoomTransform;
  if (!t || viz._facetStep || viz._facetPanels) return {k: 1, x: 0, y: 0};
  return {k: t.scale ?? 1, x: t.x ?? 0, y: t.y ?? 0};
}

/**
    The bins of some projected points at a zoom scale: hexagons whose
    radius, once zoomed, is the `hexbin` radius in pixels.
    @param viz The Geomap.
    @param points The points, projected.
    @param settings The resolved `hexbin`.
    @param k The zoom scale.
*/
export function geoBinsAt(
  viz: VizInstance,
  points: PixelPoint[],
  settings: GeoHexbinSettings,
  k: number,
): DataPoint[] {
  return geoBinRows(
    points,
    {radius: settings.radius / (k > 0 ? k : 1), agg: settings.agg},
    geoBinOrigin(viz),
  );
}

/**
    The bins that reach into the map area at a zoom: the ones its
    colorScale fits.
    @param viz The Geomap.
    @param bins The bins.
    @param zoom The zoom.
    @param radius The bins' radius once zoomed, in pixels.
*/
export function geoBinsInView(
  viz: VizInstance,
  bins: DataPoint[],
  zoom: GeoZoom,
  radius: number,
): DataPoint[] {
  const {width, height} = chartBounds(viz);
  return bins.filter(row => {
    const meta = geoBinMeta(row);
    if (!meta) return false;
    const x = meta.x * zoom.k + zoom.x,
      y = meta.y * zoom.k + zoom.y;
    return (
      x > -radius && x < width + radius && y > -radius && y < height + radius
    );
  });
}

/**
    The bins the colorScale lays out from before the map is laid out: the
    chart's points binned through the projection as it stands, at the
    chart's zoom, in view (with small multiples, every panel's, unzoomed).
    @param viz The Geomap.
    @param settings The resolved `hexbin`.
*/
export function geoHexbinColorRows(
  viz: VizInstance,
  settings: GeoHexbinSettings,
): DataPoint[] {
  if (viz._facetStep) return geoBinColorRows(viz, settings);
  const zoom = geoZoom(viz);
  const points = geoBinPoints(
    viz,
    geoPointRows(viz, viz._filteredData ?? []),
    settings,
  );
  return geoBinsInView(
    viz,
    geoBinsAt(viz, points, settings, zoom.k),
    zoom,
    settings.radius,
  );
}

/**
    Lays the colorScale out again over `rows`, in the frame it already
    claimed, so the scale the bins are filled from spans what's in view.
*/
export function refreshGeoColorScale(
  viz: VizInstance,
  rows: DataPoint[],
): void {
  const cs = viz._colorScaleClass;
  if (cs && colorScaleValue(viz)) cs.data(rows).render();
}

/** Whether a scene node is a hexbin bin. */
const isBin = (n: SceneNode) => String(n.key).startsWith("geomap-bin-");

/**
    Swaps the bins in a chart scene for new ones, where the old ones were
    drawn (or, without any, beneath the links and points).
    @param scene The chart scene.
    @param bins The new bins' nodes.
*/
export function replaceBinNodes(
  scene: SceneNode[],
  bins: SceneNode[],
): SceneNode[] {
  let at = scene.findIndex(isBin);
  const rest = scene.filter(n => !isBin(n));
  if (at < 0) {
    at = rest.findIndex(n => /^geomap-(link|point)/.test(String(n.key)));
    if (at < 0) at = rest.length;
  }
  return [...rest.slice(0, at), ...bins, ...rest.slice(at)];
}

/**
    The chart's zoom hook: re-bins its points when the zoom scale changes,
    refits the colorScale to the bins in view, and redraws the bins in the
    chart scene. Leaves the zoom itself to move the map (returns false).
    @param viz The Geomap.
    @param zoom The new zoom.
*/
export function rebinOnZoom(viz: VizInstance, zoom: GeoZoom): boolean {
  const settings = geoHexbinSettings(viz);
  const density = (
    viz.ctx.geomapCtx as
      {density?: {bins: DataPoint[] | null; binState?: GeoBinState}} | undefined
  )?.density;
  const state = density?.binState;
  if (!settings || !state || viz._facetPanels || !viz._chartScene) return false;
  if (state.k !== zoom.k) {
    state.bins = density!.bins = geoBinsAt(viz, state.points, settings, zoom.k);
    state.k = zoom.k;
  }
  refreshGeoColorScale(
    viz,
    geoBinsInView(viz, state.bins, zoom, settings.radius),
  );
  viz._chartScene = replaceBinNodes(viz._chartScene, emitBins(viz, state.bins));
  return false;
}
