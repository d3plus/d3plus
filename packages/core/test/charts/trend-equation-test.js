import assert from "assert";
import it from "../jsdom.js";
import {trendEquation, trendTooltipRows, trendTypeNames} from "../../es/src/charts/Plot/trendTooltip.js";

it("trendEquation — linear", () => {
  assert.strictEqual(trendEquation({type: "linear", coefficients: [3, 2]}), "y = 2x + 3");
  assert.strictEqual(trendEquation({type: "linear", coefficients: [-3, 2]}), "y = 2x − 3", "negative intercept");
  assert.strictEqual(trendEquation({type: "linear", coefficients: [3, -2]}), "y = −2x + 3", "negative slope");
  assert.strictEqual(trendEquation({type: "linear", coefficients: [0, 2]}), "y = 2x", "zero terms dropped");
  assert.strictEqual(trendEquation({type: "linear", coefficients: [0, 0]}), "y = 0", "all zero");
});

it("trendEquation — polynomial", () => {
  assert.strictEqual(trendEquation({type: "polynomial", coefficients: [3, -1.2, 0.5]}), "y = 0.5x² − 1.2x + 3");
  assert.strictEqual(trendEquation({type: "polynomial", coefficients: [0, 0, 0, 1]}), "y = 1x³");
  assert.strictEqual(trendEquation({type: "polynomial", coefficients: [1, 0, 0, 0, 2]}), "y = 2x^4 + 1");
});

it("trendEquation — exponential, logarithmic, power", () => {
  assert.strictEqual(trendEquation({type: "exponential", coefficients: [2, 0.3]}), "y = 2e^(0.3x)");
  assert.strictEqual(trendEquation({type: "logarithmic", coefficients: [1, 4]}), "y = 4ln(x) + 1");
  assert.strictEqual(trendEquation({type: "logarithmic", coefficients: [-1, 4]}), "y = 4ln(x) − 1");
  assert.strictEqual(trendEquation({type: "power", coefficients: [3, 1.5]}), "y = 3x^1.5");
});

it("trendEquation — formatter and axis", () => {
  const format = n => n.toFixed(1);
  assert.strictEqual(trendEquation({type: "linear", coefficients: [3, 2]}, format), "y = 2.0x + 3.0", "formats coefficients");
  assert.strictEqual(trendEquation({type: "linear", coefficients: [3, 2]}, String, "y"), "x = 2y + 3", "fit along y swaps names");
});

it("trendTooltipRows", () => {
  const viz = {
    _xTime: false,
    schema: {locale: "en-US", translate: s => `T(${s})`},
  };
  const trend = {axis: "x", fit: {type: "linear", coefficients: [3410, 1.24], r2: 0.87654, n: 12}};
  assert.deepStrictEqual(trendTooltipRows(viz, trend), [
    ["T(Trend Line)", "T(Linear)"],
    ["T(Equation)", "y = 1.24x + 3.41k"],
    ["R²", "0.877"],
    ["T(Observations)", "12"],
  ]);
  const tiny = {axis: "x", fit: {type: "linear", coefficients: [1, 0.0000123], r2: 1, n: 3}};
  assert.strictEqual(trendTooltipRows(viz, tiny)[1][1], "y = 0.0000123x + 1", "tiny coefficients keep their digits");
  const time = trendTooltipRows({...viz, _xTime: true}, trend);
  assert.deepStrictEqual(time.map(r => r[0]), ["T(Trend Line)", "R²", "T(Observations)"], "no equation on a time axis");
});

it("trendTypeNames covers every type", () => {
  assert.deepStrictEqual(Object.keys(trendTypeNames).sort(),
    ["exponential", "linear", "logarithmic", "polynomial", "power"]);
});
