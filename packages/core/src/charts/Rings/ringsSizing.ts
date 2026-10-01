/**
    Rings' ring geometry and node sizing: where the two rings sit for a chart
    area, each node's radius — fixed per ring, or from a `size` scale shared
    by every node (center included) that the size legend reads back — and
    whether the center's label still fits inside it.

    @module
*/
import {extent, min} from "d3-array";
import * as scales from "d3-scale";

import type {DataPoint} from "@d3plus/data";
import {textWidth} from "@d3plus/dom";
import {fontFamilyStringify} from "@d3plus/text";

import type {VizInstance} from "../viz/vizTypes.js";
import type {SizeLegendScale} from "../../components/SizeLegend/sizeLegendLayout.js";

/** The fields of a laid-out Rings node that sizing reads and writes. */
interface SizedNode {
  data: DataPoint;
  i: number;
  r?: number;
  ring?: 1 | 2;
  size?: number;
}

interface RScale {
  (v: number): number;
  domain: (d: [number, number]) => RScale;
  range: (r: [number, number]) => RScale;
}

type RadiusScale = SizeLegendScale & ((n: number) => number);

/** Ring geometry derived from the chart bounds. */
export interface RingGeometry {
  width: number;
  height: number;
  ringWidth: number;
  primaryRing: number;
  secondaryRing: number;
}

/** Ring geometry for a chart area: the center plus two rings, each a third of the radius apart. */
export function ringsGeometry(width: number, height: number): RingGeometry {
  const radius = (min([height, width]) || 0) / 2;
  const ringWidth = radius / 3;
  return {width, height, ringWidth, primaryRing: ringWidth, secondaryRing: ringWidth * 2};
}

/** Clamps a radius into `[sizeMin, sizeMax]` (either bound optional). */
function clampRadius(v: VizInstance, r: number): number {
  const lo = v.schema.sizeMin as number | undefined;
  const hi = v.schema.sizeMax as number | undefined;
  return Math.min(hi ?? Infinity, Math.max(lo ?? 0, r));
}

/**
    The radius scale for sized Rings: `sizeScale` over every placed node's
    `size` value. Its top radius is capped so neighbors can't overlap — a
    quarter of the ring width radially, and half the gap between adjacent
    slots around each ring (`slots` is how many evenly spaced positions the
    outer ring is divided into) — then by `sizeMax`; its bottom is `sizeMin`,
    held to at most half the top so small values still read smaller.
*/
function ringsSizeScale(
  v: VizInstance,
  geom: RingGeometry,
  slots: number,
  values: number[],
): RadiusScale {
  const {ringWidth, primaryRing, secondaryRing} = geom;
  const half = Math.sin(Math.PI / Math.max(slots, 2));
  const cap = Math.max(1, Math.floor(min([ringWidth / 4, primaryRing * half - 1, secondaryRing * half - 1])!));
  const rMax = Math.min((v.schema.sizeMax as number | undefined) ?? Infinity, cap);
  const rMin = Math.min(rMax / 2, (v.schema.sizeMin as number | undefined) ?? 3);
  const domain = extent(values) as [number, number];
  const name = `scale${v.schema.sizeScale.charAt(0).toUpperCase()}${v.schema.sizeScale.slice(1)}`;
  return ((scales as unknown as Record<string, () => RScale>)[name]()
    .domain(domain)
    .range([domain[0] === domain[1] ? rMax : rMin, rMax]) as unknown) as RadiusScale;
}

/**
    Assigns each ring node its `ring` + `r`, and `center.r`. Sized charts
    (`size` set) run every node, center included, through one
    `ringsSizeScale`, and return it; unsized charts use the fixed ring radii
    and return null.
*/
export function sizeRingsNodes(
  v: VizInstance,
  center: SizedNode,
  geom: RingGeometry,
  slots: number,
  primaries: SizedNode[],
  secondaries: SizedNode[],
): RadiusScale | null {
  primaries.forEach(p => (p.ring = 1));
  secondaries.forEach(s => (s.ring = 2));

  if (v._size) {
    const all = [center, ...primaries, ...secondaries];
    all.forEach(n => (n.size = Number(v._size!(n.data, n.i))));
    const values = all.map(n => n.size as number).filter(n => Number.isFinite(n));
    if (values.length) {
      const radius = ringsSizeScale(v, geom, slots, values);
      all.forEach(n => (n.r = Number.isFinite(n.size) ? radius(n.size as number) : clampRadius(v, 0)));
      return radius;
    }
  }

  const {ringWidth} = geom;
  const primaryDistance = ringWidth / 2;
  const secondaryDistance = ringWidth / 4;

  let primaryMax = primaryDistance / 2 - 4;
  if (primaryDistance / 2 - 4 < 8) primaryMax = min([primaryDistance / 2, 8]) || 0;

  let secondaryMax = secondaryDistance / 2 - 4;
  if (secondaryDistance / 2 - 4 < 4) secondaryMax = min([secondaryDistance / 2, 4]) || 0;
  if (secondaryMax > ringWidth / 10) secondaryMax = ringWidth / 10;
  if (secondaryMax > primaryMax && secondaryMax > 10) secondaryMax = primaryMax * 0.75;
  if (primaryMax > secondaryMax * 1.5) primaryMax = secondaryMax * 1.5;

  primaries.forEach(p => (p.r = clampRadius(v, Math.floor(primaryMax))));
  secondaries.forEach(s => (s.r = clampRadius(v, Math.floor(secondaryMax))));
  return null;
}


/** Smallest font size, in pixels, a center label may shrink to and still sit inside its circle. */
const CENTER_LABEL_MIN_FONT = 9;

/**
    Where the center node's label goes. Unsized, the center circle is always
    large, so the label fills the inner ring's square as before. Sized, the
    center can be small: the label goes inside only if its longest word fits
    the circle's inscribed square at a legible size; otherwise it sits below
    the circle (`inside: false`), where it reads against the background
    rather than the circle's fill.
*/
export function ringsCenterLabel(
  v: VizInstance,
  center: SizedNode & {r?: number},
  geom: RingGeometry,
  text: string,
  fontFamily: string | string[],
): {bounds: {x: number; y: number; width: number; height: number}; inside: boolean} {
  const {primaryRing} = geom;
  if (!v._size)
    return {bounds: {x: -primaryRing / 2, y: -primaryRing / 2, width: primaryRing, height: primaryRing}, inside: true};
  const r = center.r ?? 0;
  const side = r * Math.SQRT2;
  const longestWord = Math.max(
    0,
    ...String(text ?? "").split(/\s+/).map(w => textWidth(w, {"font-family": fontFamilyStringify(fontFamily), "font-size": CENTER_LABEL_MIN_FONT})),
  );
  if (side >= longestWord && side >= CENTER_LABEL_MIN_FONT * 1.4)
    return {bounds: {x: -side / 2, y: -side / 2, width: side, height: side}, inside: true};
  const width = primaryRing;
  return {bounds: {x: -width / 2, y: r + 3, width, height: primaryRing / 2}, inside: false};
}
