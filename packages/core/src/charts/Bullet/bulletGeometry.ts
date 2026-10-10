/**
    Pure bullet geometry: band normalization and default shades, the value
    domain, tick fitting, value → pixel mapping, and the rectangle a value
    span covers on a bullet.
*/

import {gaugeDomain, gaugeTicks} from "../Gauge/gaugeGeometry.js";
import type {GaugeBand, GaugeDomainInput} from "../Gauge/gaugeGeometry.js";

/** Which way the bullets run: values grow rightward, or upward. */
export type BulletOrient = "horizontal" | "vertical";

/** A `bands` entry: a threshold value, or a Gauge-style band object. */
export type BulletBandInput = number | GaugeBand;

/** An axis-aligned rectangle in chart-area pixels. */
export interface BulletRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Where a bullet's value axis runs: its start pixel (the domain minimum) and length. */
export interface BulletTrack {
  orient: BulletOrient;
  /** The band's rectangle; values run along its long side. */
  band: BulletRect;
  domain: [number, number];
}

/**
    Turns `bands` input into Gauge-style bands. Bare numbers are thresholds:
    `[60, 85]` becomes three bands, ending at 60, at 85, and at the domain's
    maximum. Objects pass through; a list of only objects is used as given.
*/
export function normalizeBands(input: unknown): GaugeBand[] {
  if (!Array.isArray(input)) return [];
  const bands: GaugeBand[] = [];
  let thresholds = false;
  for (const b of input) {
    if (typeof b === "number") {
      if (Number.isFinite(b)) {
        bands.push({max: b});
        thresholds = true;
      }
    } else if (b && typeof b === "object") bands.push({...(b as GaugeBand)});
  }
  const last = bands[bands.length - 1];
  if (thresholds && last && last.max !== undefined) bands.push({});
  return bands;
}

/**
    The default band shades, as mix fractions from the background (0) toward
    the text color (1): the first band contrasts most, and each later band
    steps lighter, so the qualitative ranges read as one hue on any theme.
*/
export function bandShades(
  count: number,
  darkest = 0.36,
  lightest = 0.12,
): number[] {
  if (count <= 0) return [];
  if (count === 1) return [(darkest + lightest) / 2];
  const step = (darkest - lightest) / (count - 1);
  return Array.from({length: count}, (_, i) => darkest - i * step);
}

/**
    What a bullet's domain is built from: the extent of every value it shows
    (measure, target, forecast, and band edges; empty when none are finite)
    and the user's `domain` input.
*/
export interface BulletExtent {
  extent: number[];
  input: GaugeDomainInput;
}

/** Collects the finite values and band edges a bullet shows into a `BulletExtent`. */
export function bulletExtent(
  values: number[],
  bands: GaugeBand[],
  input: GaugeDomainInput,
): BulletExtent {
  const known = [...values, ...bands.flatMap(b => [b.min, b.max])].filter(
    (v): v is number => typeof v === "number" && Number.isFinite(v),
  );
  return {
    extent: known.length ? [Math.min(...known), Math.max(...known)] : [],
    input,
  };
}

/** Merges two extents; the first one's `domain` input wins. */
export function mergeExtents(a: BulletExtent, b: BulletExtent): BulletExtent {
  return bulletExtent([...a.extent, ...b.extent], [], a.input);
}

/**
    A bullet's value domain for about `count` ticks: Gauge's domain rule (the
    extent and zero, rounded out to nice numbers that line up with the ticks),
    keeping either end the user set.
*/
export function bulletDomain(e: BulletExtent, count = 5): [number, number] {
  return gaugeDomain(e.extent, [], e.input, count);
}

/** A bullet's domain and the tick values along it. */
export interface BulletAxis {
  domain: [number, number];
  ticks: number[];
}

/** Whether every gap between neighboring ticks holds their half-labels plus `padding`. */
export function ticksFit(
  ticks: number[],
  domain: [number, number],
  length: number,
  size: (value: number) => number,
  padding: number,
): boolean {
  const span = domain[1] - domain[0] || 1;
  return ticks.every((t, i) => {
    if (!i) return true;
    const gap = ((t - ticks[i - 1]) / span) * length;
    return gap >= (size(t) + size(ticks[i - 1])) / 2 + padding;
  });
}

/**
    Fits a bullet's axis along `length` pixels: counts step down from one
    tick per `spacing` pixels, rounding the domain out to each count's nice
    step, until every tick label fits (`size(value)` wide plus `padding`).
    `ticks` may also be a fixed count, an explicit array, or `false` for no
    ticks, as on Gauge.
*/
export function fitAxis(
  e: BulletExtent,
  ticks: number | number[] | false | undefined,
  length: number,
  size: (value: number) => number,
  spacing = 70,
  padding = 8,
): BulletAxis {
  if (ticks === false) return {domain: bulletDomain(e), ticks: []};
  if (Array.isArray(ticks)) {
    const domain = bulletDomain(e);
    return {domain, ticks: gaugeTicks(domain, ticks, false, 5).major};
  }
  if (typeof ticks === "number") {
    const count = Math.max(1, ticks);
    const domain = bulletDomain(e, count);
    return {domain, ticks: gaugeTicks(domain, count, false, count).major};
  }
  const most = Math.max(1, Math.floor(Math.max(0, length) / spacing));
  let axis: BulletAxis = {domain: bulletDomain(e, 1), ticks: []};
  for (let count = most; count >= 1; count--) {
    const domain = bulletDomain(e, count);
    const major = gaugeTicks(domain, count, false, count).major;
    axis = {domain, ticks: major};
    if (ticksFit(major, domain, length, size, padding)) return axis;
  }
  return {domain: axis.domain, ticks: axis.domain.slice()};
}

/** The fraction of the domain `value` sits at, clamped to `[0, 1]`; non-finite values sit at 0. */
export function domainFraction(
  value: number,
  domain: [number, number],
): number {
  const [lo, hi] = domain;
  const span = hi - lo;
  if (!Number.isFinite(value) || !span) return 0;
  return Math.max(0, Math.min(1, (value - lo) / span));
}

/** The pixel along the track where `value` sits (x for horizontal, y for vertical). */
export function trackPosition(track: BulletTrack, value: number): number {
  const t = domainFraction(value, track.domain);
  const {band} = track;
  return track.orient === "vertical"
    ? band.y + band.height * (1 - t)
    : band.x + band.width * t;
}

/** Where a bar starts: zero when the domain spans it, else the end nearest zero. */
export function baselineValue(domain: [number, number]): number {
  const [lo, hi] = domain;
  return Math.max(lo, Math.min(hi, 0));
}

/**
    The rectangle covering values `v0`…`v1` along the track, centered across
    it at `size` (a fraction of the band's thickness).
*/
export function spanRect(
  track: BulletTrack,
  v0: number,
  v1: number,
  size: number,
): BulletRect {
  const {band} = track;
  const p0 = trackPosition(track, v0);
  const p1 = trackPosition(track, v1);
  const lo = Math.min(p0, p1);
  const length = Math.abs(p1 - p0);
  const s = Math.max(0, Math.min(1, size));
  if (track.orient === "vertical") {
    const width = band.width * s;
    return {x: band.x + (band.width - width) / 2, y: lo, width, height: length};
  }
  const height = band.height * s;
  return {x: lo, y: band.y + (band.height - height) / 2, width: length, height};
}

/**
    The target marker: a line across the track at `value`, `size` (a fraction
    of the band's thickness) long and centered on the band.
*/
export function markerPoints(
  track: BulletTrack,
  value: number,
  size: number,
): [[number, number], [number, number]] {
  const {band} = track;
  const p = trackPosition(track, value);
  const s = Math.max(0, Math.min(1, size));
  if (track.orient === "vertical") {
    const inset = (band.width * (1 - s)) / 2;
    return [
      [band.x + inset, p],
      [band.x + band.width - inset, p],
    ];
  }
  const inset = (band.height * (1 - s)) / 2;
  return [
    [p, band.y + inset],
    [p, band.y + band.height - inset],
  ];
}
