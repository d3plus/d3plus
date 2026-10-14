import assert from "assert";
import {
  applyBarWidths,
  barKey,
  barSeries,
  barSpanAxisConfig,
  barWidthAccessor,
  barWidthLabel,
  barWidthTooltipRows,
  labelBarWidth,
  layoutBarSpans,
  measureBars,
  seriesSlot,
  shareLabel,
  widthShareText,
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

it("barWidth: applyBarWidths shares widths of the panel's total, or every panel's when shared", () => {
  const viz = fakeViz({barWidth: barWidthAccessor("v")});
  const data = [row("A", {g: "a", v: 1}), row("B", {g: "a", v: 3})];
  applyBarWidths(viz, data, data);
  assert.strictEqual(viz._barSpans.shareTotal, 4);
  viz._plotFacetScales = {domains: {}, padded: {}, barTotal: 16};
  const again = [row("A", {g: "a", v: 1}), row("B", {g: "a", v: 3})];
  applyBarWidths(viz, again, again);
  assert.strictEqual(viz._barSpans.total, 4);
  assert.strictEqual(viz._barSpans.shareTotal, 16);
  assert.deepStrictEqual(barWidthTooltipRows(viz, again[1].data), [["v", "3 (18.8%)"]]);
});

it("barWidth: widthShareText formats a bar's share of the share total", () => {
  const span = {value: "A", size: 1, start: 0, end: 1, mid: 0.5};
  assert.strictEqual(widthShareText({shareTotal: 3, spans: [span]}, span, "en-US"), "33.3%");
  assert.strictEqual(widthShareText({shareTotal: 4, spans: [span]}, span, "en-US"), "25%");
  assert.strictEqual(widthShareText({shareTotal: 0, spans: [span]}, span, "en-US"), "");
});

it("barWidth: shareLabel puts the share beneath a horizontal axis label and after a vertical one", () => {
  assert.strictEqual(shareLabel("Retail", "50%", "x"), "Retail\n50%");
  assert.strictEqual(shareLabel("Retail", "50%", "y"), "Retail (50%)");
  assert.strictEqual(shareLabel("Retail", "", "x"), "Retail");
});

it("barWidth: barSpanAxisConfig ticks and labels each bar's center alone", () => {
  const viz = fakeViz({barWidth: barWidthAccessor("v")});
  const data = [row("A", {g: "a", v: 1}), row("B", {g: "a", v: 3})];
  applyBarWidths(viz, data, data);
  const config = barSpanAxisConfig(viz, "x");
  assert.deepStrictEqual(config.ticks, [0.5, 2.5], "no ticks between the bars");
  assert.deepStrictEqual(config.labels, [0.5, 2.5]);
  assert.strictEqual(config.tickFormat(0.5), "A");
  assert.strictEqual(config.tickFormat(1), "", "nothing labels a value off the bar centers");
  assert.strictEqual(config.rotatedTickFormat, undefined, "the name alone, rotated or not");
  assert.deepStrictEqual(barSpanAxisConfig(viz, "y"), {}, "only the variable-width axis");
});

it("barWidth: barSpanAxisConfig adds width shares with barWidthShare, but not to rotated labels", () => {
  const viz = fakeViz({barWidth: barWidthAccessor("v"), barWidthShare: true});
  const data = [row("A", {g: "a", v: 1}), row("B", {g: "a", v: 3})];
  applyBarWidths(viz, data, data);
  const config = barSpanAxisConfig(viz, "x");
  assert.strictEqual(config.tickFormat(0.5), "A\n25%");
  assert.strictEqual(config.tickFormat(2.5), "B\n75%");
  assert.strictEqual(config.rotatedTickFormat(0.5), "A");
  assert.strictEqual(config.rotatedTickFormat(2.5), "B");

  const vertical = fakeViz({barWidth: barWidthAccessor("v"), barWidthShare: true, discrete: "y"});
  const rows = [{y: "A", data: {v: 1}}, {y: "B", data: {v: 3}}];
  applyBarWidths(vertical, rows, rows);
  const y = barSpanAxisConfig(vertical, "y");
  assert.strictEqual(y.tickFormat(0.5), "A (25%)");
  assert.deepStrictEqual(y.ticks, [0.5, 2.5]);
});

it("barWidth: barSeries lists side-by-side series only when a bar holds more than one", () => {
  const rows = [
    {x: 1, group: "a"},
    {x: 1, group: "b"},
    {x: 3, group: "a"},
    {x: 3, group: "c"},
  ];
  assert.deepStrictEqual(barSeries(rows, "x"), ["a", "b", "c"]);
  assert.deepStrictEqual(barSeries([{x: 1, group: "s"}, {x: 3, group: "s"}], "x"), [], "one stack per bar");
  assert.deepStrictEqual(barSeries([{y: 1, group: "a"}, {y: 3, group: "b"}], "y"), [], "one series per bar");
  assert.deepStrictEqual(barSeries([], "x"), []);
});

it("barWidth: seriesSlot splits a bar like grouped bars split a band", () => {
  // 100px for 2 series with 4px padding: (100 - 8 - 1) / 2 = 45.5 each, flush with both edges.
  assert.deepStrictEqual(seriesSlot(100, 2, 0, 4), {size: 45.5, offset: -27.25});
  assert.deepStrictEqual(seriesSlot(100, 2, 1, 4), {size: 45.5, offset: 27.25});
  const middle = seriesSlot(91, 3, 1, 0);
  assert.strictEqual(middle.size, 30);
  assert.strictEqual(middle.offset, 0);
  assert.deepStrictEqual(seriesSlot(50, 1, 0, 4), {size: 45, offset: 0});
  assert.strictEqual(seriesSlot(4, 3, 0, 2).size, 1, "never narrower than 1px");
});
