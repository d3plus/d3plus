import {it} from "vitest";
import assert from "assert";

import {useJsdom} from "~test/jsdom.js";
import {Rings} from "../../index.ts";
import {
  applyRingsLayout,
  buildRingsEdges,
  claimRings,
  placeRings,
  ringNodeRadii,
  ringWeights,
  ringsGeometry,
  ringsHops,
  ringsNodeRadii,
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

it("ringsHops reads a whole number of rings, at least 1, defaulting to 2", () => {
  assert.strictEqual(ringsHops(undefined), 2);
  assert.strictEqual(ringsHops(null), 2);
  assert.strictEqual(ringsHops("many"), 2);
  assert.strictEqual(ringsHops(3), 3);
  assert.strictEqual(ringsHops("4"), 4);
  assert.strictEqual(ringsHops(2.7), 2);
  assert.strictEqual(ringsHops(0), 1);
  assert.strictEqual(ringsHops(-3), 1);
});

it("ringsGeometry spaces one or two rings evenly, and further rings evenly past the two-ring first", () => {
  const two = ringsGeometry(600, 400);
  close(two.ringWidth, 200 / 3, "two rings: a third of the radius apart");
  assert.deepStrictEqual(two.rings, [two.ringWidth, two.ringWidth * 2]);
  assert.strictEqual(two.primaryRing, two.ringWidth);
  assert.strictEqual(two.baseRing, two.ringWidth);

  const one = ringsGeometry(600, 400, 1);
  assert.deepStrictEqual(one.rings, [100]);
  assert.strictEqual(one.ringWidth, 100, "label room outside the ring");
  close(one.baseRing, 200 / 3);

  const three = ringsGeometry(600, 400, 3);
  close(
    three.primaryRing,
    200 / 3,
    "the first ring stays where it is with two",
  );
  close(three.ringWidth, 400 / 9);
  three.rings.forEach((r, k) =>
    close(r, 200 / 3 + (400 / 9) * k, `ring ${k + 1}`),
  );
  close(three.rings[2] + three.ringWidth, 200, "one spacing left outside");
});

/** The two-ring node radii as Rings sized them before `hops`. */
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

it("ringsNodeRadii keeps the two-ring first-ring size at any hops, outer rings no larger", () => {
  for (const size of [200, 400, 600, 1200]) {
    const base = ringNodeRadii(size / 6, 2);
    assert.deepStrictEqual(ringsNodeRadii(ringsGeometry(size, size)), base);
    assert.deepStrictEqual(ringsNodeRadii(ringsGeometry(size, size, 1)), [
      base[0],
    ]);
    for (const hops of [3, 4, 6]) {
      const radii = ringsNodeRadii(ringsGeometry(size, size, hops));
      assert.strictEqual(radii.length, hops);
      assert.strictEqual(radii[0], base[0], `${size}px, ${hops} hops`);
      for (let k = 1; k < hops; k++) assert.ok(radii[k] <= radii[k - 1]);
    }
  }
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

it("buildRingsEdges draws each link once, and between outermost-ring nodes only with ringLinks", () => {
  const {nodes, linkMap} = graph();
  const pairs = edges => edges.map(e => `${e.source.id}-${e.target.id}`).sort();
  const build = (depth, ringLinks) => {
    const geom = ringsGeometry(400, 400, depth);
    const tree = claimRings(linkMap, nodes.c, depth);
    placeRings(tree, geom);
    tree.rings.forEach((ring, k) =>
      ring.forEach(n => {
        n.ring = k + 1;
        n.r = 4;
      }),
    );
    return buildRingsEdges(tree.rings, linkMap, nodes.c, geom, ringLinks);
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

  // ringLinks adds the links between two outermost-ring nodes.
  assert.deepStrictEqual(pairs(build(1, true)), ["a-b", "c-a", "c-b", "c-d"]);
  assert.deepStrictEqual(
    pairs(build(2, true)),
    pairs(build(2)).concat("a1-a2").sort(),
  );
  const ringLinks = build(2, true).find(e => e.source.id === "a1");
  assert.strictEqual(ringLinks.target.id, "a2");
  assert.strictEqual(ringLinks.spline, true, "it curves");
  assert.deepStrictEqual(pairs(build(3, true)), pairs(three), "x has no peer");
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

it("Rings hops: 2 is the default layout", () => {
  assert.deepStrictEqual(summary(layout(c => c.hops(2))), summary(layout()));
});

it("Rings hops: nodes sit on the rings, each once; center and first ring keep their size", () => {
  const two = layout().nodes;
  const centerR = two[0].r;
  const firstR = two.find(n => n.ring === 1).r;
  for (const hops of [1, 2, 3, 4]) {
    const {nodes} = layout(c => c.hops(hops));
    const geom = ringsGeometry(400, 400, hops);
    const center = nodes[0];
    assert.strictEqual(center.id, "c");
    assert.strictEqual(center.r, centerR, `${hops} hops: the center's size`);
    const seen = nodes.map(n => n.id);
    assert.strictEqual(new Set(seen).size, seen.length, `${hops} hops: unique`);
    const byRing = {};
    nodes.slice(1).forEach(n => {
      close(
        Math.hypot(n.x - center.x, n.y - center.y),
        geom.rings[n.ring - 1],
        `${hops} hops: ${n.id} on ring ${n.ring}`,
      );
      (byRing[n.ring] ??= new Set()).add(n.r);
    });
    const rings = Object.keys(byRing).map(Number);
    assert.strictEqual(Math.max(...rings), Math.min(hops, 4));
    assert.deepStrictEqual(
      [...byRing[1]],
      [firstR],
      `${hops} hops: first ring`,
    );
    rings.forEach(k =>
      assert.strictEqual(byRing[k].size, 1, `${hops} hops: one size per ring`),
    );
    for (let k = 2; k <= Math.max(...rings); k++)
      assert.ok([...byRing[k]][0] <= [...byRing[k - 1]][0]);
  }
  assert.deepStrictEqual(
    layout(c => c.hops(1)).nodes.map(n => n.id),
    ["c", "d", "a", "b"],
    "one ring: only the center's neighbors",
  );
  assert.deepStrictEqual(
    layout(c => c.hops(3)).nodes.map(n => n.id),
    ["c", "d", "a", "b", "a1", "a2", "b1", "x"],
  );
});

it("Rings hops: outer nodes shrink on a larger chart", () => {
  const {nodes} = layout(c => c.hops(3).width(1200).height(1200));
  const r = ring => nodes.find(n => n.ring === ring).r;
  assert.ok(r(1) > r(2) && r(2) > r(3), `${r(1)} > ${r(2)} > ${r(3)}`);
});

it("Rings ringLinks: draws the outermost ring's own links, and nothing else changes", () => {
  const plain = layout();
  const linked = layout(c => c.ringLinks(true));
  const pairs = ({edges}) => edges.map(e => `${e.source.id}-${e.target.id}`);
  assert.deepStrictEqual(
    pairs(linked),
    pairs(plain).concat("a1-a2"),
    "a1-a2 joins at the end",
  );
  assert.deepStrictEqual(
    summary(linked).nodes,
    summary(plain).nodes,
    "the nodes stay put",
  );
});
