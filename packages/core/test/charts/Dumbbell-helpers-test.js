import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {Dumbbell} from "../../index.ts";
import {connectorStroke, dumbbellDef} from "../../internal.ts";
import {CONNECTOR_KEY_SUFFIX, dumbbellEmit, dumbbellSpans} from "../../src/charts/Dumbbell/emit.ts";
import {categoryGaps, gapComparator, syncGapSort} from "../../src/charts/Dumbbell/gapSort.ts";

useJsdom();

const rows = [
  {c: "A", s: "2010", v: 10},
  {c: "A", s: "2020", v: 14},
  {c: "B", s: "2010", v: 30},
  {c: "B", s: "2020", v: 20},
  {c: "C", s: "2010", v: 5},
  {c: "C", s: "2020", v: null},
];
const category = d => d.c;
const value = d => d.v;

it("categoryGaps — each category's largest value minus its smallest", () => {
  const gaps = categoryGaps(rows, category, value);
  assert.deepStrictEqual([...gaps], [["A", 4], ["B", 10], ["C", 0]], "a lone value has no gap");
  const three = categoryGaps([{c: "A", v: 3}, {c: "A", v: 9}, {c: "A", v: 1}], category, value);
  assert.strictEqual(three.get("A"), 8, "spans every point");
  assert.strictEqual(categoryGaps([{c: "Z", v: "x"}], category, value).get("Z"), 0, "non-numeric values");
  assert.deepStrictEqual([...categoryGaps([], category, value)], []);
  const keyed = categoryGaps([{c: 1, v: 1}, {c: 1, v: 4}], category, value);
  assert.strictEqual(keyed.get("1"), 3, "categories are keyed as strings");
});

it("gapComparator — orders rows by their category's gap", () => {
  const gaps = () => new Map([["A", 4], ["B", 10], ["C", 0]]);
  const list = [{c: "A"}, {c: "B"}, {c: "C"}, {c: "D"}];
  const sorted = order => list.slice().sort(gapComparator(gaps, order, category)).map(category);
  assert.deepStrictEqual(sorted("ascending"), ["C", "D", "A", "B"], "a category without a gap counts as 0, ties keep order");
  assert.deepStrictEqual(sorted("descending"), ["B", "A", "C", "D"]);
});

it("syncGapSort — installs a comparator on the category axis, and removes it", () => {
  const viz = new Dumbbell().data(rows).groupBy("s").x("v").y("c");
  viz._filteredData = rows;
  const state = {};
  syncGapSort(viz, state);
  assert.strictEqual(viz.schema.ySort, undefined, "off by default");

  viz.gapSort("descending");
  syncGapSort(viz, state);
  assert.strictEqual(typeof viz.schema.ySort, "function");
  assert.strictEqual(state.axis, "y");
  const order = ["A", "B", "C"].map(c => ({c})).sort(viz.schema.ySort).map(category);
  assert.deepStrictEqual(order, ["C", "A", "B"], "a vertical axis lists its first category at the bottom, so the widest gap lands on top");

  viz.gapSort("ascending");
  syncGapSort(viz, state);
  assert.deepStrictEqual(["A", "B", "C"].map(c => ({c})).sort(viz.schema.ySort).map(category), ["B", "A", "C"]);

  viz.gapSort(false);
  syncGapSort(viz, state);
  assert.strictEqual(viz.schema.ySort, undefined, "turning it off removes the comparator");
});

it("syncGapSort — a horizontal category axis reads widest-first from the left", () => {
  const viz = new Dumbbell().data(rows).groupBy("s").discrete("x").x("c").y("v").gapSort("descending");
  viz._filteredData = rows;
  const state = {};
  syncGapSort(viz, state);
  assert.strictEqual(state.axis, "x");
  assert.deepStrictEqual(["A", "B", "C"].map(c => ({c})).sort(viz.schema.xSort).map(category), ["B", "A", "C"]);
});

it("syncGapSort — a user's own category sort wins", () => {
  const mine = () => 0;
  const viz = new Dumbbell().data(rows).groupBy("s").x("v").y("c").ySort(mine).gapSort("descending");
  viz._filteredData = rows;
  const state = {};
  syncGapSort(viz, state);
  assert.strictEqual(viz.schema.ySort, mine);
  viz.gapSort(false);
  syncGapSort(viz, state);
  assert.strictEqual(viz.schema.ySort, mine, "and is never removed");
});

it("syncGapSort — gaps follow the rows being drawn", () => {
  const viz = new Dumbbell().data(rows).groupBy("s").x("v").y("c").gapSort("descending");
  viz._filteredData = rows;
  syncGapSort(viz, {});
  const before = ["A", "B"].map(c => ({c})).sort(viz.schema.ySort).map(category);
  viz._filteredData = [{c: "A", v: 0}, {c: "A", v: 50}, {c: "B", v: 1}, {c: "B", v: 2}];
  const after = ["A", "B"].map(c => ({c})).sort(viz.schema.ySort).map(category);
  assert.deepStrictEqual(before, ["A", "B"]);
  assert.deepStrictEqual(after, ["B", "A"]);
});

it("dumbbellSpans — each category's lowest and highest row", () => {
  const plotted = [
    {id: "2010", y: "A", x: 10},
    {id: "2020", y: "A", x: 14},
    {id: "2030", y: "A", x: 12},
    {id: "2010", y: "B", x: 30},
    {id: "2020", y: "B", x: 20},
    {id: "2010", y: "C", x: 5},
    {id: "2020", y: "C", x: NaN},
    {id: "2010", y: "D", x: 7},
    {id: "2020", y: "D", x: 7},
  ];
  const spans = dumbbellSpans(plotted, "y");
  assert.deepStrictEqual(spans.map(s => [s.category, s.lo.x, s.hi.x]), [["A", 10, 14], ["B", 20, 30]], "no span for a lone or flat category");
  assert.strictEqual(spans[1].lo, plotted[4], "the rows themselves");
  const vertical = dumbbellSpans([{x: "Q1", y: 1}, {x: "Q1", y: 3}], "x");
  assert.deepStrictEqual(vertical.map(s => [s.category, s.lo.y, s.hi.y]), [["Q1", 1, 3]]);
  assert.deepStrictEqual(dumbbellSpans([], "y"), []);
});

it("connectorStroke — a quiet gray for the page's background", () => {
  const viz = new Dumbbell();
  assert.strictEqual(connectorStroke(viz), "#adb5bd", "on a light page");
  const dark = new Dumbbell();
  dark._select = {node: () => {
    const el = document.createElement("div");
    el.style.backgroundColor = "rgb(20, 20, 20)";
    document.body.appendChild(el);
    return el;
  }};
  assert.strictEqual(connectorStroke(dark), "#495057", "on a dark page");
});

it("Dumbbell — horizontal by default, drawing its Circle rows with dumbbellEmit", () => {
  const viz = new Dumbbell();
  assert.strictEqual(viz._plotShapeEmitters.Circle, dumbbellEmit);
  assert.strictEqual(viz.discrete(), "y");
  assert.strictEqual(viz.gapSort(), false);
  assert.strictEqual(viz.shape()({}, 0), "Circle");
  const {Circle, Line} = viz.shapeConfig();
  assert.strictEqual(Circle.label, false);
  assert.strictEqual(Line.strokeWidth, 3);
  assert.strictEqual(Line.stroke(), "#adb5bd");
  assert.strictEqual(dumbbellDef.name, "Dumbbell");
  assert.strictEqual(CONNECTOR_KEY_SUFFIX, "::connector");
  assert.strictEqual(new Dumbbell().config({gapSort: "ascending"}).gapSort(), "ascending", "settable through config");
});
