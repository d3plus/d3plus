/**
    Lays out a Geomap's `dotDensity`: one dot for every `per` units of each
    row's value, scattered inside its region's projected shape. Each group
    of dots (a region, or a category within one) draws from a random
    stream seeded by its ids, so redraws and resizes keep every dot in
    place.

    @module
*/

import type {DataPoint} from "@d3plus/data";
import {pathRings} from "@d3plus/render";

import {fieldAccessor, fieldNameOf} from "../../utils/fieldAccessor.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {regionsReshaped} from "./tileGrid.js";
import {DotScatter, dotCounts} from "./dotDensity.js";
import type {DotPoint, DotRing} from "./dotDensity.js";

type Accessor = (d: DataPoint, i: number) => unknown;

/** The `dotDensity` option. */
export interface DotDensityConfig {
  /** The value each row's dots count: a data key or an accessor. */
  value?: string | Accessor;
  /** The units each dot stands for. */
  per?: number;
  /** The dot radius, in pixels. */
  r?: number;
  /** The dots' color: a CSS color or a function of the row. */
  fill?: string | Accessor;
  /** The dots' opacity. */
  fillOpacity?: number;
  /** The most dots the map draws; past it, each dot stands for more. */
  max?: number;
}

/** `dotDensity`, resolved for a draw. */
export interface DotDensitySettings {
  value: Accessor;
  /** The name of what the dots count. */
  valueName?: string;
  per: number;
  r: number;
  fill?: string | Accessor;
  fillOpacity: number;
  max: number;
}

/** `dotDensity`'s defaults. */
export const DOT_DEFAULTS = {
  per: 1000,
  r: 1.5,
  fillOpacity: 0.8,
};

/** The most dots drawn on each renderer, unless `dotDensity.max` sets it. */
export const DOT_MAX = {svg: 20000, canvas: 100000};

/** A group of dots: a row's share of its region. */
export interface DotGroup {
  /** A key unique to the region and category. */
  key: string;
  /** The region's id. */
  region: string | number;
  /** The row the dots count. */
  row: DataPoint;
  /** The row's index. */
  index: number;
  /** The row's value. */
  value: number;
  /** The dots' centers. */
  points: DotPoint[];
}

/** A Geomap's dots. */
export interface DotDensityLayout {
  groups: DotGroup[];
  /** The units each dot stands for, after the `max` cap. */
  per: number;
  /** Whether the rows split each region into categories (more than one `groupBy` level). */
  categories: boolean;
  settings: DotDensitySettings;
}

/** A region the dots fill. */
export interface DotRegion {
  id: string | number;
  feature: unknown;
}

/**
    `dotDensity`, resolved: null when it is off, has no `value`, or a
    `cartogram` or `tileGrid` reshapes the regions.
*/
export function dotDensitySettings(
  viz: VizInstance,
): DotDensitySettings | null {
  const option = viz.schema.dotDensity as DotDensityConfig | false | undefined;
  if (!option || typeof option !== "object" || regionsReshaped(viz))
    return null;
  const {value} = option;
  const accessor =
    typeof value === "function"
      ? value
      : typeof value === "string"
        ? (fieldAccessor(value) as Accessor)
        : undefined;
  if (!accessor) return null;
  const num = (v: unknown, fallback: number) =>
    typeof v === "number" && Number.isFinite(v) && v > 0 ? v : fallback;
  const canvas = viz._renderer === "canvas";
  return {
    value: accessor,
    valueName:
      typeof value === "string" ? value : (fieldNameOf(accessor) ?? undefined),
    per: num(option.per, DOT_DEFAULTS.per),
    r: num(option.r, DOT_DEFAULTS.r),
    fill: option.fill,
    fillOpacity:
      typeof option.fillOpacity === "number"
        ? Math.min(1, Math.max(0, option.fillOpacity))
        : DOT_DEFAULTS.fillOpacity,
    max: num(option.max, canvas ? DOT_MAX.canvas : DOT_MAX.svg),
  };
}

/** Each viz's scatters, by group key, with the path they were placed in. */
const scatters = new WeakMap<
  object,
  Map<string, {d: string; scatter: DotScatter}>
>();

/** How many scatters a viz keeps per group drawn (one per small-multiples panel). */
const KEEP = 12;

/** The rings of each projected path, by its path data. */
function ringsOf(d: string, cache: Map<string, DotRing[]>): DotRing[] {
  let rings = cache.get(d);
  if (!rings) cache.set(d, (rings = pathRings(d) ?? []));
  return rings;
}

/** The value a row's dots count, or 0 when it isn't a positive number. */
function rowValue(settings: DotDensitySettings, d: DataPoint, i: number) {
  const v = settings.value(d, i);
  const n = v === null || v === undefined || v === "" ? NaN : Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
    The dots of every region with rows: each row's value over `per` (held
    to `max` dots in all), scattered inside its region's projected shape.
    Null when `dotDensity` is off.
    @param viz The Geomap.
    @param regions The topojson regions.
    @param rows Each region's rows (with their indices), by region id as a string.
    @param pathD A region's projected path data.
*/
export function geomapDotDensity(
  viz: VizInstance,
  regions: DotRegion[],
  rows: Map<string, {row: DataPoint; index: number}[]>,
  pathD: (region: DotRegion) => string | null,
): DotDensityLayout | null {
  const settings = dotDensitySettings(viz);
  if (!settings) return null;
  const categories = (viz._drawDepth ?? 0) > 0;
  const drawn: Omit<DotGroup, "points">[] = [];
  const paths: (string | null)[] = [];
  for (const region of regions) {
    const own = rows.get(`${region.id}`);
    if (!own) continue;
    const d = pathD(region);
    for (const {row, index} of own) {
      const category = categories
        ? viz._ids(row, index).slice(0, viz._drawDepth).join("|")
        : "";
      drawn.push({
        key: `${region.id}|${category}`,
        region: region.id,
        row,
        index,
        value: rowValue(settings, row, index),
      });
      paths.push(d);
    }
  }
  const {counts, per} = dotCounts(
    drawn.map(g => g.value),
    settings.per,
    settings.max,
  );

  let kept = scatters.get(viz);
  if (!kept) scatters.set(viz, (kept = new Map()));
  const rings = new Map<string, DotRing[]>();
  const live = new Set<string>();
  const groups = drawn.map((g, k): DotGroup => {
    const d = paths[k];
    live.add(g.key);
    if (!d || !counts[k]) return {...g, points: []};
    let hit = kept.get(g.key);
    if (!hit || hit.d !== d)
      kept.set(
        g.key,
        (hit = {d, scatter: new DotScatter(ringsOf(d, rings), g.key)}),
      );
    return {...g, points: hit.scatter.take(counts[k])};
  });
  // Small multiples keep every panel's scatters; a map whose regions have
  // all changed starts over.
  if (kept.size > KEEP * Math.max(1, live.size)) kept.clear();
  return {groups, per, categories, settings};
}
