/**
    RadialLine and RadialArea's series: each `groupBy` group's rows placed
    around the circle in axis order, with the value range each point spans
    (from the baseline, or stacked on the series before it).
*/

import type {DataPoint} from "@d3plus/data";

import {radialKey} from "./angles.js";
import type {RadialAngleScale} from "./angles.js";

type Accessor<T> = (d: DataPoint, i: number) => T;

/** One series' point at one `x` value. */
export interface RadialPoint {
  /** The `x` value's key (see `radialKey`). */
  key: string;
  x: unknown;
  /** Its angle, in radians (0 at 12 o'clock, clockwise). */
  angle: number;
  /** The row's own value (0 for a stacked series' missing row). */
  value: number;
  /** The value the point's band starts from: the baseline, or the series stacked beneath. */
  y0: number;
  /** The value the point reaches. */
  y1: number;
  /** The row, or undefined where a stacked series has none at this `x`. */
  row?: DataPoint;
  /** The row's index in the rows the series were built from. */
  i: number;
}

/** One `groupBy` group, drawn as one line or area. */
export interface RadialSeries {
  id: string;
  /** The group's rows, in data order. */
  rows: DataPoint[];
  /** Its points, in axis order. */
  points: RadialPoint[];
}

/** Options for `radialSeries`. */
export interface RadialSeriesOptions {
  /** A row's series. */
  id: Accessor<unknown>;
  /** A row's `x` value. */
  x: Accessor<unknown>;
  /** A row's value. */
  y: Accessor<unknown>;
  scale: RadialAngleScale;
  /** Stacks each series on the ones before it, at every `x` any series has. */
  stacked?: boolean;
  /** The value an unstacked band starts from. */
  baseline?: number;
  /** Where values advance: clockwise (default) or counterclockwise. */
  clockwise?: boolean;
  /** Where the axis starts, in radians (to order points along it). */
  start?: number;
}

/**
    Builds the series from `rows`, in the order their groups first appear.
    A row whose `x` is off the axis is left out, as is a non-finite value
    on an unstacked series. Stacked, every series has a point at every
    `x` any series has (a missing or non-finite value counts as 0), and
    negative values take no room.
*/
export function radialSeries(
  rows: DataPoint[],
  opts: RadialSeriesOptions,
): RadialSeries[] {
  const {scale, stacked = false, baseline = 0} = opts;
  const dir = opts.clockwise === false ? -1 : 1;
  const start = opts.start ?? 0;
  const position = (angle: number) => dir * (angle - start);

  const groups = new Map<
    string,
    {rows: DataPoint[]; at: Map<string, number>}
  >();
  const xs = new Map<string, {x: unknown; angle: number}>();
  rows.forEach((d, i) => {
    const x = opts.x(d, i);
    const angle = scale.angleOf(x);
    if (angle === undefined) return;
    const key = radialKey(x);
    if (!xs.has(key)) xs.set(key, {x, angle});
    const id = `${opts.id(d, i)}`;
    let g = groups.get(id);
    if (!g) groups.set(id, (g = {rows: [], at: new Map()}));
    g.rows.push(d);
    // The first row at an `x` stands for it (the chart merges the rest).
    if (!g.at.has(key)) g.at.set(key, i);
  });
  const order = Array.from(xs.entries()).sort(
    (a, b) => position(a[1].angle) - position(b[1].angle),
  );
  const valueOf = (i: number) => Number(opts.y(rows[i], i));

  const tops = new Map<string, number>();
  return Array.from(groups.entries()).map(([id, g]) => {
    const points: RadialPoint[] = [];
    for (const [key, {x, angle}] of order) {
      const i = g.at.get(key);
      const raw = i === undefined ? Number.NaN : valueOf(i);
      if (!stacked) {
        if (i === undefined || !Number.isFinite(raw)) continue;
        points.push({
          key,
          x,
          angle,
          value: raw,
          y0: baseline,
          y1: raw,
          row: rows[i],
          i,
        });
        continue;
      }
      const value = Number.isFinite(raw) ? raw : 0;
      const y0 = tops.get(key) ?? 0;
      const y1 = y0 + Math.max(0, value);
      tops.set(key, y1);
      points.push({
        key,
        x,
        angle,
        value,
        y0,
        y1,
        row: i === undefined ? undefined : rows[i],
        i: i ?? -1,
      });
    }
    return {id, rows: g.rows, points};
  });
}

/** The values the radial domain covers: every point's reach (a stacked point's top). */
export function radialDomainValues(series: RadialSeries[]): number[] {
  return series.flatMap(s => s.points.map(p => p.y1));
}
