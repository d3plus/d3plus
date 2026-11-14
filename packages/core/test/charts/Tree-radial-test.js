import assert from "node:assert";
import {it} from "vitest";

import {useJsdom} from "~test/jsdom.js";
import {RadialTree, Tree} from "../../index.ts";
import {
  applyTreeLayout,
  boxReach,
  emitRadialTreeLabels,
  layoutRadialTree,
  nodeHeights,
  radialLabelFont,
  RADIAL_LABEL_FONT_SIZE,
  radialLabelPlacement,
  radialLinkD,
  radialNodeReach,
  radialTreeDef,
  ringGaps,
  rootDistances,
  runStages,
} from "../../internal.ts";

useJsdom();

/**
    Tree's radial layout (`orient: "radial"`, and the `RadialTree` preset)
    and `nodeHeight`, which sets each node's distance from the root by a
    value so the leaves line up as in a cluster dendrogram.
*/

const close = (a, b, msg, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) < eps, `${msg}: ${a} vs ${b}`);

const rows = [
  {top: "T", parent: "P1", id: "a"},
  {top: "T", parent: "P1", id: "b"},
  {top: "T", parent: "P2", id: "c"},
  {top: "T", parent: "P2", id: "d"},
  {top: "T", parent: "P2", id: "e"},
];

/** Lays a chart out and returns its nodes, with the chart. */
function layout(Chart, config) {
  const chart = new Chart().config({
    data: rows,
    groupBy: ["top", "parent", "id"],
    height: 400,
    width: 400,
    ...config,
  });
  chart._preDraw();
  chart._margin = {top: 0, right: 0, bottom: 0, left: 0};
  chart._padding = {top: 0, right: 0, bottom: 0, left: 0};
  const nodes = runStages({viz: chart}, [applyTreeLayout]).shapeData;
  const byId = Object.fromEntries(
    nodes.map(d => [chart._ids(d.data)[d.depth - 1], d]),
  );
  return {chart, nodes, byId};
}

/** A tiny hierarchy of plain nodes: a root over two branches over leaves. */
function hierarchyOf() {
  const leaf = (depth, theta) => ({depth, theta});
  const a = leaf(3, 0.5);
  const b = leaf(3, 1);
  const c = leaf(3, 3);
  const p1 = {depth: 2, theta: 0.75, children: [a, b]};
  const p2 = {depth: 2, theta: 3, children: [c]};
  const root = {depth: 1, theta: 2, children: [p1, p2]};
  return {root, p1, p2, a, b, c, all: [root, p1, p2, a, b, c]};
}

it("nodeHeights: values win, a leaf with none is 0, a branch takes its tallest child", () => {
  const {root, p1, p2, a, b, c, all} = hierarchyOf();
  const values = new Map([
    [a, 1],
    [p1, 3],
  ]);
  const h = nodeHeights(all, n => values.get(n));
  assert.strictEqual(h.get(a), 1);
  assert.strictEqual(h.get(b), 0);
  assert.strictEqual(h.get(c), 0);
  assert.strictEqual(h.get(p1), 3);
  assert.strictEqual(h.get(p2), 0, "a branch over one leaf of height 0");
  assert.strictEqual(
    h.get(root),
    3,
    "a branch with no value is its tallest child",
  );
  const partial = nodeHeights([root, p1], () => "x");
  assert.strictEqual(partial.get(p1), 0, "undrawn children don't count");
});

it("rootDistances: by depth, a single top node sits at the root", () => {
  const {root, p1, a, all} = hierarchyOf();
  const d = rootDistances(all);
  assert.strictEqual(d.get(root), 0);
  assert.strictEqual(d.get(p1), 0.5);
  assert.strictEqual(d.get(a), 1);
});

it("rootDistances: by depth, several top nodes sit one step out from an unseen root", () => {
  const tops = [{depth: 1}, {depth: 1}];
  const kids = [{depth: 2}];
  const d = rootDistances([...tops, ...kids]);
  assert.strictEqual(d.get(tops[0]), 0.5);
  assert.strictEqual(d.get(kids[0]), 1);
  assert.strictEqual(
    rootDistances([{depth: 1}])
      .values()
      .next().value,
    0,
  );
  assert.strictEqual(rootDistances([]).size, 0);
});

it("rootDistances: by height, leaves line up at the edge", () => {
  const {root, p1, p2, a, b, c, all} = hierarchyOf();
  const heights = new Map([
    [root, 4],
    [p1, 1],
    [p2, 2],
    [a, 0],
    [b, 0],
    [c, 0],
  ]);
  const d = rootDistances(all, heights);
  assert.strictEqual(d.get(root), 0);
  assert.strictEqual(d.get(p1), 0.75);
  assert.strictEqual(d.get(p2), 0.5);
  for (const leaf of [a, b, c]) assert.strictEqual(d.get(leaf), 1);
  // Two top nodes: an unseen root one level's share above the tallest.
  const tops = [{depth: 1}, {depth: 1}];
  const two = rootDistances(
    tops,
    new Map([
      [tops[0], 2],
      [tops[1], 1],
    ]),
  );
  close(two.get(tops[0]), 1 - 2 / 4, "tallest top");
  close(two.get(tops[1]), 1 - 1 / 4, "shorter top");
  // Every height 0: falls back to depth.
  const flat = rootDistances(all, new Map(all.map(n => [n, 0])));
  assert.strictEqual(flat.get(p1), 0.5);
});

it("radialLinkD: curves through the middle distance, cut at each node's outline", () => {
  const d = radialLinkD(
    [0, 0],
    {theta: Math.PI / 2, rho: 100},
    {theta: 0, rho: 50},
    {child: 5, parent: 7},
  );
  // Relative to the child at (100, 0): starts 5px in along its spoke, ends
  // 7px out from the parent along the parent's spoke.
  const nums = d.match(/-?[\d.e-]+/g).map(Number);
  close(nums[0], -5, "start x");
  close(nums[1], 0, "start y");
  close(nums[2], -25, "first control: child's spoke at the middle distance");
  close(nums[3], 0, "first control y");
  close(nums[4], -100, "second control x");
  close(nums[5], -75, "second control: parent's spoke at the middle distance");
  close(nums[6], -100, "end x");
  close(nums[7], -57, "end: 7px past the parent");
  assert.ok(d.startsWith("M") && d.includes("C"));
  const fromCenter = radialLinkD(
    [0, 0],
    {theta: Math.PI / 2, rho: 100},
    {theta: 2, rho: 0},
    {child: 0, parent: 3},
  );
  const end = fromCenter
    .match(/-?[\d.e-]+/g)
    .map(Number)
    .slice(-2);
  close(end[0], -97, "a center parent is left along the child's spoke");
  close(end[1], 0, "straight out");
});

it("radialLabelPlacement: leaves outward, branches inward, the center level", () => {
  const opts = {outer: 200, parentRho: 40, parentReach: 5, lineHeight: 13};
  const leaf = radialLabelPlacement(
    [0, 0],
    {theta: Math.PI / 2, rho: 150, leaf: true, reach: 6},
    {...opts, width: 30, gap: 0},
  );
  assert.strictEqual(leaf.kind, "spoke");
  assert.strictEqual(leaf.inward, false);
  close(leaf.x, 160, "past the node and the pad");
  assert.strictEqual(leaf.box.width, 40, "out to the label ring's edge");
  assert.strictEqual(leaf.box.height, 13, "one line with no gap");
  const branch = radialLabelPlacement(
    [0, 0],
    {theta: Math.PI / 2, rho: 120, leaf: false, reach: 6},
    {...opts, width: 30, gap: 1},
  );
  assert.strictEqual(branch.inward, true);
  close(branch.x, 110, "just inside the node");
  assert.strictEqual(branch.box.width, 110 - (40 + 5 + 4));
  assert.strictEqual(
    branch.box.height,
    39,
    "wraps where its neighbors leave room",
  );
  const center = radialLabelPlacement(
    [10, 20],
    {theta: 0, rho: 0, leaf: false, reach: 6},
    {...opts, width: 30},
  );
  assert.deepStrictEqual(center, {
    kind: "center",
    x: 10,
    y: 20,
    box: {x: -15, y: 10, width: 30, height: 13},
  });
  assert.strictEqual(
    radialLabelPlacement(
      [0, 0],
      {theta: 1, rho: 60, leaf: false, reach: 6},
      {...opts, width: 30},
    ),
    null,
    "no room between a branch and its parent",
  );
  assert.strictEqual(
    radialLabelPlacement(
      [0, 0],
      {theta: 1, rho: 190, leaf: true, reach: 6},
      {...opts, width: 30},
    ),
    null,
    "no room past the circle",
  );
});

it("ringGaps: the nearest neighbor on each depth's ring, around the turn", () => {
  const a = {depth: 2, theta: 0.1};
  const b = {depth: 2, theta: 0.5};
  const c = {depth: 2, theta: 6.2};
  const lone = {depth: 1, theta: 3};
  const gaps = ringGaps([a, b, c, lone]);
  close(gaps.get(a), 2 * Math.PI - 6.2 + 0.1, "wraps past 12 o'clock");
  close(gaps.get(b), 0.4, "b");
  close(gaps.get(lone), 2 * Math.PI, "alone on its ring");
});

it("boxReach: where a spoke leaves a box", () => {
  close(boxReach(20, 10, 0), 5, "straight up meets the top");
  close(boxReach(20, 10, Math.PI / 2), 10, "sideways meets the side");
  close(boxReach(20, 20, Math.PI / 4), Math.SQRT2 * 10, "a corner");
  close(boxReach(-4, 10, 0), 5, "a negative width is none");
});

it("radialNodeReach and radialLabelFont read the node's shape config", () => {
  const {chart, byId} = layout(Tree, {
    orient: "radial",
    shape: d => (d.id === "a" ? "Rect" : "Circle"),
    shapeConfig: {labelConfig: {fontSize: 13}},
  });
  assert.strictEqual(radialNodeReach(chart, byId.b, 1), 7, "a circle's radius");
  close(radialNodeReach(chart, byId.a, 0), 6, "a 12px Rect, straight up");
  assert.strictEqual(radialLabelFont(chart, byId.b).size, 13);
  const plain = layout(Tree, {orient: "radial"});
  assert.strictEqual(
    radialLabelFont(plain.chart, plain.byId.b).size,
    RADIAL_LABEL_FONT_SIZE,
  );
});

it("layoutRadialTree: one root at the center, leaves around the edge", () => {
  const {chart, byId, nodes} = layout(RadialTree);
  assert.strictEqual(chart.orient(), "radial");
  assert.strictEqual(radialTreeDef.name, "RadialTree");
  close(byId.T.x, 200, "root x");
  close(byId.T.y, 200, "root y");
  assert.strictEqual(byId.T.rho, 0);
  const leaves = ["a", "b", "c", "d", "e"].map(id => byId[id]);
  const rhos = leaves.map(d => d.rho);
  assert.ok(
    rhos.every(r => Math.abs(r - rhos[0]) < 1e-9),
    "same ring",
  );
  assert.ok(byId.P1.rho > 0 && byId.P1.rho < rhos[0], "branches between");
  const thetas = leaves.map(d => d.theta);
  assert.deepStrictEqual(
    [...thetas].sort((a, b) => a - b),
    thetas,
    "in order",
  );
  assert.ok(thetas.every(t => t > 0 && t < 2 * Math.PI));
  for (const d of nodes) {
    close(Math.hypot(d.x - 200, d.y - 200), d.rho, "x/y sit at rho");
  }
  const labels = chart.ctx.radialLabels;
  assert.strictEqual(labels.get(byId.T).place.kind, "center");
  assert.strictEqual(labels.get(byId.a).place.inward, false);
  assert.strictEqual(labels.get(byId.P1).place.inward, true);
  // Rings lie inside the chart, labels included.
  assert.ok(rhos[0] + 7 + 4 < 200);
});

it("layoutRadialTree: called directly, with a node that has no text", () => {
  const {chart, nodes} = layout(Tree, {orient: "radial"});
  const distances = new Map(nodes.map(n => [n, (n.depth - 1) / 2]));
  const out = layoutRadialTree(
    chart,
    nodes,
    distances,
    n => !n.children || n.depth === 3,
    n => (n.depth === 3 ? "" : "Label"),
    300,
    200,
  );
  assert.deepStrictEqual(out.center, [150, 100]);
  assert.ok(out.radius >= 50 && out.radius <= 100);
  assert.ok(
    [...out.labels.keys()].every(n => n.depth < 3),
    "no empty labels",
  );
});

it("radial link paths start at each child and stop at the nodes", () => {
  const {chart, byId} = layout(RadialTree);
  const {linksData, linkD} = chart.ctx;
  assert.deepStrictEqual(
    linksData.map(d => chart._ids(d.data)[d.depth - 1]),
    ["P1", "P2", "a", "b", "c", "d", "e"],
  );
  const toA = linksData.find(d => d.data.id === "a" && d.depth === 3);
  const nums = linkD(toA)
    .match(/-?[\d.e-]+/g)
    .map(Number);
  close(Math.hypot(nums[0], nums[1]), 7, "starts on the child's outline");
  const [ex, ey] = nums.slice(-2);
  const p1 = byId.P1;
  close(
    Math.hypot(toA.x + ex - p1.x, toA.y + ey - p1.y),
    7,
    "ends on the parent's outline",
  );
  const custom = linkD(toA, {child: 0, parent: 0}).match(/-?[\d.e-]+/g);
  assert.strictEqual(Number(custom[0]), 0, "a given reach wins");
});

it("emitRadialTreeLabels: keyed per node, inward and center ones haloed", () => {
  const {chart} = layout(RadialTree);
  const scene = emitRadialTreeLabels(chart, chart.ctx.radialLabels, d =>
    chart.ctx.shapeConfig.id(d, d.i),
  );
  const flat = list =>
    list.flatMap(n => (n.type === "group" ? flat(n.children) : [n]));
  const texts = flat(scene).filter(n => n.type === "text");
  const byText = Object.fromEntries(
    texts.map(n => [n.lines.map(l => l.text).join(" "), n]),
  );
  assert.deepStrictEqual(Object.keys(byText).sort(), [
    "P1",
    "P2",
    "T",
    "a",
    "b",
    "c",
    "d",
    "e",
  ]);
  assert.ok(byText.T.halo && byText.P1.halo, "center and branch");
  assert.ok(!byText.a.halo, "a leaf past the circle");
});

it("orient switches back from radial to the linear layout", () => {
  const {chart} = layout(RadialTree);
  assert.ok(chart.ctx.radialLabels);
  chart.orient("vertical");
  runStages({viz: chart}, [applyTreeLayout]);
  assert.strictEqual(chart.ctx.radialLabels, undefined);
});

it("nodeHeight: a vertical dendrogram lines its leaves up at the bottom", () => {
  const heights = {T: 3, P1: 1, P2: 2};
  const seen = [];
  const {byId} = layout(Tree, {
    nodeHeight: (d, i, node) => {
      seen.push(node);
      return heights[node.id];
    },
  });
  const leafY = ["a", "b", "c", "d", "e"].map(id => byId[id].y);
  assert.ok(
    leafY.every(y => Math.abs(y - leafY[0]) < 1e-9),
    "aligned",
  );
  assert.ok(byId.T.y < byId.P2.y && byId.P2.y < byId.P1.y, "by height");
  assert.ok(byId.P1.y < leafY[0]);
  // Leaves are spaced evenly in order (d3's cluster layout).
  const xs = ["a", "b", "c", "d", "e"].map(id => byId[id].x);
  const steps = xs.slice(1).map((x, k) => x - xs[k]);
  assert.ok(steps.every(s => s > 0));
  assert.deepStrictEqual(
    seen.find(n => n.id === "P1"),
    {id: "P1", level: 1, leaf: false},
  );
  assert.deepStrictEqual(
    seen.find(n => n.id === "a"),
    {
      id: "a",
      level: 2,
      leaf: true,
    },
  );
});

it("nodeHeight: a key in the data, horizontal", () => {
  const data = rows.map(d => ({...d, h: d.parent === "P1" ? 0 : 0}));
  const {byId} = layout(Tree, {data, nodeHeight: "h", orient: "horizontal"});
  // Every height 0: depth spacing, the root on the left.
  assert.ok(byId.T.x < byId.P1.x && byId.P1.x < byId.a.x);
});

it("nodeHeight: a radial cluster dendrogram", () => {
  const heights = {T: 3, P1: 1, P2: 2};
  const {byId} = layout(RadialTree, {
    nodeHeight: (d, i, node) => heights[node.id],
  });
  const rhos = ["a", "b", "c", "d", "e"].map(id => byId[id].rho);
  assert.ok(rhos.every(r => Math.abs(r - rhos[0]) < 1e-9));
  close(byId.P1.rho / rhos[0], 2 / 3, "P1 two thirds out");
  close(byId.P2.rho / rhos[0], 1 / 3, "P2 a third out");
});
