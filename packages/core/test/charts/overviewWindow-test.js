import {it} from "vitest";
import assert from "assert";
import {
  clampWindow,
  keyWindow,
  moveWindow,
  resizeWindow,
  scaleWindow,
  spanWindow,
} from "../../src/charts/Plot/overviewWindow.ts";

/**
    `overviewWindow.ts`: the window math behind an overview chart's band,
    which always stays inside the overview's domain.
*/

const domain = [0, 100];

it("clampWindow: slides a window inside the domain, keeping its length", () => {
  assert.deepStrictEqual(clampWindow([-10, 10], domain), [0, 20]);
  assert.deepStrictEqual(clampWindow([95, 115], domain), [80, 100]);
  assert.deepStrictEqual(clampWindow([20, 30], domain), [20, 30]);
  assert.deepStrictEqual(clampWindow([-50, 150], domain), [0, 100]);
});

it("moveWindow: moves by a delta, stopping at the domain's ends", () => {
  assert.deepStrictEqual(moveWindow([20, 30], 15, domain), [35, 45]);
  assert.deepStrictEqual(moveWindow([20, 30], -50, domain), [0, 10]);
});

it("resizeWindow: drags one edge, swapping past the other, at least minSpan long", () => {
  assert.deepStrictEqual(resizeWindow([20, 40], "end", 60, domain), [20, 60]);
  assert.deepStrictEqual(resizeWindow([20, 40], "start", 10, domain), [10, 40]);
  assert.deepStrictEqual(resizeWindow([20, 40], "start", 50, domain), [40, 50]);
  assert.deepStrictEqual(resizeWindow([20, 40], "end", 120, domain), [20, 100]);
  assert.deepStrictEqual(
    resizeWindow([20, 40], "end", 21, domain, 10),
    [15.5, 25.5],
  );
});

it("spanWindow: the window between two values, either way round", () => {
  assert.deepStrictEqual(spanWindow(70, 30, domain), [30, 70]);
  assert.deepStrictEqual(spanWindow(-5, 30, domain), [0, 30]);
  assert.deepStrictEqual(spanWindow(50, 50, domain, 4), [48, 52]);
});

it("scaleWindow: narrows or widens about an anchor that stays put", () => {
  assert.deepStrictEqual(scaleWindow([20, 60], 2, 40, domain), [30, 50]);
  assert.deepStrictEqual(scaleWindow([20, 60], 2, 20, domain), [20, 40]);
  assert.deepStrictEqual(scaleWindow([20, 60], 0.5, 40, domain), [0, 80]);
  assert.deepStrictEqual(scaleWindow([20, 60], 0.1, 40, domain), [0, 100]);
  assert.deepStrictEqual(
    scaleWindow([20, 60], 100, 40, domain, 5),
    [37.5, 42.5],
  );
});

it("keyWindow: arrow keys, Page Up/Down, Home/End, and + and −", () => {
  const w = [20, 40];
  assert.deepStrictEqual(keyWindow(w, "ArrowRight", false, domain), [22, 42]);
  assert.deepStrictEqual(keyWindow(w, "ArrowUp", false, domain), [22, 42]);
  assert.deepStrictEqual(keyWindow(w, "ArrowLeft", false, domain), [18, 38]);
  assert.deepStrictEqual(keyWindow(w, "ArrowDown", true, domain), [0, 20]);
  assert.deepStrictEqual(keyWindow(w, "PageUp", false, domain), [40, 60]);
  assert.deepStrictEqual(keyWindow(w, "PageDown", false, domain), [0, 20]);
  assert.deepStrictEqual(keyWindow(w, "Home", false, domain), [0, 20]);
  assert.deepStrictEqual(keyWindow(w, "End", false, domain), [80, 100]);
  assert.deepStrictEqual(keyWindow(w, "+", false, domain), [25, 35]);
  assert.deepStrictEqual(keyWindow(w, "=", false, domain), [25, 35]);
  assert.deepStrictEqual(keyWindow(w, "-", false, domain), [10, 50]);
  assert.deepStrictEqual(keyWindow(w, "+", false, domain, 4), [27.5, 32.5]);
  assert.strictEqual(keyWindow(w, "Enter", false, domain), null);
});
