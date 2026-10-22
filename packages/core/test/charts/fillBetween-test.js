import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {LinePlot} from "../../index.ts";
import {
  betweenPoints,
  emitFillBetween,
  FILL_BETWEEN_KEY,
  fillBetweenDefaults,
  fillBetweenPairs,
  inheritedFillStyle,
  sideClip,
  valueDirection,
} from "../../src/charts/Plot/fillBetween.ts";

useJsdom();

// #283: fill the area between two series' lines.

const plotted = (d, i) => ({
  __d3plus__: true,
  data: d,
  i,
  id: d.id,
  x: d.t,
  y: d.v,
  discrete: d.t,
});
const series = (id, values) => values.map((v, k) => ({id, t: k + 1, v}));
const rows = [
  ...series("a", [10, 12, 8, 6]),
  ...series("b", [8, 9, 10, 11]),
].map(plotted);

// x: 1..4 → 0..300 px; y: 0..20 → 200..0 px.
const px = d => (d.x - 1) * 100;
const py = d => 200 - d.y * 10;

/** The emit context the Line shape group hands its helpers. */
const ctx = (viz, values = rows) => ({
  viz,
  values,
  shapeConfig: {x: px, y: py},
});

const colors = {a: "#ff0000", b: "#0000ff"};
const unwrap = d => {
  while (d.__d3plus__ && d.data) d = d.data;
  return d;
};
const chart = setting =>
  new LinePlot()
    .fillBetween(setting)
    .duration(0)
    .shapeConfig({stroke: d => colors[unwrap(d).id], Line: {curve: "linear"}});

it("fillBetweenDefaults — a light fill", () => {
  assert.deepStrictEqual(fillBetweenDefaults(), {fillOpacity: 0.25});
  assert.deepStrictEqual(new LinePlot().fillBetweenConfig(), {
    fillOpacity: 0.25,
  });
  assert.strictEqual(new LinePlot().fillBetween(), false, "off by default");
});

it("fillBetweenPairs — true, one pair, or a list of pairs", () => {
  const ids = ["a", "b", "c"];
  assert.deepStrictEqual(
    fillBetweenPairs(true, ids),
    [["a", "b"]],
    "the first two series",
  );
  assert.deepStrictEqual(fillBetweenPairs(true, ["a"]), [], "needs two series");
  assert.deepStrictEqual(fillBetweenPairs(["c", "a"], ids), [["c", "a"]]);
  assert.deepStrictEqual(
    fillBetweenPairs(
      [
        ["a", "b"],
        ["b", "c"],
      ],
      ids,
    ),
    [
      ["a", "b"],
      ["b", "c"],
    ],
  );
  assert.deepStrictEqual(
    fillBetweenPairs([1, 2], ["1", "2"]),
    [["1", "2"]],
    "ids compare as strings",
  );
  assert.deepStrictEqual(
    fillBetweenPairs([["a", "z"], ["a", "a"], ["b"]], ids),
    [],
    "missing, repeated, or short pairs are dropped",
  );
  assert.deepStrictEqual(fillBetweenPairs(false, ids), []);
  assert.deepStrictEqual(fillBetweenPairs(undefined, ids), []);
});

it("betweenPoints — the discrete positions both series share", () => {
  const a = rows.filter(d => d.id === "a");
  const b = rows.filter(d => d.id === "b").slice(1);
  const points = betweenPoints(a, b, px, py);
  assert.deepStrictEqual(
    points,
    [
      {pos: 100, a: 80, b: 110},
      {pos: 200, a: 120, b: 100},
      {pos: 300, a: 140, b: 90},
    ],
    "t=1 has no partner",
  );
  assert.deepStrictEqual(
    betweenPoints(a, b, () => NaN, py),
    [],
    "unplaceable points are dropped",
  );
});

it("sideClip — the region from the first line out to an edge", () => {
  const points = [
    {pos: 0, a: 10, b: 0},
    {pos: 100, a: 20, b: 0},
  ];
  assert.strictEqual(
    sideClip(points, -1000, true, "linear"),
    "M0,10L100,20L100,-1000L0,-1000Z",
  );
  assert.strictEqual(
    sideClip(points, 500, false, "linear"),
    "M10,0L20,100L500,100L500,0Z",
    "vertical",
  );
  assert.ok(
    sideClip(
      [...points, {pos: 200, a: 5, b: 0}],
      0,
      true,
      "monotoneX",
    ).includes("C"),
    "follows the curve",
  );
  assert.strictEqual(sideClip([], 0, true, "linear"), "");
});

it("valueDirection — which way higher values run in pixels", () => {
  assert.strictEqual(valueDirection(rows, py, "y"), -1, "a y axis runs up");
  assert.strictEqual(
    valueDirection(rows, d => d.y * 10, "y"),
    1,
    "reversed",
  );
  assert.strictEqual(
    valueDirection(rows, d => d.y, "x"),
    1,
  );
  const flat = rows.map(d => ({...d, y: 5}));
  assert.strictEqual(
    valueDirection(flat, py, "y"),
    -1,
    "no change: y defaults up",
  );
  assert.strictEqual(valueDirection(flat, py, "x"), 1, "x defaults right");
});

it("emitFillBetween — two clipped copies of the area, one per series color", () => {
  const nodes = emitFillBetween(ctx(chart(true)));
  assert.strictEqual(nodes.length, 2);
  const key = `${FILL_BETWEEN_KEY}-a-b`;
  assert.deepStrictEqual(
    nodes.map(n => n.key),
    [`${key}-a::clip`, `${key}-b::clip`],
  );
  for (const node of nodes) {
    assert.strictEqual(node.type, "group");
    assert.strictEqual(node.interactive, false);
    assert.ok(
      node.clip && node.clip.type === "path" && node.clip.d.startsWith("M"),
    );
    assert.ok(
      node.children.every(c => c.interactive === false),
      "pointer events go to the lines",
    );
  }
  const [aboveA, aboveB] = nodes.map(n => n.children[0]);
  assert.strictEqual(
    aboveA.paint.fill,
    colors.a,
    "where a is higher, a's color",
  );
  assert.strictEqual(aboveB.paint.fill, colors.b);
  assert.strictEqual(aboveA.paint.fillOpacity, 0.25);
  assert.ok(
    nodes[0].clip.d.includes(",100000") && !nodes[0].clip.d.includes("-100000"),
    "where a is higher, b lies below it",
  );
  assert.ok(
    nodes[1].clip.d.includes(",-100000"),
    "where b is higher, a lies below it",
  );
});

it("emitFillBetween — fillBetweenConfig styles the fill; a fill accessor sees above/below", () => {
  const seen = [];
  const viz = chart(["b", "a"]).fillBetweenConfig({
    fill: d => (
      seen.push(`${d.above}>${d.below}`),
      d.above === "a" ? "green" : "orange"
    ),
    fillOpacity: 0.6,
  });
  const nodes = emitFillBetween(ctx(viz));
  assert.deepStrictEqual(
    nodes.map(n => n.children[0].paint.fill),
    ["orange", "green"],
  );
  assert.strictEqual(nodes[0].children[0].paint.fillOpacity, 0.6);
  assert.ok(seen.includes("a>b") && seen.includes("b>a"));
});

it("emitFillBetween — nothing without a pair or shared points", () => {
  assert.deepStrictEqual(emitFillBetween(ctx(chart(false))), []);
  assert.deepStrictEqual(emitFillBetween(ctx(chart(["a", "z"]))), []);
  const lonely = [...series("a", [1]), ...series("b", [2])].map(plotted);
  assert.deepStrictEqual(
    emitFillBetween(ctx(chart(true), lonely)),
    [],
    "one shared point",
  );
});

it("emitFillBetween — a vertical plot fills across x", () => {
  const viz = chart(true);
  viz.schema.discrete = "y";
  const flipped = rows.map(d => ({...d, x: d.y, y: d.x}));
  const nodes = emitFillBetween({
    viz,
    values: flipped,
    shapeConfig: {x: d => d.x * 10, y: d => (d.y - 1) * 100},
  });
  assert.strictEqual(nodes.length, 2);
  assert.ok(
    nodes[0].clip.d.endsWith("L-100000,0Z"),
    "where a is higher, b lies left of it",
  );
});

it("inheritedFillStyle: the fills take shapeConfig's texture and background image, Area first", () => {
  const accessor = d => d.id;
  const viz = new LinePlot().shapeConfig({
    texture: "lines",
    backgroundImage: accessor,
    fill: "red",
    Area: {texture: "circles", backgroundImageFit: "contain"},
  });
  assert.deepStrictEqual(inheritedFillStyle(viz), {
    texture: "circles",
    backgroundImage: accessor,
    backgroundImageFit: "contain",
  });
  assert.deepStrictEqual(
    inheritedFillStyle(new LinePlot()),
    {},
    "nothing to inherit by default",
  );
});
