/**
    Pure helpers for Candlestick: reading a row's open/high/low/close, its
    direction and change, the value extent the rows span, and the SVG path
    each period draws as.

    @module
*/

import type {DataPoint} from "@d3plus/data";

/** A row accessor, as the chart's `open`/`high`/`low`/`close` store them. */
export type OhlcAccessor = (d: DataPoint, i: number) => unknown;

/** The four accessors a candle reads. */
export interface OhlcAccessors {
  open: OhlcAccessor;
  high: OhlcAccessor;
  low: OhlcAccessor;
  close: OhlcAccessor;
}

/** One period's open, high, low, and close (values or pixels). */
export interface Ohlc {
  open: number;
  high: number;
  low: number;
  close: number;
}

/** How a candle draws: a body and wick, or an OHLC bar with side ticks. */
export type CandlestickVariant = "candlestick" | "ohlc";

/** Whether a period closed at or above its open. */
export type CandleDirection = "up" | "down";

/** `v` as a finite number, or undefined. */
export function finiteValue(v: unknown): number | undefined {
  if (v === null || v === undefined || v === "" || typeof v === "boolean") return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/**
    A row's open/high/low/close. A missing open reads as the close, and a
    missing high or low as the larger or smaller of open and close, while the
    high and low always contain the open and close. Undefined when the close
    isn't a finite number.
    @param d The data row.
    @param i The row's index.
    @param accessors The chart's `open`/`high`/`low`/`close` accessors.
*/
export function readOhlc(d: DataPoint, i: number, accessors: OhlcAccessors): Ohlc | undefined {
  const close = finiteValue(accessors.close(d, i));
  if (close === undefined) return undefined;
  const open = finiteValue(accessors.open(d, i)) ?? close;
  const high = finiteValue(accessors.high(d, i));
  const low = finiteValue(accessors.low(d, i));
  return {
    open,
    high: Math.max(high ?? -Infinity, open, close),
    low: Math.min(low ?? Infinity, open, close),
    close,
  };
}

/**
    Whether a period rose: `"up"` when it closed at or above its open,
    otherwise `"down"`.
*/
export function candleDirection(open: number, close: number): CandleDirection {
  return close >= open ? "up" : "down";
}

/**
    A period's change from open to close as a fraction of its open, e.g.
    `0.05` for a 5% rise. Undefined when the open is zero or either value
    isn't finite.
*/
export function candleChange(open: number, close: number): number | undefined {
  if (!Number.isFinite(open) || !Number.isFinite(close) || open === 0) return undefined;
  return (close - open) / Math.abs(open);
}

/**
    The `[lowest low, highest high]` over every row with a finite close;
    undefined when there is none.
    @param rows The data rows, each paired with its index.
    @param accessors The chart's `open`/`high`/`low`/`close` accessors.
*/
export function ohlcExtent(
  rows: {d: DataPoint; i: number}[],
  accessors: OhlcAccessors,
): [number, number] | undefined {
  let lo = Infinity, hi = -Infinity;
  for (const {d, i} of rows) {
    const v = readOhlc(d, i, accessors);
    if (!v) continue;
    if (v.low < lo) lo = v.low;
    if (v.high > hi) hi = v.high;
  }
  return lo <= hi ? [lo, hi] : undefined;
}

/**
    The smallest gap between neighboring distinct positions (the pixel room
    one period has); `fallback` when there are fewer than two.
    @param positions Pixel positions along the time axis, in any order.
    @param fallback The room a lone period gets.
*/
export function periodSpacing(positions: number[], fallback: number): number {
  const sorted = Array.from(new Set(positions.filter(Number.isFinite))).sort((a, b) => a - b);
  let gap = Infinity;
  for (let k = 1; k < sorted.length; k++) gap = Math.min(gap, sorted[k] - sorted[k - 1]);
  return Number.isFinite(gap) && gap > 0 ? gap : fallback;
}

/**
    The pixel width of a candle's body (or the span of an OHLC bar's two
    ticks): `bodyWidth` of the period's room, at least 1px.
    @param spacing The period's room along the time axis, in pixels.
    @param bodyWidth The share of that room to fill, from 0 to 1.
*/
export function candleWidth(spacing: number, bodyWidth: number): number {
  const share = Number.isFinite(bodyWidth) ? Math.min(1, Math.max(0, bodyWidth)) : 0.7;
  return Math.max(1, spacing * share);
}

/** Rounds `v` to the center of a pixel, so a 1px stroke there draws crisp. */
export const pixelCenter = (v: number): number => Math.round(v - 0.5) + 0.5;

/**
    The path for one candlestick: a wick from the high to the body and from
    the body to the low, and the body as a closed rectangle between the open
    and close (a flat line when they meet).
    @param cx The period's center along the time axis.
    @param width The body's width.
    @param px The open/high/low/close as pixel positions.
*/
export function candlePath(cx: number, width: number, px: Ohlc): string {
  const top = Math.min(px.open, px.close);
  const bottom = Math.max(px.open, px.close);
  const high = Math.min(px.high, top);
  const low = Math.max(px.low, bottom);
  const half = width / 2;
  let d = "";
  if (high < top) d += `M${cx},${high}V${top}`;
  if (low > bottom) d += `M${cx},${bottom}V${low}`;
  d += `M${cx - half},${top}H${cx + half}V${bottom}H${cx - half}Z`;
  return d;
}

/**
    The path for one OHLC bar: a line from the high to the low, a tick to the
    left at the open, and a tick to the right at the close.
    @param cx The period's center along the time axis.
    @param width The span from the open tick's end to the close tick's end.
    @param px The open/high/low/close as pixel positions.
*/
export function ohlcBarPath(cx: number, width: number, px: Ohlc): string {
  const half = width / 2;
  return `M${cx},${px.high}V${px.low}M${cx - half},${px.open}H${cx}M${cx},${px.close}H${cx + half}`;
}
