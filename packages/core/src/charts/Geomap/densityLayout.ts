/**
    Joins a Geomap's rows to its regions for `dotDensity`, and lays out its
    dots and `hexbin` bins for a draw.

    @module
*/

import {merge} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";

import type {VizInstance} from "../viz/vizTypes.js";
import {colorScaleValue} from "../features/colorScaleValue.js";
import {dotDensitySettings, geomapDotDensity} from "./dotDensityLayout.js";
import type {DotDensityLayout, DotRegion} from "./dotDensityLayout.js";
import {noteDotRows} from "./densityTooltip.js";
import {
  geoBinColorRows,
  geoBinOrigin,
  geoBinPoints,
  geoBinRows,
  geoHexbinSettings,
} from "./geoHexbin.js";

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
    if (viz.schema.point(row, index) instanceof Array) return;
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

/**
    Lays the colorScale out again over `rows`, in the frame it already
    claimed, so the scale the bins are filled from spans what's drawn.
*/
function refreshColorScale(viz: VizInstance, rows: DataPoint[]): void {
  const cs = viz._colorScaleClass;
  if (cs && colorScaleValue(viz)) cs.data(rows).render();
}

/** The dots and bins of a Geomap draw. */
export interface GeomapDensity {
  dots: DotDensityLayout | null;
  bins: DataPoint[] | null;
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
  let bins: DataPoint[] | null = null;
  if (settings) {
    bins = geoBinRows(
      geoBinPoints(viz, input.points, settings),
      settings,
      geoBinOrigin(viz),
    );
    refreshColorScale(
      viz,
      viz._facetStep === "panel" ? geoBinColorRows(viz, settings) : bins,
    );
  }
  return {dots, bins};
}
