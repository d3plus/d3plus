import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {Treemap} from "../../index.ts";
import {applySizeRatio, ratioHeight} from "../../src/charts/viz/sizeRatio.ts";

useJsdom();

/**
    `sizeRatio`: the height a ratio gives a width, and when it sets a chart's
    height (only a height the chart has not been given).
*/

it("ratioHeight: the width divided by the ratio", () => {
  assert.strictEqual(ratioHeight(16 / 9, 1600), 900);
  assert.strictEqual(ratioHeight(1, 500), 500);
  assert.strictEqual(ratioHeight(0.5, 300), 600);
});

it("ratioHeight: undefined for an unusable ratio or width", () => {
  for (const ratio of [undefined, 0, -1, NaN, Infinity, "16/9"])
    assert.strictEqual(ratioHeight(ratio, 500), undefined, String(ratio));
  for (const width of [undefined, 0, -10, NaN])
    assert.strictEqual(ratioHeight(2, width), undefined, String(width));
});

it("applySizeRatio sets a height the chart has not been given", () => {
  const viz = new Treemap().sizeRatio(2);
  viz.schema.width = 800;
  applySizeRatio(viz);
  assert.strictEqual(viz.schema.height, 400);
  assert.strictEqual(viz._sizeRatioHeight, true);
  viz.schema.width = 600;
  applySizeRatio(viz);
  assert.strictEqual(viz.schema.height, 300, "follows the width");
});

it("applySizeRatio leaves an explicit height alone", () => {
  const viz = new Treemap().sizeRatio(2).height(250);
  viz.schema.width = 800;
  applySizeRatio(viz);
  assert.strictEqual(viz.schema.height, 250);
  assert.strictEqual(viz._sizeRatioHeight, false);
});

it("applySizeRatio yields to a height set after the ratio applied", () => {
  const viz = new Treemap().sizeRatio(2);
  viz.schema.width = 800;
  applySizeRatio(viz);
  viz.height(250);
  applySizeRatio(viz);
  assert.strictEqual(viz.schema.height, 250);
});
