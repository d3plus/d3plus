/**
    Geomap's `hexbin`: coordinate points binned into hexagons on the
    projected map (with the Hexbin chart's binning), each colored on the
    colorScale by how many points it holds or by a value summed or averaged
    over them.

    @module
*/

import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";

import type {VizInstance} from "../viz/vizTypes.js";
import {binMeasure, binPath, binPoints} from "../Hexbin/binning.js";
import type {BinAgg, PixelPoint} from "../Hexbin/binning.js";
import {resolveBinValue} from "../Hexbin/settings.js";
import {regionsReshaped} from "./tileGrid.js";
import {toLonLat} from "./flowGeometry.js";
import {isPointRow} from "./pointRows.js";

/** The `hexbin` option. */
export interface GeoHexbinConfig {
  /** The hexagon radius, in pixels. */
  radius?: number;
  /** The value each bin sums or averages: a data key or an accessor. Without one, bins count their points. */
  value?: string | ((d: DataPoint, i: number) => unknown);
  /** How bins combine `value`: `"sum"` (the default) or `"mean"`. */
  agg?: "sum" | "mean";
  /** The name of what each bin measures, in its tooltip. */
  label?: string;
}

/** `hexbin`, resolved for a draw. */
export interface GeoHexbinSettings {
  radius: number;
  agg: BinAgg;
  weight?: (d: DataPoint, i: number) => unknown;
  /** The name of what each bin measures. */
  measure: string;
}

/** The default hexagon radius, in pixels. */
export const GEO_BIN_RADIUS = 12;

/** The key a bin row keeps what it measures under. */
export const GEO_BIN = "__d3plusGeoBin";

/** What a bin row carries. */
export interface GeoBinMeta {
  /** How many points the bin holds. */
  count: number;
  /** What the bin measures: its count, or the sum or mean of `value`. */
  value: number;
  /** The bin's center, in pixels. */
  x: number;
  y: number;
  /** The hexagon's outline, in pixels. */
  path: string;
  /** The rows of the points in the bin. */
  rows: DataPoint[];
}

/**
    `hexbin`, resolved: `true` bins by count at the default radius, and an
    object sets the radius and what each bin measures. Null when it is off,
    or a `cartogram` or `tileGrid` leaves the points out.
*/
export function geoHexbinSettings(viz: VizInstance): GeoHexbinSettings | null {
  const option = viz.schema.hexbin as GeoHexbinConfig | boolean | undefined;
  if (!option || regionsReshaped(viz)) return null;
  const config: GeoHexbinConfig = typeof option === "object" ? option : {};
  const radius = Number(config.radius);
  const measure = resolveBinValue(
    config.value === undefined
      ? "count"
      : {value: config.value, agg: config.agg, label: config.label},
    s => viz.schema.translate(s) as string,
  );
  return {
    radius: radius > 0 ? radius : GEO_BIN_RADIUS,
    ...measure,
    measure:
      config.value === undefined && config.label
        ? config.label
        : measure.measure,
  };
}

/** What a (possibly wrapped) bin row carries, if it is one. */
export function geoBinMeta(d: DataPoint | undefined): GeoBinMeta | undefined {
  while (d && d.__d3plus__ && d.data) d = d.data as DataPoint;
  return d ? (d[GEO_BIN] as unknown as GeoBinMeta | undefined) : undefined;
}

/** A bin's measure, which the colorScale reads, or undefined for any other row. */
export function geoBinValue(d: DataPoint): number | undefined {
  return geoBinMeta(d)?.value;
}

/**
    The points of `rows` placed by the projection, in pixels: the rows with
    a coordinate the projection draws.
    @param viz The Geomap.
    @param rows The rows.
    @param settings The resolved `hexbin`.
*/
export function geoBinPoints(
  viz: VizInstance,
  rows: DataPoint[],
  settings: Pick<GeoHexbinSettings, "weight">,
): PixelPoint[] {
  const projection = viz.schema.projection as (
    c: [number, number],
  ) => [number, number] | null;
  const out: PixelPoint[] = [];
  rows.forEach((row, i) => {
    const coord = toLonLat(viz.schema.point(row, i));
    const p = coord ? projection(coord) : null;
    if (!p) return;
    out.push({
      x: p[0],
      y: p[1],
      row,
      weight: settings.weight ? Number(settings.weight(row, i)) : undefined,
    });
  });
  return out;
}

/**
    One row per hexagon holding a point, with what it measures (bins whose
    measure isn't a number, a mean with nothing to average, are left out).
    The grid is anchored at `origin`, so it moves with the map.
    @param points The points, in pixels.
    @param settings The resolved `hexbin`.
    @param origin Where the grid is anchored.
*/
export function geoBinRows(
  points: PixelPoint[],
  settings: Pick<GeoHexbinSettings, "radius" | "agg">,
  origin: [number, number] = [0, 0],
): DataPoint[] {
  const {radius} = settings;
  const rows: DataPoint[] = [];
  for (const bin of binPoints(points, {shape: "hex", size: radius, origin})) {
    const value = binMeasure(bin.points, settings.agg);
    if (!Number.isFinite(value)) continue;
    const meta: GeoBinMeta = {
      count: bin.points.length,
      value,
      x: bin.cx,
      y: bin.cy,
      path: binPath(bin, "hex", radius),
      rows: bin.points.map(p => p.row),
    };
    rows.push({id: `geobin-${bin.key}`, [GEO_BIN]: meta as never});
  }
  return rows;
}

/** The point rows a Geomap bins: those with a coordinate. */
export function geoPointRows(viz: VizInstance, rows: DataPoint[]): DataPoint[] {
  return rows.filter((d, i) => isPointRow(viz, d, i));
}

/** Where a Geomap anchors its bin grid: its projection's center. */
export function geoBinOrigin(viz: VizInstance): [number, number] {
  const t = (
    viz.schema.projection as {translate?: () => number[]}
  ).translate?.();
  return t && t.length === 2 ? [t[0], t[1]] : [0, 0];
}

/**
    The bins the colorScale lays out from: every small-multiples panel's
    (noted by the facet hooks), or the chart's, binned through the
    projection as it stands.
    @param viz The Geomap.
    @param settings The resolved `hexbin`.
*/
export function geoBinColorRows(
  viz: VizInstance,
  settings: GeoHexbinSettings,
): DataPoint[] {
  const panels = viz.ctx.geomapPanels as DataPoint[][] | undefined;
  const groups = viz._facetStep && panels ? panels : [viz._filteredData ?? []];
  const origin = geoBinOrigin(viz);
  return groups.flatMap(rows =>
    geoBinRows(
      geoBinPoints(viz, geoPointRows(viz, rows), settings),
      settings,
      origin,
    ),
  );
}

const fmt = (viz: VizInstance, n: number): string =>
  Number.isFinite(n) ? formatAbbreviate(n, viz.schema.locale) : "";

/** A bin's tooltip title: what it measures, such as "Count: 42". */
export function geoBinTitle(
  viz: VizInstance,
  d: DataPoint,
): string | undefined {
  const meta = geoBinMeta(d);
  const settings = meta && geoHexbinSettings(viz);
  if (!meta || !settings) return undefined;
  return `${settings.measure}: ${fmt(viz, meta.value)}`;
}

/** A bin's tooltip rows: its point count, when it measures something else. */
export function geoBinTooltipRows(
  viz: VizInstance,
  d: DataPoint,
): [string, string][] {
  const meta = geoBinMeta(d);
  const settings = meta && geoHexbinSettings(viz);
  if (!meta || !settings || settings.agg === "count") return [];
  return [[viz.schema.translate("Count") as string, fmt(viz, meta.count)]];
}
