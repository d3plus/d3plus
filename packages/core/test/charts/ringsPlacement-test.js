import {it} from "vitest";
import assert from "assert";

import {useJsdom} from "~test/jsdom.js";
import {Rings} from "../../index.ts";
import {
  applyRingsLayout,
  buildRingsEdges,
  claimRings,
  curveRingsEdge,
  placeRings,
  ringNodeRadii,
  ringWeights,
  ringsDepth,
  ringsGeometry,
  runStages,
} from "../../internal.ts";

useJsdom();

const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-6, msg);

/**
    A small graph around "c": a, b, d on the first ring; a1, a2, b1 on the
    second (a2 linked from both a and b, so a claims it); x beyond a1, and y
    beyond x.
*/
const links = [
  ["c", "a"],
  ["c", "b"],
  ["c", "d"],
  ["a", "b"],
  ["a", "a1"],
  ["a", "a2"],
  ["b", "a2"],
  ["b", "b1"],
  ["a1", "a2"],
  ["a1", "x"],
  ["a2", "x"],
  ["x", "y"],
];

/** Node records and a `linkMap` for `links`, as `buildRingsGraph` builds them. */
function graph(pairs = links) {
  const nodes = {};
  const node = id => (nodes[id] ??= {id});
  const linkMap = {};
  pairs.forEach(([s, t]) => {
    const edge = {source: node(s), target: node(t), size: 1};
    (linkMap[s] ??= []).push(edge);
    (linkMap[t] ??= []).push(edge);
  });
  return {nodes, linkMap};
}

const ids = ring => ring.map(n => n.id);

it("ringsDepth reads a whole number of rings, at least 1, defaulting to 2", () => {
  assert.strictEqual(ringsDepth(undefined), 2);
  assert.strictEqual(ringsDepth(null), 2);
  assert.strictEqual(ringsDepth("many"), 2);
  assert.strictEqual(ringsDepth(3), 3);
  assert.strictEqual(ringsDepth("4"), 4);
  assert.strictEqual(ringsDepth(2.7), 2);
  assert.strictEqual(ringsDepth(0), 1);
  assert.strictEqual(ringsDepth(-3), 1);
});

it("ringsGeometry spaces the rings evenly, leaving one spacing outside the last", () => {
  const two = ringsGeometry(600, 400);
  close(two.ringWidth, 200 / 3, "two rings: a third of the radius apart");
  assert.deepStrictEqual(two.rings, [two.ringWidth, two.ringWidth * 2]);
  assert.strictEqual(two.primaryRing, two.ringWidth);

  const one = ringsGeometry(600, 400, 1);
  assert.deepStrictEqual(one.rings, [100]);

  const three = ringsGeometry(600, 400, 3);
  assert.strictEqual(three.ringWidth, 50);
  assert.deepStrictEqual(three.rings, [50, 100, 150]);
});

/** The two-ring node radii as Rings sized them before `ringDepth`. */
function twoRingRadii(ringWidth) {
  const primaryDistance = ringWidth / 2;
  const secondaryDistance = ringWidth / 4;
  let primaryMax = primaryDistance / 2 - 4;
  if (primaryDistance / 2 - 4 < 8)
    primaryMax = Math.min(primaryDistance / 2, 8) || 0;
  let secondaryMax = secondaryDistance / 2 - 4;
  if (secondaryDistance / 2 - 4 < 4)
    secondaryMax = Math.min(secondaryDistance / 2, 4) || 0;
  if (secondaryMax > ringWidth / 10) secondaryMax = ringWidth / 10;
  if (secondaryMax > primaryMax && secondaryMax > 10)
    secondaryMax = primaryMax * 0.75;
  if (primaryMax > secondaryMax * 1.5) primaryMax = secondaryMax * 1.5;
  return [Math.floor(primaryMax), Math.floor(secondaryMax)];
}

it("ringNodeRadii keeps the two-ring sizes, and shrinks outward on deeper charts", () => {
  for (const w of [0, 5, 20, 33.3, 50, 66.7, 80, 100, 133.3, 200, 400, 1000])
    assert.deepStrictEqual(ringNodeRadii(w, 2), twoRingRadii(w), `width ${w}`);

  for (const depth of [3, 4, 5])
    for (const w of [20, 50, 100, 200, 400]) {
      const radii = ringNodeRadii(w, depth);
      assert.strictEqual(radii.length, depth);
      for (let k = 1; k < depth; k++)
        assert.ok(
          radii[k] <= radii[k - 1],
          `depth ${depth}, width ${w}: ring ${k + 1} is no larger than ring ${k}`,
        );
    }

  // One ring sizes by its own room alone.
  assert.deepStrictEqual(ringNodeRadii(100, 1), [21]);
  assert.deepStrictEqual(ringNodeRadii(20, 1), [5]);
});

it("claimRings: one ring holds only the center's neighbors, fewest links first", () => {
  const {nodes, linkMap} = graph();
  const {rings, children} = claimRings(linkMap, nodes.c, 1);
  assert.deepStrictEqual(rings.map(ids), [["d", "a", "b"]]);
  assert.strictEqual(children.size, 0);
});

it("claimRings: each ring claims the unclaimed neighbors of the ring inside it", () => {
  const {nodes, linkMap} = graph();
  const two = claimRings(linkMap, nodes.c, 2);
  assert.deepStrictEqual(two.rings.map(ids), [
    ["d", "a", "b"],
    ["a1", "a2", "b1"],
  ]);
  assert.deepStrictEqual(ids(two.children.get(nodes.a)), ["a1", "a2"]);
  assert.deepStrictEqual(ids(two.children.get(nodes.b)), ["b1"]);
  assert.deepStrictEqual(ids(two.children.get(nodes.d)), []);

  const four = claimRings(linkMap, nodes.c, 4);
  assert.deepStrictEqual(four.rings.map(ids), [
    ["d", "a", "b"],
    ["a1", "a2", "b1"],
    ["x"],
    ["y"],
  ]);
  // x is reachable from a1 and a2; the first to reach it claims it.
  assert.deepStrictEqual(ids(four.children.get(nodes.a1)), ["x"]);
  assert.deepStrictEqual(ids(four.children.get(nodes.a2)), []);

  const all = four.rings.flat();
  assert.strictEqual(new Set(all).size, all.length, "no node twice");
  assert.ok(!all.includes(nodes.c), "the center is on no ring");
});

it("claimRings stops when the graph runs out of nodes", () => {
  const {nodes, linkMap} = graph([
    ["c", "a"],
    ["a", "b"],
  ]);
  const {rings} = claimRings(linkMap, nodes.c, 4);
  assert.deepStrictEqual(rings.map(ids), [["a"], ["b"], [], []]);
});

it("ringWeights counts the outer-ring slots under each node", () => {
  const {nodes, linkMap} = graph();
  const w2 = ringWeights(claimRings(linkMap, nodes.c, 2));
  assert.strictEqual(w2.get(nodes.a), 2);
  assert.strictEqual(w2.get(nodes.b), 1);
  assert.strictEqual(w2.get(nodes.d), 1, "a childless node keeps one slot");
  assert.strictEqual(w2.get(nodes.a1), 1);

  const w3 = ringWeights(claimRings(linkMap, nodes.c, 3));
  assert.strictEqual(w3.get(nodes.a1), 1);
  assert.strictEqual(w3.get(nodes.a2), 1);
  assert.strictEqual(w3.get(nodes.a), 2);
});

it("placeRings puts each ring's nodes on its radius, children within their parent's arc", () => {
  const {nodes, linkMap} = graph();
  for (const depth of [1, 2, 3]) {
    const geom = ringsGeometry(400, 400, depth);
    const tree = claimRings(linkMap, nodes.c, depth);
    const weights = ringWeights(tree);
    const slots = placeRings(tree, geom);
    assert.strictEqual(
      slots,
      tree.rings[0].reduce((s, n) => s + weights.get(n), 0),
    );
    close(
      tree.rings[0][0].radians,
      -Math.PI / 2,
      "the first node is at the top",
    );
    const s = (Math.PI * 2) / slots;
    tree.rings.forEach((ring, k) =>
      ring.forEach(n => {
        close(
          Math.hypot(n.x - 200, n.y - 200),
          geom.rings[k],
          `depth ${depth}: ${n.id} sits on ring ${k + 1}`,
        );
        const half = (s * weights.get(n)) / 2;
        (tree.children.get(n) ?? []).forEach(kid => {
          const kidHalf = (s * weights.get(kid)) / 2;
          assert.ok(
            kid.radians - kidHalf >= n.radians - half - 1e-9 &&
              kid.radians + kidHalf <= n.radians + half + 1e-9,
            `depth ${depth}: ${kid.id} is within ${n.id}'s arc`,
          );
        });
      }),
    );
  }
});

it("curveRingsEdge leaves an outer node on its inner side and bends in the gap outside the inner ring", () => {
  const geom = ringsGeometry(400, 400, 3);
  const inner = {id: "p", ring: 2, radians: 0, x: 300, y: 200, r: 5};
  const outer = {id: "q", ring: 3, radians: 0, x: 350, y: 200, r: 4};
  const edge = {source: inner, target: outer};
  curveRingsEdge(edge, geom);
  assert.strictEqual(edge.spline, true);
  close(edge.sourceX, 305, "the inner end leaves outward");
  close(edge.targetX, 346, "the outer end leaves inward");
  close(edge.sourceBisectX, 200 + 125, "bends halfway between rings 2 and 3");

  const peer = {id: "r", ring: 2, radians: Math.PI, x: 100, y: 200, r: 5};
  const same = {source: inner, target: peer};
  curveRingsEdge(same, geom);
  close(same.targetX, 95, "same-ring ends both leave outward");
});

it("buildRingsEdges draws each link once, and none between outermost-ring nodes", () => {
  const {nodes, linkMap} = graph();
  const pairs = edges => edges.map(e => `${e.source.id}-${e.target.id}`).sort();
  const build = depth => {
    const geom = ringsGeometry(400, 400, depth);
    const tree = claimRings(linkMap, nodes.c, depth);
    placeRings(tree, geom);
    tree.rings.forEach((ring, k) =>
      ring.forEach(n => {
        n.ring = k + 1;
        n.r = 4;
      }),
    );
    return buildRingsEdges(tree.rings, linkMap, nodes.c, geom);
  };

  assert.deepStrictEqual(pairs(build(1)), ["c-a", "c-b", "c-d"]);
  assert.deepStrictEqual(pairs(build(2)), [
    "a-a1",
    "a-a2",
    "a-b",
    "b-a2",
    "b-b1",
    "c-a",
    "c-b",
    "c-d",
  ]);
  const three = build(3);
  assert.deepStrictEqual(pairs(three), [
    "a-a1",
    "a-a2",
    "a-b",
    "a1-a2",
    "a1-x",
    "a2-x",
    "b-a2",
    "b-b1",
    "c-a",
    "c-b",
    "c-d",
  ]);
  assert.strictEqual(new Set(three).size, three.length);
});

/** Lays out a 400 × 400 Rings of `links` around "c", returning its nodes and edges. */
function layout(configure = c => c) {
  const chart = configure(
    new Rings()
      .center("c")
      .links(links.map(([source, target]) => ({source, target})))
      .width(400)
      .height(400),
  );
  chart._preDraw();
  chart._margin = {top: 0, right: 0, bottom: 0, left: 0};
  chart._padding = {top: 0, right: 0, bottom: 0, left: 0};
  const ctx = runStages({viz: chart}, [applyRingsLayout]);
  return {nodes: ctx.shapeData, edges: chart.ctx.ringsCtx.edges};
}

const summary = ({nodes, edges}) => ({
  nodes: nodes.map(n => [n.id, n.ring, n.x, n.y, n.r]),
  edges: edges.map(e => [e.source.id, e.target.id, e.sourceX, e.targetY]),
});

it("Rings ringDepth: 2 is the default layout", () => {
  assert.deepStrictEqual(
    summary(layout(c => c.ringDepth(2))),
    summary(layout()),
  );
});

it("Rings ringDepth: rings sit evenly apart, outer nodes no larger, each node once", () => {
  for (const depth of [1, 2, 3, 4]) {
    const {nodes} = layout(c => c.ringDepth(depth));
    const center = nodes[0];
    assert.strictEqual(center.id, "c");
    const seen = nodes.map(n => n.id);
    assert.strictEqual(
      new Set(seen).size,
      seen.length,
      `depth ${depth}: unique`,
    );
    const spacing = 200 / (depth + 1);
    const byRing = {};
    nodes.slice(1).forEach(n => {
      close(
        Math.hypot(n.x - center.x, n.y - center.y),
        spacing * n.ring,
        `depth ${depth}: ${n.id} on ring ${n.ring}`,
      );
      (byRing[n.ring] ??= new Set()).add(n.r);
    });
    const rings = Object.keys(byRing).map(Number);
    assert.strictEqual(Math.max(...rings), Math.min(depth, 4));
    rings.forEach(k =>
      assert.strictEqual(
        byRing[k].size,
        1,
        `depth ${depth}: one size per ring`,
      ),
    );
    for (let k = 2; k <= Math.max(...rings); k++)
      assert.ok([...byRing[k]][0] <= [...byRing[k - 1]][0]);
  }
  assert.deepStrictEqual(
    layout(c => c.ringDepth(1)).nodes.map(n => n.id),
    ["c", "d", "a", "b"],
    "one ring: only the center's neighbors",
  );
  assert.deepStrictEqual(
    layout(c => c.ringDepth(3)).nodes.map(n => n.id),
    ["c", "d", "a", "b", "a1", "a2", "b1", "x"],
  );
});

it("Rings ringDepth: outer nodes shrink on a larger chart", () => {
  const {nodes} = layout(c => c.ringDepth(3).width(1200).height(1200));
  const r = ring => nodes.find(n => n.ring === ring).r;
  assert.ok(r(1) > r(2) && r(2) > r(3), `${r(1)} > ${r(2)} > ${r(3)}`);
});
