/**
    Candlestick's axis buffer (see `Plot.buffer`): widens the value axis to
    every period's high and low, not just its close, and pads the time axis
    by a period at each end so the outer candles sit clear of the axis.

    @module
*/

import type {DataPoint} from "@d3plus/data";

import {
  scaleTimeShift,
  scaleTimeStep,
} from "../../components/Axis/brokenTimeScale.js";
import type {D3Scale} from "../../utils/index.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {ohlcAccessors} from "./aggregate.js";
import {ohlcExtent} from "./ohlc.js";

/** Pixels of room kept between the highest high (and lowest low) and the axis ends. */
const EDGE_BUFFER = 4;

/**
    Widens an ascending `[min, max]` domain to `extent`, plus `buffer` pixels
    at each end measured on `scale` (whose range runs top-down, so larger
    values sit at smaller pixels).
    @param domain The axis's ascending domain.
    @param extent The `[low, high]` the axis must hold.
    @param scale The value scale, for converting the pixel buffer.
    @param buffer The room to keep at each end, in pixels.
*/
export function widenDomain(
  domain: [number, number],
  extent: [number, number],
  scale: Pick<D3Scale, "invert"> & ((v: number) => number),
  buffer = EDGE_BUFFER,
): [number, number] {
  let [lo, hi] = domain;
  const invert = scale.invert;
  const pad = (v: number, px: number): number => {
    const p = scale(v);
    if (!invert || !Number.isFinite(p)) return v;
    const out = Number(invert(p + px));
    return Number.isFinite(out) ? out : v;
  };
  const top = pad(extent[1], -buffer);
  const bottom = pad(extent[0], buffer);
  if (top > hi) hi = top;
  if (bottom < lo) lo = bottom;
  return [lo, hi];
}

/**
    Pads the time axis by one period's room at each end, so the outer candles
    sit clear of the value axis: a full step of padding on a category scale,
    or the smallest gap between periods on a time scale.
    @param scale The time axis's scale.
    @param times The periods' times (ms), for a time scale's smallest gap.
*/
export function padPeriods(scale: D3Scale, times: number[]): void {
  if (scale.padding) {
    scale.padding(1);
    return;
  }
  const sorted = Array.from(new Set(times.filter(Number.isFinite))).sort(
    (a, b) => a - b,
  );
  // A time scale with hidden time (`rangeBreaks`) counts only the time it shows.
  let gap = Infinity;
  for (let k = 1; k < sorted.length; k++)
    gap = Math.min(gap, scaleTimeStep(scale, sorted[k - 1], sorted[k]));
  if (!Number.isFinite(gap)) return;
  const [lo, hi] = (scale.domain() as (number | Date)[]).map(Number);
  scale.domain([
    scaleTimeShift(scale, lo, -gap),
    scaleTimeShift(scale, hi, gap),
  ]);
}

/**
    The buffer Plot calls for the Candlestick shape key with that shape's
    formatted rows and the chart's scales; returns the scales, widened.
*/
export function candlestickBuffer(
  this: VizInstance,
  {
    data,
    x,
    y,
    x2,
  }: {data: Record<string, unknown>[]; x: D3Scale; y: D3Scale; x2?: unknown},
): [D3Scale, D3Scale] {
  // The secondary axes hold no candles.
  if (x2) return [x, y];
  padPeriods(
    x,
    data.map(row => +(row.x as number)),
  );
  const rows = data.map(row => ({
    d: row.data as DataPoint,
    i: row.i as number,
  }));
  const extent = ohlcExtent(rows, ohlcAccessors(this));
  if (!extent) return [x, y];
  const domain = (y.domain() as number[]).slice().reverse() as [number, number];
  const widened = widenDomain(
    domain,
    extent,
    y as unknown as Pick<D3Scale, "invert"> & ((v: number) => number),
  );
  y.domain(widened.slice().reverse());
  return [x, y];
}
