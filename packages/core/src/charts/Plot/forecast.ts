/**
    A Plot's `forecast`: where along the discrete axis a forecast begins. The
    stretch after it gets a shaded backdrop, a rule at its start, and a label,
    and each line's forecast stretch is dashed. The start comes from the
    `forecast` setting (a value, rows flagged by a predicate, or `"auto"`:
    where `confidence` bands spread away from their lines) and from any trend
    line projection (`trendLineConfig.projection`).
*/
import type {DataPoint} from "@d3plus/data";
import {date} from "@d3plus/dom";
import {finite} from "@d3plus/math";

import type {PlotDatum} from "../features/plotPaint.js";
import type {VizInstance} from "../viz/vizTypes.js";

/**
    The `forecast` setting: `"auto"` (or `true`), a predicate that flags
    forecast rows, a discrete-axis value, or `false`. Unset, only a trend
    line projection is marked.
*/
export type ForecastSetting =
  | boolean
  | "auto"
  | number
  | string
  | Date
  | ((d: DataPoint, i: number) => boolean);

/** One plotted row, as forecast detection reads it. */
export interface ForecastRow {
  /** The row's series. */
  series: string;
  /** The row's discrete-axis value. */
  value: unknown;
  /** Whether the row belongs to the forecast. */
  forecast: boolean;
}

/** Where a forecast begins. */
export interface ForecastStart {
  /** The discrete-axis value the forecast begins at: the last point before it. */
  value: unknown;
  /**
      The first discrete-axis value inside the forecast, when there is one:
      bars shade from halfway between it and `value`, so the first forecast
      bar sits wholly inside the backdrop.
  */
  next?: unknown;
  /**
      Each line's own start, by series id, for the lines that have one. When
      absent, every line's forecast starts at `value`.
  */
  series?: Map<string, unknown>;
}

/** The `forecastConfig` defaults. */
export function forecastDefaults(): Record<string, unknown> {
  return {
    fillOpacity: 0.05,
    fontSize: 12,
    fontOpacity: 0.7,
    lineDasharray: "6 4",
    strokeDasharray: "4 4",
    strokeOpacity: 0.4,
    strokeWidth: 1,
  };
}

/**
    A discrete value's sort position: dates and numbers by value, anything
    else (a category) by `fallback`, its plotted position.
    @param value The discrete-axis value.
    @param fallback The value's plotted position.
*/
export function discreteOrder(value: unknown, fallback: number): number {
  if (value instanceof Date) return +value;
  return finite(value) ? value : fallback;
}

/**
    A sort position for each of a list of discrete values: dates and numbers
    by value, categories by where they first appear in the list.
    @param values The discrete-axis values, in plotted order.
*/
export function discreteRank(values: unknown[]): (value: unknown) => number {
  const firstSeen = new Map<string, number>();
  values.forEach((v, k) => {
    if (!firstSeen.has(`${v}`)) firstSeen.set(`${v}`, k);
  });
  return value => discreteOrder(value, firstSeen.get(`${value}`) ?? NaN);
}

/** Of a list, the entry with the lowest `at`, or undefined. */
function earliest<T extends {at: number}>(list: T[]): T | undefined {
  return list.reduce<T | undefined>(
    (a, b) => (!a || b.at < a.at ? b : a),
    undefined,
  );
}

/**
    Each series' forecast start from its flagged rows: the last unflagged row
    before its first flagged one, and that first flagged row as `next`. A
    series flagged from its first row starts at that row when `fromFirst` is
    set (a forecast drawn as its own series), and has no start otherwise.
    @param rows The plotted rows, in plotted order.
    @param fromFirst Whether a series flagged throughout starts at its first row.
*/
export function seriesForecastStarts(
  rows: ForecastRow[],
  fromFirst = false,
): Map<string, {value: unknown; next: unknown; at: number}> {
  const rank = discreteRank(rows.map(r => r.value));
  const bySeries = new Map<
    string,
    {value: unknown; at: number; forecast: boolean}[]
  >();
  rows.forEach(row => {
    const list = bySeries.get(row.series) ?? [];
    list.push({value: row.value, at: rank(row.value), forecast: row.forecast});
    bySeries.set(row.series, list);
  });
  const starts = new Map<string, {value: unknown; next: unknown; at: number}>();
  for (const [id, list] of bySeries) {
    const first = earliest(
      list.filter(r => r.forecast && Number.isFinite(r.at)),
    );
    if (!first) continue;
    const before = list.filter(r => r.at < first.at);
    if (before.length) {
      const origin = before.reduce((a, b) => (b.at > a.at ? b : a));
      starts.set(id, {value: origin.value, next: first.value, at: origin.at});
    } else if (fromFirst)
      starts.set(id, {value: first.value, next: first.value, at: first.at});
  }
  return starts;
}

/**
    Where a forecast begins, from the plotted rows: in each series, the last
    row before its first forecast row. The earliest such row across series
    wins. Null when no series has a row before its forecast.
    @param rows The plotted rows, in plotted order.
*/
export function autoForecastStart(rows: ForecastRow[]): unknown {
  const start = earliest(Array.from(seriesForecastStarts(rows).values()));
  return start ? start.value : null;
}

/**
    A row's forecast-detection summary: its series, its discrete value, and
    whether it belongs to the forecast. With a `forecast` predicate, the
    predicate decides; otherwise a row belongs to the forecast when a
    `confidence` bound differs from its plotted value.
    @param viz The chart.
    @param d The plotted row.
*/
export function forecastRow(viz: VizInstance, d: PlotDatum): ForecastRow {
  const discrete = viz.schema.discrete || "x";
  const setting = viz.schema.forecast as ForecastSetting | undefined;
  let forecast: boolean;
  if (typeof setting === "function") forecast = Boolean(setting(d.data, d.i));
  else {
    const value = d[discrete === "x" ? "y" : "x"];
    forecast = (viz._confidence || []).some(bound => {
      const v = bound ? bound(d.data, d.i) : undefined;
      return finite(v) && v !== value;
    });
  }
  return {series: `${d.id}`, value: d[discrete], forecast};
}

/**
    Where a trend line projection (`trendLineConfig.projection`) begins: at
    the last value the trend lines fit, with the first projected slot as
    `next`. Null when no trend line projects. Lines draw solid up to it, so
    none get a dashed stretch.
    @param viz The chart.
*/
export function trendForecastStart(viz: VizInstance): ForecastStart | null {
  let end: {value: unknown; at: number} | undefined;
  const steps: {value: unknown; at: number}[] = [];
  for (const fit of viz._trendFits || []) {
    fit.samples.forEach((s, k) => {
      const value = s[fit.axis];
      const at = discreteOrder(value, k);
      if (s.step) steps.push({value, at});
      else if (!s.projected && (!end || at > end.at)) end = {value, at};
    });
  }
  if (!end) return null;
  const next = earliest(steps.filter(s => s.at > end!.at));
  return next ? {value: end.value, next: next.value, series: new Map()} : null;
}

/**
    Where the `forecast` setting starts the forecast, before any trend
    projection: at an explicit value, or from the rows `"auto"` or a
    predicate flags. Null when off or unset.
    @param viz The chart.
    @param rows The plotted rows.
*/
function settingForecastStart(
  viz: VizInstance,
  rows: PlotDatum[],
): ForecastStart | null {
  const setting = viz.schema.forecast as ForecastSetting | undefined;
  if (setting === false || setting === undefined || setting === null)
    return null;
  const discrete = viz.schema.discrete || "x";
  if (setting === true || setting === "auto" || typeof setting === "function") {
    const starts = seriesForecastStarts(
      rows.map(d => forecastRow(viz, d)),
      typeof setting === "function",
    );
    const first = earliest(Array.from(starts.values()));
    if (!first) return null;
    const series = new Map(Array.from(starts, ([id, s]) => [id, s.value]));
    return {value: first.value, next: first.next, series};
  }
  const time = discrete === "x" ? viz._xTime : viz._yTime;
  const value = time ? date(setting as string | number) : setting;
  const values = rows.map(d => d[discrete]);
  const rank = discreteRank([...values, value]);
  const at = rank(value);
  const later = earliest(
    values.map(v => ({value: v, at: rank(v)})).filter(v => v.at > at),
  );
  return later ? {value, next: later.value} : {value};
}

/**
    Where a chart's forecast begins, or null: from the `forecast` setting
    (an explicit value wins outright) and from any trend line projection,
    whichever begins first. `false` turns both off.
    @param viz The chart.
    @param rows The plotted rows.
*/
export function forecastStart(
  viz: VizInstance,
  rows: PlotDatum[],
): ForecastStart | null {
  const setting = viz.schema.forecast as ForecastSetting | undefined;
  if (setting === false || setting === null) return null;
  const fromSetting = settingForecastStart(viz, rows);
  const explicit =
    setting !== undefined &&
    setting !== true &&
    setting !== "auto" &&
    typeof setting !== "function";
  if (explicit) return fromSetting;
  const fromTrend = trendForecastStart(viz);
  if (!fromSetting || !fromTrend) return fromSetting || fromTrend;
  const discrete = viz.schema.discrete || "x";
  const rank = discreteRank(rows.map(d => d[discrete]));
  return rank(fromTrend.value) < rank(fromSetting.value)
    ? {...fromTrend, series: fromSetting.series}
    : fromSetting;
}
