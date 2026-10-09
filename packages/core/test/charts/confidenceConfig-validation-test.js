/* global console */
import assert from "assert";
import {BarChart, LinePlot, Plot, RESET} from "../../es/index.js";
import {resolveConfidence, validateConfidenceConfig} from "../../es/src/charts/Plot/confidenceConfig.js";
import validateShapeConfig from "../../es/src/shapes/validateShapeConfig.js";

// #781: `confidenceConfig` warns about keys neither the band nor the error bar takes.

function captureWarnings(fn) {
  const warn = console.warn, warnings = [];
  console.warn = msg => warnings.push(msg);
  try {
    fn();
  }
  finally {
    console.warn = warn;
  }
  return warnings;
}

it("validateShapeConfig — a scope names the setter, its shapes, and extra keys", () => {
  const scope = {method: "fooConfig", shapes: {Bar: "Path"}, extra: {"": ["special"], Bar: ["capWidth"]}};
  const warnings = captureWarnings(() => validateShapeConfig("Chart", {
    stroke: "red", special: 1, r: 4, scopeTypo1: 1,
    Bar: {strokeWidth: 2, capWidth: 3, width: 4},
    Rect: {fill: "red"},
  }, scope));
  assert.deepStrictEqual(warnings, [
    'Chart.fooConfig() received unknown property "r".',
    'Chart.fooConfig() received unknown property "scopeTypo1".',
    'Chart.fooConfig() received unknown property "Bar.width".',
    'Chart.fooConfig() received unknown property "Rect".',
  ], "only the scoped shapes' keys count");
});

it("confidenceConfig — typos warn at the top level and inside Bar and Area", () => {
  const warnings = captureWarnings(() => {
    new BarChart().confidenceConfig({strok: "red", Bar: {capWidht: 4}, Area: {fillOpacty: 0.2, capWidth: 3}});
    new LinePlot().config({confidenceConfig: {tooltp: false}});
  });
  assert.deepStrictEqual(warnings, [
    'BarChart.confidenceConfig() received unknown property "strok".',
    'BarChart.confidenceConfig() received unknown property "Bar.capWidht".',
    'BarChart.confidenceConfig() received unknown property "Area.fillOpacty".',
    'BarChart.confidenceConfig() received unknown property "Area.capWidth".',
    'LinePlot.confidenceConfig() received unknown property "tooltp".',
  ]);
});

it("confidenceConfig — the keys stories, dev pages, and tests use don't warn", () => {
  const warnings = captureWarnings(() => {
    const viz = new BarChart();
    viz.confidenceConfig({capWidth: 10, stroke: "#343a40", strokeWidth: 2});
    viz.confidenceConfig({capWidth: "50%", tooltip: false, strokeDasharray: "2 2", strokeOpacity: 0.5, opacity: 1});
    viz.confidenceConfig({Bar: {stroke: "#333", strokeWidth: 2, capWidth: 8, strokeDasharray: "2 2"}});
    viz.confidenceConfig({Bar: {stroke: d => d.color, capWidth: () => 6}});
    viz.config({confidenceConfig: {Bar: {stroke: RESET}, capWidth: RESET}});
    viz.config({confidenceConfig: RESET});
    new LinePlot().confidenceConfig({fillOpacity: 0.3});
    new LinePlot().confidenceConfig({fill: "red", Area: {fillOpacity: 0.2, curve: "monotoneX"}});
    new Plot().confidenceConfig({Bar: RESET, Area: RESET});
  });
  assert.deepStrictEqual(warnings, []);
});

it("validateConfidenceConfig — only plain-object patches are checked", () => {
  const warnings = captureWarnings(() => {
    validateConfidenceConfig("Plot", RESET);
    validateConfidenceConfig("Plot", undefined);
    validateConfidenceConfig("Plot", ["strok"]);
    validateConfidenceConfig("Plot", {strok: 1});
  });
  assert.deepStrictEqual(warnings, ['Plot.confidenceConfig() received unknown property "strok".']);
});

it("resolveConfidence — a [lower, upper] accessor pair, or false", () => {
  const [lower, upper] = resolveConfidence(["lo", d => d.hi * 2]);
  assert.strictEqual(lower({lo: 1}), 1, "a data key becomes an accessor");
  assert.strictEqual(upper({hi: 2}), 4, "a function is kept");
  assert.deepStrictEqual(resolveConfidence([false, ""]), false, "no bounds is off");
  assert.strictEqual(resolveConfidence(false), false);
  assert.strictEqual(resolveConfidence(undefined), false);
  assert.strictEqual(resolveConfidence([null, "hi"])[0], false, "one-sided");
});
