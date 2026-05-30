import assert from "assert";
import it from "../jsdom.js";
import {Bar, BarChart, Circle, Line} from "../../es/index.js";

/**
    Shape events on the scene path.

    Compute-mode shapes mount no per-shape DOM, so the `shape.on(evt, fn)`
    bindings in `_wirePlotShapeEvents` never fire under the scene renderers.
    Pointer events are routed instead by the `Viz._drawSceneToTarget` bridge,
    which reads the picked node's stamped `shapeType` to dispatch global,
    `.shape`, and shape-class-scoped (`.Bar`) handlers identically on SVG and
    Canvas.

    Layer 1 locks the emit stamp: every shape leaf carries the emitting
    shape's `_name` as `shapeType`. Layer 2 drives the bridge's dispatch
    closure directly with a synthetic pick, asserting which `viz.schema.on`
    keys fire for a given picked node.
*/

// ---- Layer 1: emit stamp (Shape.toScene) -----------------------------------

it("Shape.toScene stamps each leaf with the emitting shape's type", () => {
  const bar = new Bar()
    .data([{id: "a", x: 0, y: 0, width: 10, height: 10}])
    .toScene();
  assert.strictEqual(bar.children[0].shapeType, "Bar", "Bar leaf stamped");

  const circle = new Circle()
    .data([{id: "c"}]).r(8).x(20).y(30)
    .toScene();
  assert.strictEqual(circle.children[0].shapeType, "Circle", "Circle leaf stamped");
});

it("Line.toScene stamps shapeType = 'Line'", () => {
  const line = new Line()
    .data([
      {id: "S1", x: 0, y: 0}, {id: "S1", x: 10, y: 5}, {id: "S1", x: 20, y: 2},
    ])
    .x(d => d.x)
    .y(d => d.y)
    .toScene();
  assert.ok(line.children.length >= 1, "line emitted");
  assert.strictEqual(line.children[0].shapeType, "Line", "Line leaf stamped");
});

// ---- Layer 2: bridge dispatch ----------------------------------------------

// Register the bridge by mounting the scene renderer, then return its single
// subscriber. `_drawSceneToTarget` needs only a `_select` target — no full
// draw — because we feed the bridge fabricated picks below.
function bridgeHandler(chart) {
  chart._chartScene = [];
  chart._featurePanels = [];
  chart._drawSceneToTarget();
  const handlers = chart._sceneRenderer && chart._sceneRenderer._handlers;
  assert.ok(handlers && handlers.size >= 1, "bridge handler registered");
  return [...handlers][0];
}

function syntheticEvent(type, node) {
  return {
    type,
    point: [0, 0],
    pick: {node, datum: node.datum, index: node.index},
    nativeEvent: {},
  };
}

function newChart() {
  return new BarChart()
    .data([{group: "A", x: "Q1", y: 10}])
    .groupBy("group")
    .x("x").y("y").width(400).height(300)
    .select(document.body.appendChild(document.createElement("div")));
}

it("bridge fires global + .shape + .<shapeType> for a chart shape, not other classes", () => {
  const chart = newChart();
  const fired = [];
  chart.on("click", () => fired.push("global"));
  chart.on("click.shape", () => fired.push("shape"));
  chart.on("click.Bar", () => fired.push("Bar"));
  chart.on("click.Circle", () => fired.push("Circle"));

  const handler = bridgeHandler(chart);
  const barNode = {key: "a", shapeType: "Bar", datum: {id: "a"}, index: 0};
  handler(syntheticEvent("click", barNode));

  assert.deepStrictEqual(
    fired.sort(),
    ["Bar", "global", "shape"],
    "Bar shape dispatches its class key + .shape + global, never .Circle",
  );
});

it("bridge does NOT fire shape-class handlers for legend nodes", () => {
  const chart = newChart();
  const fired = [];
  chart.on("click", () => fired.push("global"));
  chart.on("click.legend", () => fired.push("legend"));
  chart.on("click.Rect", () => fired.push("Rect"));

  const handler = bridgeHandler(chart);
  // Legend swatches are Rect shapes; their stamped type must not masquerade
  // as a chart-shape handler.
  const legendNode = {key: "viz-legend-swatch-A", shapeType: "Rect", datum: {id: "A"}, index: 0};
  handler(syntheticEvent("click", legendNode));

  assert.ok(fired.includes("legend"), "legend handler fires");
  assert.ok(fired.includes("global"), "global handler fires");
  assert.ok(!fired.includes("Rect"), "shape-class handler suppressed for legend nodes");
});
