import assert from "node:assert";
import {it} from "vitest";

import {useJsdom} from "~test/jsdom.js";
import {Tree} from "../../index.ts";
import {applyTreeLayout, runStages} from "../../internal.ts";

useJsdom();

/**
    Tree's layout writes each node's hierarchy depth onto the row the node
    wraps. With the node shapes Tree draws (Circle, Rect), those rows are the
    pipeline's merged copies, never the objects passed to `.data()`.
*/

const cases = [
  [
    "a single-level groupBy",
    [
      {id: "a", value: 1},
      {id: "b", value: 2},
    ],
    viz => viz.groupBy("id"),
  ],
  [
    "a multi-level groupBy",
    [
      {parent: "P1", id: "a", value: 1},
      {parent: "P1", id: "b", value: 2},
      {parent: "P2", id: "c", value: 3},
    ],
    viz => viz.groupBy(["parent", "id"]),
  ],
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
    [
      {parent: "P1", id: "a", value: 1},
      {parent: "P1", id: "b", value: 2},
      {parent: "P2", id: "c", value: 3},
    ],
    viz => viz.groupBy(["parent", "id"]).depth(0),
  ],
  [
    "a row without its deepest groupBy key",
    [
      {parent: "P1", id: "a", value: 1},
      {parent: "P2", value: 3},
    ],
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
];

/**
    Lays a Tree out over frozen copies of `rows`, so a write to one throws.
    Returns those copies and the laid-out nodes.
*/
function layout(rows, configure) {
  const data = rows.map(d => Object.freeze({...d}));
  const chart = configure(new Tree().data(data)).width(400).height(300);
  chart._preDraw();
  chart._margin = {top: 0, right: 0, bottom: 0, left: 0};
  chart._padding = {top: 0, right: 0, bottom: 0, left: 0};
  const {shapeData} = runStages({viz: chart}, [applyTreeLayout]);
  return {data, nodes: shapeData};
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
}

it("Tree layout writes each node's hierarchy depth onto its copy of the row", () => {
  const [, rows, configure] = cases[1];
  const {nodes} = layout(rows, configure);
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
