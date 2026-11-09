/**
    Rings' ring geometry and node sizing: where the rings sit for a chart
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
  ring?: number;
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
  /** The distance between neighboring rings, and the room outside the last for its labels. */
  ringWidth: number;
  /** The first ring's radius. */
  primaryRing: number;
  /**
      The first ring's radius in the two-ring chart: it sizes the center, its
      label, and the first ring's nodes, so they keep one size at any `hops`.
  */
  baseRing: number;
  /** Each ring's radius, innermost first. */
  rings: number[];
}

/** The number of rings a `hops` value asks for: a whole number, at least 1 (2 when unset or not a number). */
export function ringsHops(hops: unknown): number {
  const n = Number(hops);
  return hops != null && Number.isFinite(n) ? Math.max(1, Math.floor(n)) : 2;
}

/**
    Ring geometry for a chart area: the center plus `hops` rings. One or two
    rings sit evenly spaced, leaving one more spacing of room outside the
    last for its labels. More rings keep the first where it sits among two
    (the center, at its two-ring size, would otherwise reach it) and space
    the rest evenly out to the edge the same way.
*/
export function ringsGeometry(
  width: number,
  height: number,
  hops = 2,
): RingGeometry {
  const radius = (min([height, width]) || 0) / 2;
  const baseRing = radius / 3;
  const primaryRing = radius / (Math.min(hops, 2) + 1);
  const ringWidth = hops <= 2 ? primaryRing : (radius - primaryRing) / hops;
  const rings = Array.from(
    {length: hops},
    (_, k) => primaryRing + ringWidth * k,
  );
  return {width, height, ringWidth, primaryRing, baseRing, rings};
}

/**
    The largest radius an unsized node may take on each of `count` rings
    `ringWidth` apart, innermost first. Each ring's room halves the one
    inside it, so outer nodes are smaller, and an inner ring's nodes stay
    within half again the size of the ring outside it.
*/
export function ringNodeRadii(ringWidth: number, count: number): number[] {
  const radii: number[] = [];
  for (let k = 1; k <= count; k++) {
    const room = ringWidth / 2 ** k;
    const floor = k === 1 ? 8 : 4;
    let r = room / 2 - 4;
    if (r < floor) r = min([room / 2, floor]) || 0;
    if (k > 1 && r > ringWidth / 10) r = ringWidth / 10;
    radii.push(r);
  }
  for (let k = 1; k < count; k++)
    if (radii[k] > radii[k - 1] && radii[k] > 10)
      radii[k] = radii[k - 1] * 0.75;
  for (let k = count - 2; k >= 0; k--)
    if (radii[k] > radii[k + 1] * 1.5) radii[k] = radii[k + 1] * 1.5;
  return radii.map(r => Math.floor(r));
}

/**
    Each ring's unsized node radius, innermost first. The first ring's nodes
    (and with two rings, the second's) take their two-ring size; further
    rings size by their own spacing (see `ringNodeRadii`), each no larger
    than the ring inside it.
*/
export function ringsNodeRadii(geom: RingGeometry): number[] {
  const hops = geom.rings.length;
  const base = ringNodeRadii(geom.baseRing, 2);
  if (hops <= 2) return base.slice(0, hops);
  const radii = ringNodeRadii(geom.ringWidth, hops);
  radii[0] = base[0];
  for (let k = 1; k < hops; k++) radii[k] = Math.min(radii[k], radii[k - 1]);
  return radii;
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
    quarter of the two-ring spacing radially, and half the gap between adjacent
    slots around each ring (`slots` is how many evenly spaced positions the
    rings are divided into) — then by `sizeMax`; its bottom is `sizeMin`,
    held to at most half the top so small values still read smaller.
*/
function ringsSizeScale(
  v: VizInstance,
  geom: RingGeometry,
  slots: number,
  values: number[],
): RadiusScale {
  const {baseRing, rings} = geom;
  const half = Math.sin(Math.PI / Math.max(slots, 2));
  const cap = Math.max(
    1,
    Math.floor(min([baseRing / 4, ...rings.map(ring => ring * half - 1)])!),
  );
  const rMax = Math.min(
    (v.schema.sizeMax as number | undefined) ?? Infinity,
    cap,
  );
  const rMin = Math.min(
    rMax / 2,
    (v.schema.sizeMin as number | undefined) ?? 3,
  );
  const domain = extent(values) as [number, number];
  const name = `scale${v.schema.sizeScale.charAt(0).toUpperCase()}${v.schema.sizeScale.slice(1)}`;
  return (scales as unknown as Record<string, () => RScale>)
    [name]()
    .domain(domain)
    .range([
      domain[0] === domain[1] ? rMax : rMin,
      rMax,
    ]) as unknown as RadiusScale;
}

/**
    Assigns each ring node its `ring` (1 innermost) + `r`, and `center.r`.
    Sized charts (`size` set) run every node, center included, through one
    `ringsSizeScale`, and return it; unsized charts give each ring its
    `ringsNodeRadii` radius and return null.
*/
export function sizeRingsNodes(
  v: VizInstance,
  center: SizedNode,
  geom: RingGeometry,
  slots: number,
  rings: SizedNode[][],
): RadiusScale | null {
  rings.forEach((ring, k) => ring.forEach(n => (n.ring = k + 1)));

  if (v._size) {
    const all = [center, ...rings.flat()];
    all.forEach(n => (n.size = Number(v._size!(n.data, n.i))));
    const values = all
      .map(n => n.size as number)
      .filter(n => Number.isFinite(n));
    if (values.length) {
      const radius = ringsSizeScale(v, geom, slots, values);
      all.forEach(
        n =>
          (n.r = Number.isFinite(n.size)
            ? radius(n.size as number)
            : clampRadius(v, 0)),
      );
      return radius;
    }
  }

  const radii = ringsNodeRadii(geom);
  rings.forEach((ring, k) =>
    ring.forEach(n => (n.r = clampRadius(v, radii[k]))),
  );
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
): {
  bounds: {x: number; y: number; width: number; height: number};
  inside: boolean;
} {
  const {baseRing: primaryRing} = geom;
  if (!v._size)
    return {
      bounds: {
        x: -primaryRing / 2,
        y: -primaryRing / 2,
        width: primaryRing,
        height: primaryRing,
      },
      inside: true,
    };
  const r = center.r ?? 0;
  const side = r * Math.SQRT2;
  const longestWord = Math.max(
    0,
    ...String(text ?? "")
      .split(/\s+/)
      .map(w =>
        textWidth(w, {
          "font-family": fontFamilyStringify(fontFamily),
          "font-size": CENTER_LABEL_MIN_FONT,
        }),
      ),
  );
  if (side >= longestWord && side >= CENTER_LABEL_MIN_FONT * 1.4)
    return {
      bounds: {x: -side / 2, y: -side / 2, width: side, height: side},
      inside: true,
    };
  const width = primaryRing;
  return {
    bounds: {x: -width / 2, y: r + 3, width, height: primaryRing / 2},
    inside: false,
  };
}
