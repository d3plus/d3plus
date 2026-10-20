/**
    `applyCalendarLayout` — Calendar's chart-specific layout stage. Reads each
    drawn row's day, lays out the year (or month) blocks the days span (see
    `calendarLayout.ts`), and pairs every day's cell with its row. Labels,
    month outlines, and the fitted cell size go on `viz.ctx` for `emit`.
*/

import type {DataPoint} from "@d3plus/data";
import {textWidth} from "@d3plus/dom";
import {fontFamilyStringify} from "@d3plus/text";

import {chartBounds} from "../features/chartGeometry.js";
import type {TransformStage} from "../pipeline/stages.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {
  calendarDayKey,
  dateExtent,
  parseCalendarDate,
  resolveWeekStart,
} from "./calendarDates.js";
import type {CalendarPeriod} from "./calendarDates.js";
import {
  calendarDateSpecifier,
  calendarFormatter,
  calendarTimeLocale,
  narrowName,
} from "./calendarFormat.js";
import {calendarLayout} from "./calendarLayout.js";
import type {
  CalendarCell,
  CalendarLabelOptions,
  CalendarLayoutResult,
} from "./calendarLayout.js";
import type {CalendarOrient} from "./calendarGrid.js";

/** A day's cell paired with the row drawn in it, if any. */
export interface CalendarCellDatum extends CalendarCell {
  datum?: DataPoint;
  i?: number;
}

/** The label style read from `calendarLabelConfig`. */
export interface CalendarLabelStyle {
  fontColor?: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number | string;
}

/** A row's day, read through the `date` accessor. */
export function rowDate(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): Date | null {
  const date = viz.schema.date as
    ((d: DataPoint, i: number) => unknown) | undefined;
  return parseCalendarDate(typeof date === "function" ? date(d, i) : undefined);
}

/** The first and last day among `rows`, or `null` when none has a readable day. */
export function rowsExtent(
  viz: VizInstance,
  rows: DataPoint[],
): [Date, Date] | null {
  const dates: Date[] = [];
  rows.forEach((d, i) => {
    const date = rowDate(viz, d, i);
    if (date) dates.push(date);
  });
  return dateExtent(dates);
}

/** The resolved period: `"month"` when set, else `"year"`. */
export function calendarPeriod(viz: VizInstance): CalendarPeriod {
  return viz.schema.period === "month" ? "month" : "year";
}

/** The resolved orientation: as set, else horizontal years and vertical (wall-calendar) months. */
export function calendarOrient(viz: VizInstance): CalendarOrient {
  const orient = viz.schema.orient;
  if (orient === "horizontal" || orient === "vertical") return orient;
  return calendarPeriod(viz) === "month" ? "vertical" : "horizontal";
}

/** The label font from `calendarLabelConfig`, over the chart's font family. */
export function calendarLabelStyle(viz: VizInstance): CalendarLabelStyle {
  const config = (viz.schema.calendarLabelConfig ?? {}) as Record<
    string,
    unknown
  >;
  const family = (config.fontFamily ?? viz.schema.fontFamily) as
    string | string[];
  return {
    fontColor:
      typeof config.fontColor === "string" ? config.fontColor : undefined,
    fontFamily: fontFamilyStringify(family),
    fontSize: typeof config.fontSize === "number" ? config.fontSize : 11,
    fontWeight: (config.fontWeight as number | string | undefined) ?? 400,
  };
}

/** Formats a day in full, with its weekday, in the chart's locale. */
export function calendarDateFormat(viz: VizInstance): (date: Date) => string {
  const definition = calendarTimeLocale(viz.schema.locale);
  return calendarFormatter(
    calendarDateSpecifier(definition),
    definition,
    false,
  )!;
}

/** The weekday/month/year/title formatters and measurement for the chart's labels. */
function labelOptions(
  viz: VizInstance,
  period: CalendarPeriod,
  style: CalendarLabelStyle,
): CalendarLabelOptions {
  const definition = calendarTimeLocale(viz.schema.locale);
  const titles: ((date: Date) => string)[] = [];
  if (period === "month") {
    const custom = calendarFormatter(viz.schema.monthFormat, definition, false);
    if (custom) titles.push(custom);
    else if (viz.schema.monthFormat !== false) {
      for (const spec of ["%B %Y", "%b %Y", "%b"]) {
        titles.push(calendarFormatter(spec, definition, false)!);
      }
    }
  }
  return {
    fontSize: style.fontSize,
    measure: text =>
      textWidth(text, {
        "font-family": style.fontFamily,
        "font-size": style.fontSize,
        "font-weight": style.fontWeight,
      }) as number,
    weekday: calendarFormatter(viz.schema.weekdayFormat, definition, "%a"),
    month:
      period === "year"
        ? calendarFormatter(viz.schema.monthFormat, definition, "%b")
        : null,
    year:
      period === "year"
        ? calendarFormatter(viz.schema.yearFormat, definition, "%Y")
        : null,
    title: titles,
    narrow: text => narrowName(text, viz.schema.locale as string),
  };
}

export const applyCalendarLayout: TransformStage = ({viz}) => {
  const data = (viz._filteredData ?? []) as DataPoint[];
  const rows = new Map<string, {datum: DataPoint; i: number}>();
  data.forEach((d, i) => {
    const date = rowDate(viz, d, i);
    if (!date) return;
    const key = calendarDayKey(date);
    if (!rows.has(key)) rows.set(key, {datum: d, i});
  });

  const extent =
    (viz.ctx.calendarSharedExtent as [Date, Date] | undefined) ??
    rowsExtent(viz, data);
  viz.ctx.calendarLayout = undefined;
  if (!extent) return {shapeData: []};

  const {width, height} = chartBounds(viz);
  const period = calendarPeriod(viz);
  const style = calendarLabelStyle(viz);
  const layout: CalendarLayoutResult = calendarLayout({
    start: extent[0],
    end: extent[1],
    period,
    orient: calendarOrient(viz),
    weekStart: resolveWeekStart(viz.schema.weekStart, viz.schema.locale),
    width,
    height,
    labels: labelOptions(viz, period, style),
  });
  viz.ctx.calendarLayout = layout;
  viz.ctx.calendarDateFormat = calendarDateFormat(viz);
  viz.ctx.calendarLabelStyle = style;

  const cells: CalendarCellDatum[] = layout.cells.map(cell => {
    const row = rows.get(cell.key);
    return row ? {...cell, datum: row.datum, i: row.i} : cell;
  });
  return {shapeData: cells as unknown as DataPoint[]};
};
