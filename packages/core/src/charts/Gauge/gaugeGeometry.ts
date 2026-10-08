/**
    Pure gauge geometry: value → angle mapping, the value domain, tick values,
    band resolution, the dial's bounding box and placement, and the needle
    outline. Angles are radians in d3's convention
    (0 at 12 o'clock, increasing clockwise), so a point at angle `a` and
    radius `r` sits at `(r·sin a, −r·cos a)`.
*/

import {scaleLinear} from "d3-scale";

/** A colored zone along the dial, e.g. `{min: 80, color: "red"}`. */
export interface GaugeBand {
  /** Where the band starts. Defaults to the previous band's end, or the domain's minimum. */
  min?: number;
  /** Where the band ends. Defaults to the domain's maximum. */
  max?: number;
  /** The band's fill color. */
  color?: string;
}

/** A band clamped to the domain, with both ends and a color resolved. */
export interface ResolvedBand {
  min: number;
  max: number;
  color: string;
}

/** An axis-aligned box, in units of the dial's outer radius. */
export interface GaugeBox {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** Where the dial sits in the chart area, and how large it is. */
export interface GaugeFit {
  cx: number;
  cy: number;
  radius: number;
}

/** A gauge's `domain` setting: `[min, max]`, where either end may be left to the data. */
export type GaugeDomainInput =
  [number | null | undefined, number | null | undefined] | undefined;

/** Degrees → radians. */
export const toRadians = (deg: number): number => (deg * Math.PI) / 180;

/** Radians → degrees. */
export const toDegrees = (rad: number): number => (rad * 180) / Math.PI;

/**
    Maps `value` onto the sweep from `start` to `end` (radians). Values outside
    `domain` clamp to the nearest end; a non-finite value maps to `start`.
*/
export function gaugeAngle(
  value: number,
  domain: [number, number],
  start: number,
  end: number,
): number {
  const [lo, hi] = domain;
  const span = hi - lo;
  const t = Number.isFinite(value) && span ? (value - lo) / span : 0;
  return start + Math.max(0, Math.min(1, t)) * (end - start);
}

/**
    The value domain shared by every gauge. Each end the user leaves unset
    comes from the data: the extent of the values, any explicit band edges,
    and zero, rounded outward to numbers that line up with `count` ticks.
*/
export function gaugeDomain(
  values: number[],
  bands: GaugeBand[] = [],
  domain: GaugeDomainInput = undefined,
  count = 10,
): [number, number] {
  const known = [0, ...values, ...bands.flatMap(b => [b.min, b.max])].filter(
    (v): v is number => typeof v === "number" && Number.isFinite(v),
  );
  const [userLo, userHi] = domain ?? [];
  const lo = Number.isFinite(userLo) ? (userLo as number) : Math.min(...known);
  let hi = Number.isFinite(userHi) ? (userHi as number) : Math.max(...known);
  if (!(hi > lo)) hi = lo + 1;
  const [niceLo, niceHi] = scaleLinear().domain([lo, hi]).nice(count).domain();
  return [
    Number.isFinite(userLo) ? lo : niceLo,
    Number.isFinite(userHi) ? hi : niceHi,
  ];
}

/** A default major tick count for a sweep: about one tick every 45°. */
export function defaultTickCount(start: number, end: number): number {
  return Math.max(2, Math.round(Math.abs(toDegrees(end - start)) / 45));
}

const near = (a: number, b: number, span: number) =>
  Math.abs(a - b) <= span * 1e-9;

/**
    Major and minor tick values. `ticks` is a tick count, an explicit array of
    values, or `false` for none. Counted ticks always label both ends of the
    domain (dropping an interior tick that would crowd an end); minor ticks
    subdivide each major step into five.
*/
export function gaugeTicks(
  domain: [number, number],
  ticks: number | number[] | false | undefined,
  minorTicks: boolean,
  defaultCount: number,
): {major: number[]; minor: number[]} {
  const [lo, hi] = domain;
  const span = hi - lo;
  if (ticks === false) return {major: [], minor: []};
  const scale = scaleLinear().domain(domain);
  const count = typeof ticks === "number" ? Math.max(1, ticks) : defaultCount;
  let major: number[];
  if (Array.isArray(ticks)) {
    major = ticks
      .filter(t => Number.isFinite(t) && t >= lo && t <= hi)
      .sort((a, b) => a - b);
  } else {
    const inner = scale.ticks(count);
    const step = inner.length > 1 ? inner[1] - inner[0] : span;
    major = [
      lo,
      ...inner.filter(t => t - lo >= step / 2 && hi - t >= step / 2),
      hi,
    ];
  }
  const minor = minorTicks
    ? scale
        .ticks(Math.max(1, (major.length - 1 || count) * 5))
        .filter(t => t > lo && t < hi && !major.some(m => near(m, t, span)))
    : [];
  return {major, minor};
}

/**
    Resolves bands in order: each starts at its own `min`, else where the
    previous band ended, else the domain's minimum; each ends at its own `max`,
    else the domain's maximum. Ends are clamped to the domain, and empty bands
    are dropped.
*/
export function resolveBands(
  bands: GaugeBand[],
  domain: [number, number],
  fallbackColor: string,
): ResolvedBand[] {
  const [lo, hi] = domain;
  const clamp = (v: number) => Math.max(lo, Math.min(hi, v));
  const out: ResolvedBand[] = [];
  let previous = lo;
  for (const b of bands ?? []) {
    if (!b) continue;
    const min = clamp(Number.isFinite(b.min) ? (b.min as number) : previous);
    const max = clamp(Number.isFinite(b.max) ? (b.max as number) : hi);
    previous = max;
    if (max > min) out.push({min, max, color: b.color ?? fallbackColor});
  }
  return out;
}

/** The bounding box of a unit-radius arc from `start` to `end`, including its center. */
export function arcExtent(start: number, end: number): GaugeBox {
  const a0 = Math.min(start, end);
  const a1 = Math.max(start, end);
  const angles = [a0, a1];
  const quarter = Math.PI / 2;
  for (let q = Math.ceil(a0 / quarter); q * quarter <= a1; q++)
    angles.push(q * quarter);
  const xs = [0, ...angles.map(a => Math.sin(a))];
  const ys = [0, ...angles.map(a => -Math.cos(a))];
  return {
    x0: Math.min(...xs),
    x1: Math.max(...xs),
    y0: Math.min(...ys),
    y1: Math.max(...ys),
  };
}

/** The smallest box containing both. */
export function unionBox(a: GaugeBox, b: GaugeBox): GaugeBox {
  return {
    x0: Math.min(a.x0, b.x0),
    x1: Math.max(a.x1, b.x1),
    y0: Math.min(a.y0, b.y0),
    y1: Math.max(a.y1, b.y1),
  };
}

/**
    Fits one dial into `width` × `height`: the largest radius at which `box`
    (the dial's footprint in units of its radius) fits, with the footprint
    centered in the area.
*/
export function fitDial(
  width: number,
  height: number,
  box: GaugeBox,
): GaugeFit {
  const boxW = box.x1 - box.x0 || 1;
  const boxH = box.y1 - box.y0 || 1;
  const radius = Math.max(0, Math.min(width / boxW, height / boxH));
  return {
    cx: width / 2 - ((box.x0 + box.x1) / 2) * radius,
    cy: height / 2 - ((box.y0 + box.y1) / 2) * radius,
    radius,
  };
}

/**
    A tapered needle pointing straight up from the origin: `length` to the
    tip, `halfWidth` at the hub, and a short counterweight `tail` behind it.
*/
export function needlePath(
  length: number,
  halfWidth: number,
  tail: number,
): string {
  const tip = halfWidth * 0.2;
  const back = halfWidth * 0.7;
  return (
    `M${-halfWidth},0L${-tip},${-length}L${tip},${-length}L${halfWidth},0` +
    `L${back},${tail}L${-back},${tail}Z`
  );
}
