import assert from "assert";
import {
  applySunburstLayout,
  holdLabels,
  renderBase,
  sunburstFocus,
  sunburstReturning,
  sunburstZoomOutFocus,
  sunburstGhosts,
} from "../../es/src/charts/Sunburst/applyLayout.js";
import {
  sunburstArcGeometry,
  sunburstLabel,
} from "../../es/src/charts/Sunburst/emit.js";
import {sunburstDef} from "../../es/src/charts/Sunburst/index.js";

const TAU = Math.PI * 2;
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
  assert.strictEqual(
    viz.ctx.sunburstGhosts.length,
    2,
    "a second pass of the same render keeps them",
  );
  viz._filteredData = viz._filteredData.slice();
  applySunburstLayout({viz});
  assert.deepStrictEqual(viz.ctx.sunburstGhosts, []);
});

it("Sunburst layout stage: sunburstGhosts keeps only the arcs the next layout drops", () => {
  const prev = [
    {
      id: "x",
      depth: 1,
      level: 1,
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
  assert.strictEqual(ghosts[0].level, 1, "keeps its ring for shading");
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

const ring = (id, path, depth, startAngle, endAngle) => ({
  id,
  path,
  depth,
  startAngle,
  endAngle,
});

it("Sunburst layout stage: sunburstReturning sweeps the arcs a zoom-out brings back in from 0 or 2π", () => {
  const previous = [
    ring("B", ["B"], 0, 0, TAU),
    ring("B|x", ["B", "x"], 1, 0, TAU),
  ];
  const next = [
    ring("A", ["A"], 1, 0, 2),
    ring("B", ["B"], 1, 2, 4),
    ring("C", ["C"], 1, 4, TAU),
    ring("B|x", ["B", "x"], 2, 2, 4),
  ];
  const radii = [
    [0, 40],
    [40, 80],
  ];
  const enter = sunburstReturning(previous, next, radii);
  assert.deepStrictEqual(
    [...enter.keys()].sort(),
    ["A", "C"],
    "only the returning arcs",
  );
  assert.deepStrictEqual(enter.get("A"), {
    innerRadius: 0,
    outerRadius: 40,
    startAngle: 0,
    endAngle: 0,
  });
  assert.deepStrictEqual(enter.get("C"), {
    innerRadius: 0,
    outerRadius: 40,
    startAngle: TAU,
    endAngle: TAU,
  });
});

it("Sunburst layout stage: sunburstReturning is empty unless the previous center became a ring arc", () => {
  const radii = [[0, 40]];
  assert.strictEqual(
    sunburstReturning(
      [ring("A", ["A"], 1, 0, TAU)],
      [ring("A", ["A"], 1, 0, TAU)],
      radii,
    ).size,
    0,
    "no center",
  );
  const center = ring("B", ["B"], 0, 0, TAU);
  assert.strictEqual(
    sunburstReturning(
      [center],
      [center, ring("B|x", ["B", "x"], 1, 0, TAU)],
      radii,
    ).size,
    0,
    "still the center (a zoom-in)",
  );
});

it("Sunburst layout stage: sunburstReturning jumps several levels through the nearest drawn ancestor", () => {
  const previous = [ring("B|x", ["B", "x"], 0, 0, TAU)];
  const next = [ring("A", ["A"], 1, 0, 3), ring("B", ["B"], 1, 3, TAU)];
  const enter = sunburstReturning(previous, next, [
    [0, 40],
    [40, 80],
  ]);
  assert.deepStrictEqual([...enter.keys()].sort(), ["A", "B"]);
  assert.strictEqual(
    enter.get("A").endAngle,
    0,
    "before the ancestor: folded at 0",
  );
  assert.deepStrictEqual(
    [enter.get("B").startAngle, enter.get("B").endAngle],
    [0, TAU],
    "the ancestor itself fills the old circle",
  );
});

it("Sunburst layout stage: renderBase takes the base once per render and reuses it across passes", () => {
  const laid = [ring("B", ["B"], 0, 0, TAU)];
  const viz = {
    ctx: {
      sunburstLaid: laid,
      sunburstRadii: [[0, 1]],
      sunburstZoomOrigin: {startAngle: 0, endAngle: 1, depth: 1},
    },
    _filteredData: [],
  };
  const first = renderBase(viz);
  assert.strictEqual(first.laid, laid);
  assert.deepStrictEqual(first.origin, {startAngle: 0, endAngle: 1, depth: 1});
  assert.strictEqual(
    viz.ctx.sunburstZoomOrigin,
    undefined,
    "the zoom-in origin is consumed",
  );
  viz.ctx.sunburstLaid = [];
  assert.strictEqual(
    renderBase(viz),
    first,
    "a later pass of the same render keeps the base",
  );
  viz._filteredData = [];
  const next = renderBase(viz);
  assert.notStrictEqual(next, first, "a new render takes a new base");
  assert.deepStrictEqual(next.laid, []);
});

it("Sunburst layout stage: holdLabels holds labels only when animated, then repaints them in", async () => {
  const painted = [];
  const viz = {
    schema: {duration: 5},
    ctx: {sunburstLaid: []},
    _drawSceneToTarget: d => painted.push(d),
  };
  holdLabels(viz, ["A"]);
  assert.deepStrictEqual([...viz.ctx.sunburstHeldLabels], ["A"]);
  await new Promise(resolve => setTimeout(resolve, 40));
  assert.deepStrictEqual(painted, [5], "repainted with the chart's duration");
  assert.strictEqual(viz.ctx.sunburstHeldLabels.size, 0, "released");
  assert.deepStrictEqual(viz._chartScene, []);

  holdLabels(viz, ["A"]);
  holdLabels(viz, []);
  await new Promise(resolve => setTimeout(resolve, 40));
  assert.deepStrictEqual(
    painted,
    [5],
    "a later layout cancels a pending release",
  );

  viz.schema.duration = 0;
  holdLabels(viz, ["A"]);
  assert.strictEqual(
    viz.ctx.sunburstHeldLabels.size,
    0,
    "nothing held without animation",
  );
});

it("Sunburst layout stage: sunburstZoomOutFocus finds the old center among the new rings", () => {
  const center = ring("B|x", ["B", "x"], 0, 0, TAU);
  const b = ring("B", ["B"], 1, 0, 3);
  const bx = ring("B|x", ["B", "x"], 2, 0, 1);
  assert.strictEqual(
    sunburstZoomOutFocus([center], [b, bx]),
    bx,
    "the old center itself",
  );
  assert.strictEqual(
    sunburstZoomOutFocus([center], [b]),
    b,
    "else its nearest drawn ancestor",
  );
  assert.strictEqual(
    sunburstZoomOutFocus([b], [b, bx]),
    undefined,
    "no previous center",
  );
  assert.strictEqual(
    sunburstZoomOutFocus([center], [{...center}]),
    undefined,
    "still the center",
  );
});
