/**
    The size legend of a Dorling or Demers cartogram: nested circles or
    squares as large as the shapes drawn for a few values of
    `cartogramSize`, in the chart's bottom-right corner.

    @module
*/

import {max, min} from "d3-array";
import {scaleSqrt} from "d3-scale";

import type {DataPoint} from "@d3plus/data";

import {fieldNameOf} from "../../utils/fieldAccessor.js";
import type {SizeLegendScale} from "../../components/SizeLegend/sizeLegendLayout.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {
  CARTOGRAM_FILL,
  cartogramKind,
  cartogramValue,
} from "./cartogramLayout.js";
import type {CartogramRegion, CartogramShape} from "./cartogramLayout.js";

/**
    The share of the chart area a cartogram's regions are guessed to cover
    before the map is laid out, to size the legend's room.
*/
const REGION_SHARE = 0.4;

/**
    A scale from value to radius (or half a square's side) that draws
    `value` at `c·√value`: the shapes' own sizing, over `[lo, hi]`.
*/
export function cartogramScale(
  c: number,
  lo: number,
  hi: number,
): SizeLegendScale {
  return scaleSqrt()
    .domain([lo, hi])
    .range([
      c * Math.sqrt(lo),
      c * Math.sqrt(hi),
    ]) as unknown as SizeLegendScale;
}

/** The positive values a cartogram sizes, read from the rows. */
function sizedValues(viz: VizInstance, rows: DataPoint[]): number[] {
  return rows
    .map((d, i) => cartogramValue(viz, d, i))
    .filter(v => Number.isFinite(v) && v > 0);
}

/**
    Points the size legend at the cartogram: its marks (squares for
    Demers) and its title (the `cartogramSize` key, else the `colorScale`
    key). Returns whether the chart draws a Dorling or Demers cartogram.
*/
export function setCartogramLegend(viz: VizInstance): boolean {
  const kind = cartogramKind(viz);
  const sized = kind === "dorling" || kind === "demers";
  viz._sizeLegendShape = kind === "demers" ? "square" : "circle";
  viz._sizeKey = sized
    ? fieldNameOf(viz.schema.cartogramSize || viz.schema.colorScale)
    : undefined;
  return sized;
}

/**
    The legend's scale before the map is laid out, for the room it takes:
    the shapes sized as if the regions covered `REGION_SHARE` of `available`.
    Null when the shapes don't differ in size.
*/
export function estimateCartogramScale(
  viz: VizInstance,
  available: {width: number; height: number},
): SizeLegendScale | null {
  const values = sizedValues(viz, viz._filteredData ?? []);
  const lo = min(values),
    hi = max(values);
  if (lo === undefined || hi === undefined || lo === hi) return null;
  const total =
    (viz.ctx.cartogramTotal as number | undefined) ??
    values.reduce((a, b) => a + b, 0);
  const area =
    available.width * available.height * REGION_SHARE * CARTOGRAM_FILL;
  const square = cartogramKind(viz) === "demers";
  const c = Math.sqrt(area / total / (square ? 4 : Math.PI));
  return cartogramScale(c, lo, hi);
}

/**
    The legend's scale for the shapes as drawn: each shape's size over the
    root of its value is the same for all of them (they shrink together).
    Null when there are no shapes, or they don't differ in size.
*/
export function drawnCartogramScale(
  viz: VizInstance,
  regions: CartogramRegion[],
  shapes: Map<string | number, CartogramShape>,
): SizeLegendScale | null {
  let c = 0,
    lo = Infinity,
    hi = -Infinity;
  regions.forEach((region, i) => {
    const shape = shapes.get(region.id);
    if (!shape || !region.data || !(shape.r > 0)) return;
    const v = cartogramValue(viz, region.data, i);
    if (!(v > 0)) return;
    if (v > hi) {
      hi = v;
      c = shape.r / Math.sqrt(v);
    }
    lo = Math.min(lo, v);
  });
  return c > 0 && hi > lo ? cartogramScale(c, lo, hi) : null;
}
