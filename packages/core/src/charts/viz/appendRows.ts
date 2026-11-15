import type {DataPoint} from "@d3plus/data";
import {date} from "@d3plus/dom";

import type {VizInstance} from "./vizTypes.js";
import {vizDiscrete} from "./discrete.js";

/**
    How many rows `append` keeps: a row count (the latest rows), a time span
    (rows within that span of the latest time) written as a number and a
    unit (`"5 minutes"`, `"90s"`, `"300000ms"`, `"1.5 hours"`), or `false`
    to keep every row.
*/
export type AppendWindow = number | string | false;

/** Options for `viz.append(rows, options)`. */
export interface AppendOptions {
  /** Drops the oldest rows outside this window (see {@link AppendWindow}). */
  window?: AppendWindow;
}

const MS: Record<string, number> = {
  ms: 1,
  millisecond: 1,
  s: 1e3,
  sec: 1e3,
  second: 1e3,
  m: 6e4,
  min: 6e4,
  minute: 6e4,
  h: 36e5,
  hr: 36e5,
  hour: 36e5,
  d: 864e5,
  day: 864e5,
  w: 6048e5,
  week: 6048e5,
};

/**
    The milliseconds a time span names (`"5 minutes"`, `"90s"`, `"300000ms"`,
    `"1.5 hours"`), or null when it isn't one. Units run from milliseconds
    to weeks, singular, plural, or abbreviated (`ms`, `s`/`sec`, `m`/`min`,
    `h`/`hr`, `d`, `w`).
    @param span The span.
*/
export function parseTimeSpan(span: string): number | null {
  const match = /^\s*(\d*\.?\d+)\s*([a-z]+)\s*$/i.exec(span);
  if (!match) return null;
  const unit = match[2].toLowerCase();
  const ms = Object.hasOwn(MS, unit)
    ? MS[unit]
    : unit.endsWith("s") && Object.hasOwn(MS, unit.slice(0, -1))
      ? MS[unit.slice(0, -1)]
      : undefined;
  return ms === undefined ? null : Number(match[1]) * ms;
}

/**
    The rows a window keeps, oldest first: the latest `window` rows for a
    row count, or those whose `time` falls within a span of the latest
    time. A row whose time can't be read is kept. Every row for a missing,
    `false`, or unreadable window.
    @param rows The rows, oldest first.
    @param window The window.
    @param time Reads a row's time, for a time span.
*/
export function windowRows(
  rows: DataPoint[],
  window: AppendWindow | undefined,
  time?: ((d: DataPoint, i: number) => unknown) | null,
): DataPoint[] {
  if (typeof window === "number")
    return window >= 0 && window < rows.length
      ? rows.slice(rows.length - Math.floor(window))
      : rows;
  if (typeof window !== "string" || !time) return rows;
  const span = parseTimeSpan(window);
  if (span === null) return rows;
  const times = rows.map((d, i) => {
    const t = date(time(d, i) as Parameters<typeof date>[0]);
    return t instanceof Date ? +t : NaN;
  });
  let latest = -Infinity;
  for (const t of times) if (t > latest) latest = t;
  if (!Number.isFinite(latest)) return rows;
  const from = latest - span;
  return rows.filter((_, i) => !(times[i] < from));
}

/**
    The accessor a time-span window reads: the chart's `time`, else its
    discrete axis's value (a LinePlot's `x`), else none.
    @private
*/
export function appendTime(
  viz: VizInstance,
): ((d: DataPoint, i: number) => unknown) | null {
  if (typeof viz.schema.time === "function") return viz.schema.time;
  const axis = vizDiscrete(viz);
  const fn = axis && (viz as unknown as Record<string, unknown>)[`_${axis}`];
  return typeof fn === "function"
    ? (fn as (d: DataPoint, i: number) => unknown)
    : null;
}

/**
    Adds rows to a chart's data, drops those outside the window, and
    schedules one redraw for the next animation frame, however many appends
    land before it. A timeline the user hasn't brushed re-defaults, so it
    follows the latest period, as a polled update does.
    @param viz The chart.
    @param rows A row or rows to add, oldest first.
    @param options The window to keep.
    @private
*/
export function appendData(
  viz: VizInstance,
  rows: DataPoint | DataPoint[],
  options: AppendOptions = {},
): void {
  const added = (Array.isArray(rows) ? rows : [rows]).filter(d => d != null);
  viz._data = windowRows(
    (viz._data ?? []).concat(added),
    options.window,
    appendTime(viz),
  );
  if (!viz.schema.timeFilter) viz._timelineSelection = false;
  const host = viz as unknown as {_appendDraw?: boolean};
  if (host._appendDraw) return;
  host._appendDraw = true;
  const draw = () => {
    host._appendDraw = false;
    viz.render?.();
  };
  if (typeof requestAnimationFrame === "function") requestAnimationFrame(draw);
  else setTimeout(draw, 0);
}
