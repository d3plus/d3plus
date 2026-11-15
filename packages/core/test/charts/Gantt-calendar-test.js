import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {Gantt} from "../../index.ts";
import {applyGanttLayout} from "../../src/charts/Gantt/applyLayout.ts";
import {
  ganttDayBreaks,
  isDateOnly,
  offsetDays,
  weekendRule,
  workingBreaks,
} from "../../src/charts/Gantt/ganttCalendar.ts";
import {taskSlack} from "../../src/charts/Gantt/ganttSlack.ts";
import {
  ganttAriaLabel,
  ganttDuration,
  ganttTooltipRows,
  shownEnd,
  taskTimes,
} from "../../src/charts/Gantt/ganttTooltip.ts";

/**
    The Gantt's calendar: an end naming a whole day runs through it (for
    drawing, Duration, and slack), and the working days that Duration and
    slack count leave out the locale's weekend.
*/

useJsdom();

/** A Gantt wired up the way the pipeline leaves it before layout. */
function gantt(data, config = {}) {
  const viz = new Gantt().config({width: 800, height: 400, ...config});
  viz._filteredData = data;
  viz._margin = {top: 0, right: 0, bottom: 0, left: 0};
  viz._id = d => d.id;
  viz._drawLabel = d => `${d.id}`;
  viz._chartScene = [];
  return viz;
}

const layout = viz => {
  const {shapeData} = applyGanttLayout({viz});
  return {marks: shapeData, layout: viz.ctx.gantt};
};

it("isDateOnly accepts whole-day strings and nothing else", () => {
  for (const v of ["2024-03-08", "2024-3-8", " 2024-03-08 ", "2024/03/08"])
    assert.strictEqual(isDateOnly(v), true, v);
  for (const v of [
    "2024-03-08T00:00",
    "2024-03-08 09:00",
    "2024-03/08",
    "March 8, 2024",
    new Date(2024, 2, 8),
    20240308,
    null,
    undefined,
  ])
    assert.strictEqual(isDateOnly(v), false, String(v));
});

it("offsetDays steps whole local or UTC days", () => {
  assert.strictEqual(
    +offsetDays(new Date(2024, 2, 8), 1),
    +new Date(2024, 2, 9),
  );
  // Across the daylight saving change, a local day stays a calendar day.
  assert.strictEqual(
    +offsetDays(new Date(2024, 2, 9), 1),
    +new Date(2024, 2, 10),
  );
  assert.strictEqual(
    +offsetDays(Date.UTC(2024, 2, 8), -1, true),
    Date.UTC(2024, 2, 7),
  );
});

it("taskTimes runs a whole-day end through that day; Dates end where given", () => {
  const viz = gantt([]);
  const day = taskTimes(viz, {start: "2024-03-04", end: "2024-03-08"}, 0);
  assert.strictEqual(+day.end, +new Date(2024, 2, 9));
  assert.strictEqual(day.inclusive, true);
  assert.strictEqual(+shownEnd(day), +new Date(2024, 2, 8));
  const dates = taskTimes(
    viz,
    {start: new Date(2024, 2, 4), end: new Date(2024, 2, 8)},
    0,
  );
  assert.strictEqual(+dates.end, +new Date(2024, 2, 8));
  assert.strictEqual(dates.inclusive, false);
  assert.strictEqual(+shownEnd(dates), +new Date(2024, 2, 8));
  // A milestone on a whole day stays a point, at the start of that day.
  const point = taskTimes(viz, {start: "2024-03-08", end: "2024-03-08"}, 0);
  assert.strictEqual(point.milestone, true);
  assert.strictEqual(point.inclusive, false);
  assert.strictEqual(+point.start, +new Date(2024, 2, 8));
  assert.strictEqual(+point.end, +point.start);
  assert.strictEqual(+shownEnd(point), +new Date(2024, 2, 8));
  // A flagged milestone spanning days sits at its start.
  const flagged = taskTimes(
    viz,
    {start: "2024-03-04", end: "2024-03-08", milestone: true},
    0,
  );
  assert.strictEqual(+flagged.start, +new Date(2024, 2, 4));
  assert.strictEqual(+flagged.end, +new Date(2024, 2, 4), "a point");
  // A numeric axis has no whole days.
  viz.axisConfig({scale: "linear"});
  const n = taskTimes(viz, {start: 1, end: 4}, 0);
  assert.deepStrictEqual([n.start, n.end, n.inclusive], [1, 4, false]);
});

it("taskTimes steps UTC days on a UTC axis", () => {
  const viz = gantt([], {axisConfig: {scale: "time", utc: true}});
  const day = taskTimes(viz, {start: "2024-03-04", end: "2024-03-08"}, 0);
  assert.strictEqual(+day.end, Date.UTC(2024, 2, 9));
  assert.strictEqual(
    +taskTimes(viz, {end: "2024-03-08"}, 0).start,
    Date.UTC(2024, 2, 8),
  );
  assert.strictEqual(day.inclusive, true);
});

it("bars, the axis domain, and the tooltip run through a whole-day end", () => {
  const data = [
    {id: "Plan", start: "2024-03-04", end: "2024-03-08"},
    {id: "Review", start: "2024-03-08", end: "2024-03-08"},
  ];
  const viz = gantt(data);
  const {marks, layout: l} = layout(viz);
  const [planMark, review] = marks;
  assert.strictEqual(planMark.x1, l.x(new Date(2024, 2, 9)));
  assert.strictEqual(
    review.x1,
    l.x(new Date(2024, 2, 8)),
    "the milestone sits at the start of its day, inside Plan's last day",
  );
  assert.ok(l.plot.x1 >= planMark.x1, "the axis spans the last day");
  assert.deepStrictEqual(ganttTooltipRows(viz, data[0], 0), [
    ["Start", "Mar 4, 2024"],
    ["End", "Mar 8, 2024"],
    ["Duration", "5 working days"],
  ]);
  assert.deepStrictEqual(ganttTooltipRows(viz, data[1], 1), [
    ["Milestone", "Mar 8, 2024"],
  ]);
  assert.strictEqual(
    ganttAriaLabel(viz, data[0], 0),
    "Plan, Mar 4, 2024 - Mar 8, 2024.",
  );
});

it("a whole-day end and the next day's start hand off with no slack", () => {
  const data = [
    {id: "A", start: "2024-03-04", end: "2024-03-06"},
    {id: "B", start: "2024-03-07", end: "2024-03-08", dependencies: "A"},
  ];
  const viz = gantt(data);
  const {layout: l} = layout(viz);
  assert.ok(l.critical);
  assert.strictEqual(taskSlack(viz, data[0]).slack, 0);
});

it("a milestone the next day, or the next working day, has no slack", () => {
  for (const [end, on] of [
    ["2024-03-07", "2024-03-08"],
    ["2024-03-08", "2024-03-11"],
  ]) {
    const data = [
      {id: "Kickoff", start: "2024-03-04", end: "2024-03-04"},
      {id: "Build", start: "2024-03-04", end, dependencies: "Kickoff"},
      {id: "Launch", start: on, end: on, dependencies: "Build"},
    ];
    const viz = gantt(data);
    const {layout: l} = layout(viz);
    assert.ok(l.critical, `${end} → ${on} chains`);
    assert.deepStrictEqual(
      data.map(d => taskSlack(viz, d).slack),
      [0, 0, 0],
      `${end} → ${on}`,
    );
  }
});

it("a milestone on its predecessor's last day, or ending the project, has no slack", () => {
  const data = [
    {id: "Build", start: "2024-03-04", end: "2024-03-08"},
    {
      id: "Sign-off",
      start: "2024-03-08",
      end: "2024-03-08",
      dependencies: "Build",
    },
    {
      id: "Ship",
      start: "2024-03-11",
      end: "2024-03-12",
      dependencies: "Sign-off",
    },
    {id: "Live", start: "2024-03-12", end: "2024-03-12", dependencies: "Ship"},
  ];
  const viz = gantt(data);
  const {marks, layout: l} = layout(viz);
  assert.strictEqual(
    marks[1].x1,
    l.x(new Date(2024, 2, 8)),
    "drawn at the start of its day",
  );
  assert.deepStrictEqual(
    data.map(d => taskSlack(viz, d).slack),
    [0, 0, 0, 0],
  );
  assert.ok(data.every(d => taskSlack(viz, d).critical));
  assert.deepStrictEqual(ganttTooltipRows(viz, data[1], 1), [
    ["Milestone", "Mar 8, 2024"],
    ["Slack", "0 working days"],
  ]);
  // A Friday milestone after a Thursday finish leaves Friday as slack before
  // a Monday start.
  const early = data.map(d =>
    d.id === "Build" ? {...d, end: "2024-03-07"} : d,
  );
  const v2 = gantt(early);
  layout(v2);
  assert.strictEqual(taskSlack(v2, early[1]).slack, 864e5);
});

it("weekendRule and workingBreaks follow the locale's weekend", () => {
  assert.deepStrictEqual(weekendRule(gantt([])), {days: [6, 0]});
  assert.deepStrictEqual(weekendRule(gantt([], {locale: "ar-SA"})), {
    days: [5, 6],
  });
  assert.deepStrictEqual(
    workingBreaks(
      gantt([], {locale: "ar-SA", axisConfig: {rangeBreaks: "weekends"}}),
    ),
    [{days: [5, 6]}, "weekends"],
  );
  assert.deepStrictEqual(ganttDayBreaks(gantt([], {locale: "ar-SA"})), []);
});

it("Duration and slack leave out the locale's weekend", () => {
  // Sunday, Mar 3 through Thursday, Mar 7; then Sunday, Mar 10 onward.
  const data = [
    {id: "A", start: "2024-03-03", end: "2024-03-07"},
    {id: "B", start: "2024-03-10", end: "2024-03-12", dependencies: "A"},
  ];
  const sa = gantt(data, {locale: "ar-SA"});
  layout(sa);
  assert.strictEqual(
    ganttDuration(sa, new Date(2024, 2, 3), new Date(2024, 2, 8)),
    `${new Intl.NumberFormat("ar-SA").format(5)} ${sa.schema.translate("working days")}`,
  );
  assert.strictEqual(taskSlack(sa, data[0]).slack, 0, "Thursday → Sunday");
  const us = gantt(data, {locale: "en-US"});
  layout(us);
  assert.strictEqual(
    ganttDuration(us, new Date(2024, 2, 3), new Date(2024, 2, 8)),
    "4 working days",
  );
  assert.strictEqual(
    taskSlack(us, data[0]),
    undefined,
    "Friday is a working day, so the handoff doesn't chain",
  );
});
