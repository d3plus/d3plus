/**
    Gantt — a project schedule: one labeled row per task, its bar running
    from its start to its end over a time axis, with milestones, phases,
    dependency arrows and their critical path, progress, and a "today"
    line.

    Implementation files in this folder:
      - `ganttRows.ts` — pure: task fields, ordering, and group rows.
      - `criticalPath.ts` — pure: the critical path method.
      - `ganttGeometry.ts` — pure: diamonds, progress, brackets, elbows.
      - `ganttLabels.ts` — the label column's font and fitted labels.
      - `ganttTooltip.ts` — task times, tooltip rows, and aria labels.
      - `ganttCritical.ts` — the drawn tasks' critical path, in working time.
      - `ganttSlack.ts` — each task's slack, for its tooltip.
      - `applyLayout.ts` — chart-specific `TransformStage`.
      - `ganttDecor.ts` — labels, brackets, dependencies, key, "today".
      - `emit.ts` — the scene nodes of each task.
*/

import {mean} from "d3-array";

import type {DataPoint} from "@d3plus/data";

import {Axis} from "../../components/index.js";
import accessor from "../../utils/accessor.js";
import {fieldAccessor} from "../../utils/fieldAccessor.js";
import type {D3plusConfig} from "../../utils/D3plusConfig.js";
import type {DataDrivenChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import {seedTimeAggs, timeFields} from "../Priestley/timeAxis.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {applyGanttLayout} from "./applyLayout.js";
import {ganttEmit} from "./emit.js";
import {normalizeProgress} from "./ganttRows.js";
import {ganttTooltipRows} from "./ganttTooltip.js";

/**
    Coerces a per-row option: a function is kept, a string becomes a data-key
    accessor, and anything else turns it off.
*/
export function taskAccessor(v: unknown): unknown {
  if (typeof v === "function") return v;
  if (typeof v === "string" && v) return fieldAccessor(v);
  return false;
}

/**
    Averages grouped rows' progress (as `aggs` call it, with the rows and an
    accessor), reading percent strings as fractions.
*/
export function progressAgg(
  rows: DataPoint[],
  value: (d: DataPoint) => unknown,
): number | undefined {
  return mean(
    rows.map(d => normalizeProgress(value(d))).filter(v => v !== undefined),
  );
}

/** The `progress` field's `onSet`: a data key averages grouped rows' progress. */
const seedProgressAgg = (viz: VizInstance, v: unknown): void => {
  const key = typeof v === "string" ? v : null;
  if (key && !viz.schema.aggs[key]) viz.schema.aggs[key] = progressAgg;
};

export const ganttDef: DataDrivenChartDefinition = {
  name: "Gantt",

  layoutStage: applyGanttLayout,
  emit: ganttEmit,

  setup: viz => {
    seedTimeAggs(viz);
    if (!viz.schema.aggs.progress) viz.schema.aggs.progress = progressAgg;
  },

  ctx: {
    axis: new Axis().align("start").orient("top"),
    axisTest: new Axis().align("start").gridSize(0).orient("top"),
  },

  fields: [
    /**
        The time axis along the top of the rows (`orient: "bottom"` moves it
        under them). It reads dates by default (`scale: "time"`); a
        `rangeBreaks` setting such as `"weekends"` hides those times, and a
        task's Duration then counts only the working days left showing.
    */
    {key: "axisConfig", merge: true, default: {scale: "time"}},
    /**
        Finds and emphasizes the critical path: the chain of `dependencies`
        that sets the project's finish. It takes each task's dates as given,
        and works back from the latest end to find how late each task could
        start without delaying it; a task's slack is how much later that is
        than its start, in working days: weekends, and any whole days
        `rangeBreaks` hide (such as holidays), count as no time, so a task
        ending on a Friday and its dependent starting on Monday hand off with
        no slack. Tasks with no slack, or less when a dependent starts before
        they end, are critical: they're outlined in their own color, their
        arrows draw bold, and every other task is muted. Tied chains are all
        critical. The tooltip lists each task's Slack (in working days) and
        Latest start, and a key in the label column's corner names the bold
        arrows. Dependencies naming tasks that aren't drawn are skipped. On
        (`true`) by default, it draws only when a critical dependency joins
        two drawn tasks, so a chart without dependencies (or whose
        dependencies never chain to the finish) looks the same; a cycle draws
        nothing and logs a warning. `false` turns it off.
        @type {boolean}
    */
    {key: "criticalPath", default: true},
    /**
        Styles the critical path: `stroke` (the dependency arrows' color by
        default), `strokeWidth` (twice theirs), `strokeOpacity` (1), and
        `arrowSize` for its arrows; `barStroke` (each task's own color;
        `false` for none) and `barStrokeWidth` (2) for the outline of its
        tasks; `mutedOpacity` (0.35) for the tasks off it; the key's `label`
        (the translated "Critical path"; `false` for no key); and
        `workingDays` (`true`), which leaves weekends out of slack (`false`
        counts them, leaving out only the days `rangeBreaks` hide).
        @type {{stroke, strokeWidth, strokeOpacity, arrowSize, barStroke, barStrokeWidth, mutedOpacity, label, workingDays}}
    */
    {key: "criticalPathConfig", merge: true, default: {}},
    /**
        Accessor function or string key for each task's predecessors: the ids
        (by `groupBy`) of the tasks it waits on, as an array or a
        comma-separated string. Each draws an arrow from the predecessor's end
        to this task's start.
        @type {string | function | false}
    */
    {
      key: "dependencies",
      default: accessor("dependencies"),
      coerce: taskAccessor,
    },
    /**
        Styles the dependency arrows: `stroke` (the chart's text color by
        default), `strokeWidth` (1), `strokeOpacity` (0.55), and `arrowSize`
        (6, in pixels).
        @type {{stroke, strokeWidth, strokeOpacity, arrowSize}}
    */
    {key: "dependencyConfig", merge: true, default: {}},
    ...timeFields(),
    /**
        Accessor function or string key for each task's group (such as its
        project phase). Grouped tasks sit under a header row that names the
        group, with a bracket spanning its tasks.
        @type {string | function | false}
    */
    {key: "group", default: false, coerce: taskAccessor},
    /**
        The most the task label column on the left may take: a share of the
        chart's width when 1 or below (`0.3` by default), else pixels. The
        column fits the widest label up to it, wrapping or truncating longer
        ones; `0` hides it.
    */
    {key: "labelWidth", default: 0.3},
    /**
        Shows a legend only when its entries group the tasks (for example, a
        `color` by phase), since every task is labeled in its row.
    */
    {
      key: "legend",
      coerce: "const",
      factory: (viz: VizInstance) => {
        const base = viz.schema.legend as (
          config: D3plusConfig,
          arr: DataPoint[],
        ) => unknown;
        return (config: D3plusConfig, arr: DataPoint[]) => {
          const rows = (viz._filteredData ?? []) as DataPoint[];
          if (arr.length >= rows.length) return false;
          return base.call(viz, config, arr);
        };
      },
    },
    /**
        Accessor function or string key for whether a task is a milestone,
        drawn as a diamond at its `end`. Without one, a task that starts and
        ends at the same time is a milestone.
        @type {string | function | false}
    */
    {key: "milestone", default: accessor("milestone"), coerce: taskAccessor},
    /**
        The space between neighboring task bars, as a share of each row
        (see d3's
        [paddingInner](https://github.com/d3/d3-scale#band_paddingInner)).
    */
    {key: "paddingInner", default: 0.35},
    /**
        The space above the first row and below the last, as a share of a row
        (see d3's
        [paddingOuter](https://github.com/d3/d3-scale#band_paddingOuter)).
    */
    {key: "paddingOuter", default: 0.2},
    /**
        Accessor function or string key for each task's progress: a fraction
        from 0 to 1 (`0.6`), or a percent string (`"60%"`). The done part of
        the bar fills in the task's color and the rest in a paler shade; the
        tooltip lists it. A milestone below 100% draws pale and outlined. A
        key also averages grouped rows' progress.
        @type {string | function | false}
    */
    {
      key: "progress",
      default: accessor("progress"),
      coerce: taskAccessor,
      onSet: seedProgressAgg,
    },
    /**
        The order of the tasks: `"data"` (default) keeps the data's order,
        `"start"` sorts them by start, and a function compares two data rows.
        Groups follow their first task.
        @type {"data" | "start" | function}
    */
    {key: "taskSort", default: "data"},
    /**
        Styles the task label column: `fontColor` (the chart's text color by
        default), `fontFamily`, and `fontSize` (12).
        @type {{fontColor, fontFamily, fontSize}}
    */
    {key: "taskLabelConfig", merge: true, default: {}},
    /**
        Draws a "today" line across the rows: `true` at the current time, or a
        date (or anything the axis parses) to mark that time. Off (`false`) by
        default. It only draws inside the time axis.
        @type {boolean | Date | string | number}
    */
    {key: "today", default: false},
    /**
        Styles the "today" line like a `referenceLines` entry: `stroke`,
        `strokeWidth` (1.5), `strokeOpacity` (0.85), `dash`, and its `label`
        (the translated "Today"; `false` for none), with the label's font
        settings and `labelPosition`.
        @type {ReferenceLineConfig}
    */
    {key: "todayConfig", merge: true, default: {}},
    /** Lists each task's Start, End, Duration, and Progress in the tooltip body. */
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        tbody: (d: DataPoint, i: number) => ganttTooltipRows(viz, d, i),
      }),
    },
    /** Zooming doesn't help read a schedule's rows, so it's off by default. */
    {key: "zoom", default: false},
  ],
};

/**
    Creates a Gantt chart from an array of tasks: one labeled row per task,
    its bar running from `start` to `end` over a time axis. Tasks can be
    grouped into phases (`group`), drawn as milestones (`milestone`), linked
    by dependency arrows (`dependencies`) with their critical path
    emphasized (`criticalPath`), and filled by their `progress`, with an
    optional `today` line.
*/
export default makeChart(ganttDef);
