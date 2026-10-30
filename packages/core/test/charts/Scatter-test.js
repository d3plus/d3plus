import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {Plot, Scatter} from "../../index.ts";
import {scatterDef} from "../../internal.ts";

useJsdom();

it("Scatter — a Plot drawing every row as a point on continuous axes", () => {
  const viz = new Scatter();
  assert.ok(viz instanceof Plot);
  assert.strictEqual(scatterDef.name, "Scatter");
  assert.strictEqual(viz.shape()({}, 0), "Circle");
  assert.strictEqual(viz.discrete(), undefined, "no category axis");
  assert.strictEqual(viz.sizeMin(), 5, "points keep Plot's radius");
  assert.strictEqual(viz.sizeZero(), false);
});

it("Scatter — user config wins over its defaults", () => {
  const viz = new Scatter().config({shape: "Rect", discrete: "x", sizeMin: 3});
  assert.strictEqual(viz.shape()({}, 0), "Rect");
  assert.strictEqual(viz.discrete(), "x");
  assert.strictEqual(viz.sizeMin(), 3);
  assert.strictEqual(new Scatter().shape()({}, 0), "Circle", "per instance");
});
