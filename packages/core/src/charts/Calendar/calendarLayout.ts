/**
    `calendarLayout` — the pure Calendar layout: the blocks a date range
    spans, fitted into the chart area with their weekday, month, and year
    labels, every day's cell, and the month outlines inside year blocks.
*/

import {
  addDays,
  blockDays,
  blockMonths,
  blockWeeks,
  calendarBlocks,
  weekIndex,
  weekdaySlot,
} from "./calendarDates.js";
import type {
  CalendarBlock,
  CalendarDay,
  CalendarPeriod,
} from "./calendarDates.js";
import {
  blockGrid,
  fitCalendar,
  monthLabelWeek,
  monthOutlinePath,
  slotPosition,
  weekdayLabelSlots,
} from "./calendarGrid.js";
import type {CalendarFit, CalendarOrient} from "./calendarGrid.js";

/** A date formatter for one kind of label, or `null` to leave those labels off. */
export type CalendarFormat = ((date: Date) => string) | null;

/** How the labels read and measure. */
export interface CalendarLabelOptions {
  /** Label font size, in pixels. */
  fontSize: number;
  /** A label's width in pixels at `fontSize`. */
  measure: (text: string) => number;
  /** Weekday names. */
  weekday: CalendarFormat;
  /** Month names along a year block. */
  month: CalendarFormat;
  /** Year block titles. */
  year: CalendarFormat;
  /** Month block titles, the first that fits the block's width. */
  title: ((date: Date) => string)[];
  /** The shortest form of a weekday name, used when the full one is wider than a cell. */
  narrow: (text: string) => string;
}

export interface CalendarLayoutInput {
  start: Date;
  end: Date;
  period: CalendarPeriod;
  orient: CalendarOrient;
  weekStart: number;
  width: number;
  height: number;
  labels: CalendarLabelOptions;
}

/** One day's cell, in chart-area pixels. */
export interface CalendarCell extends CalendarDay {
  /** The key of the block the day is drawn in. */
  block: string;
  x: number;
  y: number;
  size: number;
}

/** What a label names. */
export type CalendarLabelKind = "weekday" | "month" | "year" | "title";

/** One label, anchored at (`x`, `y`) and vertically centered there. */
export interface CalendarLabel {
  key: string;
  kind: CalendarLabelKind;
  text: string;
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
  /** Degrees; year labels beside horizontal blocks run bottom to top. */
  rotate?: number;
}

/** The outline around one month of a year block. */
export interface CalendarOutline {
  key: string;
  /** An SVG path in chart-area pixels. */
  d: string;
}

export interface CalendarLayoutResult {
  blocks: CalendarBlock[];
  fit: CalendarFit;
  cells: CalendarCell[];
  labels: CalendarLabel[];
  outlines: CalendarOutline[];
}

/** A Sunday, for naming the weekdays. */
const SUNDAY = new Date(2023, 0, 1);

/** The pixels between a label and the cells it names. */
export function labelPadding(fontSize: number): number {
  return Math.max(3, Math.round(fontSize * 0.4));
}

/** The weekday name shown for each slot of the week, from `weekStart`. */
export function weekdayNames(
  format: (date: Date) => string,
  weekStart: number,
): string[] {
  return Array.from({length: 7}, (_, s) =>
    format(addDays(SUNDAY, (weekStart + s) % 7)),
  );
}

/** The space each block's labels take: above its cells, and to their left. */
export function calendarInsets(
  period: CalendarPeriod,
  orient: CalendarOrient,
  labels: CalendarLabelOptions,
  weekdayWidth: number,
  monthWidth: number,
): {top: number; left: number} {
  const fs = labels.fontSize;
  const pad = labelPadding(fs);
  const titleBand = fs * 1.15 + pad;
  const row = fs + pad;
  const weekdayColumn = labels.weekday ? weekdayWidth + pad : 0;
  if (period === "month") {
    const top =
      (labels.title.length ? titleBand : 0) +
      (orient === "vertical" && labels.weekday ? row : 0);
    return {top, left: orient === "horizontal" ? weekdayColumn : 0};
  }
  if (orient === "vertical") {
    return {
      top: (labels.year ? titleBand : 0) + (labels.weekday ? row : 0),
      left: labels.month ? monthWidth + pad : 0,
    };
  }
  return {
    top: labels.month ? row : 0,
    left: weekdayColumn + (labels.year ? titleBand : 0),
  };
}

interface BlockFrame {
  block: CalendarBlock;
  /** The block's top-left corner. */
  left: number;
  top: number;
  /** The top-left corner of its cells. */
  x: number;
  y: number;
}

/** Labels for every weekday slot of one block, beside or above its cells. */
function weekdayLabels(
  frame: BlockFrame,
  names: string[],
  input: CalendarLayoutInput,
  cell: number,
): CalendarLabel[] {
  const {labels, orient} = input;
  const fs = labels.fontSize;
  const pad = labelPadding(fs);
  const across = orient === "vertical";
  let text = names;
  let slots = weekdayLabelSlots(cell, fs * 1.25);
  if (across) {
    const fits = (list: string[], room: number) =>
      Math.max(...list.map(labels.measure)) <= room;
    const narrow = names.map(labels.narrow);
    if (fits(names, cell - 2)) slots = [0, 1, 2, 3, 4, 5, 6];
    else if (fits(narrow, cell))
      [text, slots] = [narrow, [0, 1, 2, 3, 4, 5, 6]];
    else if (fits(narrow, cell * 2 - 2)) [text, slots] = [narrow, [0, 2, 4, 6]];
    else slots = [];
  }
  return slots.map(s => ({
    key: `${frame.block.key}-weekday-${s}`,
    kind: "weekday" as const,
    text: text[s],
    x: across ? frame.x + (s + 0.5) * cell : frame.x - pad,
    y: across ? frame.y - pad - fs / 2 : frame.y + (s + 0.5) * cell,
    anchor: across ? ("middle" as const) : ("end" as const),
  }));
}

/** A year block's month labels, dropping any that would overlap the one before. */
function monthLabels(
  frame: BlockFrame,
  input: CalendarLayoutInput,
  cell: number,
  weeks: number,
): CalendarLabel[] {
  const {labels, orient, weekStart} = input;
  const format = labels.month!;
  const fs = labels.fontSize;
  const pad = labelPadding(fs);
  const out: CalendarLabel[] = [];
  let reach = -Infinity;
  for (const month of blockMonths(frame.block)) {
    const week = monthLabelWeek({
      week: weekIndex(month.start, frame.block.start, weekStart),
      day: weekdaySlot(month.start, weekStart),
    });
    if (week >= weeks) continue;
    const text = format(month.start);
    const at = week * cell;
    const extent = orient === "vertical" ? fs : labels.measure(text);
    if (
      at < reach ||
      at + (orient === "vertical" ? 0 : extent) > weeks * cell + pad
    )
      continue;
    reach = at + extent + pad;
    out.push({
      key: `${frame.block.key}-month-${month.key}`,
      kind: "month",
      text,
      x: orient === "vertical" ? frame.x - pad : frame.x + at,
      y:
        orient === "vertical"
          ? frame.y + at + cell / 2
          : frame.y - pad - fs / 2,
      anchor: orient === "vertical" ? "end" : "start",
    });
  }
  return out;
}

/** A block's title: its year beside or above a year block, its month above a month block. */
function blockTitle(
  frame: BlockFrame,
  input: CalendarLayoutInput,
  fit: CalendarFit,
  gridWidth: number,
): CalendarLabel | null {
  const {labels, orient, period} = input;
  const fs = labels.fontSize;
  const key = `${frame.block.key}-${period === "month" ? "title" : "year"}`;
  if (period === "month") {
    const text = labels.title
      .map(f => f(frame.block.start))
      .find(
        (t, k, all) =>
          k === all.length - 1 || labels.measure(t) * 1.1 <= fit.blockWidth,
      );
    if (text === undefined) return null;
    return {
      key,
      kind: "title",
      text,
      x: frame.left,
      y: frame.top + fs * 0.6,
      anchor: "start",
    };
  }
  if (!labels.year) return null;
  const text = labels.year(frame.block.start);
  if (orient === "vertical") {
    return {
      key,
      kind: "year",
      text,
      x: frame.x + gridWidth / 2,
      y: frame.top + fs * 0.6,
      anchor: "middle",
    };
  }
  return {
    key,
    kind: "year",
    text,
    x: frame.left + fs * 0.6,
    y: frame.y + (7 * fit.cell) / 2,
    anchor: "middle",
    rotate: -90,
  };
}

/** The outlines around each month of a year block. */
function monthOutlines(
  frame: BlockFrame,
  weekStart: number,
  cell: number,
  orient: CalendarOrient,
): CalendarOutline[] {
  return blockMonths(frame.block).map(month => {
    const slot = (date: Date) => ({
      week: weekIndex(date, frame.block.start, weekStart),
      day: weekdaySlot(date, weekStart),
    });
    const d = monthOutlinePath(
      slot(month.start),
      slot(month.end),
      cell,
      orient,
    );
    return {
      key: `${frame.block.key}-outline-${month.key}`,
      d: translatePath(d, frame.x, frame.y),
    };
  });
}

/** Shifts every coordinate pair of an absolute M/L path. */
function translatePath(d: string, dx: number, dy: number): string {
  const round = (v: number) => Math.round(v * 100) / 100;
  return d.replace(
    /(-?[\d.]+),(-?[\d.]+)/g,
    (_, x, y) => `${round(+x + dx)},${round(+y + dy)}`,
  );
}

/**
    Lays a calendar out: one block per year (or month) the range touches,
    each a grid of square cells as large as the area allows, centered in it.
*/
export function calendarLayout(
  input: CalendarLayoutInput,
): CalendarLayoutResult {
  const {start, end, period, orient, weekStart, width, height, labels} = input;
  const blocks = calendarBlocks(start, end, period);
  const weeks = Math.max(1, ...blocks.map(b => blockWeeks(b, weekStart)));
  const names = labels.weekday ? weekdayNames(labels.weekday, weekStart) : [];
  const monthWidth = labels.month
    ? Math.max(
        0,
        ...Array.from({length: 12}, (_, m) =>
          labels.measure(labels.month!(new Date(2023, m, 1))),
        ),
      )
    : 0;
  const weekdayWidth = Math.max(0, ...names.map(labels.measure));
  const inset = calendarInsets(
    period,
    orient,
    labels,
    weekdayWidth,
    monthWidth,
  );
  const grid = blockGrid(weeks, orient);
  const gap = period === "month" ? labels.fontSize * 1.5 : labels.fontSize;
  const fit = fitCalendar({
    count: blocks.length,
    gridColumns: grid.columns,
    gridRows: grid.rows,
    insetTop: inset.top,
    insetLeft: inset.left,
    gap,
    width,
    height,
    columns:
      period === "month"
        ? undefined
        : orient === "vertical"
          ? blocks.length
          : 1,
  });
  const {cell} = fit;
  const offsetX = Math.max(0, (width - fit.width) / 2);
  const offsetY = Math.max(0, (height - fit.height) / 2);

  const cells: CalendarCell[] = [];
  const labelList: CalendarLabel[] = [];
  const outlines: CalendarOutline[] = [];
  blocks.forEach((block, b) => {
    const left = offsetX + (b % fit.columns) * (fit.blockWidth + gap);
    const top = offsetY + Math.floor(b / fit.columns) * (fit.blockHeight + gap);
    const frame: BlockFrame = {
      block,
      left,
      top,
      x: left + inset.left,
      y: top + inset.top,
    };
    for (const day of blockDays(block, weekStart)) {
      const [cx, cy] = slotPosition(day.week, day.day, orient);
      cells.push({
        ...day,
        block: block.key,
        x: frame.x + cx * cell,
        y: frame.y + cy * cell,
        size: cell,
      });
    }
    if (labels.weekday)
      labelList.push(...weekdayLabels(frame, names, input, cell));
    if (period === "year" && labels.month) {
      labelList.push(
        ...monthLabels(frame, input, cell, blockWeeks(block, weekStart)),
      );
    }
    const title = blockTitle(frame, input, fit, grid.columns * cell);
    if (title) labelList.push(title);
    if (period === "year")
      outlines.push(...monthOutlines(frame, weekStart, cell, orient));
  });

  return {blocks, fit, cells, labels: labelList, outlines};
}
