import assert from "node:assert";
import {it} from "vitest";

import {useJsdom} from "~test/jsdom.js";
import {Tree} from "../../index.ts";
import {applyTreeLayout, runStages} from "../../internal.ts";

useJsdom();

/**
    `depth` sets the deepest `groupBy` level a Tree draws: its nodes stop at
    that level, which lays out and labels as the leaves of the tree.
*/

const rows = [
  {top: "T", parent: "P1", id: "a", value: 1},
  {top: "T", parent: "P1", id: "b", value: 2},
  {top: "T", parent: "P2", id: "c", value: 3},
  {top: "T", parent: "P2", id: "d", value: 4},
];

/** Lays a Tree out and returns what the layout stage hands to its emit. */
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
  const {labelBounds, labelConfig} = chart.ctx.shapeConfig;
  return {
    nodes: nodes.map(d => ({
      depth: d.depth,
      id: chart._ids(d.data)[d.depth - 1],
      x: d.x,
      y: d.y,
      labelBounds: labelBounds(d, d.i, {r: 5}),
      textAnchor: labelConfig.textAnchor(d),
      verticalAlign: labelConfig.verticalAlign(d),
    })),
    links: chart.ctx.linksData.map(d => chart._ids(d.data)[d.depth - 1]),
    labelHeight: chart.ctx.labelHeight,
    labelWidths: chart.ctx.labelWidths,
  };
}

const outline = ({nodes}) => nodes.map(d => [d.depth, d.id]);

it("Tree layout draws every groupBy level by default", () => {
  const drawn = layout({groupBy: ["parent", "id"]});
  assert.deepStrictEqual(outline(drawn), [
    [1, "P1"],
    [1, "P2"],
    [2, "a"],
    [2, "b"],
    [2, "c"],
    [2, "d"],
  ]);
  assert.deepStrictEqual(drawn.links, ["a", "b", "c", "d"]);
});

it("Tree layout at depth(0) draws the first groupBy level alone", () => {
  const drawn = layout({groupBy: ["parent", "id"], depth: 0});
  assert.deepStrictEqual(outline(drawn), [
    [1, "P1"],
    [1, "P2"],
  ]);
  assert.deepStrictEqual(drawn.links, []);
});

for (const orient of ["vertical", "horizontal"]) {
  it(`Tree layout at depth(0) matches a Tree grouped by the first level alone (${orient})`, () => {
    assert.deepStrictEqual(
      layout({groupBy: ["parent", "id"], depth: 0, orient}),
      layout({groupBy: ["parent"], orient}),
    );
  });

  it(`Tree layout at depth(1) matches a Tree grouped by the first two levels (${orient})`, () => {
    assert.deepStrictEqual(
      layout({groupBy: ["top", "parent", "id"], depth: 1, orient}),
      layout({groupBy: ["top", "parent"], orient}),
    );
  });
}

it("Tree layout at depth(1) stops at the second of three groupBy levels", () => {
  const drawn = layout({groupBy: ["top", "parent", "id"], depth: 1});
  assert.deepStrictEqual(outline(drawn), [
    [1, "T"],
    [2, "P1"],
    [2, "P2"],
  ]);
  assert.deepStrictEqual(drawn.links, ["P1", "P2"]);
});

it("Tree layout draws all three groupBy levels at depth(2)", () => {
  const drawn = layout({groupBy: ["top", "parent", "id"], depth: 2});
  assert.deepStrictEqual(
    drawn.nodes.map(d => d.depth),
    [1, 2, 2, 3, 3, 3, 3],
  );
  assert.deepStrictEqual(drawn.links, ["P1", "P2", "a", "b", "c", "d"]);
});
