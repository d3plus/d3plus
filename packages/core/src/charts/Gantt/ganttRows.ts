/**
    Pure helpers that turn a Gantt's data rows into its row list: reading
    each task's milestone flag, progress, and dependencies, ordering tasks
    by `taskSort`, and grouping them under `group` header rows.
*/

import type {DataPoint} from "@d3plus/data";

import type {TimeValue} from "../Priestley/timeAxis.js";

/** One task, read from a data row. */
export interface GanttTask {
  __d3plus__: true;
  data: DataPoint;
  i: number;
  /** The task's id (its `groupBy` id), which `dependencies` refer to. */
  id: string;
  label: string;
  start: TimeValue;
  end: TimeValue;
  milestone: boolean;
  /** The share of the task done, 0 to 1, or undefined when it has none. */
  progress: number | undefined;
  /** The ids of the tasks this one waits on. */
  dependencies: string[];
  /** The task's group, or undefined when it has none. */
  group: string | undefined;
}

/** A group's header row: its label and the span of its tasks. */
export interface GanttGroupRow {
  kind: "group";
  key: string;
  label: string;
  start: TimeValue;
  end: TimeValue;
  tasks: GanttTask[];
}

/** A task's row, indented under its group header when it has one. */
export interface GanttTaskRow {
  kind: "task";
  key: string;
  task: GanttTask;
  indent: boolean;
}

/** A Gantt row, top to bottom. */
export type GanttRow = GanttGroupRow | GanttTaskRow;

/** How tasks are ordered: as given, by start, or by a comparator of their data rows. */
export type TaskSort =
  "data" | "start" | ((a: DataPoint, b: DataPoint) => number);

/**
    Whether a task draws as a milestone: when its `milestone` value is
    truthy, or, without one, when it starts and ends at the same time.
    @param start The task's start.
    @param end The task's end.
    @param flag The task's `milestone` value.
*/
export function isMilestone(
  start: TimeValue,
  end: TimeValue,
  flag?: unknown,
): boolean {
  if (flag !== undefined && flag !== null && flag !== "") return !!flag;
  return +start === +end;
}

/**
    A `progress` value as a share from 0 to 1: a number is read as a
    fraction (`0.6`), a string ending in `%` as a percent (`"60%"`), clamped
    to 0–1. Anything else is undefined.
    @param value The raw value.
*/
export function normalizeProgress(value: unknown): number | undefined {
  let n: number;
  if (typeof value === "number") n = value;
  else if (typeof value === "string" && value.trim().endsWith("%"))
    n = parseFloat(value) / 100;
  else if (typeof value === "string" && value.trim() !== "") n = Number(value);
  else return undefined;
  if (!Number.isFinite(n)) return undefined;
  return Math.max(0, Math.min(1, n));
}

/**
    A `dependencies` value as a list of task ids: an array, or a string of
    comma-separated ids. Anything else is no dependencies.
    @param value The raw value.
*/
export function dependencyIds(value: unknown): string[] {
  const list = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : typeof value === "number"
        ? [value]
        : [];
  const ids = list
    .filter(v => v !== undefined && v !== null)
    .map(v => `${v}`.trim())
    .filter(v => v !== "");
  return Array.from(new Set(ids));
}

/**
    Orders tasks by `taskSort`: `"data"` keeps their order, `"start"` sorts
    by start (then end), and a function compares their data rows. Ties keep
    data order.
    @param tasks The tasks.
    @param sort The `taskSort` setting.
*/
export function sortTasks(tasks: GanttTask[], sort: TaskSort): GanttTask[] {
  const byIndex = (a: GanttTask, b: GanttTask) => a.i - b.i;
  if (typeof sort === "function")
    return [...tasks].sort((a, b) => sort(a.data, b.data) || byIndex(a, b));
  if (sort === "start")
    return [...tasks].sort(
      (a, b) => +a.start - +b.start || +a.end - +b.end || byIndex(a, b),
    );
  return [...tasks].sort(byIndex);
}

/**
    The chart's rows, top to bottom. Tasks are ordered by `sort`; when any
    task has a group, each group gets a header row (spanning its tasks'
    earliest start to latest end) followed by its tasks, the groups in the
    order their first task appears. Tasks without a group stay in place
    among the groups, without a header.
    @param tasks The tasks.
    @param sort The `taskSort` setting.
*/
export function ganttRows(tasks: GanttTask[], sort: TaskSort): GanttRow[] {
  const sorted = sortTasks(tasks, sort);
  const taskRow = (task: GanttTask, indent: boolean): GanttTaskRow => ({
    kind: "task",
    key: `task-${task.id}`,
    task,
    indent,
  });
  if (!sorted.some(t => t.group !== undefined))
    return sorted.map(t => taskRow(t, false));
  const groups = new Map<string, GanttTask[]>();
  const order: (string | GanttTask)[] = [];
  for (const task of sorted) {
    if (task.group === undefined) {
      order.push(task);
      continue;
    }
    const list = groups.get(task.group);
    if (list) list.push(task);
    else {
      groups.set(task.group, [task]);
      order.push(task.group);
    }
  }
  const rows: GanttRow[] = [];
  for (const entry of order) {
    if (typeof entry !== "string") {
      rows.push(taskRow(entry, false));
      continue;
    }
    const members = groups.get(entry)!;
    rows.push({
      kind: "group",
      key: `group-${entry}`,
      label: entry,
      start: earliest(members.map(t => t.start)),
      end: latest(members.map(t => t.end)),
      tasks: members,
    });
    members.forEach(t => rows.push(taskRow(t, true)));
  }
  return rows;
}

const earliest = (values: TimeValue[]): TimeValue =>
  values.reduce((a, b) => (+b < +a ? b : a));

const latest = (values: TimeValue[]): TimeValue =>
  values.reduce((a, b) => (+b > +a ? b : a));
