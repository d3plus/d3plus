import assert from "node:assert";
import {it} from "vitest";

import {useJsdom} from "~test/jsdom.js";
import {Tree} from "../../index.ts";
import {applyTreeLayout, runStages} from "../../internal.ts";
import {treeEmit} from "../../src/charts/Tree/emit.ts";
import {nodeLabel} from "../../src/charts/Tree/nodeLabel.ts";

useJsdom();

/**
    `nodeLabel` names a Tree node at its own `groupBy` level; the node's
    accessible name, its link's, the `ariaLabel` accessor and the tooltip's
    title all come from it.
*/

const rows = [
  {top: "T", parent: "P1", id: "a", value: 1},
  {top: "T", parent: "P1", id: "b", value: 2},
  {top: "T", parent: "P2", id: "c", value: 3},
  {top: "T", parent: "P2", id: "d", value: 4},
];

/** Lays a Tree out and returns it with its nodes. */
function layout(config) {
  const chart = new Tree().config({
    data: rows,
    height: 300,
    width: 400,
    ...config,
  });
  chart._preDraw();
  chart._margin = {top: 0, right: 0, bottom: 0, left: 0};
  chart._padding = {top: 0, right: 0, bottom: 0, left: 0};
  const nodes = runStages({viz: chart}, [applyTreeLayout]).shapeData;
  return {chart, nodes};
}

it("nodeLabel — names each node at its own level", () => {
  const {chart, nodes} = layout({groupBy: ["top", "parent", "id"]});
  assert.deepStrictEqual(
    nodes.map(d => [d.depth, nodeLabel(chart, d.data, d.i)]),
    [
      [1, "T"],
      [2, "P1"],
      [2, "P2"],
      [3, "a"],
      [3, "b"],
      [3, "c"],
      [3, "d"],
    ],
  );
});

it("nodeLabel — names a row without a node depth at the first level", () => {
  const {chart} = layout({groupBy: ["parent", "id"]});
  assert.strictEqual(nodeLabel(chart, {parent: "P1", id: "a"}, 0), "P1");
});

it("nodeLabel — applies the label accessor to the deepest level only", () => {
  const {chart, nodes} = layout({
    groupBy: ["parent", "id"],
    label: d => `Row ${d.id}`,
  });
  assert.deepStrictEqual(
    nodes.map(d => nodeLabel(chart, d.data, d.i)),
    ["P1", "P2", "Row a", "Row b", "Row c", "Row d"],
  );
});

it("nodeLabel — follows the draw depth", () => {
  const {chart, nodes} = layout({groupBy: ["parent", "id"], depth: 0});
  assert.deepStrictEqual(
    nodes.map(d => nodeLabel(chart, d.data, d.i)),
    ["P1", "P2"],
  );
});

it("Tree emit names each node and link at its own level", () => {
  const {chart} = layout({groupBy: ["top", "parent", "id"]});
  const scene = treeEmit({viz: chart});
  const named = type =>
    scene.filter(n => n.type === type).map(n => [n.key, n.aria.label]);
  assert.deepStrictEqual(named("circle"), [
    ["tree-Circle-T", "T."],
    ["tree-Circle-P1", "P1."],
    ["tree-Circle-P2", "P2."],
    ["tree-Circle-a", "a."],
    ["tree-Circle-b", "b."],
    ["tree-Circle-c", "c."],
    ["tree-Circle-d", "d."],
  ]);
  assert.deepStrictEqual(named("path"), [
    ["tree-link-P1", "P1."],
    ["tree-link-P2", "P2."],
    ["tree-link-a", "a."],
    ["tree-link-b", "b."],
    ["tree-link-c", "c."],
    ["tree-link-d", "d."],
  ]);
});

it("Tree's ariaLabel and tooltip title name a node at its own level", () => {
  const {chart, nodes} = layout({groupBy: ["parent", "id"]});
  const {ariaLabel} = chart.shapeConfig();
  const {title} = chart.tooltipConfig();
  const expected = ["P1", "P2", "a", "b", "c", "d"];
  assert.deepStrictEqual(
    nodes.map(d => ariaLabel(d.data, d.i)),
    expected,
  );
  assert.deepStrictEqual(
    nodes.map(d => title(d.data, d.i)),
    expected,
  );
});
