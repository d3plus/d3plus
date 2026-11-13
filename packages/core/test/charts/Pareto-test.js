import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {Pareto} from "../../index.ts";
import {paretoDef} from "../../internal.ts";
import {
  categoryKey,
  paretoComparator,
  paretoSteps,
} from "../../src/charts/Pareto/paretoSteps.ts";
import {
  barRows,
  categoryAxis,
  categoryOf,
  interceptAxes,
  isLineRow,
  LINE_KEY,
  lineLabel,
  lineRow,
  lineStep,
  paretoState,
  percentFormat,
  shareAxis,
  sourceRow,
  stepOf,
  stepsFor,
  valueAxis,
  valueOf,
  withLineRows,
  wrapDrawLabel,
  wrapGroupBy,
} from "../../src/charts/Pareto/state.ts";
import {
  paretoThreshold,
  syncPooledOrder,
  syncSort,
} from "../../src/charts/Pareto/order.ts";
import {
  thresholdLines,
  titleShareAxis,
  tooltipRows,
  tooltipTitle,
  valueFormat,
  valueName,
} from "../../src/charts/Pareto/labels.ts";
import {
  barColor,
  oneBarPerCategory,
  paretoColor,
  sharesOneColor,
} from "../../src/charts/Pareto/color.ts";
import {
  hoveredCategories,
  isLinePath,
  keepLineBright,
  withLine,
} from "../../src/charts/Pareto/hover.ts";
import {fieldNameOf} from "../../src/utils/fieldAccessor.ts";

useJsdom();

/**
    Pareto's math, state, order, and labels, driven directly without a
    layout pass.
*/

const rows = [
  {cause: "Scratches", count: 30},
  {cause: "Cracks", count: 50},
  {cause: "Dents", count: 15},
  {cause: "Smudges", count: 5},
];
const pareto = (data = rows) =>
  new Pareto().data(data).groupBy("cause").x("cause").y("count");

/** A Pareto after its pre-draw, with the line's rows added as a draw adds them. */
function drawn(viz = pareto()) {
  viz._preDraw();
  viz._filteredData = withLineRows(viz, viz._filteredData);
  return viz;
}

const category = d => d.cause;
const value = d => d.count;

it("Pareto's def keeps ctx and fields last", () => {
  const keys = Object.keys(paretoDef);
  assert.deepStrictEqual(keys.slice(-2), ["ctx", "fields"]);
  assert.strictEqual(paretoDef.name, "Pareto");
});

it("categoryKey compares dates by time and everything else as text", () => {
  assert.strictEqual(categoryKey(new Date(5)), "5");
  assert.strictEqual(categoryKey(2020), "2020");
  assert.strictEqual(categoryKey("A"), "A");
});

it("paretoSteps sorts categories largest first with running shares ending at 100%", () => {
  const steps = paretoSteps(rows, {category, value});
  assert.deepStrictEqual(
    steps.map(s => [s.category, s.index, s.value]),
    [
      ["Cracks", 0, 50],
      ["Scratches", 1, 30],
      ["Dents", 2, 15],
      ["Smudges", 3, 5],
    ],
  );
  assert.deepStrictEqual(
    steps.map(s => s.share),
    [0.5, 0.3, 0.15, 0.05],
  );
  assert.deepStrictEqual(
    steps.map(s => s.cumulative),
    [50, 80, 95, 100],
  );
  assert.deepStrictEqual(
    steps.map(s => s.cumulativeShare),
    [0.5, 0.8, 0.95, 1],
  );
});

it("paretoSteps sums a category's rows, counts non-numbers as 0, and keeps ties in data order", () => {
  const steps = paretoSteps(
    [
      {c: "A", v: 10},
      {c: "B", v: 20},
      {c: "A", v: 10},
      {c: "C", v: null},
      {c: "D", v: "x"},
    ],
    {category: d => d.c, value: d => d.v},
  );
  assert.deepStrictEqual(
    steps.map(s => [s.key, s.value]),
    [
      ["A", 20],
      ["B", 20],
      ["C", 0],
      ["D", 0],
    ],
  );
});

it("paretoSteps puts a threshold bucket last, and follows a given order", () => {
  const data = [...rows, {cause: "Other", count: 70, other: true}];
  const steps = paretoSteps(data, {
    category,
    value,
    other: d => Boolean(d.other),
  });
  assert.deepStrictEqual(
    steps.map(s => [s.category, s.other]),
    [
      ["Cracks", false],
      ["Scratches", false],
      ["Dents", false],
      ["Smudges", false],
      ["Other", true],
    ],
  );
  const alpha = paretoSteps(rows, {
    category,
    value,
    order: (a, b) => a.cause.localeCompare(b.cause),
  });
  assert.deepStrictEqual(
    alpha.map(s => [s.category, s.cumulative]),
    [
      ["Cracks", 50],
      ["Dents", 65],
      ["Scratches", 95],
      ["Smudges", 100],
    ],
  );
});

it("paretoSteps gives every share 0 without a positive total", () => {
  const steps = paretoSteps([{c: "A", v: 0}], {
    category: d => d.c,
    value: d => d.v,
  });
  assert.deepStrictEqual([steps[0].share, steps[0].cumulativeShare], [0, 0]);
  assert.deepStrictEqual(paretoSteps([], {category, value}), []);
});

it("paretoComparator orders rows by step, unknown categories last", () => {
  const steps = paretoSteps(rows, {category, value});
  const compare = paretoComparator(() => steps, category);
  const sorted = [{cause: "Zzz"}, ...rows].sort(compare).map(category);
  assert.deepStrictEqual(sorted, [
    "Cracks",
    "Scratches",
    "Dents",
    "Smudges",
    "Zzz",
  ]);
  const reversed = paretoComparator(() => steps, category, true);
  assert.deepStrictEqual(rows.slice().sort(reversed).map(category), [
    "Smudges",
    "Dents",
    "Scratches",
    "Cracks",
  ]);
});

it("sourceRow, lineStep, isLineRow, and lineRow read through wrappers", () => {
  const step = paretoSteps(rows, {category, value})[0];
  const row = lineRow(step);
  assert.strictEqual(row[LINE_KEY], step);
  const wrapped = {__d3plus__: true, data: {__d3plusShape__: true, data: row}};
  assert.strictEqual(sourceRow(wrapped), row);
  assert.strictEqual(lineStep(wrapped), step);
  assert.strictEqual(isLineRow(wrapped), true);
  assert.strictEqual(isLineRow(rows[0]), false);
  assert.strictEqual(lineStep(undefined), undefined);
  assert.deepStrictEqual(barRows([row, rows[0]]), [rows[0]]);
  assert.deepStrictEqual(barRows(undefined), []);
});

it("categoryAxis, valueAxis, and shareAxis follow discrete", () => {
  const viz = pareto();
  assert.deepStrictEqual(
    [categoryAxis(viz), valueAxis(viz), shareAxis(viz)],
    ["x", "y", "y2"],
  );
  viz.discrete("y");
  assert.deepStrictEqual(
    [categoryAxis(viz), valueAxis(viz), shareAxis(viz)],
    ["y", "x", "x2"],
  );
});

it("percentFormat and lineLabel follow the locale", () => {
  const viz = pareto();
  assert.strictEqual(percentFormat(viz)(0.8), "80%");
  assert.strictEqual(lineLabel(viz), "Cumulative Share");
  viz.locale("es-ES");
  assert.strictEqual(lineLabel(viz), "Porcentaje Acumulado");
});

it("Pareto adds one line row per category, in Pareto order", () => {
  const viz = drawn();
  const lines = viz._filteredData.filter(isLineRow);
  assert.strictEqual(viz._filteredData.length, 8);
  assert.deepStrictEqual(
    lines.map(d => [lineStep(d).category, lineStep(d).cumulativeShare]),
    [
      ["Cracks", 0.5],
      ["Scratches", 0.8],
      ["Dents", 0.95],
      ["Smudges", 1],
    ],
  );
  // Adding again keeps one line.
  assert.strictEqual(withLineRows(viz, viz._filteredData).length, 8);
  assert.deepStrictEqual(withLineRows(viz, []), []);
});

it("interceptAxes reads the line's points on the share axis and keeps the user's accessors", () => {
  const viz = drawn();
  const line = viz._filteredData.find(isLineRow);
  assert.strictEqual(viz._x(line, 0), "Cracks");
  assert.strictEqual(viz._y(line, 0), undefined);
  assert.strictEqual(viz._y2(line, 0), 0.5);
  assert.strictEqual(viz._x2(line, 0), undefined);
  assert.strictEqual(viz._y(rows[0], 0), 30);
  assert.strictEqual(fieldNameOf(viz._y), "count", "keeps the field name");
  viz.y(d => d.count * 2);
  assert.strictEqual(
    viz._y(rows[0], 0),
    60,
    "y() replaces the user's accessor",
  );
  assert.strictEqual(paretoState(viz).accessors.y(rows[0], 0), 60);
  // Re-installing over the chart's accessors keeps the user's.
  interceptAxes(viz);
  assert.strictEqual(viz._y(rows[0], 0), 60);
  assert.strictEqual(viz._x(rows[0], 0), "Scratches");
  viz.discrete("y");
  assert.strictEqual(viz._x2(line, 0), 0.5, "horizontal bars read x2");
  assert.strictEqual(viz._y2(line, 0), undefined);
});

it("categoryOf and valueOf: a threshold bucket is its own category", () => {
  const viz = drawn();
  const bucket = {_isAggregation: true, _threshold: 0.1, cause: ["A", "B"]};
  assert.strictEqual(categoryOf(viz, bucket, 0), "Values < 10%");
  assert.strictEqual(categoryOf(viz, rows[1], 1), "Cracks");
  assert.strictEqual(valueOf(viz, {__d3plus__: true, data: rows[1]}, 1), 50);
});

it("wrapGroupBy and wrapDrawLabel name the line's rows after it", () => {
  const viz = drawn();
  const line = viz._filteredData.find(isLineRow);
  assert.strictEqual(viz._id(line, 0), "Cumulative Share");
  assert.strictEqual(viz._drawLabel(line, 0), "Cumulative Share");
  assert.strictEqual(viz._drawLabel(rows[0], 0), "Scratches");
  const groupBy = viz.schema.groupBy;
  wrapGroupBy(viz);
  assert.strictEqual(viz.schema.groupBy[0], groupBy[0], "wraps only once");
  assert.strictEqual(fieldNameOf(groupBy[0]), "cause");
  const base = viz._drawLabel;
  wrapDrawLabel(viz);
  assert.notStrictEqual(viz._drawLabel, base);
  assert.strictEqual(viz._drawLabel(line, 0), "Cumulative Share");
});

it("stepsFor caches per array; stepOf finds a bar's or a point's step", () => {
  const viz = drawn();
  const data = viz._filteredData;
  assert.strictEqual(stepsFor(viz, data), stepsFor(viz, data));
  assert.strictEqual(stepOf(viz, rows[0]).cumulativeShare, 0.8);
  const line = data.find(isLineRow);
  assert.strictEqual(stepOf(viz, line), lineStep(line));
  assert.strictEqual(stepOf(viz, {cause: "Nope"}), undefined);
  assert.strictEqual(stepOf(viz, undefined), undefined);
});

it("syncSort installs the Pareto order, yields to a user sort, and follows discrete", () => {
  const viz = drawn();
  const state = paretoState(viz);
  assert.strictEqual(viz.schema.xSort, state.sort.compare);
  const bars = barRows(viz._filteredData);
  assert.deepStrictEqual(bars.slice().sort(viz.schema.xSort).map(category), [
    "Cracks",
    "Scratches",
    "Dents",
    "Smudges",
  ]);
  viz.discrete("y").y("cause").x("count");
  syncSort(viz, state);
  assert.strictEqual(viz.schema.xSort, undefined, "the old axis is cleared");
  assert.deepStrictEqual(
    bars.slice().sort(viz.schema.ySort).map(category),
    ["Smudges", "Dents", "Scratches", "Cracks"],
    "a vertical category axis lists its first category at the bottom",
  );
  const mine = (a, b) => a.cause.localeCompare(b.cause);
  viz.ySort(mine);
  syncSort(viz, state);
  assert.strictEqual(viz.schema.ySort, mine);
  assert.strictEqual(state.sort, undefined);
  viz._preDraw();
  assert.deepStrictEqual(
    stepsFor(viz, viz._filteredData).map(s => s.category),
    ["Cracks", "Dents", "Scratches", "Smudges"],
    "the line accumulates in the user's order",
  );
});

it("paretoThreshold folds small categories into one bucket", () => {
  const viz = pareto().threshold(0.2);
  viz._preDraw();
  const bucket = viz._filteredData.find(d => d._isAggregation);
  assert.ok(bucket, "Dents and Smudges fold together");
  assert.strictEqual(viz._filteredData.length, 3);
  assert.strictEqual(bucket.count, 20);
  assert.strictEqual(categoryOf(viz, bucket, 0), "Values < 20%");
  const steps = stepsFor(viz, viz._filteredData);
  assert.strictEqual(steps[steps.length - 1].other, true, "drawn last");
  const off = pareto();
  off._preDraw();
  assert.strictEqual(paretoThreshold(off, rows), rows, "off by default");
});

it("valueFormat and valueName read the value axis", () => {
  const viz = drawn();
  assert.strictEqual(valueFormat(viz)(1500), "1.5k");
  assert.strictEqual(valueName(viz), "count");
  viz.yConfig({tickFormat: d => `$${d}`});
  assert.strictEqual(valueFormat(viz)(5), "$5");
  viz.y(d => d.count);
  assert.strictEqual(valueName(viz), "Value");
});

it("tooltipRows and tooltipTitle: the value, its share, and the running share", () => {
  const viz = drawn();
  assert.deepStrictEqual(tooltipRows(viz, rows[0], 0), [
    ["count", "30"],
    ["Share", "30%"],
    ["Cumulative Share", "80%"],
  ]);
  const line = viz._filteredData.find(isLineRow);
  assert.deepStrictEqual(tooltipRows(viz, line, 0), [
    ["count", "50"],
    ["Share", "50%"],
    ["Cumulative Share", "50%"],
  ]);
  assert.strictEqual(tooltipTitle(viz, line, 0), "Cracks");
  assert.strictEqual(tooltipTitle(viz, rows[0], 0), "Scratches");
  assert.deepStrictEqual(tooltipRows(viz, {cause: "Nope"}, 0), []);
});

it("thresholdLines: a dashed, labeled line on the share axis, movable and hideable", () => {
  const viz = drawn();
  assert.deepStrictEqual(thresholdLines(viz), [
    {dash: true, label: "80%", labelPosition: "end", y2: 0.8},
  ]);
  assert.deepStrictEqual(viz._plotReferenceLines(), thresholdLines(viz));
  viz
    .paretoThreshold(0.7)
    .paretoThresholdConfig({label: "Target", stroke: "red", y2: 0.1});
  assert.deepStrictEqual(thresholdLines(viz), [
    {
      dash: true,
      label: "Target",
      labelPosition: "end",
      stroke: "red",
      y2: 0.7,
    },
  ]);
  viz.discrete("y");
  assert.strictEqual(thresholdLines(viz)[0].x2, 0.7);
  assert.strictEqual(
    thresholdLines(viz)[0].labelPosition,
    "start",
    "the label sits at the bottom, over the smallest horizontal bars",
  );
  viz.paretoThresholdConfig({labelPosition: "end"});
  assert.strictEqual(thresholdLines(viz)[0].labelPosition, "end");
  viz.paretoThreshold(false);
  assert.deepStrictEqual(thresholdLines(viz), []);
  viz.paretoThreshold(0.8);
  viz._filteredData = [];
  assert.deepStrictEqual(thresholdLines(viz), [], "nothing drawn, no line");
});

it("titleShareAxis titles the share axis unless the user has", () => {
  const viz = drawn();
  assert.strictEqual(viz._y2Config.title, "Cumulative Share");
  viz.discrete("y");
  titleShareAxis(viz);
  assert.strictEqual(viz._x2Config.title, "Cumulative Share");
  assert.strictEqual(viz._y2Config.title, undefined, "taken back from y2");
  viz.x2Config({title: "Mine"});
  titleShareAxis(viz);
  assert.strictEqual(viz._x2Config.title, "Mine");
});

it("Pareto's share axes run 0–100% with percentage ticks, and markers in ink", () => {
  const viz = pareto();
  assert.deepStrictEqual(viz.y2Domain(), [0, 1]);
  assert.deepStrictEqual(viz.x2Domain(), [0, 1]);
  assert.strictEqual(viz._y2Config.tickFormat(0.25), "25%");
  assert.strictEqual(viz._x2Config.gridSize, 0);
  assert.strictEqual(viz._lineMarkers, true);
  assert.strictEqual(viz.schema.shape(lineRow({}), 0), "Line");
  assert.strictEqual(viz.schema.shape(rows[0], 0), "Bar");
  assert.strictEqual(viz.paretoThreshold(), 0.8);
  assert.strictEqual(viz.schema.facet, undefined);
  assert.strictEqual(paretoDef.facet.scales, "independent");
});

it("Pareto's legend reads only the bars, as BarChart's does", () => {
  const viz = drawn();
  viz._legendDepth = 0;
  const legend = viz.schema.legend;
  assert.strictEqual(
    legend(viz, viz._legendData),
    false,
    "a legend that only repeats the bars is hidden",
  );
  assert.strictEqual(viz._filteredData.length, 8, "the rows are put back");
});

it("syncPooledOrder shares one order across panels only when they share scales", () => {
  const panels = [
    {plant: "N", cause: "A", count: 10},
    {plant: "N", cause: "B", count: 40},
    {plant: "S", cause: "A", count: 50},
    {plant: "S", cause: "B", count: 5},
  ];
  const viz = pareto(panels).facet("plant");
  viz._preDraw();
  const state = paretoState(viz);
  syncPooledOrder(viz, state, panels);
  assert.strictEqual(state.pooled, undefined, "independent panels by default");
  viz.facetConfig({scales: "shared"});
  syncPooledOrder(viz, state, panels);
  assert.deepStrictEqual(
    state.pooled.map(s => [s.category, s.value]),
    [
      ["A", 60],
      ["B", 45],
    ],
  );
  const north = stepsFor(viz, panels.slice(0, 2));
  assert.deepStrictEqual(
    north.map(s => [s.category, s.cumulative]),
    [
      ["A", 10],
      ["B", 50],
    ],
    "a panel accumulates in the shared order",
  );
  assert.deepStrictEqual(
    panels.slice(0, 2).sort(viz.schema.xSort).map(category),
    ["A", "B"],
    "and its axis follows it",
  );
  syncPooledOrder(viz, state, undefined);
  assert.strictEqual(state.pooled, undefined);
  viz.facet(false);
  syncPooledOrder(viz, state, panels);
  assert.strictEqual(state.pooled, undefined, "no facet, no shared order");
});

it("barColor is the first color of the chart's palette", () => {
  const viz = pareto();
  assert.strictEqual(barColor(viz), "#4c6ef5");
  viz.colorDefaults({scale: d3ScaleOf(["#123456", "#abcdef"])});
  assert.strictEqual(barColor(viz), "#123456");
});

/** A minimal ordinal scale over `range`. */
function d3ScaleOf(range) {
  const scale = () => range[0];
  scale.range = () => range;
  return scale;
}

it("oneBarPerCategory: within each panel, no category draws two bars", () => {
  const cause = d => d.cause;
  assert.strictEqual(oneBarPerCategory(rows, cause), true);
  assert.strictEqual(oneBarPerCategory([...rows, rows[0]], cause), false);
  const panels = [
    {plant: "N", cause: "A"},
    {plant: "S", cause: "A"},
  ];
  assert.strictEqual(oneBarPerCategory(panels, cause), false);
  assert.strictEqual(
    oneBarPerCategory(panels, cause, d => d.plant),
    true,
    "the same category in two panels",
  );
});

it("sharesOneColor and paretoColor: one color until series split a category or a color is set", () => {
  const viz = drawn();
  assert.strictEqual(viz.schema.color, paretoState(viz).color);
  assert.strictEqual(sharesOneColor(viz), true);
  assert.strictEqual(viz.schema.color(rows[0], 0), "#4c6ef5");
  assert.strictEqual(paretoColor(viz)(rows[1], 1), "#4c6ef5");
  const split = drawn(
    pareto(
      rows.flatMap(d => [
        {...d, shift: "Day"},
        {...d, shift: "Night"},
      ]),
    ).groupBy("shift"),
  );
  assert.strictEqual(sharesOneColor(split), false);
  assert.strictEqual(split.schema.color(split._filteredData[0], 0), "Day");
  viz.color("cause");
  assert.strictEqual(sharesOneColor(viz), false, "a user color wins");
  assert.strictEqual(viz.schema.color(rows[0], 0), "Scratches");
});

it("withLine and keepLineBright: a hover also matches the cumulative line", () => {
  const line = lineRow({});
  const hovered = withLine(d => d.cause === "Dents");
  assert.strictEqual(hovered(rows[2], 2), true);
  assert.strictEqual(hovered(rows[0], 0), false);
  assert.strictEqual(hovered({__d3plus__: true, data: line}, 0), true);
  assert.strictEqual(withLine(false), false);
  assert.strictEqual(withLine(undefined), undefined);
  const viz = drawn();
  viz._sceneRenderer = undefined;
  viz.hover(d => d.cause === "Dents");
  assert.strictEqual(
    viz.hover()(lineRow({key: ["A", "B"]}), 0),
    true,
    "keepLineBright is installed",
  );
  const calls = [];
  const fake = {hover: (...args) => (calls.push(args), "base")};
  keepLineBright(fake);
  assert.strictEqual(fake.hover(), "base", "a read passes through");
  fake.hover(false);
  assert.deepStrictEqual(calls, [[], [false]]);
});

it("isLinePath and hoveredCategories tell the line's path and hovered points apart", () => {
  assert.strictEqual(isLinePath(lineRow({key: ["A", "B"]})), true);
  assert.strictEqual(
    isLinePath({__d3plus__: true, data: lineRow({key: ["A"]})}),
    true,
  );
  assert.strictEqual(isLinePath(lineRow({key: "A"})), false);
  assert.strictEqual(isLinePath(rows[0]), false);
  const viz = drawn();
  assert.deepStrictEqual(
    [...hoveredCategories(viz, d => d.count > 20)],
    ["Scratches", "Cracks"],
  );
  assert.deepStrictEqual([...hoveredCategories(viz, () => false)], []);
});

it("keepLineBright keeps only the hovered categories' points bright", () => {
  const viz = drawn();
  viz._sceneRenderer = undefined;
  viz.hover(d => (d.data || d).cause === "Dents");
  const steps = stepsFor(viz, viz._filteredData);
  const point = cause => lineRow(steps.find(s => s.category === cause));
  const path = lineRow({...steps[0], key: steps.map(s => s.key)});
  const hover = viz.hover();
  assert.strictEqual(hover(path, 0), true, "the line");
  assert.strictEqual(hover(point("Dents"), 0), true, "the hovered point");
  assert.strictEqual(hover(point("Cracks"), 0), false, "not the others");
  assert.strictEqual(hover(rows[2], 2), true, "the hovered bar");
  assert.strictEqual(hover(rows[0], 0), false);
});
