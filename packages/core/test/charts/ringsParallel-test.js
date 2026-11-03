import {it} from "vitest";
import assert from "assert";

import {useJsdom} from "~test/jsdom.js";
import {Rings} from "../../index.ts";
import {
  applyRingsLayout,
  bowedEdge,
  edgesBetween,
  fanParallelEdges,
  firstPerNeighbor,
  parallelOffsets,
  runStages,
  slideOnRim,
} from "../../internal.ts";

useJsdom();

const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-6, msg);

/** Lays out a 400 × 400 Rings around `center`, returning its nodes and edges. */
function layout(center, links) {
  const chart = new Rings().center(center).links(links).width(400).height(400);
  chart._preDraw();
  chart._margin = {top: 0, right: 0, bottom: 0, left: 0};
  chart._padding = {top: 0, right: 0, bottom: 0, left: 0};
  const ctx = runStages({viz: chart}, [applyRingsLayout]);
  return {nodes: ctx.shapeData, edges: chart.ctx.ringsCtx.edges};
}

const kinds = edges => edges.map(e => e.datum.kind).sort();

it("firstPerNeighbor keeps the first edge to each other node", () => {
  const a = {id: "a"},
    b = {id: "b"},
    c = {id: "c"};
  const edges = [
    {source: a, target: b},
    {source: a, target: c},
    {source: b, target: a},
    {source: a, target: b},
  ];
  assert.deepStrictEqual(firstPerNeighbor(edges, "a"), [edges[0], edges[1]]);
  assert.deepStrictEqual(firstPerNeighbor([], "a"), []);
});

it("edgesBetween finds the edges between two nodes, either way", () => {
  const a = {id: "a"},
    b = {id: "b"},
    c = {id: "c"};
  const edges = [
    {source: a, target: b},
    {source: a, target: c},
    {source: b, target: a},
  ];
  assert.deepStrictEqual(edgesBetween(edges, "a", "b"), [edges[0], edges[2]]);
  assert.deepStrictEqual(edgesBetween(edges, "b", "c"), []);
});

it("parallelOffsets centers n links on the line, step apart", () => {
  assert.deepStrictEqual(parallelOffsets(1, 10), [0]);
  assert.deepStrictEqual(parallelOffsets(2, 10), [-5, 5]);
  assert.deepStrictEqual(parallelOffsets(3, 10), [-10, 0, 10]);
});

/** A cubic link's middle point: (P0 + 3·P1 + 3·P2 + P3) / 8. */
const middle = e => [
  (e.sourceX + 3 * e.sourceBisectX + 3 * e.targetBisectX + e.targetX) / 8,
  (e.sourceY + 3 * e.sourceBisectY + 3 * e.targetBisectY + e.targetY) / 8,
];

it("slideOnRim moves a rim point sideways, staying on the rim", () => {
  const node = {x: 0, y: 0};
  const p = slideOnRim(node, [10, 0], [0, 1], 6);
  close(p[1], 6, "6px along the normal");
  close(Math.hypot(...p), 10, "on the rim");
  assert.ok(p[0] > 0, "same side of the center");
  const back = slideOnRim(node, [-10, 0], [0, 1], 6);
  assert.ok(back[0] < 0, "a rim point on the far side stays there");
  const capped = slideOnRim(node, [10, 0], [0, 1], 50);
  close(capped[1], 9, "slides at most 90% of the radius");
  assert.deepStrictEqual(slideOnRim(node, [0, 0], [0, 1], 6), [0, 0]);
});

it("bowedEdge bows its middle across the gap, ending on each node's rim", () => {
  const s = {x: 0, y: 0, r: 10};
  const t = {x: 100, y: 0, r: 5};
  const e = bowedEdge(s, t, [0, 1], 6);
  const [midX, midY] = middle(e);
  close(midY, 6, "middle sits 6px out");
  assert.ok(midX > 50 && midX < 55, `across the gap's middle, got ${midX}`);
  close(Math.hypot(e.sourceX - s.x, e.sourceY - s.y), 10, "starts on s");
  close(Math.hypot(e.targetX - t.x, e.targetY - t.y), 5, "ends on t");
  close(e.sourceY, 4.5, "its ends sit 3/4 as far out");
  close(e.targetY, 4.5);
  const flat = bowedEdge(s, t, [0, 1], 0);
  close(flat.sourceY, 0, "no offset stays on the line");
  close(flat.sourceX, 10);
  close(flat.targetX, 95);
});

it("fanParallelEdges bows parallel links apart and leaves single links alone", () => {
  const a = {id: "a", x: 0, y: 0, r: 4};
  const b = {id: "b", x: 100, y: 0, r: 4};
  const c = {id: "c", x: 0, y: 100, r: 4};
  const edges = [
    {source: a, target: b, size: 1},
    {source: b, target: a, size: 1},
    {source: a, target: c, size: 1},
  ];
  fanParallelEdges(edges);
  assert.ok(edges[0].spline && edges[1].spline, "the pair bows");
  assert.ok(!edges[2].spline, "the single link stays straight");
  const [m0, m1] = [middle(edges[0]), middle(edges[1])];
  // Opposite sides, a hit path's width plus a gap apart.
  close(m0[1], -6, `first bows up, got ${m0[1]}`);
  close(m1[1], 6, `second bows down, got ${m1[1]}`);
  const big = {id: "big", x: 0, y: 0, r: 12};
  const far = {id: "far", x: 100, y: 0, r: 12};
  const wide = [
    {source: big, target: far, size: 10},
    {source: big, target: far, size: 2},
  ];
  fanParallelEdges(wide);
  close(middle(wide[1])[1] - middle(wide[0])[1], 18, "wider links sit wider");
});

it("fanParallelEdges moves curved links apart, ends and control points", () => {
  const a = {id: "a", x: 0, y: 0, r: 4};
  const b = {id: "b", x: 100, y: 0, r: 4};
  const spline = () => ({
    source: a,
    target: b,
    size: 1,
    spline: true,
    sourceX: 4,
    sourceY: 0,
    sourceBisectX: 30,
    sourceBisectY: 20,
    targetBisectX: 70,
    targetBisectY: 20,
    targetX: 96,
    targetY: 0,
  });
  const edges = [spline(), spline()];
  const before = middle(spline());
  fanParallelEdges(edges);
  close(middle(edges[0])[1] - before[1], -6);
  close(middle(edges[1])[1] - before[1], 6);
  close(edges[0].sourceY, -3.6, "ends slide at most 90% of the radius");
  close(Math.hypot(edges[0].sourceX, edges[0].sourceY), 4, "on the rim");
});

it("Rings places a node with parallel center links once, keeping every link", () => {
  const {nodes, edges} = layout("A", [
    {source: "A", target: "B", kind: "ab1"},
    {source: "A", target: "B", kind: "ab2"},
    {source: "C", target: "A", kind: "ca"},
    {source: "A", target: "C", kind: "ac"},
    {source: "A", target: "D", kind: "ad"},
  ]);
  const ids = nodes.map(n => n.id);
  assert.deepStrictEqual([...ids].sort(), ["A", "B", "C", "D"]);
  assert.deepStrictEqual(kinds(edges), ["ab1", "ab2", "ac", "ad", "ca"]);
  // Three primaries share the ring evenly.
  const angles = nodes
    .filter(n => n.id !== "A")
    .map(n => n.radians)
    .sort((a, b) => a - b);
  close(angles[1] - angles[0], (Math.PI * 2) / 3, "even spacing");
  close(angles[2] - angles[1], (Math.PI * 2) / 3, "even spacing");
  // The pairs bow apart; the single link stays straight.
  const ab = edges.filter(e => e.datum.kind.startsWith("ab"));
  assert.ok(ab.every(e => e.spline));
  assert.notStrictEqual(ab[0].sourceBisectX, ab[1].sourceBisectX);
  assert.ok(!edges.find(e => e.datum.kind === "ad").spline);
});

it("Rings places a second-ring node with parallel links once", () => {
  const {nodes, edges} = layout("A", [
    {source: "A", target: "B", kind: "ab"},
    {source: "A", target: "C", kind: "ac"},
    {source: "B", target: "D", kind: "bd1"},
    {source: "D", target: "B", kind: "db"},
    {source: "B", target: "D", kind: "bd2"},
    {source: "C", target: "E", kind: "ce"},
  ]);
  assert.deepStrictEqual(nodes.map(n => n.id).sort(), [
    "A",
    "B",
    "C",
    "D",
    "E",
  ]);
  assert.deepStrictEqual(kinds(edges), ["ab", "ac", "bd1", "bd2", "ce", "db"]);
  // D and E each take one equal share of the second ring.
  const d = nodes.find(n => n.id === "D");
  const e = nodes.find(n => n.id === "E");
  const between = Math.abs(d.radians - e.radians);
  close(Math.min(between, Math.PI * 2 - between), Math.PI, "D and E opposite");
  const bd = edges.filter(x => ["bd1", "db", "bd2"].includes(x.datum.kind));
  assert.strictEqual(new Set(bd.map(x => x.sourceBisectX)).size, 3);
});
