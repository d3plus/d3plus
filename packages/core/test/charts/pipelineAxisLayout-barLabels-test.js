import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {AxisBottom, AxisLeft, AxisTop, BarChart} from "../../index.ts";
import {runStages} from "../../internal.ts";
import {measureAxes} from "../../src/charts/features/axesMeasure.ts";
import {barLabelsNeedAxis} from "../../src/charts/Plot/barLabelFit.ts";
import {
  computePlotAxisValues,
  computePlotInitialDomains,
  computePlotScales,
  formatPlotData,
  preparePlotAxisLayout,
} from "../../src/charts/Plot/pipeline.ts";

useJsdom();

/**
    A BarChart whose bars carry their categories' names hides the category
    axis's tick labels (`preparePlotAxisLayout` hands the axis measure a
    `plotBarLabelCheck`), unless the bars have no room for those names
    (#1007): then `measureAxes` measures the axis with its ticks and flags
    `barLabelsOnAxis`.
*/

const months12 = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const data = [2022, 2023, 2024].flatMap((year, k) =>
  months12.map((m, i) => ({
    year,
    month: `${m} ${year}`,
    value: 10 + ((i * 7 + k * 5) % 13),
  })),
);

/** Runs a chart's Plot stages through `preparePlotAxisLayout`. */
function axisLayout(viz) {
  viz._preDraw();
  viz._margin = {top: 0, right: 0, bottom: 0, left: 0};
  viz._padding = {top: 0, right: 0, bottom: 0, left: 0};
  return runStages({viz}, [
    formatPlotData,
    computePlotAxisValues,
    computePlotInitialDomains,
    computePlotScales,
    preparePlotAxisLayout,
  ]);
}

/** Runs the axis measure on a chart's stage outputs, as `drawPlot` does. */
function measure(viz) {
  const ctx = axisLayout(viz);
  const {x} = ctx.plotScales;
  return measureAxes(
    viz,
    {
      xTest: new AxisBottom().align("end").gridSize(0),
      x2Test: new AxisTop().align("start").gridSize(0),
      yTest: new AxisLeft().align("start").gridSize(0),
      y2Test: new AxisLeft().align("end").gridSize(0),
      xDomain: ctx.plotXDomain,
      x2Domain: ctx.plotX2Domain,
      yDomain: ctx.plotYDomain,
      y2Domain: ctx.plotY2Domain,
      xTicks: ctx.plotXTicks,
      x2Ticks: ctx.plotX2Ticks,
      yTicks: ctx.plotYTicks,
      y2Ticks: ctx.plotY2Ticks,
      ...ctx.plotConfigScales,
      defaultX2Config: ctx.plotDefaultX2Config,
      defaultY2Config: ctx.plotDefaultY2Config,
      yC: ctx.plotYC,
      showX: ctx.plotShowX,
      showY: ctx.plotShowY,
      x2Exists: ctx.x2Exists,
      y2Exists: ctx.y2Exists,
      height: viz.schema.height,
      width: viz.schema.width,
      xData: ctx.xData,
      xScalePadding: x.padding ? x.padding() : 0,
      barLabelCheck: ctx.plotBarLabelCheck,
    },
    () => ({labelWidths: [], largestLabel: undefined, xRangeMax: undefined}),
  );
}

const bars = rows =>
  new BarChart()
    .data(rows)
    .groupBy("month")
    .x("month")
    .y("value")
    .width(650)
    .height(400);

const horizontal = rows =>
  new BarChart()
    .data(rows)
    .groupBy("month")
    .discrete("y")
    .x("value")
    .y("month")
    .width(650)
    .height(400);

const year = data.filter(d => d.year === 2024);

it("preparePlotAxisLayout: bars labeled with their categories hide the axis ticks, pending the check", () => {
  const ctx = axisLayout(bars(year));
  assert.deepStrictEqual(ctx.plotXTicks, []);
  assert.strictEqual(ctx.plotBarLabelCheck.axis, "x");
  assert.deepStrictEqual(
    ctx.plotBarLabelCheck.labels,
    year.map(d => d.month),
  );
  assert.strictEqual(ctx.plotBarLabelCheck.rows.length, 12);
});

it("preparePlotAxisLayout: horizontal bars check the y axis", () => {
  const ctx = axisLayout(horizontal(data));
  assert.deepStrictEqual(ctx.plotYTicks, []);
  assert.strictEqual(ctx.plotBarLabelCheck.axis, "y");
});

it("preparePlotAxisLayout: an axis too small to draw has nothing to check", () => {
  const ctx = axisLayout(bars(data).discreteCutoff(1000));
  assert.deepStrictEqual(ctx.plotXTicks, []);
  assert.strictEqual(ctx.plotBarLabelCheck, undefined);
});

it("preparePlotAxisLayout: bars labeled with something else leave the axis alone", () => {
  const ctx = axisLayout(bars(data).label(d => `${d.value}`));
  assert.strictEqual(ctx.plotXTicks, null);
  assert.strictEqual(ctx.plotBarLabelCheck, undefined);
});

it("barLabelsNeedAxis: 12 month bars fit a 650px plot, 36 don't", () => {
  const twelve = axisLayout(bars(year));
  const all = axisLayout(bars(data));
  const plot = {width: 600, height: 340};
  assert.strictEqual(
    barLabelsNeedAxis(twelve.viz, twelve.plotBarLabelCheck, plot),
    false,
  );
  assert.strictEqual(
    barLabelsNeedAxis(all.viz, all.plotBarLabelCheck, plot),
    true,
  );
});

it("measureAxes: 12 bars that fit their labels keep the axis ticks hidden", () => {
  const r = measure(bars(year));
  assert.strictEqual(r.barLabelsOnAxis, false);
  assert.deepStrictEqual(r.xTicks, []);
});

it("measureAxes: 36 bars too narrow for their labels measure the x axis with its ticks", () => {
  const without = measure(bars(year));
  const r = measure(bars(data));
  assert.strictEqual(r.barLabelsOnAxis, true);
  assert.strictEqual(r.xTicks, null);
  assert.ok(
    r.xHeight > without.xHeight,
    `the x axis claims room for its labels (${r.xHeight} vs ${without.xHeight})`,
  );
});

it("measureAxes: horizontal bars too thin for their labels measure the y axis with its ticks", () => {
  const r = measure(horizontal(data));
  assert.strictEqual(r.barLabelsOnAxis, true);
  assert.strictEqual(r.yTicks, null);
  assert.ok(
    r.yWidth > 20,
    `the y axis claims room for its labels (${r.yWidth})`,
  );
});

it("measureAxes: a few horizontal bars keep their labels", () => {
  const r = measure(horizontal(data.slice(0, 5)));
  assert.strictEqual(r.barLabelsOnAxis, false);
  assert.deepStrictEqual(r.yTicks, []);
});
