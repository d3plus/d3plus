/**
    The Gantt's critical path: runs the critical path method over the drawn
    tasks (see `criticalPath.ts`), counting time the axis's `rangeBreaks`
    hide as no time at all, and records each task's slack for its tooltip.
*/

import {
  offsetVisible,
  visibleBetween,
} from "../../components/Axis/rangeBreaks.js";
import type {RangeBreakRule} from "../../components/Axis/rangeBreaks.js";
import {warnConfigOnce} from "../../utils/configWarnings.js";
import {isTimeAxis, isUtcAxis} from "../Priestley/timeAxis.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {criticalPath} from "./criticalPath.js";
import type {CpmTask} from "./criticalPath.js";
import type {GanttTask} from "./ganttRows.js";
import {recordSlack} from "./ganttSlack.js";
import {ganttDayBreaks} from "./ganttTooltip.js";

/** The critical path the Gantt draws. */
export interface GanttCritical {
  /** Each task's result, by id, in working time. */
  tasks: Map<string, CpmTask>;
  /** The critical links, by `linkKey`. */
  links: Set<string>;
}

/** A link's key in `GanttCritical.links`. */
export const linkKey = (from: string, to: string): string =>
  JSON.stringify([from, to]);

/** Maps times to working time and back. */
export interface WorkClock {
  /** A time's distance from the origin, less the hidden time between them. */
  toWork: (t: number) => number;
  /** The time `delta` of working time after `t` (before it, when negative). */
  shift: (t: number, delta: number) => number;
}

/**
    A clock that leaves out the time `rules` hide, measured from `origin`.
    Without rules, working time is plain time.
    @param rules The axis's whole-day `rangeBreaks` (see `ganttDayBreaks`).
    @param origin The time working time counts from.
    @param utc Whether a day is a UTC day rather than a local one.
*/
export function workClock(
  rules: RangeBreakRule[],
  origin: number,
  utc = false,
): WorkClock {
  if (!rules.length) return {toWork: t => t, shift: (t, delta) => t + delta};
  return {
    toWork: t =>
      t >= origin
        ? visibleBetween(rules, origin, t, utc)
        : -visibleBetween(rules, t, origin, utc),
    shift: (t, delta) => offsetVisible(rules, t, delta, utc),
  };
}

/** The length of the key's sample arrow, in pixels. */
export const KEY_SAMPLE = 22;
/** The space between the key's sample arrow and its label. */
export const KEY_GAP = 6;

/**
    The critical path key's label: `criticalPathConfig.label`, the
    translated "Critical path" by default, or false for no key.
*/
export function criticalKeyLabel(viz: VizInstance): string | false {
  const cfg = (viz.schema.criticalPathConfig ?? {}) as {label?: unknown};
  if (cfg.label === false) return false;
  return typeof cfg.label === "string"
    ? cfg.label
    : viz.schema.translate("Critical path");
}

/** Quotes a task id in a warning. */
const quote = (id: string): string => `"${id}"`;

/**
    The critical path of the drawn `tasks` when `criticalPath` is on, else
    null; also null when no critical dependency joins two drawn tasks (a
    path needs a chain), or when the dependencies form a cycle (which warns
    once, naming it). Records each
    task's slack and latest start for its tooltip, or clears them.
    @param viz The chart.
    @param tasks The drawn tasks.
*/
export function ganttCriticalPath(
  viz: VizInstance,
  tasks: GanttTask[],
): GanttCritical | null {
  const critical =
    viz.schema.criticalPath && tasks.length
      ? computeCritical(viz, tasks)
      : null;
  for (const task of tasks) recordSlack(viz, task.data, null);
  if (!critical) return null;
  const {result, clock, time} = critical;
  for (const task of tasks) {
    const cpm = result.get(task.id);
    if (!cpm) continue;
    const latest = clock.shift(+task.start, cpm.slack);
    recordSlack(viz, task.data, {
      slack: cpm.slack,
      latestStart: time ? new Date(latest) : latest,
      critical: cpm.critical,
    });
  }
  return critical.drawn;
}

/** Runs the method in working time; null when there's nothing to draw. */
function computeCritical(
  viz: VizInstance,
  tasks: GanttTask[],
): {
  result: Map<string, CpmTask>;
  clock: WorkClock;
  time: boolean;
  drawn: GanttCritical;
} | null {
  const time = isTimeAxis(viz);
  const origin = Math.min(...tasks.map(t => +t.start));
  const clock = workClock(
    time ? ganttDayBreaks(viz) : [],
    origin,
    isUtcAxis(viz),
  );
  const cpm = criticalPath(
    tasks.map(t => ({
      id: t.id,
      start: clock.toWork(+t.start),
      end: clock.toWork(+t.end),
      dependencies: t.dependencies,
    })),
  );
  if (cpm.cycle) {
    const loop = [...cpm.cycle, cpm.cycle[0]].map(quote).join(" → ");
    warnConfigOnce(
      viz,
      `gantt-cycle:${JSON.stringify([...cpm.cycle].sort())}`,
      `Gantt dependencies form a cycle (${loop}), so no critical path is drawn.`,
    );
    return null;
  }
  if (!cpm.links.some(l => l.critical)) return null;
  return {
    result: cpm.tasks,
    clock,
    time,
    drawn: {
      tasks: cpm.tasks,
      links: new Set(
        cpm.links.filter(l => l.critical).map(l => linkKey(l.from, l.to)),
      ),
    },
  };
}
