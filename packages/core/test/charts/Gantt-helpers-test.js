import {it} from "vitest";
import assert from "assert";
import {
  dependencyIds,
  ganttRows,
  isMilestone,
  normalizeProgress,
  sortTasks,
} from "../../src/charts/Gantt/ganttRows.ts";
import {
  bracketPath,
  diamondPath,
  elbowRoute,
  labelColumnWidth,
  progressSplit,
} from "../../src/charts/Gantt/ganttGeometry.ts";
import {ellipsize} from "../../src/charts/Gantt/ganttLabels.ts";
import {
  taskEnd,
  taskStart,
  todayValue,
} from "../../src/charts/Gantt/ganttDecor.ts";
import {dayCount, percent} from "../../src/charts/Gantt/ganttTooltip.ts";
import {progressAgg, taskAccessor} from "../../src/charts/Gantt/index.ts";

/** A task with just what row ordering reads. */
const task = (id, i, start, end, group) => ({
  __d3plus__: true,
  data: {id, i},
  i,
  id,
  label: id,
  start: new Date(start),
  end: new Date(end),
  milestone: false,
  progress: undefined,
  dependencies: [],
  group,
});

it("Gantt: isMilestone reads the flag, else a zero-length span", () => {
  const a = new Date("2024-03-01"),
    b = new Date("2024-03-05");
  assert.strictEqual(isMilestone(a, new Date(+a)), true);
  assert.strictEqual(isMilestone(a, b), false);
  assert.strictEqual(isMilestone(a, b, true), true);
  assert.strictEqual(isMilestone(a, new Date(+a), false), false);
  assert.strictEqual(isMilestone(a, b, ""), false);
  assert.strictEqual(isMilestone(3, 3, null), true);
});

it("Gantt: normalizeProgress reads fractions and percent strings, clamped", () => {
  assert.strictEqual(normalizeProgress(0.6), 0.6);
  assert.strictEqual(normalizeProgress("60%"), 0.6);
  assert.strictEqual(normalizeProgress(" 45 % "), 0.45);
  assert.strictEqual(normalizeProgress("0.25"), 0.25);
  assert.strictEqual(normalizeProgress(1.4), 1);
  assert.strictEqual(normalizeProgress(-2), 0);
  assert.strictEqual(normalizeProgress(undefined), undefined);
  assert.strictEqual(normalizeProgress(""), undefined);
  assert.strictEqual(normalizeProgress("soon"), undefined);
  assert.strictEqual(normalizeProgress(NaN), undefined);
});

it("Gantt: dependencyIds reads arrays, comma lists, and single ids", () => {
  assert.deepStrictEqual(dependencyIds(["a", "b", "a"]), ["a", "b"]);
  assert.deepStrictEqual(dependencyIds("a, b ,,c"), ["a", "b", "c"]);
  assert.deepStrictEqual(dependencyIds(7), ["7"]);
  assert.deepStrictEqual(dependencyIds([1, null, " "]), ["1"]);
  assert.deepStrictEqual(dependencyIds(undefined), []);
  assert.deepStrictEqual(dependencyIds({}), []);
});

it("Gantt: sortTasks keeps data order, sorts by start, or compares rows", () => {
  const tasks = [
    task("c", 0, "2024-03-10", "2024-03-12"),
    task("a", 1, "2024-03-01", "2024-03-09"),
    task("b", 2, "2024-03-01", "2024-03-03"),
  ];
  const ids = list => list.map(t => t.id);
  assert.deepStrictEqual(ids(sortTasks(tasks, "data")), ["c", "a", "b"]);
  assert.deepStrictEqual(ids(sortTasks(tasks, "start")), ["b", "a", "c"]);
  assert.deepStrictEqual(
    ids(sortTasks(tasks, (a, b) => a.id.localeCompare(b.id))),
    ["a", "b", "c"],
  );
  assert.deepStrictEqual(ids(tasks), ["c", "a", "b"], "leaves the input");
});

it("Gantt: ganttRows gives one row per task without groups", () => {
  const rows = ganttRows(
    [
      task("a", 0, "2024-03-01", "2024-03-02"),
      task("b", 1, "2024-03-03", "2024-03-04"),
    ],
    "data",
  );
  assert.deepStrictEqual(
    rows.map(r => [r.kind, r.key, r.indent]),
    [
      ["task", "task-a", false],
      ["task", "task-b", false],
    ],
  );
});

it("Gantt: ganttRows puts each group's header before its tasks, in first-task order", () => {
  const tasks = [
    task("build", 0, "2024-04-01", "2024-04-20", "Build"),
    task("solo", 1, "2024-03-15", "2024-03-16"),
    task("plan", 2, "2024-03-01", "2024-03-10", "Plan"),
    task("code", 3, "2024-04-05", "2024-04-30", "Build"),
  ];
  const data = ganttRows(tasks, "data");
  assert.deepStrictEqual(
    data.map(r => r.key),
    [
      "group-Build",
      "task-build",
      "task-code",
      "task-solo",
      "group-Plan",
      "task-plan",
    ],
  );
  const build = data[0];
  assert.strictEqual(+build.start, +new Date("2024-04-01"));
  assert.strictEqual(+build.end, +new Date("2024-04-30"));
  assert.strictEqual(build.label, "Build");
  assert.strictEqual(data[1].indent, true);
  assert.strictEqual(data[3].indent, false, "an ungrouped task has no indent");
  const byStart = ganttRows(tasks, "start");
  assert.deepStrictEqual(
    byStart.map(r => r.key),
    [
      "group-Plan",
      "task-plan",
      "task-solo",
      "group-Build",
      "task-build",
      "task-code",
    ],
  );
});

it("Gantt: diamondPath draws four tips around the center", () => {
  assert.strictEqual(diamondPath(10, 20, 5), "M10,15L15,20L10,25L5,20Z");
});

it("Gantt: progressSplit fills the done share from the start", () => {
  assert.deepStrictEqual(progressSplit(10, 200, 0.6), {
    done: {x: 10, width: 120},
    rest: {x: 130, width: 80},
  });
  assert.deepStrictEqual(progressSplit(0, 50, 2).done, {x: 0, width: 50});
  assert.deepStrictEqual(progressSplit(0, 50, -1).done, {x: 0, width: 0});
});

it("Gantt: bracketPath spans the group with a foot at each end", () => {
  assert.strictEqual(bracketPath(0, 100, 10, 4), "M0,8H100V16L96,12H4L0,16Z");
  // A short bracket's feet shrink to half its length.
  assert.strictEqual(bracketPath(0, 2, 10, 4), "M0,8H2V13L1,12H1L0,13Z");
});

it("Gantt: elbowRoute goes right, down, then right into the dependent", () => {
  assert.deepStrictEqual(elbowRoute([100, 20], [200, 60], 8, 40), [
    [100, 20],
    [108, 20],
    [108, 60],
    [200, 60],
  ]);
  // Upward, to an earlier row.
  assert.deepStrictEqual(elbowRoute([100, 60], [150, 20], 8, 40), [
    [100, 60],
    [108, 60],
    [108, 20],
    [150, 20],
  ]);
});

it("Gantt: elbowRoute doubles back between rows when the dependent starts too soon", () => {
  assert.deepStrictEqual(elbowRoute([100, 20], [90, 60], 8, 40), [
    [100, 20],
    [108, 20],
    [108, 40],
    [82, 40],
    [82, 60],
    [90, 60],
  ]);
  assert.deepStrictEqual(elbowRoute([100, 20], [140, 20], 8, 40), [
    [100, 20],
    [140, 20],
  ]);
});

it("Gantt: labelColumnWidth fits the widest label up to its limit", () => {
  assert.strictEqual(labelColumnWidth(100, 1000, 0.3, 8), 116);
  assert.strictEqual(labelColumnWidth(500, 1000, 0.3, 8), 300);
  assert.strictEqual(labelColumnWidth(500, 1000, 200, 8), 200);
  assert.strictEqual(labelColumnWidth(0, 1000, 0.3, 8), 0);
  assert.strictEqual(labelColumnWidth(100, 1000, 0, 8), 0);
});

it("Gantt: ellipsize trims a line until it fits with an ellipsis", () => {
  const measure = t => t.length * 10;
  assert.strictEqual(ellipsize("Requirements", 60, measure), "Requi…");
  assert.strictEqual(ellipsize("ab cd", 40, measure), "ab…");
  assert.strictEqual(ellipsize("abc", 5, measure), "");
});

it("Gantt: taskStart and taskEnd are a bar's edges or a diamond's tips", () => {
  const bar = {milestone: false, x0: 10, x1: 50, cy: 30};
  const diamond = {milestone: true, x0: 80, x1: 80, cy: 60};
  assert.deepStrictEqual(taskStart(bar, 6), [10, 30]);
  assert.deepStrictEqual(taskEnd(bar, 6), [50, 30]);
  assert.deepStrictEqual(taskStart(diamond, 6), [74, 60]);
  assert.deepStrictEqual(taskEnd(diamond, 6), [86, 60]);
});

it("Gantt: todayValue is now for true, the value given, or null when off", () => {
  const now = new Date("2024-05-01");
  assert.strictEqual(
    todayValue(true, () => now),
    now,
  );
  assert.strictEqual(todayValue("2024-03-01"), "2024-03-01");
  assert.strictEqual(todayValue(false), null);
  assert.strictEqual(todayValue(undefined), null);
  assert.strictEqual(todayValue(""), null);
  assert.ok(todayValue(true) instanceof Date);
});

it("Gantt: percent rounds a share to a whole percent", () => {
  assert.strictEqual(percent(0.6), "60%");
  assert.strictEqual(percent(0.125), "13%");
  assert.strictEqual(percent(1), "100%");
});

it("Gantt: progressAgg averages rows' progress, reading percents", () => {
  const rows = [{p: 0.2}, {p: "60%"}, {p: undefined}];
  assert.ok(Math.abs(progressAgg(rows, d => d.p) - 0.4) < 1e-9);
  assert.strictEqual(
    progressAgg([{}], d => d.p),
    undefined,
  );
});

it("Gantt: taskAccessor keeps functions, reads keys, and turns off otherwise", () => {
  const fn = d => d.x;
  assert.strictEqual(taskAccessor(fn), fn);
  assert.strictEqual(taskAccessor("phase")({phase: "Build"}), "Build");
  assert.strictEqual(taskAccessor(false), false);
  assert.strictEqual(taskAccessor(""), false);
  assert.strictEqual(taskAccessor(3), false);
});

it("Gantt: dayCount formats days in the locale, with at most one decimal", () => {
  assert.strictEqual(dayCount(11, "en-US"), "11");
  assert.strictEqual(dayCount(1.25, "es-ES"), "1,3");
  assert.strictEqual(dayCount(3, {}), "3");
  assert.strictEqual(dayCount(2, "not a locale!"), "2");
});
