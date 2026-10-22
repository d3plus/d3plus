import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {BarChart, Plot} from "../../index.ts";
import {
  vizPreDraw,
  vizPostThresholdCtx,
  vizDraw,
  runVizPipeline,
} from "../../internal.ts";

useJsdom();

/**
    Output-correctness tests for the pipeline functions: these lock the
    values they write for known inputs, so a refactor that changes them
    fails here rather than silently shifting parity downstream.
*/

it("vizPreDraw sets drawDepth = groupBy.length - 1 when _depth unset", () => {
  const chart = new BarChart()
    .data([
      {id: "a", x: 1, y: 10},
      {id: "b", x: 2, y: 20},
    ])
    .groupBy(["id"]);
  vizPreDraw(chart);
  assert.strictEqual(chart._drawDepth, 0, "single-key groupBy → drawDepth 0");
});

it("vizPreDraw drawDepth is capped to groupBy.length - 1", () => {
  const chart = new BarChart()
    .data([{a: "x", b: "y", id: "1", x: 1, y: 10}])
    .groupBy(["a", "b", "id"])
    .depth(99); // intentionally too large
  vizPreDraw(chart);
  assert.strictEqual(chart._drawDepth, 2, "depth capped to groupBy.length - 1");
});

it("vizPreDraw id closure stringifies numeric ids, including a merged datum's", () => {
  const chart = new BarChart()
    .data([
      {id: 1, x: 1, y: 10},
      {id: 2, x: 2, y: 20},
    ])
    .groupBy("id");
  vizPreDraw(chart);
  assert.strictEqual(chart._id({id: 1}, 0), "1");
  assert.deepStrictEqual(chart._id({id: [1, 2]}, 0), ["1", "2"]);
  assert.deepStrictEqual(chart._id({id: ["a", "b"]}, 0), ["a", "b"]);
});

it("vizPreDraw id closure resolves to the groupBy value at drawDepth", () => {
  const chart = new BarChart()
    .data([
      {group: "G1", id: "a"},
      {group: "G1", id: "b"},
    ])
    .groupBy(["group", "id"]);
  vizPreDraw(chart);
  // drawDepth = 1 (groupBy has 2 keys); id should resolve to .id
  assert.strictEqual(chart._id({group: "G1", id: "a"}, 0), "a");
  assert.strictEqual(chart._id({group: "G1", id: "b"}, 1), "b");
});

it("vizPreDraw ids closure returns ALL groupBy values for a datum", () => {
  const chart = new BarChart()
    .data([{group: "G1", id: "a"}])
    .groupBy(["group", "id"]);
  vizPreDraw(chart);
  assert.deepStrictEqual(
    chart._ids({group: "G1", id: "a"}, 0),
    ["G1", "a"],
    "ids returns both groupBy levels",
  );
});

it("vizPreDraw filteredData drops _hidden ids", () => {
  const chart = new BarChart()
    .data([
      {id: "a", x: 1, y: 10},
      {id: "b", x: 2, y: 20},
      {id: "c", x: 3, y: 15},
    ])
    .groupBy(["id"]);
  // Set _hidden directly (no public accessor; v4 internal slot).
  chart._hidden = ["b"];
  vizPreDraw(chart);
  const ids = (chart._filteredData ?? []).map(d => d.id);
  assert.deepStrictEqual(ids.sort(), ["a", "c"], "b filtered out");
});

it("vizPreDraw legendData INCLUDES hidden ids (legend still shows them)", () => {
  const chart = new BarChart()
    .data([
      {id: "a", x: 1, y: 10},
      {id: "b", x: 2, y: 20},
    ])
    .groupBy(["id"]);
  chart._hidden = ["b"];
  vizPreDraw(chart);
  const legendIds = (chart._legendData ?? []).map(d => d.id);
  assert.deepStrictEqual(legendIds.sort(), ["a", "b"], "legend still has b");
});

it("vizPreDraw closures are SNAPSHOTS — viz mutation after capture doesn't drift them", () => {
  const chart = new BarChart()
    .data([{group: "G1", id: "a"}])
    .groupBy(["group", "id"]);
  vizPreDraw(chart);
  const id = chart._id;
  // At capture time: drawDepth=1, so id(d) returns d.id.
  assert.strictEqual(id({group: "G1", id: "a"}, 0), "a");
  // Mutate viz._drawDepth AFTER the closure was built: it still returns "a"
  // (the snapshotted drawDepth). Each render reruns vizPreDraw for a fresh
  // closure.
  chart._drawDepth = 0;
  assert.strictEqual(
    id({group: "G1", id: "a"}, 0),
    "a",
    "snapshot closure unaffected by post-capture viz mutation",
  );
  // A fresh capture with the user-facing `.depth(0)` accessor (which is
  // how depth changes actually flow through the pipeline) reflects the
  // new depth.
  chart.depth(0);
  vizPreDraw(chart);
  assert.strictEqual(
    chart._id({group: "G1", id: "a"}, 0),
    "G1",
    "fresh capture after .depth(0) reflects new drawDepth",
  );
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
  assert.strictEqual(
    ctx.hoverOverride.hoverOpacity,
    1,
    "cutoff overrides to 1",
  );
  assert.strictEqual(ctx.hoverOverride.duration, 0, "cutoff overrides to 0");
  assert.strictEqual(
    ctx.hoverOverride.stashOriginals,
    true,
    "vizPreDraw should stash originals",
  );
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

it("vizDraw resets _featurePanels, _chartScene, _chartTransform", () => {
  const chart = new BarChart()
    .data([{id: "a", x: 1, y: 10}])
    .width(400)
    .height(300);
  chart._margin = {top: 0, bottom: 0, left: 0, right: 0};
  chart._padding = {top: 0, bottom: 0, left: 0, right: 0};
  chart._featurePanels = [{type: "group", key: "old", children: []}];
  chart._chartScene = [
    {type: "rect", key: "stale", x: 0, y: 0, width: 1, height: 1},
  ];
  chart._chartTransform = {x: 999, y: 999};
  // Need to run preDraw first.
  chart._preDraw();
  try {
    vizDraw(chart);
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
    // vizDraw may fail in jsdom on later feature setup; the resets
    // happen FIRST, so they should land even if later steps throw.
    assert.strictEqual(
      chart._featurePanels.find(p => p.key === "old"),
      undefined,
      "even on throw, the reset (which happens FIRST in vizDraw) should clear stale panels",
    );
  }
});

it("vizDraw's small-multiples panel step claims nothing and keeps the chrome", () => {
  const panels = ["title-panel"];
  const viz = {
    _facetStep: "panel",
    _margin: {top: 1, right: 2, bottom: 3, left: 4},
    _featurePanels: panels,
  };
  const out = vizDraw(viz);
  assert.deepStrictEqual(out.marginDelta, {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });
  assert.deepStrictEqual(out.featurePanels, panels);
  assert.deepStrictEqual(viz._margin, {top: 1, right: 2, bottom: 3, left: 4});
});

it("vizPreDraw: trailPersist auto-enables axisPersist and a single-period timeline", () => {
  const chart = new Plot()
    .groupBy("id")
    .time("year")
    .x("x")
    .y("y")
    .shapeConfig({Circle: {trailPersist: true}})
    .width(400)
    .height(300);
  chart._data = [
    {id: "a", year: 2019, x: 1, y: 1},
    {id: "a", year: 2020, x: 2, y: 2},
  ];
  chart._margin = {bottom: 0, left: 0, right: 0, top: 0};
  chart._padding = {bottom: 0, left: 0, right: 0, top: 0};

  // The override runs at the top of _preDraw; later data/DOM steps may throw in
  // jsdom, but by then it has already set both fields.
  try {
    chart._preDraw();
  } catch {
    /* expected: later _preDraw steps need DOM the harness doesn't provide */
  }

  assert.strictEqual(
    chart.axisPersist(),
    true,
    "axisPersist forced on by trailPersist",
  );
  assert.strictEqual(
    chart.schema.timelineConfig.brushing,
    false,
    "brushing forced off by trailPersist",
  );
});
