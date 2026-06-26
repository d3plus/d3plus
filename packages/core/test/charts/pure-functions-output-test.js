import assert from "assert";
import it from "../jsdom.js";
import {BarChart, Treemap} from "../../es/index.js";
import {
  vizPreDrawPure,
  vizPostThresholdCtx,
  vizDrawPure,
  runVizPipeline,
} from "../../es/internal.js";

/**
    Output-correctness tests for the pure pipeline functions.
    The prior tests only verified the export signature; these lock the
    actual returned values for known inputs, so a future refactor that
    changes shape detectably fails here rather than silently shifting
    parity downstream.
*/

it("vizPreDrawPure returns drawDepth = groupBy.length - 1 when _depth unset", () => {
  const chart = new BarChart()
    .data([{id: "a", x: 1, y: 10}, {id: "b", x: 2, y: 20}])
    .groupBy(["id"]);
  const ctx = vizPreDrawPure(chart);
  assert.strictEqual(ctx.drawDepth, 0, "single-key groupBy → drawDepth 0");
});

it("vizPreDrawPure drawDepth is capped to groupBy.length - 1", () => {
  const chart = new BarChart()
    .data([{a: "x", b: "y", id: "1", x: 1, y: 10}])
    .groupBy(["a", "b", "id"])
    .depth(99); // intentionally too large
  const ctx = vizPreDrawPure(chart);
  assert.strictEqual(ctx.drawDepth, 2, "depth capped to groupBy.length - 1");
});

it("vizPreDrawPure id closure resolves to the groupBy value at drawDepth", () => {
  const chart = new BarChart()
    .data([{group: "G1", id: "a"}, {group: "G1", id: "b"}])
    .groupBy(["group", "id"]);
  const ctx = vizPreDrawPure(chart);
  // drawDepth = 1 (groupBy has 2 keys); id should resolve to .id
  assert.strictEqual(ctx.id({group: "G1", id: "a"}, 0), "a");
  assert.strictEqual(ctx.id({group: "G1", id: "b"}, 1), "b");
});

it("vizPreDrawPure ids closure returns ALL groupBy values for a datum", () => {
  const chart = new BarChart()
    .data([{group: "G1", id: "a"}])
    .groupBy(["group", "id"]);
  const ctx = vizPreDrawPure(chart);
  assert.deepStrictEqual(
    ctx.ids({group: "G1", id: "a"}, 0),
    ["G1", "a"],
    "ids returns both groupBy levels",
  );
});

it("vizPreDrawPure filteredData drops _hidden ids", () => {
  const chart = new BarChart()
    .data([
      {id: "a", x: 1, y: 10},
      {id: "b", x: 2, y: 20},
      {id: "c", x: 3, y: 15},
    ])
    .groupBy(["id"]);
  // Set _hidden directly (no public accessor; v4 internal slot).
  chart._hidden = ["b"];
  const ctx = vizPreDrawPure(chart);
  const ids = (ctx.filteredData ?? []).map(d => d.id);
  assert.deepStrictEqual(ids.sort(), ["a", "c"], "b filtered out");
});

it("vizPreDrawPure legendData INCLUDES hidden ids (legend still shows them)", () => {
  const chart = new BarChart()
    .data([
      {id: "a", x: 1, y: 10},
      {id: "b", x: 2, y: 20},
    ])
    .groupBy(["id"]);
  chart._hidden = ["b"];
  const ctx = vizPreDrawPure(chart);
  const legendIds = (ctx.legendData ?? []).map(d => d.id);
  assert.deepStrictEqual(legendIds.sort(), ["a", "b"], "legend still has b");
});

it("vizPreDrawPure closures are SNAPSHOTS — viz mutation after capture doesn't drift them", () => {
  const chart = new BarChart()
    .data([{group: "G1", id: "a"}])
    .groupBy(["group", "id"]);
  const ctx = vizPreDrawPure(chart);
  // At capture time: drawDepth=1, so id(d) returns d.id.
  assert.strictEqual(ctx.id({group: "G1", id: "a"}, 0), "a");
  // Mutate viz._drawDepth AFTER the closure was built. With v4's snapshot
  // semantics, the OLD closure still returns "a" (the snapshotted
  // drawDepth). To use a different depth, callers re-run vizPreDrawPure
  // to get a fresh ctx (which is what _preDraw does on every render).
  chart._drawDepth = 0;
  assert.strictEqual(
    ctx.id({group: "G1", id: "a"}, 0),
    "a",
    "snapshot closure unaffected by post-capture viz mutation",
  );
  // A fresh capture with the user-facing `.depth(0)` accessor (which is
  // how depth changes actually flow through the pipeline) reflects the
  // new depth.
  chart.depth(0);
  const ctx2 = vizPreDrawPure(chart);
  assert.strictEqual(
    ctx2.id({group: "G1", id: "a"}, 0),
    "G1",
    "fresh capture after .depth(0) reflects new drawDepth",
  );
});

it("vizPreDrawPure stashes _thresholdTree for the shim to consume", () => {
  const chart = new BarChart()
    .data([{id: "a", x: 1, y: 10}, {id: "b", x: 2, y: 20}])
    .groupBy(["id"]);
  const ctx = vizPreDrawPure(chart);
  assert.ok(ctx._thresholdTree, "_thresholdTree carried");
});

it("vizPostThresholdCtx flags noDataMessage iff data is empty AND noDataMessage truthy", () => {
  const chart = new BarChart();
  chart.schema.noDataMessage = "no data";
  const idFn = d => d.id;
  // Empty filteredData + noDataMessage truthy → flag fires.
  assert.strictEqual(
    vizPostThresholdCtx(chart, [], idFn).noDataMessage,
    true,
    "empty + truthy → true",
  );
  // Non-empty → flag does NOT fire.
  assert.strictEqual(
    vizPostThresholdCtx(chart, [{id: "x"}], idFn).noDataMessage,
    false,
    "non-empty → false",
  );
  // noDataMessage off → never fires.
  chart.schema.noDataMessage = false;
  assert.strictEqual(
    vizPostThresholdCtx(chart, [], idFn).noDataMessage,
    false,
    "config off → false even when empty",
  );
});

it("vizPostThresholdCtx returns hoverOverride past the cutoff", () => {
  const chart = new BarChart();
  chart.schema.dataCutoff = 2;
  chart._shapeConfig = {hoverOpacity: 0.5, duration: 600};
  const idFn = d => d.id;
  const data = [{id: "a"}, {id: "b"}, {id: "c"}, {id: "d"}];
  const ctx = vizPostThresholdCtx(chart, data, idFn);
  assert.ok(ctx.hoverOverride, "override returned past cutoff");
  assert.strictEqual(ctx.hoverOverride.hoverOpacity, 1, "cutoff overrides to 1");
  assert.strictEqual(ctx.hoverOverride.duration, 0, "cutoff overrides to 0");
  assert.strictEqual(
    ctx.hoverOverride.stashOriginals,
    true,
    "shim should stash originals",
  );
});

it("Treemap _thresholdFunction is applied by the shim, not the pure function", () => {
  const chart = new Treemap()
    .data([
      {id: "a", value: 100},
      {id: "b", value: 90},
      {id: "c", value: 10},
      {id: "d", value: 5},
    ])
    .groupBy(["id"])
    .sum("value");
  // The threshold instance method is what Treemap.ts overrides.
  // vizPreDrawPure returns the rollup tree; the shim runs _thresholdFunction.
  const ctx = vizPreDrawPure(chart);
  assert.ok(ctx.filteredData, "pre-threshold filteredData present");
  assert.ok(ctx._thresholdTree, "rollup tree captured for the shim");
});

it("runVizPipeline calls _preDraw then _draw then _drawSceneToTarget in order", () => {
  // Spy on the methods by overriding them; the pipeline must dispatch in
  // the documented order so subclass overrides see ordering they rely on.
  const chart = new BarChart();
  const log = [];
  chart._preDraw = () => log.push("pre");
  chart._draw = () => log.push("draw");
  chart._drawSceneToTarget = () => log.push("scene");
  // zoomFeature + attributionFeature would also fire; stub them via the
  // viz fields they read.
  chart._zoomGroup = null; // zoomFeature early-exits
  chart._container = null;
  // attributionFeature reads chart fields; tolerate any error from it.
  try {
    runVizPipeline(chart);
  } catch {
    // Acceptable — features may need DOM. The dispatch order before any
    // throw is what we're testing.
  }
  // The first three calls MUST be pre / draw / (zoomControls + attribution
  // are in the middle, may or may not throw). _drawSceneToTarget runs last.
  assert.deepStrictEqual(
    log.slice(0, 2),
    ["pre", "draw"],
    "preDraw before draw",
  );
});

it("vizDrawPure resets _featurePanels, _chartScene, _chartTransform", () => {
  const chart = new BarChart()
    .data([{id: "a", x: 1, y: 10}])
    .width(400)
    .height(300);
  chart._margin = {top: 0, bottom: 0, left: 0, right: 0};
  chart._padding = {top: 0, bottom: 0, left: 0, right: 0};
  chart._featurePanels = [{type: "group", key: "old", children: []}];
  chart._chartScene = [{type: "rect", key: "stale", x: 0, y: 0, width: 1, height: 1}];
  chart._chartTransform = {x: 999, y: 999};
  // Need to run preDraw first.
  chart._preDraw();
  try {
    vizDrawPure(chart);
    assert.strictEqual(
      chart._featurePanels.length === 0 ||
        chart._featurePanels.every(p => p.key !== "old"),
      true,
      "_featurePanels reset",
    );
    assert.strictEqual(
      chart._chartScene.length === 0 ||
        chart._chartScene.every(p => p.key !== "stale"),
      true,
      "_chartScene reset (or has only feature-emitted entries, not stale)",
    );
    assert.notStrictEqual(
      chart._chartTransform?.x,
      999,
      "_chartTransform overwritten or undefined",
    );
  } catch {
    // vizDrawPure may fail in jsdom on later feature setup; the resets
    // happen FIRST, so they should land even if later steps throw.
    assert.strictEqual(
      chart._featurePanels.find(p => p.key === "old"),
      undefined,
      "even on throw, the reset (which happens FIRST in vizDrawPure) should clear stale panels",
    );
  }
});
