import {it} from "vitest";
import assert from "assert";

import {
  CIRCULAR_CLEARANCE,
  CIRCULAR_RADIUS,
  capReserve,
  circularArrowEdge,
  columnEdges,
  columnScale,
  circularLanes,
  circularLinkAnchor,
  circularLinkD,
  circularLinkOrder,
  circularLinkShape,
  circularLinkSide,
  circularReserve,
  circularRibbonD,
  layOutCircular,
  sankeyArrowSize,
  sankeyNodeValue,
  sankeyScale,
  solveScale,
  stackCircularEnds,
} from "../../internal.ts";
import {sankey} from "../../src/charts/Sankey/sankeyLayout.ts";

const node = (layer, y0, y1, x0 = layer * 100) => ({
  layer,
  x0,
  x1: x0 + 10,
  y0,
  y1,
});
const link = (index, source, target, width = 4, value = width) => ({
  index,
  source,
  target,
  value,
  width,
});
/** Columns 100px apart, 10px wide (see `node`). */
const columnX = layer => [layer * 100, layer * 100 + 10];
const numbers = d => (d.match(/-?\d+(\.\d+)?/g) || []).map(Number);

it("circularLinkSide runs a lane along the half its ends sit in", () => {
  const top = node(0, 0, 20);
  const bottom = node(1, 80, 100);
  assert.strictEqual(
    circularLinkSide({source: top, target: top}, 0, 100),
    "top",
  );
  assert.strictEqual(
    circularLinkSide({source: bottom, target: bottom}, 0, 100),
    "bottom",
  );
  // Ends in different halves: by the middle of the two.
  assert.strictEqual(
    circularLinkSide({source: bottom, target: node(0, 0, 40)}, 0, 100),
    "bottom",
  );
  assert.strictEqual(
    circularLinkSide(
      {source: node(1, 40, 60), target: node(0, 40, 60)},
      0,
      100,
    ),
    "top",
  );
});

it("circularLinkOrder nests short loops inside long ones, then by nearness to the side", () => {
  const a = node(0, 0, 10);
  const b = node(1, 0, 10);
  const c = node(2, 0, 10);
  const c2 = node(2, 50, 60);
  const links = [
    link(0, c, a),
    link(1, c, b),
    link(2, c2, b),
    link(3, b, b),
    link(4, c, b, 4, 9),
  ];
  const top = circularLinkOrder(links, "top").map(l => l.index);
  assert.deepStrictEqual(top, [3, 4, 1, 2, 0]);
  const bottom = circularLinkOrder(links, "bottom").map(l => l.index);
  assert.deepStrictEqual(bottom, [3, 2, 4, 1, 0]);
  assert.deepStrictEqual(
    links.map(l => l.index),
    [0, 1, 2, 3, 4],
    "leaves its input alone",
  );
});

it("circularLanes stacks lanes that share columns and nests legs at each column", () => {
  const a = node(0, 0, 10);
  const b = node(1, 0, 10);
  const c = node(2, 0, 10);
  const d = node(3, 0, 10);
  const e = node(4, 0, 10);
  const links = [link(0, c, b, 4), link(1, c, a, 6), link(2, e, d, 3)];
  const lanes = circularLanes(links, 5, columnX);
  assert.deepStrictEqual(
    lanes.map(l => l.depth),
    [0, 4, 0],
  );
  assert.strictEqual(lanes[0].arcSource, CIRCULAR_RADIUS + 2);
  // The second leg out of column 2 turns around the first.
  assert.strictEqual(lanes[1].arcSource, CIRCULAR_RADIUS + 4 + 3);
  assert.strictEqual(lanes[1].legSource, 5 + CIRCULAR_RADIUS + 4 + 3);
  // Different target columns: neither turns around the other.
  assert.strictEqual(lanes[1].arcTarget, CIRCULAR_RADIUS + 3);
  assert.strictEqual(lanes[2].legTarget, 5 + CIRCULAR_RADIUS + 1.5);
  assert.deepStrictEqual(circularLanes([], 0, columnX), []);
  // A wide loop's legs reach into the next columns, so it stacks outside
  // a lane two columns over.
  const wide = node(4, 0, 10);
  const stacked = circularLanes(
    [link(0, c, b, 4), link(1, wide, wide, 200)],
    0,
    columnX,
  );
  assert.deepStrictEqual(
    stacked.map(l => l.depth),
    [0, 4],
  );
});

it("circularReserve makes room for lanes and for legs past the outer columns", () => {
  const a = node(0, 0, 10);
  const c = node(2, 0, 10);
  const top = [link(0, c, a, 4), link(1, a, a, 2)];
  const bottom = [link(2, node(1, 50, 60), node(1, 50, 60), 3)];
  const reserve = circularReserve(
    [
      {side: "top", links: top, lanes: circularLanes(top, 0, columnX)},
      {
        side: "bottom",
        links: bottom,
        lanes: circularLanes(bottom, 0, columnX),
      },
    ],
    2,
  );
  // The self-link on column 0 sits outside the lane into column 0.
  assert.strictEqual(reserve.top, CIRCULAR_CLEARANCE + 4 + 2);
  assert.strictEqual(reserve.bottom, CIRCULAR_CLEARANCE + 3);
  assert.strictEqual(reserve.right, CIRCULAR_RADIUS + 2 + 2);
  assert.strictEqual(reserve.left, CIRCULAR_RADIUS + 4 + 1 + 1);
  assert.deepStrictEqual(circularReserve([], 0), {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });
});

it("circularLinkShape places the lane outside the nodes and caps each turn", () => {
  const s = node(2, 30, 50, 200);
  const t = node(0, 40, 60, 0);
  const l = {...link(0, s, t, 4), y0: 32, y1: 42};
  const lane = {
    depth: 6,
    arcSource: 10,
    arcTarget: 10,
    legSource: 10,
    legTarget: 12,
  };
  const top = circularLinkShape(l, lane, "top", 30);
  assert.strictEqual(top.laneY, 30 - CIRCULAR_CLEARANCE - 6 - 2);
  assert.strictEqual(top.xs, 210);
  assert.strictEqual(top.xr, 220);
  assert.strictEqual(top.xt, 0);
  assert.strictEqual(top.xl, -12);
  assert.strictEqual(top.rs, 10);
  const bottom = circularLinkShape(l, lane, "bottom", 60);
  assert.strictEqual(bottom.laneY, 60 + CIRCULAR_CLEARANCE + 6 + 2);
  // A leg too short for two full turns turns tighter.
  const short = circularLinkShape(l, {...lane, arcSource: 40}, "top", 30);
  assert.strictEqual(short.rs, (32 - short.laneY) / 2);
});

it("circularLinkD runs from source to target through four turns", () => {
  const shape = {
    side: "top",
    xs: 210,
    sy: 32,
    xt: 0,
    ty: 42,
    laneY: 10,
    xr: 222,
    rs: 8,
    xl: -12,
    rt: 8,
  };
  const d = circularLinkD(shape);
  assert.ok(d.startsWith("M210,32L214,32C"), d);
  assert.ok(d.endsWith("L0,42"), d);
  assert.strictEqual((d.match(/C/g) || []).length, 4);
  assert.ok(numbers(d).every(Number.isFinite));
  const ys = numbers(d).filter((_, k) => k % 2);
  assert.strictEqual(Math.min(...ys), 10, "reaches the lane");
  const trimmed = circularLinkD(shape, 6, 5);
  assert.ok(trimmed.startsWith("M216,32") && trimmed.endsWith("L-5,42"));
  const below = circularLinkD({...shape, side: "bottom", laneY: 90});
  assert.strictEqual(Math.max(...numbers(below).filter((_, k) => k % 2)), 90);
});

it("circularLinkAnchor is the middle of the lane's straight run", () => {
  const anchor = circularLinkAnchor({
    side: "top",
    xs: 210,
    sy: 32,
    xt: 0,
    ty: 42,
    laneY: 10,
    xr: 222,
    rs: 8,
    xl: -12,
    rt: 8,
  });
  assert.strictEqual(anchor.x, (214 + -4) / 2);
  assert.strictEqual(anchor.y, 10);
  assert.ok(Math.abs(Math.abs(anchor.angle) - Math.PI) < 1e-9);
});

it("sankeyNodeValue is the larger of the flow out and in, returns included", () => {
  const links = [
    {source: 0, target: 1, value: 5},
    {source: 1, target: 2, value: 4},
    {source: 2, target: 0, value: 3},
    {source: 1, target: 1, value: 2},
    {source: 2, target: 1, value: NaN},
  ];
  assert.strictEqual(sankeyNodeValue(0, links), 5);
  assert.strictEqual(sankeyNodeValue(1, links), 7);
  assert.strictEqual(sankeyNodeValue(2, links), 4);
  assert.strictEqual(sankeyNodeValue(3, links), 0);
});

it("stackCircularEnds puts top returns at a node's top, bottom ones at its bottom", () => {
  const a = {y0: 0, y1: 20};
  const b = {y0: 0, y1: 20};
  const regular = {source: a, target: b, y0: 3, y1: 3};
  const up = {source: b, target: a, width: 4};
  const up2 = {source: b, target: a, width: 2};
  const self = {source: a, target: a, width: 6};
  stackCircularEnds(
    [
      {side: "top", links: [up, up2]},
      {side: "bottom", links: [self]},
    ],
    [regular],
  );
  assert.deepStrictEqual([up.y0, up.y1, up2.y0, up2.y1], [2, 2, 5, 5]);
  assert.deepStrictEqual([self.y0, self.y1], [17, 17]);
  // Only b's left side has returns above: the regular band moves down there.
  assert.deepStrictEqual([regular.y0, regular.y1], [3, 3]);
  const into = {source: b, target: a, y0: 1, y1: 1};
  stackCircularEnds(
    [{side: "top", links: [{source: a, target: a, width: 4}]}],
    [into],
  );
  assert.deepStrictEqual([into.y0, into.y1], [1, 5]);
});

it("sankeyScale is pixels per unit of value", () => {
  assert.strictEqual(
    sankeyScale([
      {value: 0, y0: 0, y1: 0},
      {value: 4, y0: 10, y1: 30},
    ]),
    5,
  );
  assert.strictEqual(sankeyScale([{value: 0, y0: 0, y1: 0}]), 0);
  assert.strictEqual(sankeyScale([]), 0);
});

it("capReserve keeps at least half the chart for the nodes", () => {
  const small = {top: 10, right: 5, bottom: 20, left: 0};
  assert.deepStrictEqual(capReserve(small, 400, 300), small);
  const big = capReserve(
    {top: 300, right: 400, bottom: 100, left: 100},
    400,
    400,
  );
  assert.strictEqual(big.top + big.bottom, 200);
  assert.strictEqual(big.top, 150);
  assert.strictEqual(big.left + big.right, 200);
});

it("layOutCircular lays out returns around nodes that fit inside the chart", () => {
  const nodes = [{}, {}, {}, {}];
  const links = [
    {source: 0, target: 1, value: 6},
    {source: 1, target: 2, value: 4},
    {source: 2, target: 3, value: 3},
  ];
  const circular = [
    {source: 2, target: 0, value: 1, datum: "c→a", i: 3},
    {source: 1, target: 1, value: 2, datum: "b→b", i: 4},
  ];
  // Every node is sized by the flow through it, returns included.
  nodes.forEach(
    (n, i) => (n.fixedValue = sankeyNodeValue(i, [...links, ...circular])),
  );
  const layout = sankey().nodes(nodes).links(links).nodeWidth(10);
  const extents = [];
  const laid = layOutCircular({
    run: extent => (extents.push(extent), layout.extent(extent)()),
    nodes,
    links,
    circular,
    width: 400,
    height: 300,
    padding: 8,
    stubFor: () => 8,
  });
  assert.strictEqual(extents.length, 2);
  const [[x0, y0], [x1, y1]] = extents[1];
  assert.ok(
    x0 > 0 && y0 > 0 && x1 <= 400 && y1 <= 300,
    JSON.stringify(extents),
  );
  assert.deepStrictEqual(
    laid.map(l => l.datum),
    ["c→a", "b→b"],
  );
  for (const l of laid) {
    const ys = numbers(circularLinkD(l.circular)).filter((_, k) => k % 2);
    const xs = numbers(circularLinkD(l.circular)).filter((_, k) => !(k % 2));
    assert.ok(Math.min(...ys) - l.width / 2 >= -0.01, `inside: ${ys}`);
    assert.ok(Math.max(...ys) + l.width / 2 <= 300.01, `inside: ${ys}`);
    assert.ok(Math.min(...xs) - l.width / 2 >= -0.01, `inside: ${xs}`);
    assert.ok(Math.max(...xs) + l.width / 2 <= 400.01, `inside: ${xs}`);
    assert.ok(l.width > 0 && Number.isFinite(l.y0) && Number.isFinite(l.y1));
  }
  const ky = sankeyScale(nodes);
  assert.ok(Math.abs(laid[0].width - ky) < 1e-9);
  // Node b's height counts its link to itself.
  assert.ok(Math.abs(nodes[1].y1 - nodes[1].y0 - 8 * ky) < 1e-6);

  const once = [];
  const none = layOutCircular({
    run: extent => (once.push(extent), layout.extent(extent)()),
    nodes,
    links,
    circular: [],
    width: 400,
    height: 300,
    padding: 8,
    stubFor: () => 0,
  });
  assert.deepStrictEqual(none, []);
  assert.strictEqual(once.length, 1);
});

it("circularArrowEdge lays each head along its band's straight end", () => {
  const shape = {
    side: "top",
    xs: 210,
    sy: 32,
    xt: 0,
    ty: 42,
    laneY: 10,
    xr: 230,
    rs: 8,
    xl: -20,
    rt: 8,
  };
  const edge = circularArrowEdge(shape, 10, 6, {source: true, target: true}, 3);
  assert.deepStrictEqual(edge.target.tip, [0, 42]);
  assert.strictEqual(edge.target.angle, 0);
  assert.deepStrictEqual(edge.target.cut, [-6, 42]);
  assert.deepStrictEqual(edge.source.tip, [210, 32]);
  assert.ok(Math.abs(edge.source.angle - Math.PI) < 1e-9);
  // The ribbon, 3px each side, ends square at each head's cut.
  assert.ok(edge.d.startsWith("M216,35L"), edge.d);
  assert.ok(edge.d.includes("L-6,45L-6,39"), edge.d);
  assert.ok(edge.d.endsWith("L216,29Z"), edge.d);
  const plain = circularArrowEdge(
    shape,
    10,
    6,
    {source: false, target: false},
    3,
  );
  assert.strictEqual(plain.d, circularRibbonD(shape, 3));
});

it("sankeyArrowSize follows the band's width between 8 and 28, or arrowSize", () => {
  const viz = {schema: {}};
  assert.strictEqual(sankeyArrowSize(viz, 12, {}, 0), 12);
  assert.strictEqual(sankeyArrowSize(viz, 2, {}, 0), 8);
  assert.strictEqual(sankeyArrowSize(viz, 90, {}, 0), 28);
  assert.strictEqual(sankeyArrowSize(viz, undefined, {}, 0), 8);
  assert.strictEqual(sankeyArrowSize({schema: {arrowSize: 5}}, 90, {}, 0), 5);
  assert.strictEqual(
    sankeyArrowSize({schema: {arrowSize: (d, i) => i * 3}}, 90, {}, 4),
    12,
  );
});

it("columnScale matches the scale the layout draws nodes at", () => {
  const nodes = [{}, {}, {}, {}, {}];
  const links = [
    {source: 0, target: 1, value: 5},
    {source: 0, target: 2, value: 3},
    {source: 1, target: 3, value: 4},
    {source: 2, target: 4, value: 2},
  ];
  const layout = sankey().nodes(nodes).links(links).nodePadding(10);
  for (const height of [300, 120, 40]) {
    layout.extent([
      [0, 20],
      [400, 20 + height],
    ])();
    assert.ok(
      Math.abs(columnScale(nodes, height, 10) - sankeyScale(nodes)) < 1e-9,
      `${height}`,
    );
  }
  assert.strictEqual(columnScale([], 100, 8), 0);
  assert.strictEqual(columnScale([{layer: 0, value: 0}], 100, 8), 0);
});

it("solveScale finds the scale at which nodes fill what the lanes leave", () => {
  // Nodes drawn at (height - 10) / 8; lanes take 12 + 3 units of value.
  const scaleFor = h => Math.max(0, (h - 10) / 8);
  const reserve = ky => 12 + 3 * ky;
  const ky = solveScale(scaleFor, reserve, 300, 1000);
  assert.ok(Math.abs(ky - (300 - 12 - 10) / 11) < 1e-6, `${ky}`);
  assert.ok(scaleFor(300 - reserve(ky)) >= ky - 1e-9);
  assert.strictEqual(
    solveScale(scaleFor, () => 400, 300, 50),
    0,
  );
  assert.strictEqual(solveScale(scaleFor, reserve, 300, 0), 0);
});

it("columnEdges spreads columns across an extent as the layout does", () => {
  const nodes = [{}, {}, {}];
  const links = [
    {source: 0, target: 1, value: 2},
    {source: 1, target: 2, value: 2},
  ];
  sankey()
    .nodes(nodes)
    .links(links)
    .nodeWidth(12)
    .extent([
      [30, 0],
      [470, 200],
    ])();
  const edges = columnEdges(30, 470, 2, 12);
  for (const n of nodes) assert.deepStrictEqual(edges(n.layer), [n.x0, n.x1]);
  assert.deepStrictEqual(columnEdges(0, 100, 0, 10)(0), [0, 10]);
});
