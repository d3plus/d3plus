/**
    Each drawn task's slack, kept by chart and data row for its tooltip and
    aria label, which only see the row. Rows are weakly held, so a redraw's
    rows replace the last draw's.
*/

import type {DataPoint} from "@d3plus/data";

import type {TimeValue} from "../Priestley/timeAxis.js";

/** A task's place on the critical path. */
export interface TaskSlack {
  /** How long the task could slip without delaying the finish, in ms (or axis units). */
  slack: number;
  /** The latest the task could start. */
  latestStart: TimeValue;
  critical: boolean;
  /** Whether the slack counts working days only. */
  working: boolean;
}

const store = new WeakMap<object, WeakMap<DataPoint, TaskSlack>>();

/** Records (or, with null, forgets) a row's slack on a chart. */
export function recordSlack(
  viz: object,
  row: DataPoint,
  slack: TaskSlack | null,
): void {
  let rows = store.get(viz);
  if (!rows) store.set(viz, (rows = new WeakMap()));
  if (slack) rows.set(row, slack);
  else rows.delete(row);
}

/** A row's slack on a chart, when its critical path is drawn. */
export function taskSlack(viz: object, row: DataPoint): TaskSlack | undefined {
  return store.get(viz)?.get(row);
}
