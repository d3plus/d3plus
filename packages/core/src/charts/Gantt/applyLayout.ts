/**
    `applyGanttLayout` — Gantt's chart-specific layout stage. Reads one task
    per row of `viz._filteredData`, orders and groups them into rows, sizes
    the label column, measures and renders the time axis beside it, and
    places every row. Stores the layout on `viz.ctx.gantt` and returns one
    `GanttMark` per task.
*/

import {timeDay} from "d3-time";
import {scaleBand} from "d3-scale";

import type {DataPoint} from "@d3plus/data";

import {chartBounds} from "../features/chartGeometry.js";
import type {TransformStage} from "../pipeline/stages.js";
import {
  isTimeAxis,
  measureTimeAxis,
  renderTimeAxis,
} from "../Priestley/timeAxis.js";
import type {TimeValue} from "../Priestley/timeAxis.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {labelColumnWidth} from "./ganttGeometry.js";
import {fitLabel, ganttLabelFont, labelWidth} from "./ganttLabels.js";
import type {FittedLabel, GanttLabelFont} from "./ganttLabels.js";
import {dependencyIds, ganttRows} from "./ganttRows.js";
import type {GanttRow, GanttTask, TaskSort} from "./ganttRows.js";
import {taskTimes, timeFormatter} from "./ganttTooltip.js";

/** A task, placed: its row, its row's center, and its left and right edges. */
export interface GanttMark extends GanttTask {
  row: number;
  cy: number;
  x0: number;
  x1: number;
}

/** The Gantt's layout, shared by its emit, stored on `viz.ctx.gantt`. */
export interface GanttLayout {
  rows: GanttRow[];
  /** Each row's fitted label, by row. */
  labels: FittedLabel[];
  font: GanttLabelFont;
  /** The label column's width; the time axis starts at its right edge. */
  column: number;
  /** Maps a start or end to its x position. */
  x: (v: TimeValue) => number;
  /** Each row's center, by row. */
  cy: number[];
  /** The distance between neighboring row centers. */
  step: number;
  /** A task bar's thickness. */
  band: number;
  /** The rows' area, the plot the "today" line spans. */
  plot: {x0: number; x1: number; y0: number; y1: number};
  time: boolean;
  /** Formats a start or end for the tooltip and aria labels. */
  format: (v: TimeValue) => string;
}

/** The most a row may take, in pixels, so a short list doesn't draw giant bars. */
export const MAX_ROW_STEP = 40;
/** The space on each side of the labels in the label column. */
export const LABEL_PADDING = 8;
/** How far a grouped task's label is indented under its group's. */
export const LABEL_INDENT = 12;

type RowFn = ((d: DataPoint, i: number) => unknown) | false | undefined;

const read = (fn: RowFn, d: DataPoint, i: number): unknown =>
  typeof fn === "function" ? fn(d, i) : undefined;

/**
    Reads one task per data row (see `taskTimes`); rows without a start or
    an end are skipped.
*/
export function ganttTasks(viz: VizInstance, data: DataPoint[]): GanttTask[] {
  const tasks: GanttTask[] = [];
  data.forEach((d, i) => {
    const times = taskTimes(viz, d, i);
    if (!times) return;
    const group = read(viz.schema.group as RowFn, d, i);
    tasks.push({
      __d3plus__: true,
      data: d,
      i,
      id: `${viz._id(d, i)}`,
      label: `${viz._drawLabel(d, i) ?? ""}`,
      ...times,
      dependencies: dependencyIds(read(viz.schema.dependencies as RowFn, d, i)),
      group:
        group === undefined || group === null || group === ""
          ? undefined
          : `${group}`,
    });
  });
  return tasks;
}

/**
    The time domain the tasks span, widened by a day (or by 1 on a numeric
    axis) on each side when every task falls on one time.
*/
export function ganttDomain(tasks: GanttTask[], time: boolean): number[] {
  if (!tasks.length) return [0, 1];
  let lo = Math.min(...tasks.map(t => +t.start));
  let hi = Math.max(...tasks.map(t => +t.end));
  if (lo === hi) {
    if (time) {
      lo = +timeDay.offset(new Date(lo), -1);
      hi = +timeDay.offset(new Date(hi), 1);
    } else {
      lo -= 1;
      hi += 1;
    }
  }
  return [lo, hi];
}

/** The label column's width for these rows' labels. */
function columnFor(
  viz: VizInstance,
  rows: GanttRow[],
  font: GanttLabelFont,
  width: number,
): number {
  const widest = Math.max(
    0,
    ...rows.map(r =>
      r.kind === "group"
        ? labelWidth(r.label, font, 600)
        : labelWidth(r.task.label, font) + (r.indent ? LABEL_INDENT : 0),
    ),
  );
  return labelColumnWidth(
    widest,
    width,
    Number(viz.schema.labelWidth),
    LABEL_PADDING,
  );
}

/** Fits each row's label to the column, over two lines when its row holds them. */
function fitLabels(
  rows: GanttRow[],
  column: number,
  step: number,
  font: GanttLabelFont,
): FittedLabel[] {
  const maxLines = step >= font.lineHeight * 2 + 2 ? 2 : 1;
  return rows.map(r => {
    const indent = r.kind === "task" && r.indent ? LABEL_INDENT : 0;
    const room = column - LABEL_PADDING * 2 - indent;
    return r.kind === "group"
      ? fitLabel(r.label, room, maxLines, font, 600)
      : fitLabel(r.task.label, room, maxLines, font);
  });
}

export const applyGanttLayout: TransformStage = ({viz}) => {
  const v = viz as VizInstance;
  const data = (v._filteredData ?? []) as DataPoint[];
  const time = isTimeAxis(v);
  const tasks = ganttTasks(v, data);
  const rows = ganttRows(tasks, (v.schema.taskSort ?? "data") as TaskSort);
  const font = ganttLabelFont(v);
  const {width, height} = chartBounds(v);
  const column = columnFor(v, rows, font, width);

  const axisConfig = (v.schema.axisConfig ?? {}) as {orient?: string};
  const top = axisConfig.orient !== "bottom";
  const frame = {
    domain: ganttDomain(tasks, time),
    width: Math.max(0, width - column),
    height,
    config: {orient: top ? "top" : "bottom", align: top ? "start" : "end"},
  };
  const size = measureTimeAxis(v, frame);
  const available = Math.max(0, height - size.height - size.padding * 2);
  const block = Math.min(available, rows.length * MAX_ROW_STEP);
  const rowsTop = top ? size.height + size.padding : size.padding;

  // The axis box ends below the rows, so its grid spans them and a bottom
  // axis sits right under the last row.
  const scale = renderTimeAxis(
    v,
    {
      ...frame,
      height: block + size.height + size.padding * 2,
      transform: {x: column, y: 0},
      key: "gantt-axis",
    },
    {interactive: false, interactionGroup: "axis"} as Record<string, unknown>,
  );
  const x = (t: TimeValue) => column + scale(t);

  const bands = scaleBand<number>()
    .domain(rows.map((_, k) => k))
    .paddingInner(Number(v.schema.paddingInner) || 0)
    .paddingOuter(Number(v.schema.paddingOuter) || 0)
    .range([rowsTop, rowsTop + block]);
  const band = bands.bandwidth();
  const step = rows.length > 1 ? bands.step() : block;
  const cy = rows.map((_, k) => (bands(k) ?? 0) + band / 2);

  const marks: GanttMark[] = [];
  rows.forEach((r, k) => {
    if (r.kind !== "task") return;
    marks.push({
      ...r.task,
      row: k,
      cy: cy[k],
      x0: x(r.task.start),
      x1: x(r.task.end),
    });
  });

  const range = (scale as unknown as {range?: () => number[]}).range?.() ?? [
    0,
    frame.width,
  ];
  v.ctx.gantt = {
    rows,
    labels: fitLabels(rows, column, step, font),
    font,
    column,
    x,
    cy,
    step,
    band,
    plot: {
      x0: column + Math.min(...range),
      x1: column + Math.max(...range),
      y0: rowsTop,
      y1: rowsTop + block,
    },
    time,
    format: timeFormatter(
      v,
      tasks.flatMap(t => [t.start, t.end]),
    ),
  } satisfies GanttLayout;
  return {shapeData: marks as unknown as DataPoint[]};
};
