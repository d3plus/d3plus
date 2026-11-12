import assert from "node:assert";
import {it} from "vitest";

import {useJsdom} from "~test/jsdom.js";
import {Tree} from "../../index.ts";
import {applyTreeLayout, runStages} from "../../internal.ts";
import {depthOf} from "../../src/charts/features/depthKey.ts";

useJsdom();

/**
    Tree's layout writes each node's hierarchy depth onto the node's row,
    under a key of d3plus's own. That row is always the layout's: never one
    passed to `.data()`, nor one the legend holds. A data field named `depth`
    keeps its values.
*/

const twoLevels = [
  {parent: "P1", id: "a", value: 1},
  {parent: "P1", id: "b", value: 2},
  {parent: "P2", id: "c", value: 3},
];
const ragged = [
  {parent: "P1", id: "a", value: 1},
  {parent: "P2", value: 3},
];

const cases = [
  [
    "a single-level groupBy",
    [
      {id: "a", value: 1},
      {id: "b", value: 2},
    ],
    viz => viz.groupBy("id"),
  ],
  ["a multi-level groupBy", twoLevels, viz => viz.groupBy(["parent", "id"])],
  [
    "several rows per leaf",
    [
      {parent: "P1", id: "a", value: 1},
      {parent: "P1", id: "a", value: 5},
      {parent: "P1", id: "b", value: 2},
      {parent: "P2", id: "c", value: 3},
      {parent: "P2", id: "c", value: 4},
    ],
    viz => viz.groupBy(["parent", "id"]),
  ],
  [
    "rows with a depth column of their own",
    [
      {parent: "P1", id: "a", depth: 100},
      {parent: "P1", id: "b", depth: 200},
      {parent: "P2", id: "c", depth: 300},
    ],
    viz => viz.groupBy(["parent", "id"]),
  ],
  [
    "a depth above the deepest groupBy level",
    twoLevels,
    viz => viz.groupBy(["parent", "id"]).depth(0),
  ],
  [
    "a row without its deepest groupBy key",
    ragged,
    viz => viz.groupBy(["parent", "id"]),
  ],
  [
    "Rect nodes",
    [
      {parent: "P1", id: "a", value: 1},
      {parent: "P2", id: "c", value: 3},
    ],
    viz => viz.groupBy(["parent", "id"]).shape("Rect"),
  ],
  // The Line shape keeps the rows passed to `data()` unmerged.
  [
    "the Line shape",
    twoLevels,
    viz => viz.groupBy(["parent", "id"]).shape("Line"),
  ],
  [
    "the Line shape, a depth above the deepest groupBy level",
    twoLevels,
    viz => viz.groupBy(["parent", "id"]).shape("Line").depth(0),
  ],
  [
    "the Line shape, a row without its deepest groupBy key",
    ragged,
    viz => viz.groupBy(["parent", "id"]).shape("Line"),
  ],
];

/**
    Lays a Tree out over frozen copies of `rows`, so a write to one throws.
    Returns the chart, those copies, the laid-out nodes, and the rows the
    chart and its legend held before the layout ran.
*/
function layout(rows, configure) {
  const data = rows.map(d => Object.freeze({...d}));
  const chart = configure(new Tree().data(data)).width(400).height(300);
  chart._preDraw();
  chart._margin = {top: 0, right: 0, bottom: 0, left: 0};
  chart._padding = {top: 0, right: 0, bottom: 0, left: 0};
  const before = structuredClone({
    filtered: chart._filteredData,
    legend: chart._legendData,
  });
  const {shapeData} = runStages({viz: chart}, [applyTreeLayout]);
  return {chart, data, nodes: shapeData, before};
}

for (const [name, rows, configure] of cases) {
  it(`Tree layout leaves the rows passed to data() untouched: ${name}`, () => {
    const {data, nodes} = layout(rows, configure);
    assert.ok(nodes.length >= 2, "the layout placed nodes");
    assert.deepStrictEqual(data, rows, "the rows keep their values");
    assert.deepStrictEqual(
      nodes.filter(d => data.includes(d.data)),
      [],
      "no node wraps one of the rows",
    );
  });

  it(`Tree layout leaves the chart's and the legend's rows untouched: ${name}`, () => {
    const {chart, nodes, before} = layout(rows, configure);
    assert.ok(before.filtered.length >= 1, "the chart holds rows");
    assert.ok(before.legend.length >= 1, "the legend holds rows");
    assert.deepStrictEqual(chart._filteredData, before.filtered);
    assert.deepStrictEqual(chart._legendData, before.legend);
    assert.deepStrictEqual(
      nodes.filter(
        d =>
          chart._filteredData.includes(d.data) ||
          chart._legendData.includes(d.data),
      ),
      [],
      "no node wraps one of them",
    );
  });

  it(`Tree layout gives every node its hierarchy depth: ${name}`, () => {
    const {nodes} = layout(rows, configure);
    assert.deepStrictEqual(
      nodes.map(d => depthOf(d.data)),
      nodes.map(d => d.depth),
    );
    assert.deepStrictEqual(
      nodes.map(d => depthOf(d)),
      nodes.map(d => d.depth),
      "read through the node too",
    );
  });
}

it("Tree layout mirrors the hierarchy depth as depth on rows without that field", () => {
  const {nodes} = layout(twoLevels, viz => viz.groupBy(["parent", "id"]));
  assert.deepStrictEqual(
    nodes.map(d => [d.data.parent, d.data.id, d.depth, d.data.depth]),
    [
      ["P1", ["a", "b"], 1, 1],
      ["P2", "c", 1, 1],
      ["P1", "a", 2, 2],
      ["P1", "b", 2, 2],
      ["P2", "c", 2, 2],
    ],
  );
});

it("Tree layout keeps a depth field's own values on each node's row", () => {
  const [, rows, configure] = cases[3];
  const {chart, nodes} = layout(rows, configure);
  assert.deepStrictEqual(
    nodes.map(d => [d.data.id, d.data.depth, depthOf(d.data)]),
    [
      [["a", "b"], 300, 1],
      ["c", 300, 1],
      ["a", 100, 2],
      ["b", 200, 2],
      ["c", 300, 2],
    ],
  );
  const {title} = chart.tooltipConfig();
  assert.deepStrictEqual(
    nodes.map((d, i) => title(d.data, i)),
    ["P1", "P2", "a", "b", "c"],
    "tooltip titles follow the hierarchy depth",
  );
  assert.deepStrictEqual(
    nodes.map(d => chart._shapeDepth(d.data)),
    [0, 0, 1, 1, 1],
    "and so does each node's groupBy level",
  );
});

it("Tree draws a groupBy on a field named depth", () => {
  const rows = [
    {depth: "shallow", id: "a", value: 1},
    {depth: "shallow", id: "b", value: 2},
    {depth: "deep", id: "c", value: 3},
  ];
  const {chart, nodes} = layout(rows, viz => viz.groupBy(["depth", "id"]));
  const names = ["shallow", "deep", "a", "b", "c"];
  const {id, label} = chart.ctx.shapeConfig;
  const {title} = chart.tooltipConfig();
  assert.deepStrictEqual(
    nodes.map((d, i) => id(d, i)),
    names,
    "ids",
  );
  assert.deepStrictEqual(
    nodes.map((d, i) => label(d, i)),
    names,
    "labels",
  );
  assert.deepStrictEqual(
    nodes.map((d, i) => title(d.data, i)),
    names,
    "tooltip titles",
  );
  assert.deepStrictEqual(
    nodes.map(d => [d.data.depth, depthOf(d.data)]),
    [
      ["shallow", 1],
      ["deep", 1],
      ["shallow", 2],
      ["shallow", 2],
      ["deep", 2],
    ],
  );
});
