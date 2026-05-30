import assert from "assert";
import {applyTreemapLayout} from "../../es/src/charts/Treemap/applyLayout.js";
import {treemapDef} from "../../es/src/charts/Treemap/index.js";

function fieldDefault(key) {
  const f = treemapDef.fields.find(x => x.key === key);
  return f && f.default;
}

function mockViz(extra = {}) {
  // The chart-def + config refactor routes Viz config fields through
  // `viz.schema.<key>`. `_`-prefixed overrides on this mock get re-homed
  // onto `schema` so the internal accessors find them.
  const schemaOverride = {};
  for (const [under, key] of [
    ["_width", "width"],
    ["_height", "height"],
    ["_locale", "locale"],
    ["_shapeConfig", "shapeConfig"],
    ["_sum", "sum"],
  ]) {
    if (under in extra) {
      schemaOverride[key] = extra[under];
      delete extra[under];
    }
  }
  return {
    _filteredData: [],
    _drawDepth: 0,
    _margin: {top: 0, right: 0, bottom: 0, left: 0},
    schema: {
      width: 100,
      height: 100,
      groupBy: [d => d.id],
      aggs: {},
      tile: fieldDefault("tile"),
      layoutPadding: 0,
      sum: fieldDefault("sum"),
      sort: fieldDefault("sort"),
      ...schemaOverride,
    },
    ctx: {
      treemap: treemapDef.ctx.treemap,
    },
    ...extra,
  };
}

it("applyTreemapLayout produces shapeData laid out within the chart box", () => {
  const data = [
    {id: "A", value: 30},
    {id: "B", value: 20},
    {id: "C", value: 50},
  ];
  const viz = mockViz({_filteredData: data, _width: 200});

  const partial = applyTreemapLayout({viz});

  assert.ok(Array.isArray(partial.shapeData), "stage returns shapeData array");
  assert.strictEqual(partial.shapeData.length, 3, "one node per leaf");

  for (const node of partial.shapeData) {
    assert.ok(node.x0 >= 0 && node.x1 <= viz.schema.width, "x in [0, width]");
    assert.ok(node.y0 >= 0 && node.y1 <= viz.schema.height, "y in [0, height]");
    assert.ok(typeof node.share === "number", "share is computed");
    assert.ok(node.share > 0 && node.share <= 1, "share is a normalized fraction");
    assert.ok(node.__d3plus__, "node tagged with __d3plus__");
    assert.ok(typeof node.data.rank === "number", "rank attached to source datum");
  }

  const totalShare = partial.shapeData.reduce((s, n) => s + n.share, 0);
  assert.ok(Math.abs(totalShare - 1) < 1e-9, "shares sum to 1");

  // Default sort is descending by value — largest leaf gets rank 0.
  const byId = Object.fromEntries(partial.shapeData.map(n => [n.id, n]));
  assert.strictEqual(byId.C.data.rank, 0, "largest leaf has rank 0");
});

it("applyTreemapLayout returns empty shapeData when filteredData is empty", () => {
  const viz = mockViz({_filteredData: []});
  const partial = applyTreemapLayout({viz});
  assert.deepStrictEqual(partial.shapeData, [], "empty data → empty layout");
});

it("treemapDef.emit converts shapeData into rect SceneNodes", () => {
  const viz = mockViz({
    _filteredData: [
      {id: "A", value: 30},
      {id: "B", value: 20},
    ],
    _locale: "en-US",
    _drawLabel: d => d.id,
    _sum: fieldDefault("sum"),
    _shapeConfig: {},
  });
  const {shapeData} = applyTreemapLayout({viz});
  const nodes = treemapDef.emit({viz, shapeData});

  // emit produces rect cells (one per leaf) + label nodes from emitLabels.
  const rects = nodes.filter(n => n.type === "rect");
  assert.strictEqual(rects.length, 2, "one rect per laid-out cell");
  for (const node of rects) {
    assert.ok(typeof node.width === "number" && node.width > 0, "non-zero width");
    assert.ok(typeof node.height === "number" && node.height > 0, "non-zero height");
    assert.ok(node.aria && typeof node.aria.label === "string", "aria label set");
  }
});
