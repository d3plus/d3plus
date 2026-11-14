import assert from "node:assert";
import {it} from "vitest";

import {useJsdom} from "~test/jsdom.js";
import {Network} from "../../index.ts";
import {
  applyNetworkLayout,
  CIRCLE_NODE_MAX,
  CIRCLE_NODE_SHARE,
  circleAngles,
  circleLinkPoints,
  circleNodeGroup,
  curveCircleLinks,
  fitCircle,
  layoutCircleNetwork,
  nodeSpokeReach,
  placeCircleNetworkLabels,
  resolveGraphLinks,
  resolveGraphNodes,
  runStages,
  sortCircleNodes,
} from "../../internal.ts";

useJsdom();

/**
    Network's `layout: "circle"`: nodes spaced evenly around a circle,
    ordered by cluster and then degree (or by `nodeSort`), links bowing in
    toward the center, and labels along their spokes past the circle.
*/

const close = (a, b, msg, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) < eps, `${msg}: ${a} vs ${b}`);

const nodes = ["a", "b", "c", "d", "e", "f"].map(id => ({id}));
// Two triangles joined by one link: two clusters.
const links = [
  {source: "a", target: "b"},
  {source: "b", target: "c"},
  {source: "c", target: "a"},
  {source: "d", target: "e"},
  {source: "e", target: "f"},
  {source: "f", target: "d"},
  {source: "a", target: "d"},
  {source: "f", target: "f"},
];

/** A Network laid out on a circle, with its laid-out nodes by id. */
function layout(config = {}) {
  const chart = new Network().config({
    nodes,
    links,
    layout: "circle",
    height: 400,
    width: 400,
    ...config,
  });
  chart._preDraw();
  chart._margin = {top: 0, right: 0, bottom: 0, left: 0};
  chart._padding = {top: 0, right: 0, bottom: 0, left: 0};
  const laid = runStages({viz: chart}, [applyNetworkLayout]).shapeData;
  return {chart, byId: Object.fromEntries(laid.map(n => [n.id, n]))};
}

const sortable = (id, group, degree, order) => ({
  id,
  datum: {id},
  label: id,
  group,
  degree,
  order,
});

it("sortCircleNodes: by group, then most connected, then nodes order", () => {
  const list = [
    sortable("x", 1, 2, 0),
    sortable("y", 0, 1, 1),
    sortable("z", 0, 5, 2),
    sortable("w", undefined, 9, 3),
    sortable("v", 1, 2, 4),
  ];
  assert.deepStrictEqual(
    sortCircleNodes(list).map(n => n.id),
    ["z", "y", "x", "v", "w"],
  );
  assert.deepStrictEqual(
    sortCircleNodes(list, "label").map(n => n.id),
    ["v", "w", "x", "y", "z"],
    "nodeSort overrides",
  );
  assert.deepStrictEqual(
    sortCircleNodes(list, (a, b) => b.id.localeCompare(a.id)).map(n => n.id),
    ["z", "y", "x", "w", "v"],
  );
  assert.notStrictEqual(sortCircleNodes(list), list, "a new array");
});

it("circleAngles: evenly spaced from 12 o'clock", () => {
  assert.deepStrictEqual(circleAngles(4), [
    0,
    Math.PI / 2,
    Math.PI,
    Math.PI * 1.5,
  ]);
  assert.deepStrictEqual(circleAngles(0), []);
  assert.deepStrictEqual(circleAngles(1), [0]);
});

it("circleLinkPoints: a quadratic curve bowed toward the center", () => {
  const pts = circleLinkPoints([0, -100], [100, 0], [0, 0], 1, 4);
  assert.strictEqual(pts.length, 5);
  assert.deepStrictEqual(pts[0], [0, -100]);
  assert.deepStrictEqual(pts[4], [100, 0]);
  // Halfway: a quarter each end, half the control point (the center).
  close(pts[2][0], 25, "middle x");
  close(pts[2][1], -25, "middle y");
  const straight = circleLinkPoints([0, -100], [100, 0], [0, 0], 0, 2);
  close(straight[1][0], 50, "no bow is the chord");
  close(straight[1][1], -50, "no bow is the chord");
  assert.strictEqual(circleLinkPoints([0, 0], [1, 1], [0, 0], 1, 0).length, 2);
});

it("fitCircle: labels and loops come off first, then the node radius", () => {
  const fit = fitCircle(200, 10, 40);
  const spacing = 2 * fit.radius * Math.sin(Math.PI / 10);
  close(
    fit.rMax,
    Math.min(spacing * CIRCLE_NODE_SHARE, CIRCLE_NODE_MAX),
    "node radius from the spacing",
  );
  close(fit.radius + fit.rMax + 4 + fit.labelWidth, 200, "fills the room");
  assert.strictEqual(fit.labelWidth, 40);
  const looped = fitCircle(200, 10, 40, 20);
  assert.ok(looped.radius < fit.radius, "loops take room");
  assert.strictEqual(fitCircle(200, 10, 40, 0, 7).rMax, 7, "sizeMax wins");
  const two = fitCircle(200, 2, 0);
  assert.strictEqual(two.rMax, CIRCLE_NODE_MAX, "capped");
  const none = fitCircle(0, 3, 10);
  assert.strictEqual(none.radius, 0);
});

it("nodeSpokeReach: a circle, a Rect's box, and a loop's far side", () => {
  assert.strictEqual(nodeSpokeReach({r: 5}, 1), 5);
  close(
    nodeSpokeReach({r: 5, shape: "Rect"}, Math.PI / 4),
    5 * Math.SQRT2,
    "corner",
  );
  close(
    nodeSpokeReach({r: 5, shape: "Rect", width: 20, height: 4}, 0),
    2,
    "up",
  );
  assert.strictEqual(
    nodeSpokeReach({x: 0, y: 0, r: 5}, 0, [
      {apex: {x: 0, y: -12}, strokeWidth: 4},
    ]),
    14,
  );
});

it("layoutCircleNetwork: every node on one circle, evenly, clusters together", () => {
  const {chart, byId} = layout();
  const circle = chart.ctx.networkCtx.circle;
  assert.deepStrictEqual(circle.center, [200, 200]);
  const ids = Object.keys(byId);
  for (const id of ids)
    close(
      Math.hypot(byId[id].x - 200, byId[id].y - 200),
      circle.radius,
      `${id} on the circle`,
    );
  const order = [...circle.thetas.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([id]) => id);
  // The two triangles are the two clusters; each sits together, its
  // most connected node (a, or d with its loop) first.
  const first = order.slice(0, 3).sort().join("");
  const second = order.slice(3).sort().join("");
  assert.deepStrictEqual([first, second].sort(), ["abc", "def"]);
  const steps = order
    .map(id => circle.thetas.get(id))
    .slice(1)
    .map((t, k, all) => t - (k ? all[k - 1] : 0));
  steps.forEach(s => close(s, Math.PI / 3, "even spacing"));
  // Loops point outward.
  const loop = chart.ctx.networkCtx.links.find(l => l.loop);
  const f = byId.f;
  const out = Math.atan2(f.y - 200, f.x - 200);
  close(loop.loop.angle, out, "f's loop points away from the center");
  // Links between distinct nodes bow toward the center.
  const ab = chart.ctx.networkCtx.links.find(
    l => l.source.id === "a" && l.target.id === "b",
  );
  const mid = ab.points[Math.floor(ab.points.length / 2)];
  const chordMid = [(byId.a.x + byId.b.x) / 2, (byId.a.y + byId.b.y) / 2];
  assert.ok(
    Math.hypot(mid[0] - 200, mid[1] - 200) <
      Math.hypot(chordMid[0] - 200, chordMid[1] - 200),
  );
});

it("layoutCircleNetwork: nodeSort and the size scale", () => {
  const sized = nodes.map((d, i) => ({...d, weight: i + 1}));
  const {chart, byId} = layout({
    nodes: sized,
    size: "weight",
    nodeSort: "data",
  });
  const circle = chart.ctx.networkCtx.circle;
  assert.deepStrictEqual(
    [...circle.thetas.entries()].sort((a, b) => a[1] - b[1]).map(e => e[0]),
    ["a", "b", "c", "d", "e", "f"],
  );
  assert.ok(byId.a.r < byId.f.r, "sized by weight");
  assert.strictEqual(byId.f.width, byId.f.r * 2);
});

it("layoutCircleNetwork and circleNodeGroup called directly", () => {
  const chart = new Network().config({
    nodes,
    links,
    cluster: false,
    height: 300,
    width: 500,
  });
  chart._preDraw();
  const graph = resolveGraphNodes(chart);
  const glinks = resolveGraphLinks(chart, graph);
  assert.strictEqual(circleNodeGroup(chart, graph[0]), undefined);
  const {r, circle} = layoutCircleNetwork(chart, graph, glinks, 500, 300);
  assert.deepStrictEqual(circle.center, [250, 150]);
  assert.strictEqual(typeof r, "function");
  assert.strictEqual(circle.labels.size, 0, "labels come after the loops");
  placeCircleNetworkLabels(chart, graph, glinks, circle);
  assert.strictEqual(circle.labels.size, 6);
  const label = circle.labels.get("a");
  assert.strictEqual(label.text, "a");
  assert.ok(label.place.box.width > 0);
});

it("circleNodeGroup: a top groupBy level when clusters are off", () => {
  const rows = nodes.map((d, i) => ({...d, team: i < 3 ? "x" : "y"}));
  const chart = new Network().config({
    data: rows,
    nodes: rows,
    links,
    groupBy: ["team", "id"],
    cluster: false,
  });
  chart._preDraw();
  const graph = resolveGraphNodes(chart);
  assert.deepStrictEqual(
    graph.map(n => circleNodeGroup(chart, n)),
    ["x", "x", "x", "y", "y", "y"],
  );
});

it("curveCircleLinks: skips loops, bundled paths, and unplaced ends", () => {
  const s = {id: "s", x: 0, y: -10};
  const t = {id: "t", x: 10, y: 0};
  const list = [
    {source: s, target: t},
    {source: s, target: t, points: [[0, 0]]},
    {source: s, target: s},
    {source: s, target: {id: "u"}},
  ];
  curveCircleLinks(list, [0, 0]);
  assert.strictEqual(list[0].points.length, 25);
  assert.deepStrictEqual(list[1].points, [[0, 0]], "kept");
  assert.strictEqual(list[2].points, undefined);
  assert.strictEqual(list[3].points, undefined);
});

it("placeCircleNetworkLabels: labels start past loops, along the spoke", () => {
  const {chart, byId} = layout();
  const {circle} = chart.ctx.networkCtx;
  const f = circle.labels.get("f");
  const a = circle.labels.get("a");
  const dist = l => Math.hypot(l.place.x - 200, l.place.y - 200);
  assert.ok(
    dist(f) - circle.radius > dist(a) - circle.radius + byId.f.r * 0.5,
    "f's label clears its loop",
  );
  for (const label of circle.labels.values())
    assert.ok(dist(label) + label.place.box.width <= circle.outer + 1e-6);
});

it("layout: force keeps the force layout, without a circle", () => {
  const {chart} = layout({layout: "force"});
  assert.strictEqual(chart.ctx.networkCtx.circle, undefined);
});

it("the size legend's scale follows the circle", () => {
  const sized = nodes.map((d, i) => ({...d, weight: i + 1}));
  const chart = new Network().config({
    nodes: sized,
    links,
    layout: "circle",
    size: "weight",
  });
  chart._preDraw();
  const scale = chart._sizeLegendScale({width: 400, height: 400});
  assert.ok(scale && scale(6) > scale(1));
});
