import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {StackedArea, Streamgraph} from "../../index.ts";
import {streamgraphDef, streamValueAxis} from "../../internal.ts";
import {
  resolveStackOffset,
  resolveStackOrder,
} from "../../src/charts/Plot/stackHelpers.ts";

useJsdom();

it("Streamgraph — a StackedArea centered on a silhouette baseline", () => {
  const viz = new Streamgraph();
  assert.ok(viz instanceof StackedArea);
  assert.strictEqual(streamgraphDef.name, "Streamgraph");
  assert.strictEqual(viz.stacked(), true);
  assert.strictEqual(viz.stackOffset(), resolveStackOffset("silhouette"));
  assert.strictEqual(viz.stackOrder(), resolveStackOrder("insideOut"));
  assert.strictEqual(viz.axisHover(), "x", "no badge on the value axis");
  assert.strictEqual(viz.shapeConfig().Area.curve, "monotoneX");
  assert.ok(viz.shapeConfig().Area.labelConfig, "keeps Plot's Area config");
  assert.deepStrictEqual(viz.yConfig().labels, []);
  assert.deepStrictEqual(viz.yConfig().ticks, []);
  assert.ok(viz.yConfig().gridConfig, "keeps Plot's y config");
});

it("streamValueAxis — hides the value axis's labels and ticks", () => {
  assert.deepStrictEqual(streamValueAxis, {labels: [], ticks: []});
});

it("Streamgraph — user config wins over its defaults", () => {
  const viz = new Streamgraph().config({
    axisHover: true,
    shapeConfig: {Area: {curve: "linear"}},
    stackOffset: "wiggle",
    stackOrder: "descending",
    yConfig: {labels: [10], ticks: [10]},
  });
  assert.strictEqual(viz.stackOffset(), resolveStackOffset("wiggle"));
  assert.strictEqual(viz.stackOrder(), resolveStackOrder("descending"));
  assert.strictEqual(viz.axisHover(), true);
  assert.strictEqual(viz.shapeConfig().Area.curve, "linear");
  assert.deepStrictEqual(viz.yConfig().labels, [10]);
  assert.deepStrictEqual(viz.yConfig().ticks, [10]);
  const fresh = new Streamgraph();
  assert.strictEqual(
    fresh.stackOffset(),
    resolveStackOffset("silhouette"),
    "per instance",
  );
  assert.deepStrictEqual(fresh.yConfig().labels, []);
});
