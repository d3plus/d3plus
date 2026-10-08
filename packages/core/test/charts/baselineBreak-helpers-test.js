import assert from "assert";
import it from "../jsdom.js";
import {
  baselineBreakAxisConfig,
  clampBarConfig,
  userDomainBreaksBaseline,
  valueAxis,
  valueAxisExtent,
} from "../../es/internal.js";
import {buildXConfig} from "../../es/src/charts/features/xAxisConfig.js";
import {BarChart, LinePlot} from "../../es/index.js";

/**
    Plot's side of the baseline axis break (#645): which axis breaks, the axis
    config it gets, when a user domain is left short of the baseline, and the
    clamp that keeps bars inside the plot area.
*/

const stub = schema => ({schema: {baseline: 0, baselineBreak: true, discrete: "x", ...schema}});

it("valueAxis is the non-discrete axis", () => {
  assert.strictEqual(valueAxis(stub({discrete: "x"})), "y");
  assert.strictEqual(valueAxis(stub({discrete: "y"})), "x");
  assert.strictEqual(valueAxis(stub({discrete: undefined})), "y");
});

it("baselineBreakAxisConfig turns the break on for the value axis only", () => {
  const viz = stub({baseline: 5});
  assert.deepStrictEqual(baselineBreakAxisConfig(viz, "y"), {baseline: 5, baselineBreak: true});
  assert.deepStrictEqual(baselineBreakAxisConfig(viz, "x"), {baseline: 5, baselineBreak: false});
  assert.deepStrictEqual(
    baselineBreakAxisConfig(stub({baselineBreak: false}), "y"),
    {baseline: 0, baselineBreak: false},
    "opted out",
  );
  assert.deepStrictEqual(
    baselineBreakAxisConfig(stub({baseline: undefined}), "y"),
    {baselineBreak: true},
    "no baseline leaves the axis default",
  );
});

it("userDomainBreaksBaseline only when a user bound stops short of the baseline", () => {
  const check = (schema, axis = "y", scale = "linear") => userDomainBreaksBaseline(stub(schema), axis, scale);
  assert.strictEqual(check({yDomain: [1100, 2100]}), true, "positive domain above 0");
  assert.strictEqual(check({yDomain: [-2100, -1100]}), true, "negative domain below 0");
  assert.strictEqual(check({yDomain: [1100, undefined]}), true, "only the min given");
  assert.strictEqual(check({yDomain: [undefined, 2100]}), false, "min left to the data");
  assert.strictEqual(check({yDomain: [0, 2100]}), false, "domain reaches the baseline");
  assert.strictEqual(check({}), false, "no user domain");
  assert.strictEqual(check({yDomain: [1100, 2100], baselineBreak: false}), false, "opted out");
  assert.strictEqual(check({yDomain: [1100, 2100]}, "y", "log"), false, "log scales never break");
  assert.strictEqual(check({xDomain: [1100, 2100]}, "x"), false, "x is discrete here");
  assert.strictEqual(check({discrete: "y", xDomain: [1100, 2100]}, "x"), true, "horizontal bars");
});

it("valueAxisExtent reads the value axis range in shape coordinates", () => {
  const axis = range => ({_getRange: () => range});
  const vertical = {schema: {discrete: "x"}, _yAxis: axis([0, 400])};
  assert.deepStrictEqual(valueAxisExtent(vertical, {x2Height: 10, yOffset: 0.5}), [-10.5, 390]);
  const horizontal = {schema: {discrete: "y"}, _xAxis: axis([400, 50])};
  assert.deepStrictEqual(valueAxisExtent(horizontal, {x2Height: 10, yOffset: 0.5}), [50, 400]);
  assert.strictEqual(valueAxisExtent({schema: {discrete: "x"}}, {x2Height: 0, yOffset: 0}), undefined);
  assert.strictEqual(
    valueAxisExtent({schema: {discrete: "x"}, _yAxis: axis([NaN, 4])}, {x2Height: 0, yOffset: 0}),
    undefined,
  );
});

it("clampBarConfig clamps the value-axis accessors and leaves the rest", () => {
  const discreteFn = d => d.x * 1000;
  const config = {x: discreteFn, y: d => d.v, y0: 500, y1: d => d.v, label: "keep"};
  const clamped = clampBarConfig(config, "y", [0, 400]);
  assert.strictEqual(clamped.y0, 400, "constant base clamps");
  assert.strictEqual(clamped.y1({v: -20}), 0, "accessor clamps low");
  assert.strictEqual(clamped.y({v: 900}), 400, "accessor clamps high");
  assert.strictEqual(clamped.y1({v: 120}), 120, "in-range values pass through");
  assert.strictEqual(clamped.x, discreteFn, "discrete accessor untouched");
  assert.strictEqual(clamped.label, "keep");
  assert.strictEqual(config.y0, 500, "the input config isn't mutated");
  assert.strictEqual(clampBarConfig(config, "y", undefined), config, "no extent, no change");
  const ctx = {scale: 2};
  const withThis = clampBarConfig({x0: function (d) { return this.scale * d; }}, "x", [0, 100]);
  assert.strictEqual(withThis.x0.call(ctx, 80), 100, "accessors keep their `this`");
});

it("buildXConfig carries the x break settings into the shared x-axis config", () => {
  const inputs = {xTicks: null, showX: true, showY: true, xData: [], xScalePadding: 0};
  const horizontal = new BarChart().discrete("y");
  assert.strictEqual(buildXConfig(horizontal, inputs).baselineBreak, true, "horizontal bars break on x");
  assert.strictEqual(buildXConfig(new BarChart(), inputs).baselineBreak, false, "vertical bars don't break x");
});

it("BarChart defaults baselineBreak on; Plot charts leave it off", () => {
  assert.strictEqual(new BarChart().baselineBreak(), true);
  assert.ok(!new LinePlot().baselineBreak(), "LinePlot does not break");
  assert.strictEqual(new BarChart().baselineBreak(false).baselineBreak(), false, "opt out");
});

it("withAxisInk inks the break marks along with the axis line", async () => {
  const {withAxisInk} = await import("../../es/src/charts/Plot/axisInk.js");
  const viz = new BarChart();
  const config = withAxisInk(viz, {breakConfig: {stroke: "red"}});
  assert.strictEqual(typeof config.baselineBreakConfig.stroke, "function", "baseline break marks inked");
  assert.strictEqual(config.baselineBreakConfig.stroke(), config.barConfig.stroke(), "same ink as the axis line");
  assert.strictEqual(config.breakConfig.stroke, "red", "a user stroke wins");
});
