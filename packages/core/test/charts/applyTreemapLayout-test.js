import assert from "assert";
import {
  applyTreemapLayout,
  treemapDef,
} from "../../es/src/charts/ChartDefinition.js";

// E3 follow-on: `treemapDef.stages` includes `applyTreemapLayout`, a pure
// transform that takes a minimal viz-like context and produces shapeData +
// rankData. This test exercises the stage directly (no DOM, no Treemap class)
// to prove the chart-specific layout is now an extractable, testable value.
it("applyTreemapLayout produces shapeData laid out within the chart box", () => {
  const data = [
    {id: "A", value: 30},
    {id: "B", value: 20},
    {id: "C", value: 50},
  ];

  // Minimal "viz" surface the stage reads from. Mirrors what Treemap sets up
  // by the time `_draw` runs (after _preDraw has filtered data + resolved
  // drawDepth). `_treemap` and `_tile` come straight from `treemapDef.defaults`.
  const viz = {
    _filteredData: data,
    _groupBy: [d => d.id],
    _drawDepth: 0,
    _aggs: {},
    _width: 200,
    _height: 100,
    _margin: {top: 0, right: 0, bottom: 0, left: 0},
    _treemap: treemapDef.defaults.treemap,
    _tile: treemapDef.defaults.tile,
    _layoutPadding: 0,
    _sum: treemapDef.defaults.sum,
    _sort: treemapDef.defaults.sort,
  };

  const partial = applyTreemapLayout({viz});

  assert.ok(Array.isArray(partial.shapeData), "stage returns shapeData array");
  assert.strictEqual(partial.shapeData.length, 3, "one node per leaf");

  // Geometry invariants: every cell stays inside the chart box.
  for (const node of partial.shapeData) {
    assert.ok(node.x0 >= 0 && node.x1 <= viz._width, "x in [0, width]");
    assert.ok(node.y0 >= 0 && node.y1 <= viz._height, "y in [0, height]");
    assert.ok(typeof node.share === "number", "share is computed");
    assert.ok(node.share > 0 && node.share <= 1, "share is a normalized fraction");
    assert.ok(node.__d3plus__, "node tagged with __d3plus__");
  }

  // Share fractions sum to 1 (within float tolerance).
  const totalShare = partial.shapeData.reduce((s, n) => s + n.share, 0);
  assert.ok(Math.abs(totalShare - 1) < 1e-9, "shares sum to 1");

  // `_rankData` was published onto the viz (legacy ariaLabel / legend sort).
  assert.ok(Array.isArray(viz._rankData), "_rankData written to viz");
  assert.strictEqual(viz._rankData.length, 3, "_rankData includes every leaf");
  // The default sort is descending by value, so the largest leaf is first.
  assert.strictEqual(viz._rankData[0].id, "C", "rank order: largest first");
});

it("applyTreemapLayout returns empty shapeData when filteredData is empty", () => {
  const viz = {
    _filteredData: [],
    _groupBy: [d => d.id],
    _drawDepth: 0,
    _aggs: {},
    _width: 100,
    _height: 100,
    _margin: {top: 0, right: 0, bottom: 0, left: 0},
    _treemap: treemapDef.defaults.treemap,
    _tile: treemapDef.defaults.tile,
    _layoutPadding: 0,
    _sum: treemapDef.defaults.sum,
    _sort: treemapDef.defaults.sort,
  };
  const partial = applyTreemapLayout({viz});
  assert.deepStrictEqual(partial.shapeData, [], "empty data → empty layout");
});

it("treemapDef.emit converts shapeData into Rect SceneNodes", () => {
  // Drive the stage first, then hand the same partial context to emit — this
  // is the data flow the v4 scene path will use once the legacy Rect compute
  // mode is retired.
  const viz = {
    _filteredData: [
      {id: "A", value: 30},
      {id: "B", value: 20},
    ],
    _groupBy: [d => d.id],
    _drawDepth: 0,
    _aggs: {},
    _width: 100,
    _height: 100,
    _margin: {top: 0, right: 0, bottom: 0, left: 0},
    _treemap: treemapDef.defaults.treemap,
    _tile: treemapDef.defaults.tile,
    _layoutPadding: 0,
    _sum: treemapDef.defaults.sum,
    _sort: treemapDef.defaults.sort,
    _locale: "en-US",
    _drawLabel: d => d.id,
  };
  const {shapeData} = applyTreemapLayout({viz});
  const nodes = treemapDef.emit({viz, shapeData});

  assert.strictEqual(nodes.length, 2, "one SceneNode per laid-out cell");
  for (const node of nodes) {
    assert.strictEqual(node.type, "rect", "emit yields rect nodes");
    assert.ok(typeof node.width === "number" && node.width > 0, "non-zero width");
    assert.ok(typeof node.height === "number" && node.height > 0, "non-zero height");
    assert.ok(node.aria && typeof node.aria.label === "string", "aria label set");
  }
});
