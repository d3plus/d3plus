/**
    A KPI tile's history, for a chart with `time` set: the tile's rows split
    into periods in time order, the period(s) the timeline selects as
    current, and the previous value they are compared with.
*/

import type {DataPoint} from "@d3plus/data";
import {date} from "@d3plus/dom";

/** A row of the chart's data, with its index in the data. */
export interface IndexedRow {
  row: DataPoint;
  i: number;
}

/** One period of a tile's rows. */
export interface KpiPeriod {
  /** The period's time value, as the data gives it. */
  time: unknown;
  rows: IndexedRow[];
}

/** One point of a tile's sparkline. */
export interface KpiPoint {
  time: unknown;
  value: number;
  /** Whether the point is in the selected (current) period. */
  current: boolean;
}

/** A tile's sparkline and the value its current period is compared with. */
export interface KpiSeries {
  points: KpiPoint[];
  /** The value of the periods just before the current one(s), or `NaN`. */
  previous: number;
  /** Those previous periods' time values. */
  previousTimes: unknown[];
}

/** A time value as a timestamp, or `NaN` when it doesn't read as a date. */
function timestamp(value: unknown): number {
  if (value === undefined || value === null || value === "") return NaN;
  const parsed = date(value as Parameters<typeof date>[0]);
  return parsed ? +parsed : NaN;
}

/**
    Splits rows into periods by their `time` value, in time order (data
    order for values that don't read as dates, after those that do).
*/
export function kpiPeriods(
  rows: IndexedRow[],
  time: (d: DataPoint, i: number) => unknown,
): KpiPeriod[] {
  const byKey = new Map<string, KpiPeriod>();
  for (const r of rows) {
    const t = time(r.row, r.i);
    const key = t instanceof Date ? `${+t}` : `${t}`;
    let period = byKey.get(key);
    if (!period) byKey.set(key, (period = {time: t, rows: []}));
    period.rows.push(r);
  }
  const periods = [...byKey.values()].map((p, order) => ({
    p,
    order,
    ms: timestamp(p.time),
  }));
  periods.sort((a, b) => {
    const da = Number.isFinite(a.ms),
      db = Number.isFinite(b.ms);
    if (da && db && a.ms !== b.ms) return a.ms - b.ms;
    if (da !== db) return da ? -1 : 1;
    return a.order - b.order;
  });
  return periods.map(d => d.p);
}

/**
    A tile's sparkline points and previous value. `current` picks the
    selected periods; the previous value covers as many periods, just before
    the first selected one, and is `NaN` when there aren't that many.
    `valueOf` reads one value from a set of rows (merging them the way the
    chart rolls rows up).
*/
export function kpiSeries(
  periods: KpiPeriod[],
  current: (period: KpiPeriod) => boolean,
  valueOf: (rows: IndexedRow[]) => number,
): KpiSeries {
  const flags = periods.map(current);
  const points = periods.map((p, k) => ({
    time: p.time,
    value: valueOf(p.rows),
    current: flags[k],
  }));
  const first = flags.indexOf(true);
  const count = flags.filter(Boolean).length;
  if (first < 0 || first < count)
    return {points, previous: NaN, previousTimes: []};
  const before = periods.slice(first - count, first);
  return {
    points,
    previous: valueOf(before.flatMap(p => p.rows)),
    previousTimes: before.map(p => p.time),
  };
}
