import assert from "assert";
import it from "../jsdom.js";
import {Pyramid} from "../../es/index.js";
import {runStages} from "../../es/internal.js";
import {computePlotAxisValues, computePlotInitialDomains, formatPlotData} from "../../es/src/charts/Plot/pipeline.js";
import {plotAxisConfig} from "../../es/src/charts/Plot/baselineBreak.js";
import {absoluteFormat, snapMagnitude} from "../../es/src/charts/Pyramid/pyramidData.js";
import {comparisonNodes} from "../../es/src/charts/Pyramid/scene.js";
import {
  allCategories,
  captureAxisStyles,
  categoryLabelConfig,
  categoryText,
  gutterAxisDefaults,
  gutterInset,
  gutterStackOffset,
  gutterWidth,
  labelFont,
  labelHeight,
  thinBands,
} from "../../es/src/charts/Pyramid/gutter.js";

/**
    Pyramid's center gutter: the value axis breaks around zero, as wide as
    the widest category label, and each side stacks out from its own edge.
*/

const rows = [
  {age: "0-9", sex: "Male", pop: 100},
  {age: "0-9", sex: "Female", pop: 120},
  {age: "10-19", sex: "Male", pop: 80},
  {age: "10-19", sex: "Female", pop: 60},
];
const pyramid = (data = rows) => new Pyramid().data(data).groupBy("sex").y("age").x("pop");

it("Pyramid gutterInset is a vanishing fraction of the extent", () => {
  assert.ok(Math.abs(gutterInset(1000) - 1e-6) < 1e-15);
  assert.strictEqual(gutterInset(0), 1e-9);
  assert.ok(gutterInset(0.05) > 0);
});

it("Pyramid snapMagnitude reads the gutter edges as zero", () => {
  assert.strictEqual(snapMagnitude(-5), 5);
  assert.strictEqual(snapMagnitude(1e-9, 1e-9), 0);
  assert.strictEqual(snapMagnitude(-2e-9, 1e-9), 0);
  assert.strictEqual(snapMagnitude(-3e-9, 1e-9), 3e-9);
  assert.strictEqual(absoluteFormat(d => `${d}`, () => 1e-6)(-1e-6), "0", "absoluteFormat snaps too");
});

it("Pyramid gutterStackOffset starts each side at its own edge", () => {
  const series = [[[0, -3]], [[0, 5]], [[0, -2]]];
  gutterStackOffset(() => 0.5)(series, [0, 1, 2]);
  assert.deepStrictEqual(series.map(s => s[0]), [[-3.5, -0.5], [0.5, 5.5], [-5.5, -3.5]]);
  const plain = [[[0, -3]], [[0, 5]]];
  gutterStackOffset(() => 0)(plain, [0, 1]);
  assert.deepStrictEqual(plain.map(s => s[0]), [[-3, 0], [0, 5]], "no inset: a plain diverging stack");
});

it("Pyramid labelFont resolves an axis labelConfig", () => {
  const font = labelFont({fontSize: () => 14, padding: 3, fontWeight: 600, fontFamily: ["Inter", "sans-serif"]}, "a", 0);
  assert.deepStrictEqual(font, {family: "'Inter', sans-serif", size: 14, weight: 600, padding: 3});
  const fallback = labelFont({}, "a", 0);
  assert.strictEqual(fallback.size, 12);
  assert.strictEqual(fallback.padding, 0);
  assert.ok(fallback.family.length);
});

it("Pyramid gutterWidth is the widest label plus its padding", () => {
  const fonts = [{family: "x", size: 10, weight: 400, padding: 5}, {family: "x", size: 10, weight: 400, padding: 2}];
  const measure = text => text.length * 6;
  assert.strictEqual(gutterWidth(["0-4", "100+"], fonts, measure), 24 + 10);
  assert.strictEqual(gutterWidth([], [], measure), 0);
});

it("Pyramid thinBands keeps every band that fits, and always the last", () => {
  assert.deepStrictEqual(thinBands([0, 20, 40], 15), [true, true, true]);
  assert.deepStrictEqual(thinBands([0, 10, 20, 30, 40], 15), [true, false, true, false, true]);
  assert.deepStrictEqual(thinBands([0, 10, 20, 30], 15), [true, false, false, true], "the last label wins over its neighbor");
  assert.deepStrictEqual(thinBands([5], 50), [true]);
  assert.deepStrictEqual(thinBands([], 10), []);
  assert.strictEqual(labelHeight({size: 10, padding: 5}), 22);
});

it("Pyramid gutterAxisDefaults breaks the value axis and blanks the category axis", () => {
  const restore = {x: {breakConfig: {space: 36}}, y: {barConfig: {stroke: "black"}, tickSize: 8}};
  const center = gutterAxisDefaults("center", 0.5, 40, undefined, restore);
  assert.deepStrictEqual(center.x.break, [[-0.5, 0.5]]);
  assert.strictEqual(center.x.breakConfig.space, 40);
  assert.strictEqual(center.x.breakConfig.gap, 40, "the axis line is gapped across the gutter");
  assert.strictEqual(center.x.breakConfig.lines, false);
  assert.strictEqual(center.x.breakConfig.mask, false);
  assert.deepStrictEqual(center.y, {barConfig: {stroke: "transparent"}, tickSize: 0, ticks: []});
  assert.deepStrictEqual(gutterAxisDefaults("center", 1, 10, [5, 8], restore).x.break, [[-1, 1], [5, 8]], "a user xBreak is kept");
  assert.deepStrictEqual(gutterAxisDefaults("center", 1, 10, [[5, 8], [9, 12]], restore).x.break, [[-1, 1], [5, 8], [9, 12]]);
  const left = gutterAxisDefaults("left", 0, 0, undefined, restore);
  assert.deepStrictEqual(left, restore, "the left layout restores the axes' own styles");
  assert.notStrictEqual(left.x, restore.x);
});

it("Pyramid reads the category axis's labels", () => {
  const viz = pyramid().yConfig({shapeConfig: {labelConfig: {fontSize: 20}}, tickFormat: d => `Age ${d}`});
  const config = categoryLabelConfig(viz);
  assert.strictEqual(config.fontSize, 20, "the user's label config wins");
  assert.strictEqual(config.padding, 5, "over the axis's own defaults");
  assert.strictEqual(categoryText(viz, "0-9"), "Age 0-9");
  assert.strictEqual(categoryText(pyramid(), 5), "5");
  assert.deepStrictEqual(allCategories(pyramid()), ["0-9", "10-19"]);
  const styles = captureAxisStyles(pyramid());
  assert.strictEqual(styles.y.tickSize, 8);
  assert.ok(styles.y.barConfig.stroke && styles.x.breakConfig.space === 36);
});

it("Pyramid's center layout gives the axes a gutter around zero", () => {
  const viz = pyramid();
  viz._preDraw();
  const inset = viz.ctx.pyramid.inset;
  assert.strictEqual(viz.categoryPosition(), "center");
  assert.ok(inset > 0 && inset < 1e-3);
  assert.deepStrictEqual(viz._xConfig.domain, [-(120 + inset), 120 + inset]);
  const x = plotAxisConfig(viz, "x");
  assert.deepStrictEqual(x.break, [[-inset, inset]]);
  assert.ok(x.breakConfig.space > 20, `gutter fits "10-19" (${x.breakConfig.space}px)`);
  assert.deepStrictEqual(plotAxisConfig(viz, "y").ticks, []);
  assert.strictEqual(viz._xConfig.tickFormat(inset), "0", "the gutter edges read as zero");
  viz.yConfig({shapeConfig: {labelConfig: {padding: 20}}})._preDraw();
  assert.ok(plotAxisConfig(viz, "x").breakConfig.space >= x.breakConfig.space + 30, "padding widens the gutter");
  viz.yConfig({breakConfig: {space: 99}});
  viz.categoryPosition("left")._preDraw();
  assert.strictEqual(viz.ctx.pyramid.inset, 0);
  assert.deepStrictEqual(viz._xConfig.domain, [-120, 120]);
  assert.strictEqual(plotAxisConfig(viz, "x").break, false, "no gutter break");
  assert.strictEqual(plotAxisConfig(viz, "y").tickSize, 8, "the category axis is restored");
});

it("Pyramid's center layout stacks each side from its gutter edge", () => {
  const viz = pyramid();
  viz._preDraw();
  const ctx = runStages({viz}, [formatPlotData, computePlotAxisValues, computePlotInitialDomains]);
  const e = viz.ctx.pyramid.inset;
  const segment = key => {
    const [lo, hi] = ctx.plotStackData[ctx.plotStackKeys.indexOf(key)][ctx.plotDiscreteKeys.findIndex(k => `${k}`.startsWith("0-9"))];
    return [lo, hi];
  };
  assert.deepStrictEqual(segment("Male_0-9"), [-100 - e, -e]);
  assert.deepStrictEqual(segment("Female_0-9"), [e, 120 + e]);
  assert.strictEqual(viz._x(rows[0], 0), -100, "the plotted value itself is unchanged");
});

it("Pyramid's comparison outline starts at each gutter edge", () => {
  const [left, right] = comparisonNodes({
    sides: ["M", "F"], categories: ["a"], data: [{c: "a", s: "M", v: 2}, {c: "a", s: "F", v: 3}],
    category: d => d.c, side: d => d.s, comparison: d => d.v, divisor: 1,
    x: v => 100 + v * 10, y: () => 10, fallbackStep: 20, config: {}, inset: 1,
  });
  assert.deepStrictEqual(left.points, [[90, 0], [70, 0], [70, 20], [90, 20]]);
  assert.deepStrictEqual(right.points, [[110, 0], [140, 0], [140, 20], [110, 20]]);
});
