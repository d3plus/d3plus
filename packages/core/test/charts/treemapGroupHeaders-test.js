import {describe, it} from "vitest";
import assert from "assert";
import {color} from "d3-color";
import {interpolateRgb} from "d3-interpolate";

import {colorDefaults} from "@d3plus/color";
import {hierarchy, treemap} from "d3-hierarchy";

import {applyTreemapLayout} from "../../src/charts/Treemap/applyLayout.ts";
import {
  defaultGroupFill,
  groupHeaderNodes,
} from "../../src/charts/Treemap/emitGroupHeaders.ts";
import {
  attachGroupHeaders,
  collectGroupHeaders,
  groupLabelDefaults,
  groupLabelStyle,
  groupPaddingTop,
  groupStripFits,
  groupStripHeight,
} from "../../src/charts/Treemap/groupHeaders.ts";
import {treemapDef} from "../../src/charts/Treemap/index.ts";
import {
  GROUP_DEPTH_KEY,
  GROUP_LABEL_KEY,
} from "../../src/charts/viz/groupRow.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

const fieldDefault = key => treemapDef.fields.find(x => x.key === key).default;

const style = {...groupLabelDefaults};

const data = [
  {group: "A", id: "a1", value: 30},
  {group: "A", id: "a2", value: 20},
  {group: "B", id: "b1", value: 40},
  {group: "B", id: "b2", value: 10},
];

function mockViz({schema = {}, ...rest} = {}) {
  return {
    _filteredData: data,
    _drawDepth: 1,
    _margin: {top: 0, right: 0, bottom: 0, left: 0},
    _drawLabel: (d, i, depth) => (depth === 0 ? d.group : d.id),
    schema: {
      width: 400,
      height: 300,
      groupBy: [d => d.group, d => d.id],
      aggs: {},
      tile: fieldDefault("tile"),
      layoutPadding: 1,
      sum: fieldDefault("sum"),
      sort: fieldDefault("sort"),
      locale: "en-US",
      shapeConfig: {fill: d => (d.group === "A" ? "#4c6ef5" : "#e67700")},
      ...schema,
    },
    ctx: {treemap: treemapDef.ctx.treemap},
    ...rest,
  };
}

describe("groupStripHeight", () => {
  it("fits one line of text plus padding above and below", () => {
    assert.strictEqual(groupStripHeight({fontSize: 11, padding: 3}), 20);
    assert.strictEqual(groupStripHeight({fontSize: 10, padding: 0}), 12);
  });
});

describe("groupStripFits", () => {
  it("needs a strip's height left for the tiles below it", () => {
    const strip = groupStripHeight(style);
    assert.ok(groupStripFits(200, strip * 2, style));
    assert.ok(!groupStripFits(200, strip * 2 - 1, style));
  });

  it("needs room for a few characters across", () => {
    const min = style.fontSize * 3 + style.padding * 2;
    assert.ok(groupStripFits(min, 100, style));
    assert.ok(!groupStripFits(min - 1, 100, style));
  });
});

describe("groupLabelStyle", () => {
  it("layers groupLabelConfig over the defaults and the chart font", () => {
    const viz = {
      schema: {fontFamily: "Inter", groupLabelConfig: {fontSize: 14}},
    };
    assert.deepStrictEqual(groupLabelStyle(viz), {
      ...groupLabelDefaults,
      fontFamily: "Inter",
      fontSize: 14,
    });
  });

  it("passes a label accessor through", () => {
    const label = d => d.name;
    const viz = {schema: {groupLabelConfig: {label}}};
    assert.strictEqual(groupLabelStyle(viz).label, label);
  });

  it("is null when groupLabels is false", () => {
    assert.strictEqual(groupLabelStyle({schema: {groupLabels: false}}), null);
  });
});

describe("groupPaddingTop", () => {
  const layout = (opts, size = [400, 300]) => {
    const strips = new Map();
    const root = hierarchy({
      children: [
        {key: "A", children: [{key: "a1", value: 3}]},
        {key: "B", children: [{key: "b1", value: 1}]},
      ],
    }).sum(d => d.value || 0);
    treemap()
      .size(size)
      .padding(1)
      .paddingTop(groupPaddingTop({padding: 1, style, ...opts}, strips))(root);
    return {root, strips};
  };

  it("reserves a strip on each group above the drawn depth", () => {
    const {root, strips} = layout({drawDepth: 1});
    const height = groupStripHeight(style);
    assert.strictEqual(strips.size, 2);
    for (const [node, h] of strips) {
      assert.strictEqual(h, height);
      assert.strictEqual(node.depth, 1);
      assert.strictEqual(node.children[0].y0, node.y0 + height + 1);
    }
    assert.ok(!strips.has(root), "the root gets no strip");
  });

  it("reserves nothing for a single drawn level or with headers off", () => {
    assert.strictEqual(layout({drawDepth: 0}).strips.size, 0);
    assert.strictEqual(layout({drawDepth: 1, style: null}).strips.size, 0);
  });

  it("skips a group too small for a strip", () => {
    const {strips} = layout({drawDepth: 1}, [400, 30]);
    assert.strictEqual(strips.size, 0);
  });
});

describe("applyTreemapLayout with group headers", () => {
  it("stamps each group with its header strip and merged row", () => {
    const {shapeData} = applyTreemapLayout({viz: mockViz()});
    const headers = collectGroupHeaders(shapeData);
    assert.deepStrictEqual(headers.map(h => h.id).sort(), ["A", "B"]);
    const b = headers.find(h => h.id === "B");
    assert.strictEqual(b.depth, 0);
    assert.strictEqual(b.data[GROUP_DEPTH_KEY], 0);
    assert.strictEqual(b.data.group, "B");
    assert.deepStrictEqual(b.data.id, ["b1", "b2"]);
    assert.strictEqual(b.data.value, 50);
    assert.strictEqual(b.data.__d3plusShare, 0.5);
    assert.strictEqual(b.y1 - b.y0, groupStripHeight(style));
    for (const leaf of shapeData.filter(d => d.data.group === "B"))
      assert.ok(leaf.y0 >= b.y1, "tiles sit below their strip");
  });

  it("nests a strip per level above the tiles", () => {
    const viz = mockViz({
      _filteredData: data.map(d => ({...d, sector: "S"})),
      _drawDepth: 2,
      schema: {groupBy: [d => d.sector, d => d.group, d => d.id]},
    });
    const headers = collectGroupHeaders(applyTreemapLayout({viz}).shapeData);
    assert.deepStrictEqual(headers.map(h => [h.depth, h.id]).sort(), [
      [0, "S"],
      [1, "S/A"],
      [1, "S/B"],
    ]);
    assert.strictEqual(headers[0].id, "S", "shallowest level first");
    assert.ok(headers[1].y0 >= headers[0].y1, "inner strips sit below outer");
  });

  it("drops the threshold flags from a group holding the threshold bucket", () => {
    const viz = mockViz({
      _filteredData: [
        ...data,
        {group: "A", id: "Other", value: 5, _isAggregation: true},
      ],
    });
    const headers = collectGroupHeaders(applyTreemapLayout({viz}).shapeData);
    const a = headers.find(h => h.id === "A");
    assert.strictEqual(a.data._isAggregation, undefined);
    assert.strictEqual(a.data.value, 55);
  });

  it("draws no strips when groupLabels is false", () => {
    const viz = mockViz({schema: {groupLabels: false}});
    const {shapeData} = applyTreemapLayout({viz});
    assert.strictEqual(collectGroupHeaders(shapeData).length, 0);
    assert.strictEqual(Math.min(...shapeData.map(d => d.y0)), 2);
  });
});

describe("attachGroupHeaders", () => {
  it("clips a strip to its group", () => {
    const root = hierarchy({children: [{key: "A", children: [{value: 1}]}]})
      .sum(d => d.value || 0)
      .each(n => Object.assign(n, {x0: 0, x1: 50, y0: 10, y1: 25}));
    const group = root.children[0];
    attachGroupHeaders(new Map([[group, 20]]), {aggs: {}, total: 1});
    assert.strictEqual(group.groupHeader.y1, 25);
    assert.strictEqual(group.groupHeader.id, "A");
  });

  it("stamps the label groupLabelConfig.label gives the merged row", () => {
    const rows = [
      {sector: "T", name: "Tech", value: 1},
      {sector: "T", name: "Tech", value: 2},
    ];
    const root = hierarchy({children: [{key: "T", children: rows}]})
      .sum(d => d.value || 0)
      .each(n => Object.assign(n, {x0: 0, x1: 50, y0: 0, y1: 50}));
    const group = root.children[0];
    const seen = [];
    attachGroupHeaders(new Map([[group, 20]]), {
      aggs: {},
      label: d => {
        seen.push(d);
        return `${d.name} (${d.value})`;
      },
      total: 3,
    });
    assert.strictEqual(seen[0], group.groupHeader.data, "given the merged row");
    assert.strictEqual(group.groupHeader.data[GROUP_LABEL_KEY], "Tech (3)");
  });

  it("stamps no label when groupLabelConfig.label gives none", () => {
    for (const label of [undefined, () => undefined, () => "", () => false]) {
      const root = hierarchy({children: [{key: "A", children: [{value: 1}]}]})
        .sum(d => d.value || 0)
        .each(n => Object.assign(n, {x0: 0, x1: 50, y0: 0, y1: 50}));
      const group = root.children[0];
      attachGroupHeaders(new Map([[group, 20]]), {aggs: {}, label, total: 1});
      assert.ok(!(GROUP_LABEL_KEY in group.groupHeader.data));
    }
  });
});

describe("defaultGroupFill", () => {
  it("darkens the group's color", () => {
    const viz = mockViz();
    const fill = defaultGroupFill(viz, {group: "A"}, 0);
    assert.strictEqual(fill, color("#4c6ef5").darker(0.8).formatHex());
  });

  it("is neutral when a colorScale colors the tiles", () => {
    const viz = mockViz({schema: {colorScale: "value"}});
    assert.strictEqual(
      defaultGroupFill(viz, {group: "A"}, 0),
      interpolateRgb("rgb(255, 255, 255)", colorDefaults.dark)(0.7),
      "between the (white) background and its ink",
    );
  });
});

describe("groupHeaderNodes", () => {
  it("emits a strip rect and a left-aligned name per header", () => {
    const viz = mockViz();
    const headers = collectGroupHeaders(applyTreemapLayout({viz}).shapeData);
    const nodes = groupHeaderNodes(viz, headers, style);
    const rects = nodes.filter(n => n.type === "rect");
    const texts = nodes.filter(n => n.type === "text");
    assert.deepStrictEqual(
      rects.map(n => n.key),
      headers.map(h => `treemap-group-${h.id}`),
    );
    const b = rects.find(n => n.key === "treemap-group-B");
    assert.strictEqual(b.datum, headers.find(h => h.id === "B").data);
    assert.strictEqual(b.height, groupStripHeight(style));
    assert.strictEqual(b.aria.label, "B, 50, 50%");
    assert.deepStrictEqual(
      texts.map(t => t.lines.map(l => l.text).join(" ")),
      headers.map(h => h.id),
    );
    const t = texts[0];
    const h = headers[0];
    assert.ok(t.x - h.x0 <= style.padding + 1, "left-aligned in its strip");
    assert.ok(texts.every(t => t.shapeType === "Label"));
  });

  it("honors a fill and fontColor from groupLabelConfig", () => {
    const viz = mockViz();
    const headers = collectGroupHeaders(applyTreemapLayout({viz}).shapeData);
    const nodes = groupHeaderNodes(viz, headers, {
      ...style,
      fill: d => (d.group === "A" ? "#111111" : "#222222"),
      fontColor: "#ff0000",
    });
    const rects = nodes.filter(n => n.type === "rect");
    assert.deepStrictEqual(
      rects.map(n => n.paint.fill),
      headers.map(h => (h.id === "A" ? "#111111" : "#222222")),
    );
    const text = nodes.find(n => n.type === "text");
    assert.strictEqual(text.paint?.fill ?? text.fill, "#ff0000");
  });

  it("emits nothing without headers", () => {
    assert.deepStrictEqual(groupHeaderNodes(mockViz(), [], style), []);
  });
});
