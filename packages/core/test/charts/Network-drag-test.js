import {afterEach, beforeEach, it, vi} from "vitest";
import assert from "assert";
import {jsdomit} from "~test/jsdom.js";
import {
  DOUBLE_CLICK_WAIT,
  bindNodeDrag,
  chartPoint,
  clampToBounds,
  deferPinnedClicks,
  networkLive,
  networkNodeDrag,
  networkNodeId,
  networkSimulation,
  nudgeNetworkNode,
  unbindNodeDrag,
  unpinNetworkNode,
} from "../../internal.ts";

/**
    Dragging chart nodes: the shared press-and-follow gesture
    (`bindNodeDrag`), and how a Network drags, pins, and lets go its nodes.
*/

beforeEach(() => {
  vi.stubGlobal("requestAnimationFrame", fn => setTimeout(fn, 0));
  vi.stubGlobal("cancelAnimationFrame", id => clearTimeout(id));
});
afterEach(() => vi.unstubAllGlobals());

it("chartPoint: undoes the zoom, then the chart's own transform", () => {
  assert.deepStrictEqual(chartPoint([10, 20]), [10, 20]);
  assert.deepStrictEqual(
    chartPoint([110, 220], {x: 10, y: 20, scale: 2}, {x: 5, y: 10}),
    [45, 90],
  );
  assert.deepStrictEqual(
    chartPoint([30, 30], undefined, {x: 10, y: 10, scale: 2}),
    [10, 10],
  );
});

it("networkNodeId: a node's shape or label key gives its id", () => {
  const ids = new Set(["a", "b-c"]);
  assert.strictEqual(networkNodeId({key: "network-Circle-a"}, ids), "a");
  assert.strictEqual(networkNodeId({key: "network-Rect-b-c"}, ids), "b-c");
  assert.strictEqual(networkNodeId({key: "network-label-a"}, ids), "a");
  // A label inside the node carries its line's index.
  assert.strictEqual(networkNodeId({key: "network-label-a_0"}, ids), "a");
  assert.strictEqual(networkNodeId({key: "network-label-b-c_12"}, ids), "b-c");
  const suffixed = new Set(["x_1", "x"]);
  assert.strictEqual(
    networkNodeId({key: "network-label-x_1"}, suffixed),
    "x_1",
  );
  assert.strictEqual(
    networkNodeId({key: "network-label-x_1_0"}, suffixed),
    "x_1",
  );
  assert.strictEqual(networkNodeId({key: "network-Circle-a_0"}, ids), null);
  assert.strictEqual(networkNodeId({key: "network-link-a-b-0"}, ids), null);
  assert.strictEqual(networkNodeId({key: "network-Circle-z"}, ids), null);
  assert.strictEqual(networkNodeId({}, ids), null);
});

it("clampToBounds: keeps a point in the chart area", () => {
  assert.deepStrictEqual(clampToBounds([-5, 50], {width: 100, height: 40}), {
    x: 0,
    y: 40,
  });
  assert.deepStrictEqual(clampToBounds([5, 6]), {x: 5, y: 6});
});

/** A stand-in Network with remembered positions. */
const fakeNetwork = () => {
  const viz = {
    ctx: {nodeLookup: {a: {}, b: {}}},
    schema: {on: {}},
    _sceneRenderer: {},
    drawn: 0,
    _drawSceneToTarget() {
      this.drawn++;
    },
  };
  const state = networkLive(viz);
  state.bounds = {width: 200, height: 100};
  state.positions.set("a", {x: 50, y: 50});
  state.positions.set("b", {x: 100, y: 50});
  state.laid = new Map([["a", {x: 40, y: 40}]]);
  return viz;
};

it("networkNodeDrag: a dragged node follows the pointer from where it was taken and stays pinned", async () => {
  const viz = fakeNetwork();
  let relayouts = 0;
  networkLive(viz).relayout = () => relayouts++;
  const drag = networkNodeDrag(viz);
  assert.strictEqual(drag.nodeAt({key: "network-Circle-a"}), "a");
  assert.strictEqual(drag.nodeAt({key: "network-Circle-x"}), null);
  drag.start("a", [55, 52]);
  assert.strictEqual(networkLive(viz).dragging, "a");
  drag.move("a", [75, 62]);
  drag.move("a", [500, 62]);
  const state = networkLive(viz);
  // Taken 5px right and 2px below its center; clamped to the area.
  assert.deepStrictEqual(state.pinned.get("a"), {x: 200, y: 60});
  assert.deepStrictEqual(state.positions.get("a"), {x: 200, y: 60});
  await new Promise(resolve => setTimeout(resolve, 5));
  assert.strictEqual(relayouts, 1, "one repaint per frame");
  drag.end("a", [500, 62]);
  assert.strictEqual(state.dragging, undefined);
  assert.ok(state.pinned.has("a"), "stays pinned");
});

it("networkNodeDrag: moves the simulated node and holds it there", () => {
  const viz = fakeNetwork();
  const state = networkLive(viz);
  const nodes = [
    {id: "a", x: 50, y: 50, rx: 5, ry: 5},
    {id: "b", x: 100, y: 50, rx: 5, ry: 5},
  ];
  state.sim = networkSimulation(nodes, [], state.bounds, 20);
  const drag = networkNodeDrag(viz);
  drag.start("a", [50, 50]);
  assert.strictEqual(state.sim.alphaTarget(), 0.3, "heated");
  drag.move("a", [60, 70]);
  assert.deepStrictEqual([nodes[0].fx, nodes[0].fy], [60, 70]);
  drag.end("a", [60, 70]);
  assert.strictEqual(state.sim.alphaTarget(), 0);
  assert.strictEqual(drag.dblclick("a"), true);
  assert.strictEqual(nodes[0].fx, null, "let go");
  assert.ok(!state.pinned.has("a"));
});

it("networkNodeDrag: a double-click lets a pinned node go back to its place", () => {
  const viz = fakeNetwork();
  networkLive(viz).relayout = () => undefined;
  const drag = networkNodeDrag(viz);
  assert.strictEqual(drag.dblclick("a"), false, "not pinned");
  networkLive(viz).pinned.set("a", {x: 1, y: 1});
  assert.strictEqual(drag.dblclick("a"), true);
  assert.deepStrictEqual(networkLive(viz).positions.get("a"), {x: 40, y: 40});
  assert.strictEqual(viz.drawn, 1);
});

it("deferPinnedClicks: a click on a pinned node waits for a double-click", () => {
  vi.useFakeTimers();
  try {
    const viz = fakeNetwork();
    viz._id = d => d.id;
    viz.schema.nodeGroupBy = [d => d.id];
    viz._drawDepth = 0;
    const clicks = [];
    viz.schema.on["click.shape"] = d => clicks.push(d.id);
    deferPinnedClicks(viz);
    const click = viz.schema.on["click.shape"];
    click({id: "b"}, 0, null, {detail: 1});
    assert.deepStrictEqual(clicks, ["b"], "unpinned: at once");
    networkLive(viz).pinned.set("a", {x: 0, y: 0});
    click({id: "a"}, 0, null, {detail: 1});
    assert.deepStrictEqual(clicks, ["b"]);
    vi.advanceTimersByTime(DOUBLE_CLICK_WAIT);
    assert.deepStrictEqual(
      clicks,
      ["b", "a"],
      "a lone click acts after the wait",
    );
    click({id: "a"}, 0, null, {detail: 1});
    click({id: "a"}, 0, null, {detail: 2});
    vi.advanceTimersByTime(DOUBLE_CLICK_WAIT);
    assert.deepStrictEqual(clicks, ["b", "a"], "a double-click's clicks don't");
  } finally {
    vi.useRealTimers();
  }
});

/** A chart in jsdom whose renderer picks `key` anywhere on its surface. */
function dragFixture(key = "network-Circle-a") {
  document.body.innerHTML =
    "<div id='host'><svg id='outer'><svg id='scene'></svg></svg></div>";
  const scene = document.querySelector("#scene");
  const styles = [];
  const viz = {
    ctx: {},
    schema: {},
    _select: {
      node: () => document.querySelector("#outer"),
      style: (_name, value) => styles.push(value),
    },
    _sceneRenderer: {
      elements: () => [scene],
      pick: () => ({node: {key}}),
    },
  };
  const calls = [];
  const drag = {
    nodeAt: node => (node.key === "network-Circle-a" ? "a" : null),
    start: (id, at) => calls.push(["start", id, at]),
    move: (id, at) => calls.push(["move", id, at]),
    end: (id, at) => calls.push(["end", id, at]),
    dblclick: id => (calls.push(["dblclick", id]), true),
  };
  return {viz, drag, calls, scene, styles};
}

const mouse = (type, x, y, extra = {}) =>
  new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
    view: window,
    ...extra,
  });

jsdomit(
  "bindNodeDrag: a press that moves drags the node, ahead of the zoom",
  () => {
    const {viz, drag, calls, scene, styles} = dragFixture();
    bindNodeDrag(viz, drag, () => true);
    let zoomPress = 0;
    document
      .querySelector("#outer")
      .addEventListener("mousedown", () => zoomPress++);
    scene.dispatchEvent(mouse("mousedown", 10, 10));
    assert.strictEqual(zoomPress, 0, "the zoom never sees the press");
    window.dispatchEvent(mouse("mousemove", 11, 11));
    assert.deepStrictEqual(calls, [], "not past the drag distance yet");
    window.dispatchEvent(mouse("mousemove", 30, 40));
    window.dispatchEvent(mouse("mouseup", 30, 40));
    assert.deepStrictEqual(calls, [
      ["start", "a", [10, 10]],
      ["move", "a", [30, 40]],
      ["end", "a", [30, 40]],
    ]);
    assert.deepStrictEqual(styles, ["grabbing", "auto"]);
    // The click the drag ends with is swallowed.
    let clicked = 0;
    scene.addEventListener("click", () => clicked++);
    scene.dispatchEvent(mouse("click", 30, 40));
    assert.strictEqual(clicked, 0);
  },
);

jsdomit("bindNodeDrag: a press that doesn't move is left to click", () => {
  const {viz, drag, calls, scene} = dragFixture();
  bindNodeDrag(viz, drag, () => true);
  scene.dispatchEvent(mouse("mousedown", 10, 10));
  window.dispatchEvent(mouse("mouseup", 10, 10));
  let clicked = 0;
  scene.addEventListener("click", () => clicked++);
  scene.dispatchEvent(mouse("click", 10, 10));
  assert.deepStrictEqual(calls, []);
  assert.strictEqual(clicked, 1);
});

jsdomit(
  "bindNodeDrag: off a node, disabled, or with a modifier, the press passes on",
  () => {
    const off = dragFixture("network-link-a-b-0");
    bindNodeDrag(off.viz, off.drag, () => true);
    let zoomPress = 0;
    document
      .querySelector("#outer")
      .addEventListener("mousedown", () => zoomPress++);
    off.scene.dispatchEvent(mouse("mousedown", 10, 10));
    assert.strictEqual(zoomPress, 1);

    const disabled = dragFixture();
    bindNodeDrag(disabled.viz, disabled.drag, () => false);
    let presses = 0;
    document
      .querySelector("#outer")
      .addEventListener("mousedown", () => presses++);
    disabled.scene.dispatchEvent(mouse("mousedown", 10, 10));
    disabled.scene.dispatchEvent(mouse("mousedown", 10, 10, {shiftKey: true}));
    assert.strictEqual(presses, 2);
  },
);

jsdomit(
  "bindNodeDrag: a double-click on a node goes to the drag, not the zoom",
  () => {
    const {viz, drag, calls, scene} = dragFixture();
    bindNodeDrag(viz, drag, () => true);
    let zoomed = 0;
    document
      .querySelector("#outer")
      .addEventListener("dblclick", () => zoomed++);
    scene.dispatchEvent(mouse("dblclick", 10, 10));
    assert.deepStrictEqual(calls, [["dblclick", "a"]]);
    assert.strictEqual(zoomed, 0);
  },
);

jsdomit(
  "bindNodeDrag / unbindNodeDrag: binds once per host and unbinds",
  () => {
    const {viz, drag, calls, scene} = dragFixture();
    bindNodeDrag(viz, drag, () => true);
    const binding = viz.ctx.nodeDragBinding;
    bindNodeDrag(viz, drag, () => true);
    assert.strictEqual(viz.ctx.nodeDragBinding, binding);
    unbindNodeDrag(viz);
    assert.strictEqual(viz.ctx.nodeDragBinding, undefined);
    scene.dispatchEvent(mouse("mousedown", 10, 10));
    window.dispatchEvent(mouse("mousemove", 40, 40));
    window.dispatchEvent(mouse("mouseup", 40, 40));
    assert.deepStrictEqual(calls, []);
  },
);

it("nudgeNetworkNode: moves a node by pixels, inside the chart, and pins it", () => {
  const viz = fakeNetwork();
  let relayouts = 0;
  networkLive(viz).relayout = () => relayouts++;
  assert.strictEqual(nudgeNetworkNode(viz, "a", [10, -10]), true);
  const state = networkLive(viz);
  assert.deepStrictEqual(state.pinned.get("a"), {x: 60, y: 40});
  assert.deepStrictEqual(state.positions.get("a"), {x: 60, y: 40});
  assert.strictEqual(relayouts, 1, "repainted");
  state.positions.set("a", {x: 200, y: 40});
  assert.strictEqual(nudgeNetworkNode(viz, "a", [10, 0]), false, "at the edge");
  assert.strictEqual(nudgeNetworkNode(viz, "z", [10, 0]), false);
});

it("nudgeNetworkNode / unpinNetworkNode: the live simulation holds the node, then lets it go", () => {
  const viz = fakeNetwork();
  const state = networkLive(viz);
  const nodes = [
    {id: "a", x: 50, y: 50, rx: 5, ry: 5},
    {id: "b", x: 100, y: 50, rx: 5, ry: 5},
  ];
  state.sim = networkSimulation(nodes, [], state.bounds, 20);
  state.sim.alpha(0);
  nudgeNetworkNode(viz, "a", [0, 10]);
  assert.deepStrictEqual([nodes[0].fx, nodes[0].fy], [50, 60]);
  assert.ok(state.sim.alpha() >= 0.3, "reheated");
  assert.strictEqual(unpinNetworkNode(viz, "a"), true);
  assert.strictEqual(nodes[0].fx, null);
  assert.strictEqual(unpinNetworkNode(viz, "a"), false, "not pinned now");
});
