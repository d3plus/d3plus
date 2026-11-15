import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {BarChart, LinePlot} from "../../index.ts";
import {
  LEVEL_JOIN,
  axisAccessorInput,
  isLevelAccessor,
  levelAccessor,
  levelAggs,
  levelAxisConfig,
  levelAxisName,
  levelAxisValue,
  levelDomain,
  orderAxisLevels,
  orderLevelCategories,
  plotLevels,
  sharedValue,
} from "../../src/charts/Plot/plotLevels.ts";
import {plotAxisConfig} from "../../src/charts/Plot/baselineBreak.ts";
import {userAxisDomain} from "../../src/charts/Plot/baselineDomain.ts";
import {discreteDomainCategories} from "../../src/charts/Plot/discreteDomain.ts";
import {axisName, axisValue} from "../../src/charts/Plot/sharedTooltip.ts";

useJsdom();

/**
    Multi-level category axes in a Plot (`x: ["year", "quarter"]`): each
    row's category joins its level values, the axis groups them, and
    tooltips name every level.
*/

const rows = [
  {year: 2021, quarter: "Q1", value: 3},
  {year: 2020, quarter: "Q2", value: 2},
  {year: 2020, quarter: "Q1", value: 1},
];

it("levelAccessor joins a row's levels into one category it reads back", () => {
  const category = levelAccessor(["year", d => d.quarter]);
  const a = category(rows[0], 0);
  const b = category(rows[2], 2);
  assert.strictEqual(typeof a, "string");
  assert.notStrictEqual(a, b);
  // The same quarter in another year is another category.
  assert.notStrictEqual(
    category(rows[1], 1),
    category({...rows[1], year: 2021}, 0),
  );
  // Values keep their types.
  assert.deepStrictEqual(category.values(a), [2021, "Q1"]);
  assert.deepStrictEqual(category.keys, ["year", undefined]);
  // A category it hasn't seen reads back as text.
  const other = levelAccessor(["a", "b"]);
  assert.deepStrictEqual(other.values(a), ["2021", "Q1"]);
});

it("isLevelAccessor tells a level accessor from any other value", () => {
  assert.strictEqual(isLevelAccessor(levelAccessor(["a", "b"])), true);
  assert.strictEqual(
    isLevelAccessor(d => d.a),
    false,
  );
  assert.strictEqual(isLevelAccessor("a"), false);
  assert.strictEqual(isLevelAccessor(undefined), false);
});

it("axisAccessorInput reads two or more levels as a level accessor", () => {
  assert.ok(isLevelAccessor(axisAccessorInput(["a", "b"])));
  assert.strictEqual(axisAccessorInput(["a"]), "a");
  assert.strictEqual(axisAccessorInput("a"), "a");
  const fn = d => d.a;
  assert.strictEqual(axisAccessorInput(fn), fn);
});

it("plotLevels reads a Plot axis's level accessor", () => {
  const viz = new BarChart().x(["year", "quarter"]).y("value");
  assert.ok(plotLevels(viz, "x"));
  assert.strictEqual(plotLevels(viz, "y"), undefined);
  assert.strictEqual(plotLevels(viz, "x2"), undefined);
  // A single key draws a plain axis again.
  viz.x("year");
  assert.strictEqual(plotLevels(viz, "x"), undefined);
  assert.strictEqual(viz._xKey, "year");
});

it("the x setter names no single key for a multi-level axis", () => {
  const viz = new BarChart().x("year").x(["year", "quarter"]);
  assert.strictEqual(viz._xKey, undefined);
  assert.strictEqual(typeof viz.x(), "function");
  viz.y(["region", "country"]);
  assert.strictEqual(viz._yKey, undefined);
});

it("sharedValue keeps a value the rows share, else each distinct one", () => {
  assert.strictEqual(
    sharedValue([{a: 1}, {a: 1}], d => d.a),
    1,
  );
  assert.deepStrictEqual(
    sharedValue([{a: 1}, {a: 2}, {a: 1}], d => d.a),
    [1, 2],
  );
});

it("levelAggs keeps numeric levels from being summed, unless aggs says how", () => {
  const custom = () => "custom";
  const viz = new BarChart()
    .x(["year", d => d.quarter])
    .y(["region", "country"])
    .aggs({country: custom});
  levelAggs(viz);
  assert.strictEqual(viz.schema.aggs.year, sharedValue);
  assert.strictEqual(viz.schema.aggs.country, custom);
  assert.strictEqual(viz.schema.aggs.region, sharedValue);
  const plain = new BarChart().x("year");
  levelAggs(plain);
  assert.strictEqual(plain.schema.aggs.year, undefined);
});

it("orderLevelCategories keeps each group's categories together", () => {
  const values = c => c.split("|");
  // Groups keep their first category's order.
  assert.deepStrictEqual(
    orderLevelCategories(["b|1", "a|1", "b|2", "a|2"], values, false),
    ["b|1", "b|2", "a|1", "a|2"],
  );
  // Numeric levels sort with `sort`, others keep their order.
  const typed = new Map([
    ["x", [2021, "Q2"]],
    ["y", [2020, "Q2"]],
    ["z", [2020, "Q1"]],
    ["w", [2021, "Q1"]],
  ]);
  assert.deepStrictEqual(
    orderLevelCategories(["x", "y", "z", "w"], c => typed.get(c), true),
    ["y", "z", "x", "w"],
  );
  assert.deepStrictEqual(
    orderLevelCategories(["x", "y", "z", "w"], c => typed.get(c), false),
    ["x", "w", "y", "z"],
  );
  const dates = new Map([
    ["late", [new Date(2021, 0, 1), "a"]],
    ["early", [new Date(2020, 0, 1), "a"]],
  ]);
  assert.deepStrictEqual(
    orderLevelCategories(["late", "early"], c => dates.get(c), true),
    ["early", "late"],
  );
  assert.deepStrictEqual(orderLevelCategories([], values, true), []);
});

it("orderAxisLevels orders a multi-level axis, sorting unless the axis has its own sort", () => {
  const viz = new BarChart().x(["year", "quarter"]);
  const keys = rows.map((d, i) => viz._x(d, i));
  assert.deepStrictEqual(
    orderAxisLevels(viz, "x", keys).map(k => viz._x.values(k)),
    [
      [2020, "Q2"],
      [2020, "Q1"],
      [2021, "Q1"],
    ],
  );
  viz.xSort((a, b) => b.value - a.value);
  assert.deepStrictEqual(
    orderAxisLevels(viz, "x", keys).map(k => viz._x.values(k)),
    [
      [2021, "Q1"],
      [2020, "Q2"],
      [2020, "Q1"],
    ],
  );
  assert.deepStrictEqual(orderAxisLevels(viz, "y", [3, 1]), [3, 1]);
});

it("levelAxisConfig hands a multi-level axis its levels, and clears them otherwise", () => {
  const viz = new BarChart().x(["year", "quarter"]);
  const {levels} = levelAxisConfig(viz, "x");
  assert.deepStrictEqual(levels(viz._x(rows[0], 0)), [2021, "Q1"]);
  assert.deepStrictEqual(levelAxisConfig(viz, "y"), {levels: false});
  // Plot's axis config always carries the setting.
  assert.strictEqual(typeof plotAxisConfig(viz, "x").levels, "function");
  assert.strictEqual(plotAxisConfig(viz, "y").levels, false);
});

it("levelAxisValue names every level, or the innermost one for a tick", () => {
  const viz = new BarChart().x(["year", "quarter"]);
  const key = viz._x(rows[0], 0);
  assert.strictEqual(levelAxisValue(viz, "x", key), `2021${LEVEL_JOIN}Q1`);
  assert.strictEqual(levelAxisValue(viz, "x", key, true), "Q1");
  viz.xConfig({tickFormat: d => `Quarter ${d.slice(1)}`});
  assert.strictEqual(levelAxisValue(viz, "x", key, true), "Quarter 1");
  assert.strictEqual(
    levelAxisValue(viz, "x", key),
    `2021${LEVEL_JOIN}Quarter 1`,
  );
  assert.strictEqual(levelAxisValue(viz, "y", 3), undefined);
  // An empty outer level is left out.
  const blank = viz._x({quarter: "Q3"}, 0);
  viz.xConfig({tickFormat: undefined});
  assert.strictEqual(levelAxisValue(viz, "x", blank), "Q3");
});

it("levelAxisName joins the levels' data keys", () => {
  const viz = new LinePlot().x(["year", d => d.month, "day"]);
  assert.strictEqual(levelAxisName(viz, "x"), `year${LEVEL_JOIN}day`);
  assert.strictEqual(levelAxisName(viz, "y"), undefined);
});

it("tooltips read a multi-level axis's name and values", () => {
  const viz = new BarChart().x(["year", "quarter"]);
  const key = viz._x(rows[0], 0);
  assert.strictEqual(axisName(viz, "x"), `year${LEVEL_JOIN}quarter`);
  assert.strictEqual(axisValue(viz, "x", key), `2021${LEVEL_JOIN}Q1`);
  assert.strictEqual(axisValue(viz, "x", key, true), "Q1");
  viz.xConfig({title: "Period"});
  assert.strictEqual(axisName(viz, "x"), "Period");
});

it("a level accessor's key names the category of a list of level values", () => {
  const category = levelAccessor(["year", "quarter"]);
  const key = category.key([2023, "Q1"]);
  assert.strictEqual(key, category({year: 2023, quarter: "Q1"}, 0));
  assert.deepStrictEqual(category.values(key), [2023, "Q1"]);
});

it("sharedValue reads Dates at the same time as one value", () => {
  const a = new Date(2020, 0, 1);
  const b = new Date(2020, 0, 1);
  assert.strictEqual(
    sharedValue([{d: a}, {d: b}], r => r.d),
    a,
  );
  assert.strictEqual(
    sharedValue([{d: a}, {d: new Date(2021, 0, 1)}], r => r.d).length,
    2,
  );
});

it("levelDomain reads lists of level values as categories", () => {
  const viz = new BarChart().x(["year", "quarter"]);
  const domain = levelDomain(viz, "x", [
    [2023, "Q1"],
    [2023, "Q2"],
  ]);
  assert.deepStrictEqual(domain, [
    viz._x({year: 2023, quarter: "Q1"}, 0),
    viz._x({year: 2023, quarter: "Q2"}, 0),
  ]);
  // A category already joined, and an axis of one level, stay as given.
  assert.deepStrictEqual(levelDomain(viz, "x", [domain[0]]), [domain[0]]);
  assert.deepStrictEqual(levelDomain(viz, "y", [[1, 2]]), [[1, 2]]);
});

it("xDomain and xConfig.domain take lists of level values", () => {
  const viz = new BarChart().x(["year", "quarter"]).xDomain([
    [2023, "Q1"],
    [2024, "Q1"],
  ]);
  const q1 = viz._x({year: 2023, quarter: "Q1"}, 0);
  const next = viz._x({year: 2024, quarter: "Q1"}, 0);
  assert.deepStrictEqual(userAxisDomain(viz, "x", undefined), [q1, next]);
  const categories = discreteDomainCategories(viz);
  assert.ok(categories.has(q1) && categories.has(next));
  assert.strictEqual(categories.size, 2);
  viz.xConfig({domain: [[2024, "Q1"]]});
  assert.deepStrictEqual(plotAxisConfig(viz, "x").domain, [next]);
  assert.deepStrictEqual([...discreteDomainCategories(viz)], [next]);
});

it("levelAxisValue writes outer levels with the axis's levelFormat", () => {
  const viz = new BarChart()
    .x(["year", "quarter"])
    .xConfig({levelFormat: (value, level) => `FY${value}/${level}`});
  const key = viz._x(rows[0], 0);
  assert.strictEqual(levelAxisValue(viz, "x", key), `FY2021/0${LEVEL_JOIN}Q1`);
  assert.strictEqual(levelAxisValue(viz, "x", key, true), "Q1");
});
