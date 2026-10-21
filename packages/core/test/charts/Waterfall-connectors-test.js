import {it} from "vitest";
import assert from "assert";
import {connectorBars, connectorNodes, connectorSegments} from "../../src/charts/Waterfall/connectors.ts";

/**
    Waterfall connectors: reading drawn bars out of the scene, the line
    between consecutive steps of a series, and their scene nodes.
*/

const step = (series, index, end, joins = true) => ({series, index, end, joins});

it("connectorBars reads each Bar rect's discrete-axis extent", () => {
  const rowA = {n: "a"}, rowB = {n: "b"}, rowC = {n: "c"};
  const steps = new Map([[rowA, step("s", 0, 10)], [rowB, step("s", 1, 20)]]);
  const nodes = [{
    type: "group",
    children: [
      {type: "rect", shapeType: "Bar", x: -10, y: -30, width: 20, height: 30, transform: {x: 50, y: 200}, datum: {data: rowA}},
      {type: "rect", shapeType: "Bar", x: -10, y: 0, width: 20, height: 15, transform: {x: 90, y: 170}, datum: {data: rowB}},
      {type: "rect", shapeType: "Bar", x: 0, y: 0, width: 5, height: 5, transform: {x: 0, y: 0}, datum: {data: rowC}},
      {type: "text", shapeType: "Bar", datum: {data: rowA}},
    ],
  }];
  const vertical = connectorBars(nodes, d => steps.get(d), true);
  assert.deepStrictEqual(vertical.map(b => [b.datum.n, b.lo, b.hi]), [["a", 40, 60], ["b", 80, 100]], "rows without a step are skipped");
  const horizontal = connectorBars(nodes, d => steps.get(d), false);
  assert.deepStrictEqual(horizontal.map(b => [b.lo, b.hi]), [[170, 200], [170, 185]]);
});

it("connectorSegments joins consecutive steps at the earlier step's end", () => {
  const bars = [
    {step: step("s", 0, 100, false), datum: {}, lo: 0, hi: 20},
    {step: step("s", 1, 150), datum: {}, lo: 30, hi: 50},
    {step: step("s", 2, 120), datum: {}, lo: 60, hi: 80},
    {step: step("s", 3, 300, false), datum: {}, lo: 90, hi: 110},
    {step: step("t", 1, 5), datum: {}, lo: 200, hi: 210},
  ];
  const level = v => 400 - v;
  const segments = connectorSegments(bars, level, true);
  assert.deepStrictEqual(
    segments.map(s => [s.x1, s.y1, s.x2, s.y2]),
    [[20, 300, 30, 300], [50, 250, 60, 250]],
    "a reset, or a step whose predecessor isn't drawn, takes no connector",
  );
  assert.strictEqual(segments[0].from, bars[0]);
});

it("connectorSegments runs along the value axis for horizontal bars, either direction", () => {
  const bars = [
    {step: step("s", 0, 10, false), datum: {}, lo: 300, hi: 320},
    {step: step("s", 1, 25), datum: {}, lo: 260, hi: 280},
  ];
  const [segment] = connectorSegments(bars, v => v * 2, false);
  assert.deepStrictEqual([segment.x1, segment.y1, segment.x2, segment.y2], [20, 300, 20, 280], "bars laid out bottom-up connect their near edges");
  assert.deepStrictEqual(connectorSegments(bars, () => NaN, false), [], "a level off the scale draws nothing");
});

it("connectorNodes styles each connector as an inert line", () => {
  const from = {step: step("s", 0, 10), datum: {id: "x"}, lo: 0, hi: 1};
  const nodes = connectorNodes([{from, x1: 1, y1: 2, x2: 3, y2: 2}], {
    stroke: d => (d.id === "x" ? "#123" : "#000"),
    strokeWidth: 2,
    strokeOpacity: 0.5,
    strokeDasharray: "3 2",
  });
  assert.strictEqual(nodes.length, 1);
  const [node] = nodes;
  assert.strictEqual(node.type, "line");
  assert.strictEqual(node.key, "waterfall-connector-s-0");
  assert.deepStrictEqual(node.points, [[1, 2], [3, 2]]);
  assert.deepStrictEqual(node.paint, {fill: "none", stroke: "#123", strokeWidth: 2, strokeOpacity: 0.5, strokeDasharray: [3, 2]});
  assert.strictEqual(node.interactive, false);
  assert.strictEqual(node.interactionGroup, "axis");
  const [solid] = connectorNodes([{from, x1: 0, y1: 0, x2: 1, y2: 0}], {stroke: "#000", strokeDasharray: ""});
  assert.strictEqual(solid.paint.strokeDasharray, undefined);
});
