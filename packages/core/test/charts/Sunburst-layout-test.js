import assert from "assert";
import {
  applySunburstLayout,
  rememberSpreads,
  sunburstFocus,
  sunburstGhosts,
} from "../../es/src/charts/Sunburst/applyLayout.js";
import {
  sunburstArcGeometry,
  sunburstLabel,
} from "../../es/src/charts/Sunburst/emit.js";
import {sunburstDef} from "../../es/src/charts/Sunburst/index.js";

const key = k => d => d[k];
const field = k => sunburstDef.fields.find(f => f.key === k);

function mockViz({schema = {}, ...extra} = {}) {
  return {
    schema: {
      width: 420,
      height: 320,
      groupBy: [key("group"), key("item")],
      shapeConfig: {strokeWidth: 1},
      sum: d => d.value,
      sort: field("sort").decorate(null, field("sort").default),
      ringSize: "equal",
      ...schema,
    },
    _margin: {top: 10, bottom: 10, left: 10, right: 10},
    _filteredData: [
      {group: "A", item: "a1", value: 30},
      {group: "A", item: "a2", value: 10},
      {group: "B", item: "b1", value: 60},
    ],
    _drawDepth: 1,
    _history: [],
    ctx: {},
    ...extra,
  };
}

it("Sunburst layout stage: sunburstFocus: is unfocused without drill-down history", () => {
  assert.deepStrictEqual(sunburstFocus(mockViz()), {level: -1, path: []});
});

it("Sunburst layout stage: sunburstFocus: reads the clicked level from the latest history entry and the path from the data", () => {
  const viz = mockViz({
    _history: [{depth: undefined, groupId: "A", groupDepth: 0}],
  });
  viz._filteredData = viz._filteredData.slice(0, 2);
  assert.deepStrictEqual(sunburstFocus(viz), {level: 0, path: ["A"]});
});

it("Sunburst layout stage: sunburstFocus: never focuses at or past the deepest drawn level", () => {
  const viz = mockViz({
    _history: [{depth: 0, groupId: "a1", groupDepth: 1}],
    _drawDepth: 0,
  });
  assert.deepStrictEqual(sunburstFocus(viz), {level: -1, path: []});
});

it("Sunburst layout stage: applySunburstLayout: lays out every arc inside the chart area and indexes nodes by row", () => {
  const viz = mockViz();
  const {shapeData} = applySunburstLayout({viz});
  assert.strictEqual(shapeData.length, 5);
  assert.strictEqual(viz.ctx.sunburstWidth, 400);
  assert.strictEqual(viz.ctx.sunburstHeight, 300);
  assert.strictEqual(
    viz.ctx.sunburstOuterRadius,
    148.5,
    "half the short side, less the hover-stroke buffer",
  );
  assert.ok(shapeData.every(n => n.outerRadius <= 148.5));
  for (const n of shapeData)
    assert.strictEqual(viz.ctx.sunburstNodes.get(n.datum), n);
  assert.strictEqual(
    viz._filteredData[2].share,
    0.6,
    "the row carries its share for the tooltip",
  );
});

it("Sunburst layout stage: applySunburstLayout: honors innerRadius as pixels or a function of the outer radius", () => {
  const px = mockViz({schema: {innerRadius: 20}});
  const ring1 = applySunburstLayout({viz: px}).shapeData.find(
    n => n.depth === 1,
  );
  assert.strictEqual(ring1.innerRadius, 20);
  const fn = mockViz({schema: {innerRadius: r => r / 2}});
  const ring1b = applySunburstLayout({viz: fn}).shapeData.find(
    n => n.depth === 1,
  );
  assert.strictEqual(ring1b.innerRadius, 148.5 / 2);
});

it("Sunburst layout stage: applySunburstLayout: returns nothing for empty data", () => {
  const viz = mockViz({_filteredData: []});
  assert.deepStrictEqual(applySunburstLayout({viz}).shapeData, []);
  assert.deepStrictEqual(viz.ctx.sunburstLaid, []);
});

it("Sunburst layout stage: applySunburstLayout: collapses the arcs a zoom removed, once", () => {
  const viz = mockViz();
  const first = applySunburstLayout({viz}).shapeData;
  const a = first.find(n => n.id === JSON.stringify(["A"]));
  viz.ctx.sunburstZoomOrigin = {
    startAngle: a.startAngle,
    endAngle: a.endAngle,
    depth: a.depth,
  };
  viz._history = [{groupId: "A", groupDepth: 0}];
  viz._filteredData = viz._filteredData.slice(0, 2);
  applySunburstLayout({viz});
  const ghosts = viz.ctx.sunburstGhosts;
  assert.deepStrictEqual(ghosts.map(g => g.id).sort(), [
    JSON.stringify(["B", "b1"]),
    JSON.stringify(["B"]),
  ]);
  assert.ok(
    ghosts.every(g => g.arc.startAngle === g.arc.endAngle),
    "folded to zero width",
  );
  assert.strictEqual(viz.ctx.sunburstZoomOrigin, undefined);
  applySunburstLayout({viz});
  assert.deepStrictEqual(viz.ctx.sunburstGhosts, []);
});

it("Sunburst layout stage: sunburstGhosts keeps only the arcs the next layout drops", () => {
  const prev = [
    {
      id: "x",
      depth: 1,
      level: 1,
      spread: 0.5,
      startAngle: 0,
      endAngle: 1,
      datum: {},
      i: 0,
    },
    {id: "y", depth: 1, startAngle: 1, endAngle: 2, datum: {}, i: 1},
  ];
  const ghosts = sunburstGhosts(
    prev,
    [{id: "y"}],
    {startAngle: 1, endAngle: 2, depth: 1},
    [
      [0, 10],
      [10, 20],
    ],
  );
  assert.deepStrictEqual(
    ghosts.map(g => g.id),
    ["x"],
  );
  assert.deepStrictEqual(
    [ghosts[0].level, ghosts[0].spread],
    [1, 0.5],
    "keeps its shade inputs",
  );
  assert.deepStrictEqual(ghosts[0].arc, {
    innerRadius: 0,
    outerRadius: 10,
    startAngle: 0,
    endAngle: 0,
  });
});

const node = {
  depth: 2,
  innerRadius: 30,
  outerRadius: 40,
  startAngle: 0,
  endAngle: 1,
  level: 1,
  datum: {id: "x"},
  i: 3,
};

it("Sunburst emit helpers: sunburstArcGeometry pads ring arcs but never the center disc", () => {
  assert.strictEqual(sunburstArcGeometry(node, 0.1, 0).padAngle, 0.1);
  assert.ok(Math.abs(sunburstArcGeometry(node, 0, 5).padAngle * 50 - 5) < 1e-9);
  assert.strictEqual(
    sunburstArcGeometry({...node, depth: 0}, 0.1, 5).padAngle,
    0,
  );
});

it("Sunburst emit helpers: sunburstLabel reads the label at the node's own level", () => {
  const calls = [];
  const viz = {
    _drawLabel: (d, i, depth) => (calls.push([d, i, depth]), "label"),
  };
  assert.strictEqual(sunburstLabel(viz, node), "label");
  assert.deepStrictEqual(calls, [[node.datum, 3, 1]]);
});

it("Sunburst layout stage: rememberSpreads gives the center disc the spread it had in its ring", () => {
  const viz = {ctx: {}};
  rememberSpreads(viz, [{id: "a", depth: 1, spread: 0.75}]);
  const center = {id: "a", depth: 0, spread: 0};
  const child = {id: "b", depth: 1, spread: 0.5};
  rememberSpreads(viz, [center, child]);
  assert.strictEqual(center.spread, 0.75);
  assert.strictEqual(viz.ctx.sunburstSpreads.get("b"), 0.5);
  const unseen = {id: "z", depth: 0, spread: 0};
  rememberSpreads(viz, [unseen]);
  assert.strictEqual(unseen.spread, 0);
});
