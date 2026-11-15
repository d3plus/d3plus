import {afterEach, it, vi} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {Gantt} from "../../index.ts";
import {configWarnings} from "../../src/utils/configWarnings.ts";
import {applyGanttLayout} from "../../src/charts/Gantt/applyLayout.ts";
import {ganttEmit, milestoneRadius} from "../../src/charts/Gantt/emit.ts";
import {
  ganttCriticalPath,
  linkKey,
  workClock,
} from "../../src/charts/Gantt/ganttCritical.ts";
import {
  criticalKeyNodes,
  criticalStyle,
  dependencyNodes,
  dependencyStyle,
} from "../../src/charts/Gantt/ganttDecor.ts";
import {recordSlack, taskSlack} from "../../src/charts/Gantt/ganttSlack.ts";
import {
  daysLabel,
  ganttAriaLabel,
  ganttTooltipRows,
  slackRows,
} from "../../src/charts/Gantt/ganttTooltip.ts";
import {ganttDef} from "../../src/charts/Gantt/index.ts";

/**
    The Gantt's critical path: the method run over the drawn tasks in
    working time, each task's slack in its tooltip and aria label, muted
    tasks and bold critical arrows, the key, and cycles warned about once.
*/

useJsdom();

afterEach(() => vi.restoreAllMocks());

/** Plan → Design → Review → Ship is critical; Copy has a week of slack. */
const plan = [
  {id: "Plan", start: "2024-03-04", end: "2024-03-08"},
  {id: "Design", start: "2024-03-08", end: "2024-03-20", dependencies: "Plan"},
  {id: "Copy", start: "2024-03-08", end: "2024-03-13", dependencies: "Plan"},
  {
    id: "Review",
    start: "2024-03-20",
    end: "2024-03-20",
    dependencies: ["Design", "Copy"],
  },
  {id: "Ship", start: "2024-03-20", end: "2024-03-27", dependencies: "Review"},
];

/** A Gantt wired up the way the pipeline leaves it before layout. */
function gantt(data = plan, config = {}) {
  const viz = new Gantt().config({
    width: 800,
    height: 400,
    criticalPath: true,
    ...config,
  });
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

const byId = id => plan.find(d => d.id === id);

/** Whether two dates fall within an hour (a daylight saving shift) of each other. */
const sameDay = (a, b) => Math.abs(+a - +b) <= 36e5;

it("Gantt: criticalPath is off by default, with an empty criticalPathConfig", () => {
  const viz = new Gantt();
  assert.strictEqual(viz.criticalPath(), false);
  assert.deepStrictEqual(viz.criticalPathConfig(), {});
  const fields = ganttDef.fields.map(f => f.key);
  assert.ok(fields.includes("criticalPath"));
  assert.ok(fields.includes("criticalPathConfig"));
  const {layout: l} = layout(gantt(plan, {criticalPath: false}));
  assert.strictEqual(l.critical, null);
});

it("Gantt: workClock leaves out hidden days, and is plain time without rules", () => {
  const plain = workClock([], 0);
  assert.strictEqual(plain.toWork(5), 5);
  assert.strictEqual(plain.shift(5, -2), 3);
  const day = 864e5;
  const mon = +new Date(2024, 2, 4);
  const clock = workClock(["weekends"], mon);
  // Friday to the next Monday is one working day.
  assert.strictEqual(
    clock.toWork(+new Date(2024, 2, 11)) - clock.toWork(+new Date(2024, 2, 8)),
    day,
  );
  assert.strictEqual(clock.toWork(+new Date(2024, 2, 1)), -day);
  assert.strictEqual(
    clock.shift(+new Date(2024, 2, 8), 5 * day),
    +new Date(2024, 2, 15),
  );
  assert.strictEqual(
    clock.shift(+new Date(2024, 2, 11), -day),
    +new Date(2024, 2, 8),
  );
});

it("Gantt: ganttCriticalPath marks the critical tasks and links of the drawn tasks", () => {
  const {layout: l} = layout(gantt());
  const critical = [...l.critical.tasks]
    .filter(([, t]) => t.critical)
    .map(([id]) => id);
  assert.deepStrictEqual(critical, ["Plan", "Design", "Review", "Ship"]);
  assert.deepStrictEqual(
    [...l.critical.links],
    [
      linkKey("Plan", "Design"),
      linkKey("Design", "Review"),
      linkKey("Review", "Ship"),
    ],
  );
  assert.strictEqual(
    taskSlack(gantt(), byId("Copy")),
    undefined,
    "slack is kept per chart",
  );
});

it("Gantt: ganttCriticalPath records each task's slack and latest start", () => {
  const viz = gantt();
  layout(viz);
  const copy = taskSlack(viz, byId("Copy"));
  assert.strictEqual(copy.critical, false);
  assert.strictEqual(copy.slack, 7 * 864e5);
  assert.strictEqual(sameDay(copy.latestStart, new Date(2024, 2, 15)), true);
  assert.strictEqual(taskSlack(viz, byId("Design")).slack, 0);
  // Turned off, the slack is forgotten.
  viz.criticalPath(false);
  layout(viz);
  assert.strictEqual(taskSlack(viz, byId("Copy")), undefined);
});

it("Gantt: weekends hidden by rangeBreaks don't count as slack", () => {
  const viz = gantt(plan, {axisConfig: {rangeBreaks: "weekends"}});
  layout(viz);
  const copy = taskSlack(viz, byId("Copy"));
  assert.strictEqual(copy.slack, 5 * 864e5);
  assert.strictEqual(sameDay(copy.latestStart, new Date(2024, 2, 15)), true);
});

it("Gantt: the critical path reads numbers on a linear axis", () => {
  const data = [
    {id: "A", start: 0, end: 4},
    {id: "B", start: 4, end: 10, dependencies: "A"},
    {id: "C", start: 4, end: 6, dependencies: "A"},
  ];
  const viz = gantt(data, {axisConfig: {scale: "linear"}});
  layout(viz);
  assert.deepStrictEqual(taskSlack(viz, data[2]), {
    slack: 4,
    latestStart: 8,
    critical: false,
  });
  assert.deepStrictEqual(
    slackRows(viz, data[2], v => `${v}`),
    [
      ["Slack", "4"],
      ["Latest start", "8"],
    ],
  );
});

it("Gantt: no critical path without a link between drawn tasks", () => {
  const data = [
    {id: "A", start: "2024-03-04", end: "2024-03-08", dependencies: "Gone"},
    {id: "B", start: "2024-03-08", end: "2024-03-12"},
  ];
  const viz = gantt(data);
  const {layout: l} = layout(viz);
  assert.strictEqual(l.critical, null);
  assert.strictEqual(taskSlack(viz, data[0]), undefined);
  assert.strictEqual(ganttCriticalPath(viz, []), null);
});

it("Gantt: a dependency cycle warns once, naming it, and draws no critical path", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const data = [
    {id: "A", start: "2024-03-04", end: "2024-03-08", dependencies: "C"},
    {id: "B", start: "2024-03-08", end: "2024-03-12", dependencies: "A"},
    {id: "C", start: "2024-03-12", end: "2024-03-15", dependencies: "B"},
  ];
  const viz = gantt(data);
  const {marks, layout: l} = layout(viz);
  layout(viz);
  assert.strictEqual(l.critical, null);
  assert.strictEqual(warn.mock.calls.length, 1);
  assert.match(warn.mock.calls[0][0], /"A" → "B" → "C" → "A"/);
  // The arrows still draw, in the plain style.
  const nodes = dependencyNodes(viz, l, marks, milestoneRadius(l.band));
  assert.strictEqual(nodes.length, 6);
  assert.ok(
    nodes.every(n => (n.paint.strokeOpacity ?? n.paint.fillOpacity) === 0.55),
  );
  assert.deepStrictEqual(
    ganttTooltipRows(viz, data[0], 0).at(-1)[0],
    "Duration",
    "no slack rows",
  );
  configWarnings(false);
  gantt(data);
  layout(gantt(data));
  configWarnings(true);
  assert.strictEqual(warn.mock.calls.length, 1, "silenced by configWarnings");
});

it("Gantt: recordSlack keeps a row's slack per chart, and null forgets it", () => {
  const a = {},
    b = {},
    row = {};
  recordSlack(a, row, {slack: 1, latestStart: 2, critical: false});
  assert.strictEqual(taskSlack(a, row).slack, 1);
  assert.strictEqual(taskSlack(b, row), undefined);
  recordSlack(a, row, null);
  assert.strictEqual(taskSlack(a, row), undefined);
});

it("Gantt: daysLabel counts days, working days, and negative spans", () => {
  const viz = gantt();
  viz.locale("en-US");
  assert.strictEqual(daysLabel(viz, 864e5 * 3, false), "3 days");
  assert.strictEqual(daysLabel(viz, 864e5, true), "1 working day");
  assert.strictEqual(daysLabel(viz, -864e5 * 2, false), "-2 days");
  assert.strictEqual(daysLabel(viz, -1, false), "0 days");
  viz.locale("es-ES");
  assert.strictEqual(daysLabel(viz, 864e5 * 3, true), "3 días laborables");
});

it("Gantt: the tooltip lists Slack and Latest start, translated", () => {
  const viz = gantt();
  layout(viz);
  const copy = ganttTooltipRows(viz, byId("Copy"), 2);
  assert.deepStrictEqual(copy.slice(-2), [
    ["Slack", "7 days"],
    ["Latest start", "Mar 15, 2024"],
  ]);
  assert.deepStrictEqual(ganttTooltipRows(viz, byId("Design"), 1).at(-1), [
    "Slack",
    "0 days",
  ]);
  assert.deepStrictEqual(ganttTooltipRows(viz, byId("Review"), 3), [
    ["Milestone", "Mar 20, 2024"],
    ["Slack", "0 days"],
  ]);
  viz.locale("es-ES");
  assert.deepStrictEqual(
    ganttTooltipRows(viz, byId("Copy"), 2)
      .slice(-2)
      .map(r => r[0]),
    ["Holgura", "Inicio más tardío"],
  );
  viz.locale("zh-CN");
  assert.strictEqual(
    ganttTooltipRows(viz, byId("Copy"), 2).at(-2)[0],
    "浮动时间",
  );
});

it("Gantt: a critical task's aria label says so", () => {
  const viz = gantt();
  layout(viz);
  assert.match(ganttAriaLabel(viz, byId("Design"), 1), /, Critical path\.$/);
  assert.doesNotMatch(ganttAriaLabel(viz, byId("Copy"), 2), /Critical/);
  viz.locale("pt-BR");
  assert.match(ganttAriaLabel(viz, byId("Ship"), 4), /Caminho crítico\.$/);
});

it("Gantt: criticalStyle reads criticalPathConfig over the arrows' style", () => {
  const viz = gantt();
  const dep = dependencyStyle(viz);
  const style = criticalStyle(viz);
  assert.strictEqual(style.stroke, dep.stroke);
  assert.deepStrictEqual(
    [
      style.strokeWidth,
      style.strokeOpacity,
      style.arrowSize,
      style.mutedOpacity,
    ],
    [2, 1, 8, 0.35],
  );
  assert.strictEqual(style.label, "Critical path");
  viz.dependencyConfig({stroke: "blue"}).criticalPathConfig({
    stroke: "red",
    strokeWidth: 3,
    mutedOpacity: 2,
    label: false,
  });
  const set = criticalStyle(viz);
  assert.deepStrictEqual(
    [set.stroke, set.strokeWidth, set.arrowSize, set.mutedOpacity, set.label],
    ["red", 3, 10, 1, false],
  );
  viz.criticalPathConfig({label: "Longest chain"});
  assert.strictEqual(criticalStyle(viz).label, "Longest chain");
  viz.locale("es-ES").criticalPathConfig({label: undefined});
  assert.strictEqual(criticalStyle(viz).label, "Ruta crítica");
});

it("Gantt: dependencyNodes draw critical links last and bold", () => {
  const viz = gantt();
  const {marks, layout: l} = layout(viz);
  const nodes = dependencyNodes(viz, l, marks, milestoneRadius(l.band));
  const lines = nodes.filter(n => n.type === "line");
  assert.deepStrictEqual(
    lines.map(n => n.key),
    [
      "gantt-dependency-Plan-Copy",
      "gantt-dependency-Copy-Review",
      "gantt-dependency-Plan-Design",
      "gantt-dependency-Design-Review",
      "gantt-dependency-Review-Ship",
    ],
  );
  const [plainLine, , boldLine] = lines;
  assert.deepStrictEqual(
    [plainLine.paint.strokeWidth, plainLine.paint.strokeOpacity],
    [1, 0.55],
  );
  assert.deepStrictEqual(
    [boldLine.paint.strokeWidth, boldLine.paint.strokeOpacity],
    [2, 1],
  );
  const arrow = nodes.find(n => n.key === "gantt-dependency-Plan-Design-arrow");
  assert.strictEqual(arrow.paint.fillOpacity, 1);
});

it("Gantt: ganttEmit mutes the tasks off the critical path", () => {
  const viz = gantt().color(() => "#4c6ef5");
  const {marks} = layout(viz);
  const nodes = ganttEmit({viz, shapeData: marks});
  const byKey = Object.fromEntries(nodes.map(n => [n.key, n]));
  assert.strictEqual(byKey["gantt-task-Copy"].paint.opacity, 0.35);
  assert.strictEqual(byKey["gantt-task-Design"].paint.opacity ?? 1, 1);
  assert.strictEqual(byKey["gantt-milestone-Review"].paint.opacity ?? 1, 1);
  assert.ok(byKey["gantt-critical-key-label"], "draws the key");
  // A shapeConfig opacity is muted along with it.
  viz.shapeConfig({Rect: {opacity: 0.8}});
  const again = ganttEmit({viz, shapeData: marks});
  const copy = again.find(n => n.key === "gantt-task-Copy");
  assert.ok(Math.abs(copy.paint.opacity - 0.28) < 1e-9);
  // Without a critical path nothing is muted.
  viz.criticalPath(false);
  const {marks: plain} = layout(viz);
  const off = ganttEmit({viz, shapeData: plain});
  assert.strictEqual(
    off.find(n => n.key === "gantt-task-Copy").paint.opacity,
    0.8,
  );
  assert.ok(!off.some(n => `${n.key}`.startsWith("gantt-critical-key")));
});

it("Gantt: criticalKeyNodes sit in the label column's corner beside the axis", () => {
  const viz = gantt();
  const {layout: l} = layout(viz);
  const nodes = criticalKeyNodes(viz, l);
  assert.deepStrictEqual(
    nodes.map(n => n.key),
    [
      "gantt-critical-key-line",
      "gantt-critical-key-arrow",
      "gantt-critical-key-label",
    ],
  );
  assert.ok(nodes.every(n => n.interactive === false && !n.datum));
  const label = nodes[2];
  assert.deepStrictEqual(
    label.lines.map(x => x.text),
    ["Critical path"],
  );
  assert.ok(label.transform.y > l.corner.y0 && label.transform.y < l.corner.y1);
  assert.ok(l.corner.y1 <= l.plot.y0, "above the rows");
  // A bottom axis moves the corner below the rows.
  const bottom = gantt(plan, {axisConfig: {orient: "bottom"}});
  const {layout: lb} = layout(bottom);
  assert.ok(lb.corner.y0 >= lb.plot.y1, "below the rows");
  // No key without a label, or without room for it.
  viz.criticalPathConfig({label: false});
  assert.deepStrictEqual(criticalKeyNodes(viz, l), []);
  viz.criticalPathConfig({label: "Critical path"});
  assert.deepStrictEqual(
    criticalKeyNodes(viz, {...l, corner: {...l.corner, x1: 30}}),
    [],
  );
  const none = gantt(plan, {labelWidth: 0});
  assert.deepStrictEqual(criticalKeyNodes(none, layout(none).layout), []);
});
