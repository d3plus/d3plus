import assert from "assert";
import {
  applyIcicleLayout,
  icicleGhosts,
  icicleOrient,
  icicleRenderBase,
  icicleReturning,
} from "../../es/src/charts/Icicle/applyLayout.js";
import {icicleBands} from "../../es/src/charts/Icicle/geometry.js";
import {icicleLayout} from "../../es/src/charts/Icicle/layout.js";
import {icicleDef} from "../../es/src/charts/Icicle/index.js";

const key = k => d => d[k];
const sum = d => d.value;
const field = k => icicleDef.fields.find(f => f.key === k);
const rows = [
  {group: "A", item: "a1", value: 30},
  {group: "A", item: "a2", value: 10},
  {group: "B", item: "b1", value: 60},
];
const frame = {width: 400, height: 300, orient: "horizontal"};
const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} vs ${b}`);

function mockViz({schema = {}, ...extra} = {}) {
  return {
    schema: {
      width: 420,
      height: 320,
      groupBy: [key("group"), key("item")],
      shapeConfig: {strokeWidth: 1},
      sum,
      sort: field("sort").decorate(null, field("sort").default),
      orient: "horizontal",
      ...schema,
    },
    _margin: {top: 10, bottom: 10, left: 10, right: 10},
    _filteredData: rows.map(d => ({...d})),
    _drawDepth: 1,
    _history: [],
    ctx: {},
    ...extra,
  };
}

it("Icicle layout: icicleLayout places every node in its depth's band, breadth by value", () => {
  const nodes = icicleLayout({
    data: rows,
    keys: [key("group"), key("item")],
    firstLevel: 0,
    focusPath: [],
    sum,
    sort: field("sort").decorate(null, field("sort").default),
    bands: icicleBands(400, 2, false),
    frame,
  });
  assert.strictEqual(nodes.length, 5);
  const b = nodes.find(n => n.id === JSON.stringify(["B"]));
  assert.deepStrictEqual([b.x, b.width], [0, 200]);
  close(b.y, 0, "largest first");
  close(b.height, 180, "60% of the breadth");
  for (const n of nodes.filter(d => d.parent)) {
    assert.strictEqual(n.x, n.parent.x + n.parent.width, "one band further out");
    assert.ok(n.y >= n.parent.y - 1e-9 && n.y + n.height <= n.parent.y + n.parent.height + 1e-9);
  }
});

it("Icicle layout: icicleOrient accepts only vertical, else horizontal", () => {
  assert.strictEqual(icicleOrient("vertical"), "vertical");
  assert.strictEqual(icicleOrient("horizontal"), "horizontal");
  assert.strictEqual(icicleOrient("sideways"), "horizontal");
  assert.strictEqual(icicleOrient(undefined), "horizontal");
});

it("Icicle layout: applyIcicleLayout fills the chart area and indexes nodes by row", () => {
  const viz = mockViz();
  const {shapeData} = applyIcicleLayout({viz});
  assert.strictEqual(shapeData.length, 5);
  assert.strictEqual(viz.ctx.icicleWidth, 400);
  assert.strictEqual(viz.ctx.icicleHeight, 300);
  assert.deepStrictEqual(viz.ctx.icicleBands, [
    [0, 0],
    [0, 200],
    [200, 400],
  ]);
  for (const n of shapeData) assert.strictEqual(viz.ctx.icicleNodes.get(n.datum), n);
  assert.strictEqual(viz._filteredData[2].__d3plusShare, 0.6);
  const vertical = mockViz({schema: {orient: "vertical"}});
  const top = applyIcicleLayout({viz: vertical}).shapeData.find(n => n.depth === 1);
  assert.deepStrictEqual([top.y, top.height], [0, 150], "levels run down");
});

it("Icicle layout: applyIcicleLayout returns nothing for empty data", () => {
  const viz = mockViz({_filteredData: []});
  assert.deepStrictEqual(applyIcicleLayout({viz}).shapeData, []);
  assert.deepStrictEqual(viz.ctx.icicleLaid, []);
  assert.strictEqual(viz.ctx.icicleEnterRects.size, 0);
});

it("Icicle layout: applyIcicleLayout draws the focus in the root band and collapses what a zoom removed, once", () => {
  const viz = mockViz();
  const first = applyIcicleLayout({viz}).shapeData;
  const a = first.find(n => n.id === JSON.stringify(["A"]));
  viz.ctx.icicleZoomOrigin = {x0: a.x0, x1: a.x1, depth: a.depth};
  viz._history = [{groupId: "A", groupDepth: 0}];
  viz._filteredData = viz._filteredData.slice(0, 2);
  const zoomed = applyIcicleLayout({viz}).shapeData;
  assert.strictEqual(zoomed[0].id, JSON.stringify(["A"]));
  assert.deepStrictEqual(
    [zoomed[0].x, zoomed[0].y, zoomed[0].width, zoomed[0].height],
    [0, 0, 200, 300],
    "the focus fills the root band",
  );
  const ghosts = viz.ctx.icicleGhosts;
  assert.deepStrictEqual(ghosts.map(g => g.id).sort(), [
    JSON.stringify(["B", "b1"]),
    JSON.stringify(["B"]),
  ]);
  assert.ok(ghosts.every(g => g.rect.height === 0), "folded to zero breadth");
  assert.strictEqual(viz.ctx.icicleZoomOrigin, undefined);
  applyIcicleLayout({viz});
  assert.strictEqual(viz.ctx.icicleGhosts.length, 2, "a second pass of the same render keeps them");
  viz._filteredData = viz._filteredData.slice();
  applyIcicleLayout({viz});
  assert.deepStrictEqual(viz.ctx.icicleGhosts, []);
});

it("Icicle layout: icicleGhosts keeps only the dropped nodes, collapsed through the origin", () => {
  const prev = [
    {id: "x", depth: 1, level: 0, x0: 0, x1: 0.5, datum: {}, i: 0},
    {id: "y", depth: 1, level: 0, x0: 0.5, x1: 1, datum: {}, i: 1},
  ];
  const ghosts = icicleGhosts(prev, [{id: "y"}], {x0: 0.5, x1: 1, depth: 1}, icicleBands(400, 1, true), frame);
  assert.deepStrictEqual(ghosts.map(g => g.id), ["x"]);
  assert.strictEqual(ghosts[0].level, 0, "keeps its level for shading");
  assert.deepStrictEqual(ghosts[0].rect, {x: 0, y: 0, width: 200, height: 0});
});

it("Icicle layout: icicleReturning grows a zoom-out's returning nodes from the previous view's edges", () => {
  const viz = mockViz();
  const all = applyIcicleLayout({viz}).shapeData;
  const prevBands = icicleBands(400, 1, true);
  const zoomedPrev = [
    {id: JSON.stringify(["A"]), depth: 0, path: ["A"]},
    {id: JSON.stringify(["A", "a1"]), depth: 1, path: ["A", "a1"]},
  ];
  const enter = icicleReturning(zoomedPrev, all, prevBands, frame);
  assert.ok(enter.has(JSON.stringify(["B"])));
  assert.ok(!enter.has(JSON.stringify(["A", "a1"])), "already drawn");
  const b = enter.get(JSON.stringify(["B"]));
  assert.ok(b.height === 0 && (b.y === 0 || b.y === 300), "B grows in from an edge");
  assert.strictEqual(icicleReturning([], all, prevBands, frame).size, 0);
});

it("Icicle layout: icicleRenderBase takes the base once per render and clears the zoom origin", () => {
  const viz = mockViz();
  viz.ctx.icicleLaid = ["laid"];
  viz.ctx.icicleZoomOrigin = {x0: 0, x1: 1, depth: 1};
  const base = icicleRenderBase(viz);
  assert.deepStrictEqual(base.laid, ["laid"]);
  assert.deepStrictEqual(base.origin, {x0: 0, x1: 1, depth: 1});
  assert.strictEqual(viz.ctx.icicleZoomOrigin, undefined);
  viz.ctx.icicleLaid = ["next"];
  assert.strictEqual(icicleRenderBase(viz), base, "reused within a render");
});
