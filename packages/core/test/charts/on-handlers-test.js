import assert from "assert";
import it from "../jsdom.js";
import {BarChart, Network, Pack, Treemap} from "../../es/index.js";

/**
    `on(typename, handler)` behaves the same on every chart, including charts
    whose def seeds its own handlers into `on` (Pack) — handlers register, read
    back, merge, and fire from the scene bridge.
*/

const charts = {
  BarChart: {
    make: () => new BarChart().data([{id: "a", x: "Q1", y: 10}]).groupBy("id").x("x").y("y"),
    shapeType: "Bar",
  },
  Network: {
    make: () =>
      new Network()
        .nodes([{id: "a", x: 0, y: 0}, {id: "b", x: 1, y: 1}])
        .links([{source: "a", target: "b"}]),
    shapeType: "Circle",
  },
  Pack: {
    make: () => new Pack().data([{group: "A", id: "a", value: 10}]).groupBy(["group", "id"]).sum("value"),
    shapeType: "Circle",
  },
  Treemap: {
    make: () => new Treemap().data([{id: "a", value: 10}]).groupBy("id").sum("value"),
    shapeType: "Rect",
  },
};

// Mounts the scene renderer without a full draw and returns its pointer-event
// bridge, which dispatches the chart's `schema.on` handlers for a picked node.
function bridgeHandler(chart) {
  chart._chartScene = [];
  chart._featurePanels = [];
  chart._drawSceneToTarget(0);
  return [...chart._sceneRenderer._handlers][0];
}

for (const [name, {make, shapeType}] of Object.entries(charts)) {
  it(`${name}: on(typename, handler) registers, reads back, merges, and fires`, () => {
    const chart = make()
      .width(400)
      .height(300)
      .select(document.body.appendChild(document.createElement("div")));
    const defaults = chart.on();
    const clicked = [];
    const onClick = d => clicked.push(d.id);
    const onLegend = () => undefined;

    assert.strictEqual(chart.on("click.shape", onClick), chart, "on(typename, fn) chains");
    assert.strictEqual(chart.on("click.shape"), onClick, "on(typename) reads the handler back");
    assert.strictEqual(chart.on({"click.legend": onLegend}), chart, "on({…}) chains");

    const handlers = chart.on();
    assert.strictEqual(typeof handlers, "object", "on() returns the handler map");
    assert.strictEqual(handlers["click.legend"], onLegend, "on({…}) merges handlers");
    for (const key of Object.keys(defaults)) {
      if (key === "click.legend") continue;
      assert.strictEqual(handlers[key], defaults[key], `the chart's own ${key} handler is kept`);
    }

    const node = {key: "a", shapeType, datum: {id: "a"}, index: 0};
    bridgeHandler(chart)({type: "click", point: [0, 0], pick: {node, datum: node.datum, index: 0}, nativeEvent: {}});
    assert.deepStrictEqual(clicked, ["a"], "the click handler fires with the picked datum");
  });
}
