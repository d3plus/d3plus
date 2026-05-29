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

it("toScene() omits viz-zoom group when _zoomTransform is unset", () => {
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
  // No nested viz-zoom group — children are the chart cells directly.
  const zoom = findGroup(scene, "viz-zoom");
  assert.strictEqual(zoom, null, "viz-zoom group absent when no _zoomTransform");
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
  const rect = zoom.children.find(c => c.key === "r1");
  assert.ok(rect, "chart-scene rect lives inside viz-zoom");
});

it("toScene() composes _chartTransform OUTSIDE the viz-zoom group", () => {
  // Order matters: chart-cells group carries the chart-positioning
  // transform; viz-zoom is its CHILD, carrying the user-driven zoom.
  // So pan/scale apply to chart content WITHOUT moving legend/title/etc.
  // (those live in sibling viz-* groups).
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
  assert.deepStrictEqual(
    cells.transform,
    {x: 10, y: 20},
    "chart-cells group carries _chartTransform",
  );
  // The viz-zoom group is a CHILD of cells.
  const zoomChild = cells.children.find(c => c.key === "viz-zoom");
  assert.ok(zoomChild, "viz-zoom is a child of viz-chart-cells");
  assert.deepStrictEqual(
    zoomChild.transform,
    {x: 30, y: 40, scale: 1.5},
    "viz-zoom carries _zoomTransform separately",
  );
});

it("Clearing _zoomTransform back to undefined removes the viz-zoom group", () => {
  const chart = new BarChart()
    .data([{id: "a", x: 1, y: 10}])
    .groupBy(["id"]);
  chart._chartScene = [
    {type: "rect", key: "r1", x: 0, y: 0, width: 10, height: 10},
  ];
  chart.schema.width = 400;
  chart.schema.height = 300;
  chart._zoomTransform = {x: 5, y: 5, scale: 1.2};
  assert.ok(findGroup(chart.toScene(), "viz-zoom"), "viz-zoom present");
  chart._zoomTransform = undefined;
  assert.strictEqual(
    findGroup(chart.toScene(), "viz-zoom"),
    null,
    "viz-zoom gone after clear",
  );
});
