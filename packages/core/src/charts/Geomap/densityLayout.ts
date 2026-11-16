/**
    Joins a Geomap's rows to its regions for `dotDensity`, and lays out its
    dots and `hexbin` bins for a draw.

    @module
*/

import {merge} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";

import type {VizInstance} from "../viz/vizTypes.js";
import {dotDensitySettings, geomapDotDensity} from "./dotDensityLayout.js";
import type {DotDensityLayout, DotRegion} from "./dotDensityLayout.js";
import {noteDotRows} from "./densityTooltip.js";
import {syncDotRenderer} from "./dotRenderer.js";
import {geoBinColorRows, geoBinPoints, geoHexbinSettings} from "./geoHexbin.js";
import {
  geoBinsAt,
  geoBinsInView,
  geoZoom,
  refreshGeoColorScale,
} from "./geoHexbinZoom.js";
import type {GeoBinState} from "./geoHexbinZoom.js";
import {isPointRow} from "./pointRows.js";

/** Each region's rows, with their indices in the drawn data, by region id (as a string). */
export type RegionRows = Map<string, {row: DataPoint; index: number}[]>;

/**
    The rows matched to regions (those without a coordinate point), by
    region id, and each region's datum: its one row, or with `dotDensity`
    splitting regions into categories, its rows merged (so its tooltip
    reads the region's totals).
    @param viz The Geomap.
*/
export function geomapRegionRows(viz: VizInstance): {
  rows: RegionRows;
  data: Record<string, DataPoint>;
} {
  const rows: RegionRows = new Map();
  viz._filteredData.forEach((row: DataPoint, index: number) => {
    if (isPointRow(viz, row, index)) return;
    const id = `${viz._id(row, index)}`;
    const list = rows.get(id);
    if (list) list.push({row, index});
    else rows.set(id, [{row, index}]);
  });
  const merged = Boolean(dotDensitySettings(viz)) && viz._drawDepth > 0;
  const data: Record<string, DataPoint> = {};
  for (const [id, list] of rows)
    data[id] =
      merged && list.length > 1
        ? (merge(
            list.map(r => r.row),
            viz.schema.aggs,
          ) as DataPoint)
        : list[list.length - 1].row;
  return {rows, data};
}

/** The dots and bins of a Geomap draw. */
export interface GeomapDensity {
  dots: DotDensityLayout | null;
  bins: DataPoint[] | null;
  /** The projected points behind the bins, to re-bin them as the map zooms. */
  binState?: GeoBinState;
}

/**
    Lays out the dots inside the regions and bins the visible points, and
    lays the colorScale out again over the bins (with small multiples,
    every panel's bins, so all panels share one colorScale).
    @param viz The Geomap.
    @param input The regions, their rows and datums, each region's
    projected path, and the coordinate points the projection draws.
*/
export function geomapDensity(
  viz: VizInstance,
  input: {
    regions: (DotRegion & {data?: DataPoint})[];
    rows: RegionRows;
    pathD: (region: DotRegion) => string | null;
    points: DataPoint[];
  },
): GeomapDensity {
  const dots = geomapDotDensity(viz, input.regions, input.rows, input.pathD);
  // A chart switched to Canvas for its dots goes back without them.
  if (!dots) syncDotRenderer(viz, 0);
  if (dots) {
    const regionDots = new Map<DataPoint, DotDensityLayout["groups"]>();
    const byRegion = new Map<string, DotDensityLayout["groups"]>();
    for (const g of dots.groups) {
      const list = byRegion.get(`${g.region}`);
      if (list) list.push(g);
      else byRegion.set(`${g.region}`, [g]);
    }
    for (const region of input.regions) {
      const groups = byRegion.get(`${region.id}`);
      if (region.data && groups) regionDots.set(region.data, groups);
    }
    noteDotRows(viz, dots, regionDots);
  }
  const settings = geoHexbinSettings(viz);
  if (!settings) return {dots, bins: null};
  // Bins keep their pixel radius at the chart's zoom.
  const zoom = geoZoom(viz);
  const points = geoBinPoints(viz, input.points, settings);
  const bins = geoBinsAt(viz, points, settings, zoom.k);
  refreshGeoColorScale(
    viz,
    viz._facetStep === "panel"
      ? geoBinColorRows(viz, settings)
      : geoBinsInView(viz, bins, zoom, settings.radius),
  );
  return {dots, bins, binState: {points, k: zoom.k, bins}};
}
