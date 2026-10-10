import assert from "assert";
import {
  applyBarWidths,
  barKey,
  barSpanAxisConfig,
  barWidthAccessor,
  barWidthLabel,
  barWidthTooltipRows,
  labelBarWidth,
  layoutBarSpans,
  measureBars,
} from "../../es/src/charts/Plot/barWidth.js";
import {plotAxisConfig} from "../../es/src/charts/Plot/baselineBreak.js";

/** A formatted Plot row over `data`, plotted at `x`. */
const row = (x, data) => ({x, data, id: `${data.g}_${x}`});

/** A minimal viz stand-in for the barWidth helpers. */
const fakeViz = (schema = {}) => ({
  schema: {
    aggs: {},
    discrete: "x",
    locale: "en-US",
    translate: s => `t:${s}`,
    ...schema,
  },
});

it("barWidth: barKey keys dates by time and everything else by string", () => {
  assert.strictEqual(barKey("Europe"), "Europe");
  assert.strictEqual(barKey(2024), "2024");
  assert.strictEqual(barKey(new Date(0)), "0");
  assert.strictEqual(barKey(new Date(0)), barKey(new Date(0)));
});

it("barWidth: barWidthAccessor coerces keys, keeps functions, and turns falsy off", () => {
  const byKey = barWidthAccessor("size");
  assert.strictEqual(byKey({size: 4}), 4);
  const fn = d => d.size * 2;
  assert.strictEqual(barWidthAccessor(fn), fn);
  assert.strictEqual(barWidthAccessor(false), undefined);
  assert.strictEqual(barWidthAccessor(""), undefined);
  assert.strictEqual(barWidthAccessor(undefined), undefined);
});

it("barWidth: labelBarWidth names an accessor and returns it", () => {
  const fn = () => 1;
  assert.strictEqual(labelBarWidth(fn, "Bar Total"), fn);
  assert.strictEqual(barWidthLabel(fakeViz({barWidth: fn})), "t:Bar Total");
});

it("barWidth: barWidthLabel prefers the data key, else a translated name", () => {
  assert.strictEqual(barWidthLabel(fakeViz({barWidth: barWidthAccessor("Market Size")})), "Market Size");
  assert.strictEqual(barWidthLabel(fakeViz({barWidth: d => d.v})), "t:Width");
  assert.strictEqual(barWidthLabel(fakeViz()), "t:Width");
});

it("barWidth: measureBars groups rows by category and measures the merged rows", () => {
  const rows = [
    row("A", {g: "a", v: 2, size: 10}),
    row("B", {g: "a", v: 5, size: 30}),
    row("A", {g: "b", v: 3, size: 10}),
    {x: "C"},
  ];
  const summed = measureBars(rows, "x", d => d.v);
  assert.deepStrictEqual(summed.map(b => [b.value, b.size]), [["A", 5], ["B", 5]]);
  const max = measureBars(rows, "x", d => d.size, {size: (a, c) => Math.max(...a.map(c))});
  assert.deepStrictEqual(max.map(b => b.size), [10, 30]);
  assert.strictEqual(max[1].data.g, "a", "a single row is its own datum");
});

it("barWidth: layoutBarSpans lays bars end to end and drops empty ones", () => {
  const spans = layoutBarSpans([
    {value: "A", size: 2},
    {value: "B", size: 0},
    {value: "C", size: 6},
    {value: "D", size: NaN},
    {value: "E", size: -1},
  ]);
  assert.deepStrictEqual(spans, [
    {value: "A", size: 2, start: 0, end: 2, mid: 1},
    {value: "C", size: 6, start: 2, end: 8, mid: 5},
  ]);
  assert.deepStrictEqual(layoutBarSpans([]), []);
});

it("barWidth: applyBarWidths places rows at their bar centers and spans the axis", () => {
  const viz = fakeViz({barWidth: barWidthAccessor("v")});
  const data = [
    row("A", {g: "a", v: 1}),
    row("A", {g: "b", v: 3}),
    row("B", {g: "a", v: 4}),
    row("Z", {g: "a", v: 0}),
  ];
  const [placed, axis] = applyBarWidths(viz, data, data);
  assert.strictEqual(placed, axis, "a shared array is placed once");
  assert.deepStrictEqual(placed.map(r => r.x), [2, 2, 6], "zero-width bar Z is dropped");
  assert.strictEqual(viz._barSpans.total, 8);
  assert.strictEqual(viz._barSpans.axis, "x");
  assert.strictEqual(viz._xTime, false);
  assert.deepStrictEqual(viz._discreteExtent(data[2].data), [4, 8]);
  assert.deepStrictEqual(viz._discreteExtent({}), [0, 0]);
});

it("barWidth: applyBarWidths follows xSort and places persisted axis rows", () => {
  const viz = fakeViz({barWidth: barWidthAccessor("v"), xSort: (a, b) => b.v - a.v});
  const shown = [row("A", {g: "a", v: 1}), row("B", {g: "a", v: 4})];
  const all = [row("A", {g: "a", v: 1}), row("B", {g: "a", v: 4}), row("C", {g: "a", v: 2})];
  const [placed, axis] = applyBarWidths(viz, shown, all);
  assert.deepStrictEqual(viz._barSpans.spans.map(s => s.value), ["B", "C", "A"]);
  assert.deepStrictEqual(placed.map(r => r.x), [6.5, 2]);
  assert.deepStrictEqual(axis.map(r => r.x), [6.5, 2, 5]);
});

it("barWidth: applyBarWidths spans a horizontal (discrete y) chart", () => {
  const viz = fakeViz({barWidth: barWidthAccessor("v"), discrete: "y"});
  const data = [{y: "A", data: {v: 2}}, {y: "B", data: {v: 2}}];
  applyBarWidths(viz, data, data);
  assert.deepStrictEqual(data.map(r => r.y), [1, 3]);
  assert.strictEqual(viz._barSpans.axis, "y");
  assert.strictEqual(viz._yTime, false);
});

it("barWidth: applyBarWidths clears its own layout when off and leaves other extents alone", () => {
  const viz = fakeViz({barWidth: barWidthAccessor("v")});
  const data = [row("A", {g: "a", v: 1})];
  applyBarWidths(viz, data, data);
  viz.schema.barWidth = undefined;
  const fresh = [row("A", {g: "a", v: 1})];
  const [placed] = applyBarWidths(viz, fresh, fresh);
  assert.strictEqual(placed[0].x, "A");
  assert.strictEqual(viz._barSpans, undefined);
  assert.strictEqual(viz._discreteExtent, undefined);

  const histogram = fakeViz({barWidth: barWidthAccessor("v")});
  const extent = () => [0, 1];
  histogram._discreteExtent = extent;
  const rows = [row("A", {g: "a", v: 1})];
  applyBarWidths(histogram, rows, rows);
  assert.strictEqual(histogram._discreteExtent, extent, "a chart's own span extent wins");
  assert.strictEqual(rows[0].x, "A");
});

it("barWidth: barSpanAxisConfig labels each category at its bar center", () => {
  const viz = fakeViz({barWidth: barWidthAccessor("v")});
  const date = new Date(2020, 0, 1);
  const data = [row("A", {g: "a", v: 2}), row(date, {g: "a", v: 2})];
  applyBarWidths(viz, data, data);
  const config = barSpanAxisConfig(viz, "x");
  assert.deepStrictEqual(config.labels, [1, 3]);
  assert.strictEqual(config.tickFormat(1), "A");
  assert.ok(config.tickFormat(3).includes("2020"), "dates are formatted");
  assert.strictEqual(config.tickFormat(2), "");
  assert.deepStrictEqual(barSpanAxisConfig(viz, "y"), {});
  assert.deepStrictEqual(barSpanAxisConfig(fakeViz(), "x"), {});
});

it("barWidth: barWidthTooltipRows shows the bar's width and share of the total", () => {
  const viz = fakeViz({barWidth: barWidthAccessor("Size")});
  const a = {g: "a", Size: 1500};
  const data = [row("A", a), row("B", {g: "a", Size: 500})];
  applyBarWidths(viz, data, data);
  assert.deepStrictEqual(barWidthTooltipRows(viz, a), [["Size", "1.5k (75%)"]]);
  assert.deepStrictEqual(barWidthTooltipRows(viz, {}), []);
  assert.deepStrictEqual(barWidthTooltipRows(viz, undefined), []);
  assert.deepStrictEqual(barWidthTooltipRows(fakeViz(), a), []);
});

it("barWidth: plotAxisConfig puts the category labels beneath the user's axis config", () => {
  const viz = fakeViz({barWidth: barWidthAccessor("v")});
  const data = [row("A", {g: "a", v: 2})];
  applyBarWidths(viz, data, data);
  viz._xConfig = {labels: undefined, title: "Region"};
  const config = plotAxisConfig(viz, "x");
  assert.deepStrictEqual(config.labels, [1], "an unset user key keeps the chart's labels");
  assert.strictEqual(config.title, "Region");
  assert.strictEqual(config.break, false);
  viz._xConfig = {labels: []};
  assert.deepStrictEqual(plotAxisConfig(viz, "x").labels, [], "a user's own labels win");
  viz._yConfig = {title: "v"};
  assert.deepStrictEqual(plotAxisConfig(viz, "y"), {break: false, title: "v"});
});
