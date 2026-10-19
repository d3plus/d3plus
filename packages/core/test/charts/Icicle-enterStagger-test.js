import assert from "assert";
import {
  icicleRootEdge,
  icicleShowWrappers,
  icicleStagger,
} from "../../es/src/charts/Icicle/enterStagger.js";

const rect = {x: 100, y: 40, width: 50, height: 80};

/** A parent-before-child node list: a → (ab, ac → acd). */
function tree() {
  const a = {id: "a", x: 0, y: 0, width: 10, height: 100};
  const ab = {id: "ab", x: 10, y: 0, width: 10, height: 40, parent: a};
  const ac = {id: "ac", x: 10, y: 40, width: 10, height: 60, parent: a};
  const acd = {id: "acd", x: 20, y: 40, width: 10, height: 60, parent: ac};
  return [a, ab, ac, acd];
}

it("icicleRootEdge collapses a rect onto the midpoint of its root-side edge", () => {
  assert.deepStrictEqual(icicleRootEdge(rect, "horizontal"), {x: 100, y: 80, width: 0, height: 0}, "the left edge");
  assert.deepStrictEqual(icicleRootEdge(rect, "vertical"), {x: 125, y: 40, width: 0, height: 0}, "the top edge");
});

it("icicleStagger gives each entering level the next window of the transition", () => {
  const nodes = tree();
  const {rects, windows} = icicleStagger(nodes, new Set(nodes.map(n => n.id)), "horizontal");
  assert.deepStrictEqual(windows.get("a"), {start: 0, end: 1 / 3});
  assert.deepStrictEqual(windows.get("ab"), {start: 1 / 3, end: 2 / 3});
  assert.deepStrictEqual(windows.get("ac"), windows.get("ab"), "siblings share a window");
  assert.deepStrictEqual(windows.get("acd"), {start: 2 / 3, end: 1});
  assert.deepStrictEqual(rects.get("acd"), {x: 20, y: 70, width: 0, height: 0});
  assert.deepStrictEqual(icicleStagger(nodes, new Set(nodes.map(n => n.id)), "vertical").rects.get("a"), {x: 5, y: 0, width: 0, height: 0});
});

it("icicleStagger counts only entering levels, and leaves drawn nodes alone", () => {
  const nodes = tree();
  const {rects, windows} = icicleStagger(nodes, new Set(["ac", "acd"]), "horizontal");
  assert.ok(!windows.has("a") && !rects.has("a") && !windows.has("ab"), "drawn nodes keep their update");
  assert.deepStrictEqual(windows.get("ac"), {start: 0, end: 0.5}, "a child of a drawn node starts at once");
  assert.deepStrictEqual(windows.get("acd"), {start: 0.5, end: 1});
  assert.deepStrictEqual(icicleStagger(nodes, new Set(["acd"]), "horizontal").windows.get("acd"), {start: 0, end: 1});
  assert.strictEqual(icicleStagger(nodes, new Set(), "horizontal").windows.size, 0);
});

it("icicleShowWrappers shows the chart's wrapper groups at once, not its datum groups", () => {
  const image = {type: "group", key: "img", datum: {a: 1}, children: []};
  const body = {type: "group", key: "viz-chart-body", children: [{type: "rect", key: "r"}, image]};
  const cells = {type: "group", key: "viz-chart-cells", children: [{type: "group", key: "viz-zoom", children: [body]}]};
  const legend = {type: "group", key: "viz-legend", children: []};
  const scene = {width: 1, height: 1, root: {type: "group", key: "viz-root", children: [cells, legend]}};
  assert.strictEqual(icicleShowWrappers(scene), scene, "the same scene");
  const atOnce = {start: 0, end: 0};
  assert.deepStrictEqual(
    [cells.enterWindow, cells.children[0].enterWindow, body.enterWindow],
    [atOnce, atOnce, atOnce],
  );
  assert.strictEqual(image.enterWindow, undefined, "a rect's image keeps its own window");
  assert.strictEqual(legend.enterWindow, undefined, "the chrome is left alone");
  const noCells = {width: 1, height: 1, root: {type: "group", key: "viz-root", children: [legend]}};
  assert.strictEqual(icicleShowWrappers(noCells), noCells);
});
