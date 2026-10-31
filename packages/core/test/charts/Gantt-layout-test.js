import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {Gantt, Priestley} from "../../index.ts";
import {
  applyGanttLayout,
  ganttDomain,
  ganttTasks,
  LABEL_INDENT,
  LABEL_PADDING,
  MAX_ROW_STEP,
} from "../../src/charts/Gantt/applyLayout.ts";
import {
  ganttEmit,
  milestoneRadius,
  remainingShade,
} from "../../src/charts/Gantt/emit.ts";
import {
  dependencyNodes,
  dependencyStyle,
  groupNodes,
  labelNodes,
  todayNodes,
} from "../../src/charts/Gantt/ganttDecor.ts";
import {
  fitLabel,
  ganttLabelFont,
  LABEL_FONT_SIZE,
  labelWidth,
} from "../../src/charts/Gantt/ganttLabels.ts";
import {
  ganttAriaLabel,
  ganttDuration,
  ganttTooltipRows,
  taskTimes,
  timeFormatter,
} from "../../src/charts/Gantt/ganttTooltip.ts";
import {ganttDef} from "../../src/charts/Gantt/index.ts";
import {
  isTimeAxis,
  measureTimeAxis,
  parseTime,
  renderTimeAxis,
  rowTime,
  seedTimeAggs,
  timeFields,
} from "../../src/charts/Priestley/timeAxis.ts";

useJsdom();

const plan = [
  {
    id: "Plan",
    phase: "Discovery",
    start: "2024-03-04",
    end: "2024-03-08",
    progress: 1,
  },
  {
    id: "Design",
    phase: "Build",
    start: "2024-03-11",
    end: "2024-03-22",
    progress: 0.5,
    dependencies: ["Plan"],
  },
  {
    id: "Review",
    phase: "Build",
    start: "2024-03-22",
    end: "2024-03-22",
    dependencies: "Design",
  },
  {id: "Ship", start: "2024-03-25", end: "2024-03-29", progress: "25%"},
];

/** A Gantt wired up the way the pipeline leaves it before layout. */
function gantt(data = plan, config = {}) {
  const viz = new Gantt().config({width: 800, height: 400, ...config});
  viz._filteredData = data;
  viz._margin = {top: 0, right: 0, bottom: 0, left: 0};
  viz._id = d => d.id;
  viz._drawLabel = d => `${d.id}`;
  viz._chartScene = [];
  return viz;
}

/** Runs the layout stage and returns the marks and the stored layout. */
function layout(viz) {
  const {shapeData} = applyGanttLayout({viz});
  return {marks: shapeData, layout: viz.ctx.gantt};
}

it("Gantt: timeFields declares start and end accessors that seed their aggregations", () => {
  const [end, start] = timeFields();
  assert.strictEqual(end.key, "end");
  assert.strictEqual(start.key, "start");
  assert.strictEqual(start.coerce("begin")({begin: 4}), 4);
  const fn = d => d.x;
  assert.strictEqual(end.coerce(fn), fn);
  const viz = {schema: {aggs: {}}};
  start.onSet(viz, "begin");
  end.onSet(viz, "finish");
  end.onSet(viz, fn);
  assert.strictEqual(
    viz.schema.aggs.begin([{v: 3}, {v: 1}], d => d.v),
    1,
  );
  assert.strictEqual(
    viz.schema.aggs.finish([{v: 3}, {v: 1}], d => d.v),
    3,
  );
  assert.deepStrictEqual(Object.keys(viz.schema.aggs), ["begin", "finish"]);
});

it("Gantt: seedTimeAggs adds min/max for the default keys without replacing others", () => {
  const custom = () => 0;
  const viz = {schema: {aggs: {end: custom}}};
  seedTimeAggs(viz);
  assert.strictEqual(viz.schema.aggs.start([5, 2]), 2);
  assert.strictEqual(viz.schema.aggs.end, custom);
});

it("Gantt: parseTime reads dates on a time axis and numbers otherwise", () => {
  assert.ok(parseTime("2024-03-04", true) instanceof Date);
  assert.strictEqual(parseTime("nope", true), null);
  assert.strictEqual(parseTime("12", false), 12);
  assert.strictEqual(parseTime("x", false), null);
  assert.strictEqual(parseTime(undefined, true), null);
  assert.strictEqual(parseTime("", false), null);
});

it("Gantt: isTimeAxis and rowTime read the chart's config", () => {
  const viz = gantt();
  assert.strictEqual(isTimeAxis(viz), true);
  assert.strictEqual(rowTime(viz, "start", plan[0], 0), "2024-03-04");
  viz.axisConfig({scale: "linear"});
  assert.strictEqual(isTimeAxis(viz), false);
});

it("Gantt: measureTimeAxis and renderTimeAxis size, draw, and return the axis scale", () => {
  const viz = gantt();
  const frame = {domain: [0, 864e5 * 10], width: 500, height: 300};
  const size = measureTimeAxis(viz, frame);
  assert.ok(size.height > 0);
  assert.strictEqual(size.padding, 5);
  const scale = renderTimeAxis(
    viz,
    {...frame, transform: {x: 10, y: 0}, key: "test-axis"},
    {interactive: false},
  );
  assert.strictEqual(typeof scale, "function");
  const group = viz._chartScene.find(n => n.key === "test-axis");
  assert.deepStrictEqual(group.transform, {x: 10, y: 0});
  assert.strictEqual(group.interactive, false);
  assert.ok(group.children.length > 0);
});

it("Gantt: taskTimes fills a missing end, swaps reversed times, and reads milestones and progress", () => {
  const viz = gantt();
  const a = taskTimes(
    viz,
    {start: "2024-03-08", end: "2024-03-04", progress: "50%"},
    0,
  );
  assert.ok(+a.start < +a.end);
  assert.strictEqual(a.progress, 0.5);
  assert.strictEqual(a.milestone, false);
  const b = taskTimes(viz, {start: "2024-03-08"}, 0);
  assert.strictEqual(+b.start, +b.end);
  assert.strictEqual(b.milestone, true);
  const c = taskTimes(
    viz,
    {start: "2024-03-01", end: "2024-03-08", milestone: true},
    0,
  );
  assert.strictEqual(c.milestone, true);
  assert.strictEqual(taskTimes(viz, {}, 0), null);
});

it("Gantt: ganttTasks reads each row's id, label, group, dependencies, and progress", () => {
  const viz = gantt().group("phase");
  const tasks = ganttTasks(viz, [...plan, {id: "Empty"}]);
  assert.deepStrictEqual(
    tasks.map(t => [t.id, t.group, t.dependencies, t.progress, t.milestone]),
    [
      ["Plan", "Discovery", [], 1, false],
      ["Design", "Build", ["Plan"], 0.5, false],
      ["Review", "Build", ["Design"], undefined, true],
      ["Ship", undefined, [], 0.25, false],
    ],
  );
  assert.strictEqual(tasks[0].label, "Plan");
});

it("Gantt: ganttDomain spans the tasks, widening a single instant", () => {
  const viz = gantt();
  const tasks = ganttTasks(viz, plan);
  assert.deepStrictEqual(ganttDomain(tasks, true), [
    +new Date(tasks[0].start),
    +new Date(tasks[3].end),
  ]);
  const one = ganttTasks(viz, [plan[2]]);
  const [lo, hi] = ganttDomain(one, true);
  assert.ok(Math.abs(hi - lo - 2 * 864e5) < 2 * 36e5, "a day each side");
  assert.deepStrictEqual(ganttDomain([{start: 4, end: 4}], false), [3, 5]);
  assert.deepStrictEqual(ganttDomain([], true), [0, 1]);
});

it("Gantt: the layout gives one row per task, top down, beside the label column", () => {
  const viz = gantt();
  const {marks, layout: l} = layout(viz);
  assert.strictEqual(marks.length, 4);
  assert.deepStrictEqual(
    marks.map(m => m.row),
    [0, 1, 2, 3],
  );
  assert.ok(marks.every((m, k) => k === 0 || m.cy > marks[k - 1].cy));
  assert.ok(l.column > 0 && l.column < 800 * 0.3 + 1);
  assert.ok(marks.every(m => m.x0 >= l.column));
  assert.ok(l.step <= MAX_ROW_STEP + 0.001);
  assert.ok(l.plot.y0 > 0, "the time axis sits on top");
  assert.ok(marks[1].x1 > marks[1].x0);
  assert.strictEqual(marks[2].x0, marks[2].x1, "a milestone has no length");
  assert.strictEqual(typeof l.format, "function");
  const axis = viz._chartScene.find(n => n.key === "gantt-axis");
  assert.strictEqual(axis.interactionGroup, "axis");
  assert.strictEqual(axis.transform.x, l.column);
});

it("Gantt: groups add header rows and indented tasks", () => {
  const viz = gantt().group("phase");
  const {marks, layout: l} = layout(viz);
  assert.deepStrictEqual(
    l.rows.map(r => r.key),
    [
      "group-Discovery",
      "task-Plan",
      "group-Build",
      "task-Design",
      "task-Review",
      "task-Ship",
    ],
  );
  assert.deepStrictEqual(
    marks.map(m => m.row),
    [1, 3, 4, 5],
  );
});

it("Gantt: taskSort orders rows by start", () => {
  const viz = gantt([plan[3], plan[0]]).taskSort("start");
  const {layout: l} = layout(viz);
  assert.deepStrictEqual(
    l.rows.map(r => r.key),
    ["task-Plan", "task-Ship"],
  );
});

it("Gantt: a bottom axis puts the rows above it", () => {
  const viz = gantt().axisConfig({orient: "bottom"});
  const {layout: l} = layout(viz);
  assert.strictEqual(l.plot.y0, 5);
});

it("Gantt: labelWidth caps the column and 0 hides it", () => {
  const long = [
    {id: "A very long task name that will not fit at all", start: 1, end: 2},
  ];
  const capped = layout(
    gantt(long, {labelWidth: 80, axisConfig: {scale: "linear"}}),
  );
  assert.strictEqual(capped.layout.column, 80);
  assert.ok(capped.layout.labels[0].lines.at(-1).endsWith("…"));
  const hidden = layout(
    gantt(long, {labelWidth: 0, axisConfig: {scale: "linear"}}),
  );
  assert.strictEqual(hidden.layout.column, 0);
  assert.deepStrictEqual(hidden.layout.labels[0].lines, []);
});

it("Gantt: ganttLabelFont reads taskLabelConfig over the chart's defaults", () => {
  const viz = gantt();
  const font = ganttLabelFont(viz);
  assert.strictEqual(font.size, LABEL_FONT_SIZE);
  assert.strictEqual(font.lineHeight, Math.round(LABEL_FONT_SIZE * 1.2));
  viz.taskLabelConfig({fontSize: 16, fontColor: "red", fontFamily: "serif"});
  const custom = ganttLabelFont(viz);
  assert.strictEqual(custom.size, 16);
  assert.strictEqual(custom.color, "red");
  assert.strictEqual(custom.family, "serif");
});

it("Gantt: fitLabel wraps onto two lines, then truncates with an ellipsis", () => {
  const font = ganttLabelFont(gantt());
  const text = "Visual design and component library";
  const one = labelWidth(text, font);
  assert.ok(one > 0);
  assert.strictEqual(labelWidth("", font), 0);
  assert.deepStrictEqual(fitLabel(text, one + 10, 2, font).lines, [text]);
  const two = fitLabel(text, one * 0.6, 2, font);
  assert.strictEqual(two.lines.length, 2);
  assert.ok(two.widths.every(w => w <= one * 0.6 + 0.5));
  const cut = fitLabel(text, one * 0.4, 1, font);
  assert.strictEqual(cut.lines.length, 1);
  assert.ok(cut.lines[0].endsWith("…"));
  assert.ok(cut.widths[0] <= one * 0.4 + 0.5);
  assert.deepStrictEqual(fitLabel("", 100, 1, font).lines, []);
  assert.deepStrictEqual(fitLabel(text, 0, 1, font).lines, []);
});

it("Gantt: timeFormatter and ganttDuration read dates and days, or numbers", () => {
  const viz = gantt();
  const days = [new Date(2024, 2, 4), new Date(2024, 2, 8)];
  assert.strictEqual(timeFormatter(viz, days)(days[0]), "Mar 4, 2024");
  assert.strictEqual(ganttDuration(viz, days[0], days[1]), "4 days");
  assert.strictEqual(
    ganttDuration(viz, days[0], new Date(2024, 2, 5)),
    "1 day",
  );
  viz.axisConfig({scale: "linear"});
  assert.strictEqual(timeFormatter(viz, [1, 2])(1500), "1.5k");
  assert.strictEqual(ganttDuration(viz, 2, 9), "7");
});

it("Gantt: ganttTooltipRows lists start, end, duration, and progress, translated", () => {
  const viz = gantt();
  layout(viz);
  const rows = ganttTooltipRows(viz, plan[1], 1);
  assert.deepStrictEqual(
    rows.map(r => r[0]),
    ["Start", "End", "Duration", "Progress"],
  );
  assert.strictEqual(rows[1][1], "Mar 22, 2024");
  assert.strictEqual(rows[2][1], "11 days");
  assert.strictEqual(rows[3][1], "50%");
  assert.deepStrictEqual(ganttTooltipRows(viz, plan[2], 2), [
    ["Milestone", "Mar 22, 2024"],
  ]);
  assert.deepStrictEqual(ganttTooltipRows(viz, {}, 0), []);
  viz.locale("es-ES");
  assert.deepStrictEqual(
    ganttTooltipRows(viz, plan[1], 1).map(r => r[0]),
    ["Inicio", "Fin", "Duración", "Progreso"],
  );
  assert.strictEqual(ganttTooltipRows(viz, plan[1], 1)[2][1], "11 días");
});

it("Gantt: ganttAriaLabel names the task, its span, and its progress", () => {
  const viz = gantt();
  layout(viz);
  assert.strictEqual(
    ganttAriaLabel(viz, plan[1], 1),
    "Design, Mar 11, 2024 - Mar 22, 2024, Progress 50%.",
  );
  assert.strictEqual(
    ganttAriaLabel(viz, plan[2], 2),
    "Review, Milestone Mar 22, 2024.",
  );
  assert.strictEqual(ganttAriaLabel(viz, {id: "X"}, 0), "X.");
});

it("Gantt: dependencyStyle defaults to the chart's ink and reads dependencyConfig", () => {
  const viz = gantt();
  const style = dependencyStyle(viz);
  assert.deepStrictEqual(
    [style.strokeWidth, style.strokeOpacity, style.arrowSize],
    [1, 0.55, 6],
  );
  assert.ok(style.stroke);
  viz.dependencyConfig({stroke: "red", arrowSize: 9});
  assert.strictEqual(dependencyStyle(viz).stroke, "red");
  assert.strictEqual(dependencyStyle(viz).arrowSize, 9);
});

it("Gantt: dependencyNodes join a predecessor's end to its dependent's start", () => {
  const viz = gantt();
  const {marks, layout: l} = layout(viz);
  const r = milestoneRadius(l.band);
  const nodes = dependencyNodes(viz, l, marks, r);
  assert.deepStrictEqual(
    nodes.map(n => n.key),
    [
      "gantt-dependency-Plan-Design",
      "gantt-dependency-Plan-Design-arrow",
      "gantt-dependency-Design-Review",
      "gantt-dependency-Design-Review-arrow",
    ],
  );
  const [line, arrow] = nodes;
  const [plan_, design] = marks;
  assert.deepStrictEqual(line.points[0], [plan_.x1, plan_.cy]);
  assert.ok(line.points.at(-1)[0] < design.x0);
  assert.strictEqual(line.interactive, false);
  assert.strictEqual(arrow.interactive, false);
  assert.strictEqual(arrow.datum, undefined);
  assert.ok(arrow.d.startsWith(`M${Math.round(design.x0 * 100) / 100},`));
  assert.deepStrictEqual(
    line.interactionPoints.map(p => p.datum.id),
    ["Plan", "Design"],
  );
  // The milestone's dependency ends at its diamond's left tip.
  const review = marks[2];
  const tip = Math.round((review.x1 - r) * 100) / 100;
  assert.ok(nodes[3].d.startsWith(`M${tip},`));
});

it("Gantt: groupNodes draws an inert bracket per group", () => {
  const viz = gantt().group("phase");
  const {layout: l} = layout(viz);
  const nodes = groupNodes(viz, l);
  assert.deepStrictEqual(
    nodes.map(n => n.key),
    ["gantt-group-Discovery", "gantt-group-Build"],
  );
  assert.ok(nodes.every(n => n.interactive === false && !n.datum));
});

it("Gantt: labelNodes place each row's label, indenting grouped tasks", () => {
  const viz = gantt().group("phase");
  const {marks, layout: l} = layout(viz);
  const nodes = labelNodes(l, marks);
  assert.strictEqual(nodes.length, 6);
  assert.strictEqual(nodes[0].font.weight, 600);
  assert.strictEqual(nodes[0].transform.x, LABEL_PADDING);
  assert.strictEqual(nodes[1].transform.x, LABEL_PADDING + LABEL_INDENT);
  assert.strictEqual(nodes[1].datum.id, "Plan");
  assert.ok(nodes.every(n => n.interactive === false));
});

it("Gantt: todayNodes draws a labeled line inside the axis, and nothing outside it", () => {
  const viz = gantt().today("2024-03-15");
  const {layout: l} = layout(viz);
  const nodes = todayNodes(viz, l);
  assert.deepStrictEqual(
    nodes.map(n => n.key),
    ["gantt-today-line", "gantt-today-label"],
  );
  const x = l.x(new Date(2024, 2, 15));
  assert.ok(Math.abs(nodes[0].points[0][0] - x) < 0.01);
  assert.strictEqual(nodes[1].lines[0].text, "Today");
  viz.todayConfig({label: false, stroke: "red"});
  const plain = todayNodes(viz, l);
  assert.strictEqual(plain.length, 1);
  assert.strictEqual(plain[0].paint.stroke, "red");
  viz.today("2030-01-01");
  assert.deepStrictEqual(todayNodes(viz, l), []);
  viz.today(false);
  assert.deepStrictEqual(todayNodes(viz, l), []);
});

it("Gantt: remainingShade mixes a color toward the background", () => {
  assert.strictEqual(
    remainingShade("rgb(0, 0, 0)", "rgb(255, 255, 255)"),
    "rgb(153, 153, 153)",
  );
  assert.strictEqual(milestoneRadius(10), 6);
  assert.strictEqual(milestoneRadius(1), 3);
});

it("Gantt: ganttEmit splits bars by progress and draws milestones as diamonds", () => {
  const viz = gantt().color(() => "#4c6ef5");
  const {marks} = layout(viz);
  const nodes = ganttEmit({viz, shapeData: marks});
  const byKey = Object.fromEntries(nodes.map(n => [n.key, n]));
  const design = byKey["gantt-task-Design"];
  const done = byKey["gantt-task-Design-progress"];
  assert.strictEqual(design.shapeType, "Bar");
  assert.strictEqual(done.interactive, false);
  assert.ok(Math.abs(done.width - design.width * 0.5) < 0.01);
  assert.strictEqual(done.paint.fill, "#4c6ef5");
  assert.notStrictEqual(design.paint.fill, "#4c6ef5");
  assert.ok(byKey["gantt-milestone-Review"].d.startsWith("M0,"));
  assert.strictEqual(byKey["gantt-milestone-Review"].datum.id, "Review");
  assert.ok(byKey["gantt-task-Plan"].aria.label.startsWith("Plan, "));
  assert.deepStrictEqual(ganttEmit({viz, shapeData: []}), []);
});

it("Gantt: the def specializes nothing and keeps Priestley's time fields", () => {
  assert.strictEqual(ganttDef.name, "Gantt");
  const viz = new Gantt();
  assert.strictEqual(viz.zoom(), false);
  assert.strictEqual(viz.taskSort(), "data");
  assert.strictEqual(viz.today(), false);
  assert.strictEqual(viz.axisConfig().scale, "time");
  assert.strictEqual(viz.start()({start: 1}), 1);
  assert.ok(!(viz instanceof Priestley));
  assert.strictEqual(viz.legend()({}, [{}, {}], 0), false);
});
