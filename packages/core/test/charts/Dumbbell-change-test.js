import {it} from "vitest";
import assert from "assert";
import {colorDefaults} from "@d3plus/color";
import {useJsdom} from "~test/jsdom.js";
import {Dumbbell} from "../../index.ts";
import {
  BAR_MAX_THICKNESS,
  barThickness,
  changeText,
  directionColor,
  dumbbellChanges,
  dumbbellConnector,
  dumbbellDirection,
} from "../../src/charts/Dumbbell/changes.ts";
import {
  arrowSegment,
  barColors,
  pointGeometry,
} from "../../src/charts/Dumbbell/changeEmit.ts";
import {hiddenPoint} from "../../src/charts/Dumbbell/emit.ts";
import {
  barColor,
  categoryValues,
  changeRow,
  lineColor,
  rowDirection,
} from "../../src/charts/Dumbbell/categoryChange.ts";

useJsdom();

/** Plot rows: category `y`, value `x`, data index `i`. */
const plotRows = [
  {y: "A", x: 10, i: 0},
  {y: "B", x: 30, i: 1},
  {y: "A", x: 14, i: 2},
  {y: "B", x: 20, i: 3},
  {y: "C", x: 5, i: 4},
  {y: "C", x: null, i: 5},
  {y: "D", x: 8, i: 6},
  {y: "D", x: 8, i: 7},
];

const rows = [
  {c: "A", s: "2010", v: 10},
  {c: "A", s: "2020", v: 14},
  {c: "B", s: "2010", v: 30},
  {c: "B", s: "2020", v: 20},
  {c: "C", s: "2010", v: 5},
  {c: "D", s: "2010", v: 8},
  {c: "D", s: "2020", v: 8},
];

/** A horizontal Dumbbell over `rows`, as if drawn. */
const chart = config => {
  const viz = new Dumbbell()
    .data(rows)
    .groupBy("s")
    .x("v")
    .y("c")
    .config(config || {});
  viz._filteredData = rows;
  return viz;
};

it("dumbbellChanges — each category's first and last numeric row, in data order", () => {
  const changes = dumbbellChanges(plotRows, "y");
  assert.deepStrictEqual(
    changes.map(c => [c.category, c.from.x, c.to.x]),
    [
      ["A", 10, 14],
      ["B", 30, 20],
      ["D", 8, 8],
    ],
  );
  // Read by index, not array position.
  const shuffled = [plotRows[2], plotRows[0]];
  const [a] = dumbbellChanges(shuffled, "y");
  assert.deepStrictEqual([a.from.i, a.to.i], [0, 2]);
});

it("dumbbellDirection — compares the last value with the first", () => {
  const [a, b, d] = dumbbellChanges(plotRows, "y");
  assert.strictEqual(dumbbellDirection(a, "x"), "increase");
  assert.strictEqual(dumbbellDirection(b, "x"), "decrease");
  assert.strictEqual(dumbbellDirection(d, "x"), "none");
});

it("directionColor — the chart's own colors, else the color defaults", () => {
  assert.strictEqual(directionColor("increase", {}, "gray"), colorDefaults.on);
  assert.strictEqual(directionColor("decrease", {}, "gray"), colorDefaults.off);
  assert.strictEqual(directionColor("none", {}, "gray"), "gray");
  const own = {increaseColor: "orange", decreaseColor: "blue"};
  assert.strictEqual(directionColor("increase", own, "gray"), "orange");
  assert.strictEqual(directionColor("decrease", own, "gray"), "blue");
  assert.strictEqual(
    directionColor("increase", {}, "gray", {on: "lime"}),
    "lime",
    "a theme's defaults",
  );
});

it("changeText — signs an increase", () => {
  const format = n => n.toFixed(1);
  assert.strictEqual(changeText(2.25, format), "+2.3");
  assert.strictEqual(changeText(-1.5, format), "-1.5");
  assert.strictEqual(changeText(0, format), "0.0");
  assert.strictEqual(changeText(NaN, format), "");
});

it("dumbbellConnector — coerces to line or bar", () => {
  assert.strictEqual(dumbbellConnector("bar"), "bar");
  assert.strictEqual(dumbbellConnector("line"), "line");
  assert.strictEqual(dumbbellConnector(undefined), "line");
  assert.strictEqual(dumbbellConnector(true), "line");
});

it("barThickness — 60% of the smallest step, capped, or connectorWidth", () => {
  assert.strictEqual(barThickness([0, 20, 50], 300), 12);
  assert.strictEqual(barThickness([0, 200], 300), BAR_MAX_THICKNESS);
  assert.strictEqual(
    barThickness([100], 50),
    30,
    "a lone category reads the axis",
  );
  assert.strictEqual(barThickness([0, 20], 300, 8), 8);
  assert.strictEqual(barThickness([0, 20], 300, 0), 12, "0 is unset");
  assert.strictEqual(barThickness([0, 0.5], 300), 1, "at least a pixel");
});

it("pointGeometry — each circle's center and radius, by its row", () => {
  const datum = {i: 0};
  const nodes = [
    {type: "circle", datum, transform: {x: 10, y: 20}, cx: 1, cy: 2, r: 5},
    {type: "text", datum},
    {type: "circle", transform: {x: 0, y: 0}, r: 3},
  ];
  const map = pointGeometry(nodes);
  assert.strictEqual(map.size, 1);
  assert.deepStrictEqual(map.get(datum), {x: 11, y: 22, r: 5});
});

it("arrowSegment — the tip a gap off the last point, the line back at the head's base", () => {
  const seg = arrowSegment({x: 0, y: 0, r: 5}, {x: 100, y: 0, r: 5}, 10, 12);
  assert.deepStrictEqual(seg.tip, [94, 0]);
  assert.deepStrictEqual(seg.end, [82, 0]);
  assert.deepStrictEqual(seg.start, [0, 0]);
  assert.strictEqual(seg.angle, 0);
  const up = arrowSegment({x: 0, y: 100, r: 0}, {x: 0, y: 0, r: 0}, 10, 10, 0);
  assert.deepStrictEqual(up.tip, [0, 0]);
  assert.deepStrictEqual(up.end, [0, 10]);
  assert.strictEqual(up.angle, -Math.PI / 2);
  assert.strictEqual(
    arrowSegment({x: 0, y: 0, r: 5}, {x: 18, y: 0, r: 5}, 10, 10),
    null,
    "no room for the head between the points",
  );
  assert.strictEqual(
    arrowSegment({x: 0, y: 0, r: 0}, {x: 0, y: 0, r: 0}, 1, 1),
    null,
  );
});

it("categoryValues — a category's first, last, smallest and largest value", () => {
  const c = d => d.c;
  const v = d => d.v;
  assert.deepStrictEqual(categoryValues(rows, c, v, "B"), {
    first: 30,
    last: 20,
    min: 20,
    max: 30,
  });
  assert.strictEqual(categoryValues(rows, c, v, "C"), null, "one value");
});

it("rowDirection — which way a row's category moves", () => {
  const viz = chart();
  assert.strictEqual(rowDirection(viz, rows[0]), "increase");
  assert.strictEqual(rowDirection(viz, rows[3]), "decrease");
  assert.strictEqual(rowDirection(viz, rows[5]), "none");
  assert.strictEqual(rowDirection(viz, rows[4]), "none", "a lone value");
});

it("lineColor and barColor — gray and sequential, or by direction with arrows", () => {
  const plain = chart();
  assert.strictEqual(lineColor(plain, rows[0], "gray"), "gray");
  assert.strictEqual(barColor(plain, rows[0]), colorDefaults.sequential);
  const arrows = chart({arrows: true, decreaseColor: "navy"});
  assert.strictEqual(lineColor(arrows, rows[0], "gray"), colorDefaults.on);
  assert.strictEqual(lineColor(arrows, rows[2], "gray"), "navy");
  assert.strictEqual(lineColor(arrows, rows[5], "gray"), "gray");
  assert.strictEqual(barColor(arrows, rows[1], "gray"), colorDefaults.on);
  assert.strictEqual(barColor(arrows, rows[5]), colorDefaults.sequential);
});

it("changeRow — the change with arrows, the range with bars, else none", () => {
  assert.strictEqual(changeRow(chart(), rows[0]), null);
  assert.deepStrictEqual(changeRow(chart({arrows: true}), rows[2]), [
    "Change",
    "-10",
  ]);
  assert.deepStrictEqual(changeRow(chart({arrows: true}), null, "A"), [
    "Change",
    "+4",
  ]);
  assert.deepStrictEqual(changeRow(chart({connector: "bar"}), rows[2]), [
    "Range",
    "10",
  ]);
  assert.strictEqual(changeRow(chart({arrows: true}), rows[4]), null);
  const es = chart({arrows: true, locale: "es-ES"});
  assert.strictEqual(changeRow(es, rows[0])[0], "Variaci\u00f3n");
});

it("Dumbbell — exposes arrows and connector options with their defaults", () => {
  const viz = new Dumbbell();
  assert.strictEqual(viz.arrows(), false);
  assert.strictEqual(viz.connector(), "line");
  assert.strictEqual(viz.arrowSize(), undefined);
  assert.strictEqual(viz.connectorWidth(), undefined);
  viz.arrows(true).connector("bar").connectorWidth(12).increaseColor("red");
  assert.deepStrictEqual(
    [viz.arrows(), viz.connector(), viz.connectorWidth(), viz.increaseColor()],
    [true, "bar", 12, "red"],
  );
});

it("barColors — each row's bar fill, by the row", () => {
  const a = {i: 0};
  const b = {i: 1};
  const map = barColors([
    {
      type: "rect",
      paint: {fill: "#123456"},
      interactionPoints: [{datum: {data: a}}, {datum: {data: b}}],
    },
    {
      type: "path",
      paint: {fill: "#ffffff"},
      interactionPoints: [{datum: {data: {}}}],
    },
    {type: "rect", paint: {}, interactionPoints: [{datum: {data: {}}}]},
  ]);
  assert.strictEqual(map.size, 2);
  assert.strictEqual(map.get(a), "#123456");
  assert.strictEqual(map.get(b), "#123456");
});

it("hiddenPoint — unseen, keeping its bar's color for swatches", () => {
  const dot = {
    type: "circle",
    paint: {fill: "red", stroke: "blue", strokeWidth: 1},
  };
  assert.deepStrictEqual(hiddenPoint(dot, "#00ff00").paint, {
    fill: "#00ff00",
    stroke: "#00ff00",
    strokeWidth: 1,
    opacity: 0,
  });
  assert.deepStrictEqual(hiddenPoint(dot).paint, {
    fill: "transparent",
    stroke: "transparent",
    strokeWidth: 1,
  });
  const text = {type: "text"};
  assert.strictEqual(hiddenPoint(text, "#00ff00"), text);
});
