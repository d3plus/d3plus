/**
    `dialLayout` — the radii, lengths, and font sizes of the dial's parts for
    a given outer radius, shared by the layout stage (to fit the dial) and the
    emit (to draw).
*/

import {unionBox} from "./gaugeGeometry.js";
import type {GaugeBox} from "./gaugeGeometry.js";

/** How a gauge shows its value: a needle, or an arc filled from the minimum. */
export type GaugeIndicator = "needle" | "progress";

/** Inputs to `dialLayout` that don't depend on the radius. */
export interface DialOptions {
  indicator: GaugeIndicator;
  /** Track thickness as a fraction of the radius. */
  thickness: number;
  hasBands: boolean;
  /** How many rows the dial shows: one needle, or one progress ring, each. */
  rows: number;
  /** Whether to show the value under the hub (or in the middle of the rings). */
  hasValue: boolean;
  /** Whether to show a name under the value. */
  hasName: boolean;
  /** The unit-radius sweep's bounding box (see `arcExtent`). */
  extent: GaugeBox;
  /** A fixed tick label font size, overriding the radius-scaled default. */
  tickFontSize?: number;
}

/** An annulus, by its inner and outer radius. */
export interface Ring {
  inner: number;
  outer: number;
}

/** Every measurement needed to draw the dial, in pixels from its center. */
export interface DialLayout {
  /** The outer edge of the outermost track. */
  outer: number;
  /** The inner edge of the innermost track. */
  inner: number;
  /** One track per progress row, stepping inward; a needle dial has one. */
  rings: Ring[];
  bandOuter: number;
  bandInner: number;
  tickOuter: number;
  majorLength: number;
  minorLength: number;
  tickLabelRadius: number;
  tickFontSize: number;
  hubRadius: number;
  needleLength: number;
  needleHalfWidth: number;
  needleTail: number;
  valueY: number;
  valueFontSize: number;
  valueMaxWidth: number;
  nameY: number;
  nameFontSize: number;
  nameMaxWidth: number;
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

/**
    The tracks of a dial of radius `r`: a single track for a needle, or one
    concentric track per row for progress arcs, stepping inward. Several
    progress tracks thin out so that together they span at most half the
    radius.
*/
export function dialRings(
  r: number,
  thickness: number,
  rows: number,
  progress: boolean,
): Ring[] {
  const n = progress ? Math.max(1, rows) : 1;
  const gap = n > 1 ? Math.max(2, r * 0.02) : 0;
  let t = r * thickness;
  if (n > 1 && n * t + (n - 1) * gap > r * 0.5)
    t = Math.max(1, (r * 0.5 - (n - 1) * gap) / n);
  return Array.from({length: n}, (_, i) => {
    const ringOuter = r - i * (t + gap);
    return {inner: Math.max(0, ringOuter - t), outer: ringOuter};
  });
}

/**
    Lays out a dial of outer radius `r`. Bands sit on the track for a needle
    and in a thin strip just inside the innermost track for progress arcs;
    ticks hang inward from there, with their labels inside them. The value
    label sits below the hub for a needle, or in the middle of the dial for a
    progress arc (above the center line when the sweep leaves no room below
    it), with the name beneath it.
*/
export function dialLayout(r: number, opts: DialOptions): DialLayout {
  const {indicator, hasBands, hasValue, extent} = opts;
  const hasName = opts.hasName && hasValue;
  const thickness = clamp(opts.thickness, 0.02, 1);
  const needle = indicator !== "progress";
  const rings = dialRings(r, thickness, opts.rows, !needle);
  const outer = r;
  const inner = rings[rings.length - 1].inner;
  const bandOuter = needle ? outer : inner - r * 0.025;
  const bandInner = needle ? inner : bandOuter - Math.max(2, r * 0.035);
  const tickOuter = (needle || !hasBands ? inner : bandInner) - r * 0.03;
  const majorLength = r * 0.07;
  const tickFontSize = opts.tickFontSize ?? clamp(r * 0.075, 8, 16);
  const tickLabelRadius =
    tickOuter - majorLength - r * 0.03 - tickFontSize * 0.8;
  const hubRadius = Math.max(3, r * 0.055);
  const valueFontSize = hasValue ? clamp(r * (needle ? 0.2 : 0.3), 10, 72) : 0;
  const nameFontSize = hasName ? clamp(r * 0.085, 9, 20) : 0;
  const gap = r * 0.03;
  const block = valueFontSize + (hasName ? gap + nameFontSize : 0);
  let valueTop: number;
  if (needle) valueTop = hubRadius + r * 0.06;
  else if (extent.y1 >= 0.3) valueTop = -block / 2;
  else valueTop = -block - gap;
  const valueY = valueTop + valueFontSize / 2;
  return {
    outer,
    inner,
    rings,
    bandOuter,
    bandInner,
    tickOuter,
    majorLength,
    minorLength: majorLength / 2,
    tickLabelRadius,
    tickFontSize,
    hubRadius,
    needleLength: (inner + outer) / 2,
    needleHalfWidth: Math.max(2, r * 0.03),
    needleTail: r * 0.12,
    valueY,
    valueFontSize,
    valueMaxWidth: Math.max(0, tickLabelRadius) * (needle ? 1.3 : 1.6),
    nameY: valueY + valueFontSize / 2 + gap + nameFontSize / 2,
    nameFontSize,
    nameMaxWidth: r * 1.2,
  };
}

/**
    The dial's footprint in units of its outer radius: the sweep's bounding
    box plus the needle's tail and the value/name labels. Measured at a
    reference radius, since label sizes scale with the radius.
*/
export function dialBox(opts: DialOptions): GaugeBox {
  const ref = 100;
  const l = dialLayout(ref, opts);
  if (!l.valueFontSize) {
    const tail = opts.indicator === "progress" ? 0 : l.needleTail / ref;
    return unionBox(opts.extent, {x0: 0, x1: 0, y0: 0, y1: tail});
  }
  const bottom =
    (l.nameFontSize
      ? l.nameY + l.nameFontSize / 2
      : l.valueY + l.valueFontSize / 2) / ref;
  const top = (l.valueY - l.valueFontSize / 2) / ref;
  const tail = opts.indicator === "progress" ? 0 : l.needleTail / ref;
  return unionBox(opts.extent, {
    x0: -0.5,
    x1: 0.5,
    y0: Math.min(top, 0),
    y1: Math.max(bottom, tail),
  });
}
