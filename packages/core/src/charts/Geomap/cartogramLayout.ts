/**
    Lays out a Geomap's `cartogram`: reads each region's value and projected
    home, sizes and places its circle or square (see `cartogram.ts`), and
    keeps the result for redraws with the same inputs.

    @module
*/

import {polygonArea, polygonCentroid} from "d3-polygon";

import type {DataPoint} from "@d3plus/data";
import {pathRings} from "@d3plus/render";

import type {VizInstance} from "../viz/vizTypes.js";
import {cartogramRadii, circlePathD, squarePathD} from "./cartogram.js";
import {fitCartogram} from "./cartogramRelax.js";
import type {CartogramKind, CartogramNode} from "./cartogram.js";

/** A region as `applyGeomapLayout` joins it to its row. */
export interface CartogramRegion {
  data?: DataPoint;
  feature: unknown;
  id: string | number;
}

/** A region's cartogram shape. */
export interface CartogramShape {
  /** The shape's path data. */
  d: string;
  /** The center x. */
  x: number;
  /** The center y. */
  y: number;
  /** The radius, or half the square's side. */
  r: number;
  /** Whether the shape is a square. */
  square: boolean;
}

/** The share of the regions' own area their cartogram shapes take, before fitting. */
export const CARTOGRAM_FILL = 0.6;

/** What a layout reads besides the regions. */
export interface CartogramLayoutInput {
  /** The region's projected path data. */
  pathD: (region: CartogramRegion) => string | null;
  /** The region's projected area. */
  area: (region: CartogramRegion) => number;
  /** The box the shapes must fit, `[x0, y0, x1, y1]`. */
  bounds: [number, number, number, number];
}

/**
    The cartogram Geomap draws: `cartogram` when it names a kind Geomap
    draws, else false.
*/
export function cartogramKind(viz: VizInstance): CartogramKind | false {
  const kind = viz.schema.cartogram;
  return kind === "dorling" || kind === "demers" ? kind : false;
}

/**
    The value that sizes a region: `cartogramSize`, else the `colorScale`
    value, else 1 for every region with data.
*/
export function cartogramValue(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): number {
  const size = (viz.schema.cartogramSize ?? viz.schema.colorScale) as
    ((d: DataPoint, i: number) => unknown) | false | undefined;
  if (typeof size !== "function") return 1;
  const value = size(d, i);
  return value === null || value === undefined || value === ""
    ? NaN
    : Number(value);
}

/**
    The center of a region's largest ring, read from its projected path
    data: the home its shape is pulled toward, so a country's far-flung
    islands don't drag it out to sea. Null when the path draws nothing.
    @param d The region's projected path data.
*/
export function regionHome(d: string | null): [number, number] | null {
  const rings = d ? pathRings(d) : null;
  if (!rings || !rings.length) return null;
  let best = rings[0],
    max = -1;
  for (const ring of rings) {
    const a = Math.abs(polygonArea(ring));
    if (a > max) {
      max = a;
      best = ring;
    }
  }
  return max > 0 ? polygonCentroid(best) : best[0];
}

/** Each viz's recent layouts, by the inputs they were placed from. */
const layouts = new WeakMap<object, Map<string, CartogramShape[]>>();
/** The layouts each viz keeps (one per small-multiples panel). */
const KEEP = 12;

/** Each region's home, by its geometry, for the path it was read from. */
const homes = new WeakMap<object, {d: string; home: [number, number] | null}>();

/** `regionHome` of a region, kept by its geometry while its path is the same. */
function cachedHome(region: CartogramRegion, d: string | null) {
  const geometry = (region.feature as {geometry?: unknown} | null)?.geometry;
  if (!d || !geometry || typeof geometry !== "object") return regionHome(d);
  const hit = homes.get(geometry);
  if (hit && hit.d === d) return hit.home;
  const home = regionHome(d);
  homes.set(geometry, {d, home});
  return home;
}

/**
    Each region's cartogram shape, by region id: a circle (Dorling) or
    square (Demers) as large as its value's share of `CARTOGRAM_FILL` of
    the regions' area, placed near its home without overlapping the others.
    Regions without data or without a positive value get none.
    @param viz The Geomap.
    @param regions The regions, joined to their rows.
    @param input How to read each region's path and area, and the box to fit.
*/
export function geomapCartogram(
  viz: VizInstance,
  regions: CartogramRegion[],
  input: CartogramLayoutInput,
): Map<string | number, CartogramShape> | null {
  const kind = cartogramKind(viz);
  if (!kind) return null;
  const square = kind === "demers";
  const drawn: {
    region: CartogramRegion;
    home: [number, number];
    value: number;
    area: number;
  }[] = [];
  regions.forEach((region, i) => {
    if (!region.data) return;
    const value = cartogramValue(viz, region.data, i);
    if (!(value > 0)) return;
    const d = input.pathD(region);
    const home = cachedHome(region, d);
    if (!home) return;
    drawn.push({region, home, value, area: input.area(region)});
  });
  const shapes = new Map<string | number, CartogramShape>();
  if (!drawn.length) return shapes;

  const area = drawn.reduce((sum, r) => sum + (r.area > 0 ? r.area : 0), 0);
  const total = viz.ctx.cartogramTotal as number | undefined;
  const radii = cartogramRadii(
    drawn.map(r => r.value),
    area * CARTOGRAM_FILL,
    square,
    total,
  );
  const nodes: CartogramNode[] = drawn.map((r, i) => ({
    x: r.home[0],
    y: r.home[1],
    r: radii[i],
  }));
  const padding = Math.max(0, Number(viz.schema.cartogramPadding) || 0);
  const key = [
    kind,
    padding,
    input.bounds.join(","),
    nodes.map(n => `${n.x},${n.y},${n.r}`).join(";"),
  ].join("|");

  let kept = layouts.get(viz);
  if (!kept) layouts.set(viz, (kept = new Map()));
  let placed = kept.get(key);
  if (!placed) {
    placed = fitCartogram(nodes, input.bounds, {square, padding}).map(p => ({
      d: square ? squarePathD(p.x, p.y, p.r) : circlePathD(p.x, p.y, p.r),
      x: p.x,
      y: p.y,
      r: p.r,
      square,
    }));
    kept.set(key, placed);
    if (kept.size > KEEP) kept.delete(kept.keys().next().value!);
  }
  drawn.forEach((r, i) => shapes.set(r.region.id, placed![i]));
  return shapes;
}
