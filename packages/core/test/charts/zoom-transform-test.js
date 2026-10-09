import assert from "assert";
import it from "../jsdom.js";
import {BarChart} from "../../es/index.js";

/**
    v4 zoom-transform threading: `zoomed()` writes `viz._zoomTransform`
    on every d3-zoom event; `Viz.toScene()` wraps `_chartScene` in a
    `viz-zoom` group whose `transform` reflects pan + scale. Without
    these tests a regression that drops the threading (or applies it
    in the wrong place in the scene tree) goes unnoticed: nothing else
    exercises Network/Geomap pan/zoom in the suite.
*/

function findGroup(scene, key) {
  const stack = [scene.root];
  while (stack.length) {
    const node = stack.pop();
    if (!node) continue;
    if (node.key === key) return node;
    if (node.type === "group" && Array.isArray(node.children)) {
      for (const c of node.children) stack.push(c);
    }
  }
  return null;
}

it("toScene() emits viz-zoom group with an identity transform when _zoomTransform is unset", () => {
  const chart = new BarChart()
    .data([{id: "a", x: 1, y: 10}])
    .groupBy(["id"]);
  // Need _chartScene populated so the chart-cells branch fires.
  chart._chartScene = [
    {type: "rect", key: "r1", x: 0, y: 0, width: 10, height: 10},
  ];
  chart._zoomTransform = undefined;
  chart.schema.width = 400;
  chart.schema.height = 300;
  const scene = chart.toScene();
  const cells = findGroup(scene, "viz-chart-cells");
  assert.ok(cells, "viz-chart-cells group exists when _chartScene has content");
  // The viz-zoom group is ALWAYS emitted (identity transform when no zoom is
  // active) so its key stays stable across the first zoom — otherwise the chart
  // cells exit+enter (teardown/rebuild) instead of tweening the zoom in.
  const zoom = findGroup(scene, "viz-zoom");
  assert.ok(zoom, "viz-zoom group present with identity transform");
  assert.deepStrictEqual(
    zoom.transform,
    {x: 0, y: 0, scale: 1},
    "identity transform when no zoom is active",
  );
  const rect = findGroup({root: zoom}, "r1");
  assert.ok(rect, "chart-scene rect lives inside viz-zoom");
});

it("toScene() wraps _chartScene in a viz-zoom group when _zoomTransform is set", () => {
  const chart = new BarChart()
    .data([{id: "a", x: 1, y: 10}])
    .groupBy(["id"]);
  chart._chartScene = [
    {type: "rect", key: "r1", x: 0, y: 0, width: 10, height: 10},
  ];
  chart._zoomTransform = {x: 25, y: 50, scale: 2};
  chart.schema.width = 400;
  chart.schema.height = 300;
  const scene = chart.toScene();
  const zoom = findGroup(scene, "viz-zoom");
  assert.ok(zoom, "viz-zoom group present when _zoomTransform is set");
  assert.deepStrictEqual(
    zoom.transform,
    {x: 25, y: 50, scale: 2},
    "viz-zoom transform reflects _zoomTransform",
  );
  // The rect lives INSIDE the viz-zoom group.
  const rect = findGroup({root: zoom}, "r1");
  assert.ok(rect, "chart-scene rect lives inside viz-zoom");
});

it("toScene() composes _zoomTransform OUTSIDE the chart transform", () => {
  // Order matters: viz-zoom carries the user-driven zoom in surface space
  // (the space d3-zoom measures the pointer in), and viz-chart-body inside it
  // carries the chart-positioning transform. viz-chart-cells is left
  // untransformed so its clip stays fixed in surface space while content pans
  // and scales beneath it. Legend/title/etc. live in sibling viz-* groups.
  const chart = new BarChart()
    .data([{id: "a", x: 1, y: 10}])
    .groupBy(["id"]);
  chart._chartScene = [
    {type: "rect", key: "r1", x: 0, y: 0, width: 10, height: 10},
  ];
  chart._chartTransform = {x: 10, y: 20};
  chart._zoomTransform = {x: 30, y: 40, scale: 1.5};
  chart.schema.width = 400;
  chart.schema.height = 300;
  const scene = chart.toScene();
  const cells = findGroup(scene, "viz-chart-cells");
  assert.strictEqual(cells.transform, undefined, "chart-cells group is untransformed");
  const zoomChild = cells.children.find(c => c.key === "viz-zoom");
  assert.ok(zoomChild, "viz-zoom is a child of viz-chart-cells");
  assert.deepStrictEqual(
    zoomChild.transform,
    {x: 30, y: 40, scale: 1.5},
    "viz-zoom carries _zoomTransform",
  );
  const body = zoomChild.children.find(c => c.key === "viz-chart-body");
  assert.ok(body, "viz-chart-body is a child of viz-zoom");
  assert.deepStrictEqual(body.transform, {x: 10, y: 20}, "viz-chart-body carries _chartTransform");
  assert.ok(body.children.find(c => c.key === "r1"), "chart content lives in viz-chart-body");
});

it("toScene() clips zoomable charts to the chart area", () => {
  const chart = new BarChart()
    .data([{id: "a", x: 1, y: 10}])
    .groupBy(["id"]);
  chart._chartScene = [
    {type: "rect", key: "r1", x: 0, y: 0, width: 10, height: 10},
  ];
  chart.schema.width = 400;
  chart.schema.height = 300;
  chart._margin = {top: 30, right: 0, bottom: 20, left: 10};
  chart.zoom(false);
  assert.strictEqual(
    findGroup(chart.toScene(), "viz-chart-cells").clip,
    undefined,
    "no clip while zoom is off",
  );
  chart.zoom(true);
  assert.deepStrictEqual(
    findGroup(chart.toScene(), "viz-chart-cells").clip,
    {type: "rect", x: 10, y: 30, width: 390, height: 250},
    "clip is the margin-inset chart area",
  );
});

it("Clearing _zoomTransform back to undefined resets the viz-zoom group to identity", () => {
  const chart = new BarChart()
    .data([{id: "a", x: 1, y: 10}])
    .groupBy(["id"]);
  chart._chartScene = [
    {type: "rect", key: "r1", x: 0, y: 0, width: 10, height: 10},
  ];
  chart.schema.width = 400;
  chart.schema.height = 300;
  chart._zoomTransform = {x: 5, y: 5, scale: 1.2};
  const zoomed = findGroup(chart.toScene(), "viz-zoom");
  assert.deepStrictEqual(zoomed.transform, {x: 5, y: 5, scale: 1.2}, "viz-zoom reflects the zoom");
  chart._zoomTransform = undefined;
  // The group stays (stable key); its transform falls back to identity.
  const cleared = findGroup(chart.toScene(), "viz-zoom");
  assert.ok(cleared, "viz-zoom group remains after clear for stable keying");
  assert.deepStrictEqual(
    cleared.transform,
    {x: 0, y: 0, scale: 1},
    "transform reset to identity after clear",
  );
});
