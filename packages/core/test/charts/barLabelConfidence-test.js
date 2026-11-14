import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {BarChart} from "../../index.ts";
import {
  anchorAtBase,
  barErrorReach,
} from "../../src/charts/Plot/barLabelConfidence.ts";
import {syncConfidenceAxes} from "../../src/charts/Plot/confidenceAxes.ts";

useJsdom();

/**
    A bar with an error bar anchors its label at its base, and a label
    outside it starts past the whisker's far end.
*/

it("anchorAtBase: flips an end anchor to the base, leaves middle alone", () => {
  assert.strictEqual(anchorAtBase("end"), "start");
  assert.strictEqual(anchorAtBase("start"), "end");
  assert.strictEqual(anchorAtBase("top"), "bottom");
  assert.strictEqual(anchorAtBase("bottom"), "top");
  assert.strictEqual(anchorAtBase("middle"), "middle");
});

/** A horizontal BarChart whose x axis places a value at 10px per unit from 0. */
function chart(config = {}) {
  const viz = new BarChart()
    .discrete("y")
    .x("v")
    .y("id")
    .confidence(["lo", "hi"])
    .config(config);
  syncConfidenceAxes(viz);
  viz._xAxis = {_getPosition: v => v * 10};
  viz._yAxis = {_getPosition: v => 400 - v * 10};
  return viz;
}

it("barErrorReach: how far the whisker reaches past the bar's end, in pixels", () => {
  const viz = chart();
  assert.strictEqual(barErrorReach(viz, {v: 20, lo: 15, hi: 26}, 0), 60);
  // A whisker that stops short of the end reaches nothing past it.
  assert.strictEqual(barErrorReach(viz, {v: 20, lo: 15, hi: 19}, 0), 0);
  // A negative bar grows left: its lower bound reaches past its end.
  assert.strictEqual(barErrorReach(viz, {v: -20, lo: -24, hi: -18}, 0), 40);
  // No bound, no error bar.
  assert.strictEqual(barErrorReach(viz, {v: 20}, 0), null);
  assert.strictEqual(barErrorReach(new BarChart().x("v"), {v: 20}, 0), null);
});

it("barErrorReach: upright bars grow up the y axis; stacked bars report 0", () => {
  const upright = chart({discrete: "x", x: "id", y: "v"});
  syncConfidenceAxes(upright);
  assert.strictEqual(barErrorReach(upright, {v: 20, lo: 18, hi: 25}, 0), 50);
  const stacked = chart({stacked: true});
  assert.strictEqual(barErrorReach(stacked, {v: 20, lo: 15, hi: 26}, 0), 0);
});
