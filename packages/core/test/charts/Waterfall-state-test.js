import assert from "assert";
import it from "../jsdom.js";
import {Waterfall} from "../../es/index.js";
import {waterfallDef} from "../../es/internal.js";
import {
  categoryAxis,
  categoryRanks,
  interceptAxes,
  KIND_KEY,
  kindOf,
  legendKind,
  resetSteps,
  sourceRow,
  stepOf,
  syncCategorySort,
  topDownSort,
  valueAxis,
  valueFormat,
  waterfallState,
} from "../../es/src/charts/Waterfall/state.js";
import {formatPlotData} from "../../es/src/charts/Plot/pipeline.js";

/**
    Waterfall's per-instance state and pre-draw, driven directly without a
    layout pass.
*/

const rows = [
  {item: "Start", amount: 100, sub: true},
  {item: "Sales", amount: 50},
  {item: "Costs", amount: -30},
  {item: "Gross", sub: true},
];
const waterfall = (data = rows) => new Waterfall().data(data).x("item").y("amount").subtotal("sub");

it("Waterfall's def keeps ctx and fields last", () => {
  const keys = Object.keys(waterfallDef);
  assert.deepStrictEqual(keys.slice(-2), ["ctx", "fields"]);
  assert.strictEqual(waterfallDef.name, "Waterfall");
});

it("sourceRow unwraps shape, label, and legend wrappers", () => {
  const row = {a: 1};
  assert.strictEqual(sourceRow({__d3plus__: true, data: {__d3plusShape__: true, data: row}}), row);
  assert.strictEqual(sourceRow(row), row);
  assert.strictEqual(sourceRow(undefined), undefined);
});

it("categoryAxis and valueAxis follow discrete", () => {
  const viz = waterfall();
  assert.strictEqual(categoryAxis(viz), "x");
  assert.strictEqual(valueAxis(viz), "y");
  viz.discrete("y");
  assert.strictEqual(categoryAxis(viz), "y");
  assert.strictEqual(valueAxis(viz), "x");
});

it("Waterfall pre-draw lays out steps and a legend of the kinds drawn", () => {
  const viz = waterfall();
  viz._preDraw();
  const steps = viz._filteredData.map(d => stepOf(viz, d));
  assert.deepStrictEqual(steps.map(s => s.kind), ["total", "increase", "decrease", "total"]);
  assert.deepStrictEqual(steps.map(s => s.end), [100, 150, 120, 120]);
  assert.deepStrictEqual(viz._legendData.map(d => d[KIND_KEY]), ["increase", "decrease", "total"]);
  assert.strictEqual(waterfallState(viz).steps.get(viz._filteredData[1]), steps[1]);
});

it("stepOf and kindOf read through wrappers; legendKind only reads legend entries", () => {
  const viz = waterfall();
  viz._preDraw();
  const row = viz._filteredData[2];
  assert.strictEqual(stepOf(viz, {__d3plus__: true, data: row}).kind, "decrease");
  assert.strictEqual(kindOf(viz, {__d3plus__: true, data: row}), "decrease");
  assert.strictEqual(kindOf(viz, {[KIND_KEY]: "total"}), "total");
  assert.strictEqual(legendKind({__d3plus__: true, data: {[KIND_KEY]: "increase"}}), "increase");
  assert.strictEqual(legendKind(row), undefined);
  assert.strictEqual(stepOf(viz, {other: true}), undefined);
  assert.strictEqual(kindOf(viz, undefined), undefined);
});

it("resetSteps clears the layout so the next read lays out afresh", () => {
  const viz = waterfall();
  viz._preDraw();
  const row = viz._filteredData[1];
  const first = stepOf(viz, row);
  resetSteps(viz);
  assert.notStrictEqual(stepOf(viz, row), first);
  assert.deepStrictEqual(stepOf(viz, row), first);
});

it("interceptAxes reports a subtotal's running total on the value axis only", () => {
  const viz = waterfall();
  viz._preDraw();
  const gross = viz._filteredData[3];
  assert.strictEqual(viz._y(gross, 3), 120);
  assert.strictEqual(viz._x(gross, 3), "Gross", "the category axis reads as given");
  assert.strictEqual(viz._y(viz._filteredData[0], 0), 100, "a subtotal's own value stands");
  viz.y(d => d.amount * 2);
  viz._preDraw();
  assert.strictEqual(viz._y(viz._filteredData[1], 1), 100, "y() replaces the user's accessor");
  assert.strictEqual(viz._y(viz._filteredData[3], 3), 240);
  // Re-installing over existing accessors keeps them working.
  interceptAxes(viz);
  assert.strictEqual(viz._y(viz._filteredData[3], 3), 240);
});

it("Waterfall formats subtotals into plottable Plot rows", () => {
  const viz = waterfall();
  viz._preDraw();
  const {plotFormattedData} = formatPlotData({viz});
  assert.strictEqual(plotFormattedData.length, 4, "a subtotal without a value is still drawn");
  assert.strictEqual(plotFormattedData[3].y, 120);
});

it("valueFormat uses the value axis tickFormat, else abbreviates", () => {
  const viz = waterfall();
  assert.strictEqual(valueFormat(viz)(1500), "1.5k");
  viz.yConfig({tickFormat: d => `$${d}`});
  assert.strictEqual(valueFormat(viz)(12), "$12");
  viz.discrete("y");
  assert.strictEqual(valueFormat(viz)(1500), "1.5k", "horizontal bars read the x axis");
});

it("categoryRanks orders categories by first appearance, numbers ascending", () => {
  const text = categoryRanks([{c: "b"}, {c: "a"}, {c: "b"}], d => d.c);
  assert.deepStrictEqual(Array.from(text.entries()), [["b", 0], ["a", 1]]);
  const years = categoryRanks([{c: 2021}, {c: 2019}], d => d.c);
  assert.deepStrictEqual(Array.from(years.entries()), [["2019", 0], ["2021", 1]]);
});

it("topDownSort lists categories in reverse waterfall order", () => {
  const ranks = new Map([["a", 0], ["b", 1], ["c", 2]]);
  const sort = topDownSort(ranks, d => d.c);
  const sorted = [{c: "a"}, {c: "c"}, {c: "b"}].sort(sort).map(d => d.c);
  assert.deepStrictEqual(sorted, ["c", "b", "a"]);
});

it("syncCategorySort gives horizontal bars a top-down ySort and takes it back", () => {
  const viz = waterfall().discrete("y").x("amount").y("item");
  viz._preDraw();
  const sort = viz.schema.ySort;
  assert.strictEqual(typeof sort, "function");
  assert.strictEqual(waterfallState(viz).ySort, sort);
  assert.deepStrictEqual(rows.slice().sort(sort).map(d => d.item), ["Gross", "Costs", "Sales", "Start"]);
  assert.deepStrictEqual(viz._filteredData.map(d => stepOf(viz, d).index), [0, 1, 2, 3], "steps still run in data order");
  viz.discrete("x").x("item").y("amount");
  syncCategorySort(viz);
  assert.strictEqual(viz.schema.ySort, undefined);
  const order = ["Costs", "Gross", "Sales", "Start"];
  const own = (a, b) => order.indexOf(a.item) - order.indexOf(b.item);
  viz.discrete("y").x("amount").y("item").ySort(own);
  viz._preDraw();
  assert.strictEqual(viz.schema.ySort, own, "a user's ySort stands");
  assert.strictEqual(waterfallState(viz).ySort, undefined);
  assert.deepStrictEqual(
    viz._filteredData.map(d => [d.item, stepOf(viz, d).index]),
    [["Start", 3], ["Sales", 2], ["Costs", 0], ["Gross", 1]],
    "and orders the steps",
  );
});

it("subtotal accepts a key, an accessor, or nothing", () => {
  const viz = waterfall();
  assert.strictEqual(viz.subtotal()(rows[0]), true);
  viz.subtotal(d => d.item === "Gross");
  viz._preDraw();
  assert.strictEqual(stepOf(viz, viz._filteredData[0]).kind, "increase");
  viz.subtotal(false);
  assert.strictEqual(viz.subtotal(), undefined);
});

it("Waterfall colors bars and legend entries by kind", () => {
  const viz = waterfall().increaseColor("#00ff00");
  viz._preDraw();
  const fill = viz.schema.shapeConfig.fill;
  assert.strictEqual(fill(viz._filteredData[1], 1), "#00ff00");
  assert.strictEqual(fill({[KIND_KEY]: "decrease"}, 0), viz.schema.colorDefaults.off);
  assert.strictEqual(viz.schema.color(viz._filteredData[0]), "total");
  const label = viz.schema.legendConfig.label;
  assert.strictEqual(label({[KIND_KEY]: "decrease"}, 0), "Decrease");
  viz.locale("es-ES");
  assert.strictEqual(label({[KIND_KEY]: "increase"}, 0), "Aumento");
  const sorted = [{[KIND_KEY]: "total"}, {[KIND_KEY]: "increase"}].sort(viz.schema.legendSort);
  assert.deepStrictEqual(sorted.map(d => d[KIND_KEY]), ["increase", "total"]);
  assert.strictEqual(viz.schema.legend({}, [1, 2]), true);
  assert.strictEqual(viz.schema.legend({}, [1]), false);
});

it("Waterfall labels, tooltips, and aria labels read each bar's step", () => {
  const viz = waterfall();
  viz._preDraw();
  const bar = viz.schema.shapeConfig.Bar;
  const [start, sales, costs] = viz._filteredData;
  assert.strictEqual(bar.label(sales), "+50");
  assert.strictEqual(bar.label(costs), "-30");
  assert.strictEqual(bar.label({}), false);
  assert.deepStrictEqual(bar.labelBounds({}, 0, {width: 1, height: 1}), false);
  assert.strictEqual(bar.labelConfig.verticalAlign(costs), "top");
  assert.strictEqual(bar.labelConfig.textAnchor({}), "middle");
  assert.strictEqual(bar.ariaLabel(costs, 2), "Costs, Decrease: -30.");
  const tip = viz.schema.tooltipConfig;
  assert.strictEqual(tip.title(costs, 2), "Decrease", "bars without a series are titled by kind");
  assert.strictEqual(tip.title({[KIND_KEY]: "total"}, 0), "Total");
  assert.deepStrictEqual(tip.tbody(costs), [["Running Total", "120"]]);
  assert.deepStrictEqual(tip.tbody(start), []);
  const series = new Waterfall().data(rows.map(d => ({...d, region: "North"}))).groupBy("region").x("item").y("amount");
  series._preDraw();
  assert.strictEqual(series.schema.tooltipConfig.title(series._filteredData[0], 0), "North");
});

it("Waterfall's legend hover highlights a kind, and its entries don't hide", () => {
  const viz = waterfall();
  viz._preDraw();
  assert.strictEqual(viz.schema.on["click.legend"], undefined);
  let predicate;
  viz.hover = fn => {
    predicate = fn;
    return viz;
  };
  viz.schema.on.mouseenter.call(viz, {[KIND_KEY]: "decrease"}, 0);
  assert.strictEqual(predicate(viz._filteredData[2]), true);
  assert.strictEqual(predicate(viz._filteredData[1]), false);
});

it("Waterfall connectors honor connectors(false)", () => {
  const viz = waterfall();
  viz._preDraw();
  const bar = {type: "rect", shapeType: "Bar", x: -5, y: -10, width: 10, height: 10, transform: {x: 10, y: 100}};
  const nodes = viz._filteredData.map((d, i) => ({...bar, transform: {x: 10 + i * 20, y: 100}, datum: {data: d}}));
  const underlay = viz._plotUnderlay(nodes, v => v, v => 200 - v);
  assert.strictEqual(underlay.length, 3);
  assert.deepStrictEqual(underlay[0].points, [[15, 100], [25, 100]]);
  viz.connectors(false);
  assert.deepStrictEqual(viz._plotUnderlay(nodes, v => v, v => v), []);
  assert.strictEqual(viz._stackShareLabels, false);
});
