/**
    Candlestick's tooltip rows and aria label: each period's date, open,
    high, low, close, and change, and its volume when the chart has one.

    @module
*/

import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";

import {axisName} from "../Plot/sharedTooltip.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {ohlcAccessors} from "./aggregate.js";
import {candleChange, readOhlc} from "./ohlc.js";
import {formatPeriod, periodDate} from "./periods.js";
import {formatVolume, readVolume} from "./volume.js";

type Locale = Parameters<typeof formatAbbreviate>[1];

/**
    A price as the tooltip shows it: two decimals for values of 1 or more
    (e.g. `"1,234.50"`, with the locale's separators), three significant
    digits below that.
    @param value The price.
    @param locale The chart's locale.
*/
export function formatPrice(value: number, locale?: Locale): string {
  if (Math.abs(value) < 1) return formatAbbreviate(value, locale, ".3~g");
  // formatAbbreviate drops trailing zeros; put the cents back.
  const decimal = formatAbbreviate(1.5, locale, ".1f").charAt(1);
  const [whole, cents = ""] = formatAbbreviate(value, locale, ",.2f").split(decimal);
  return `${whole}${decimal}${cents.padEnd(2, "0")}`;
}

/**
    A fractional change as a signed percentage, e.g. `0.0123` as `"+1.23%"`.
    @param change The change, as a fraction.
    @param locale The chart's locale.
*/
export function formatChange(change: number, locale?: Locale): string {
  const text = formatAbbreviate(change * 100, locale, ".2f");
  return `${change > 0 ? "+" : ""}${text}%`;
}

/** The chart's price formatter: the y axis's `tickFormat` when set, else `formatPrice`. */
function priceFormat(viz: VizInstance): (v: number) => string {
  const tickFormat = viz._yConfig?.tickFormat;
  return typeof tickFormat === "function"
    ? (v: number) => String(tickFormat(v))
    : (v: number) => formatPrice(v, viz.schema.locale);
}

/** A row's period: through the x axis's `tickFormat` when set, else as a full date. */
function periodText(viz: VizInstance, d: DataPoint, i: number): string {
  const raw = viz._x ? viz._x(d, i) : undefined;
  const tickFormat = viz._xConfig?.tickFormat;
  const value = periodDate(raw);
  if (typeof tickFormat === "function") return String(tickFormat(value));
  return value instanceof Date ? formatPeriod(value) : String(raw ?? "");
}

/**
    The tooltip rows for one period: its date, then Open, High, Low, Close,
    Change (open to close, as a percentage), and, with `volume` set, Volume
    (abbreviated, e.g. "1.2M"). Empty when the row has no close.
    @param viz The chart.
    @param d The data row.
    @param i The row's index.
*/
export function candleTooltipRows(viz: VizInstance, d: DataPoint, i: number): string[][] {
  const v = readOhlc(d, i, ohlcAccessors(viz));
  if (!v) return [];
  const t = (s: string): string => viz.schema.translate(s);
  const price = priceFormat(viz);
  const rows: string[][] = [
    [axisName(viz, "x"), periodText(viz, d, i)],
    [t("Open"), price(v.open)],
    [t("High"), price(v.high)],
    [t("Low"), price(v.low)],
    [t("Close"), price(v.close)],
  ];
  const change = candleChange(v.open, v.close);
  if (change !== undefined) rows.push([t("Change"), formatChange(change, viz.schema.locale)]);
  const volume = readVolume(viz, d, i);
  if (volume !== undefined) rows.push([t("Volume"), formatVolume(viz, volume)]);
  return rows;
}

/**
    A screen-reader label for one period, e.g.
    `"ACME, Jan 2, 2024: Open 101, High 104, Low 99.5, Close 103."`.
    @param viz The chart.
    @param d The data row.
    @param i The row's index.
*/
export function candleAriaLabel(viz: VizInstance, d: DataPoint, i: number): string {
  const [period, ...values] = candleTooltipRows(viz, d, i);
  const label = viz._drawLabel(d, i);
  const head = [label, period?.[1]].filter(s => s !== undefined && s !== "").join(", ");
  return `${head}: ${values.map(([k, val]) => `${k} ${val}`).join(", ")}.`;
}
