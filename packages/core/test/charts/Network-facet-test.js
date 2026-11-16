import {it} from "vitest";
import assert from "assert";
import {
  graphNodeRows,
  panelNodeIds,
  resolveGraphLinks,
  resolveGraphNodes,
} from "../../internal.ts";

/**
    A small-multiple panel of a node-link chart keeps only the nodes its
    own data rows stand for, and the links between two of them, even when
    every panel shares the same `nodes` and `links`.
*/

const rows = [
  {id: "a", group: 1},
  {id: "b", group: 1},
  {id: "c", group: 2},
];
const links = [
  {source: "a", target: "b"},
  {source: "b", target: "c"},
  {source: "c", target: "a"},
];

/** A stand-in node-link chart drawing `data`, in a panel when `panel`. */
const fakeGraph = ({nodes = [], data, panel = true}) => ({
  ctx: {},
  schema: {
    nodes,
    links,
    nodeGroupBy: [d => d.id],
    linkSize: () => 1,
    shape: () => "Circle",
    sizeMin: 5,
  },
  _id: d => d.id,
  _drawDepth: 0,
  _data: rows,
  _filteredData: data,
  _facetStep: panel ? "panel" : undefined,
});

it("panelNodeIds: a panel's own row ids, or none outside a panel", () => {
  const panel = fakeGraph({data: rows.slice(0, 2)});
  assert.deepStrictEqual([...panelNodeIds(panel)], ["a", "b"]);
  assert.strictEqual(
    panelNodeIds(fakeGraph({data: rows, panel: false})),
    undefined,
  );
  assert.strictEqual(
    panelNodeIds({...panel, _facetStep: "chrome"}),
    undefined,
    "the chrome step draws no nodes of its own",
  );
});

it("graphNodeRows: a panel keeps the nodes its rows stand for", () => {
  const nodes = [{id: "a"}, {id: "b"}, {id: "c"}];
  const panel = fakeGraph({nodes, data: rows.slice(0, 2)});
  assert.deepStrictEqual(graphNodeRows(panel), [{id: "a"}, {id: "b"}]);
  const whole = fakeGraph({nodes, data: rows.slice(0, 2), panel: false});
  assert.deepStrictEqual(graphNodeRows(whole), nodes);
});

it("graphNodeRows: without nodes, a panel adds no link ends", () => {
  const panel = fakeGraph({data: rows.slice(2)});
  assert.deepStrictEqual(graphNodeRows(panel), [rows[2]]);
  const whole = fakeGraph({data: rows.slice(2), panel: false});
  assert.deepStrictEqual(
    graphNodeRows(whole).map(d => d.id),
    ["c", "a", "b"],
  );
});

it("resolveGraphLinks: a panel resolves only links between its own nodes", () => {
  const viz = fakeGraph({nodes: rows, data: rows.slice(0, 2)});
  const nodes = resolveGraphNodes(viz);
  assert.deepStrictEqual(
    nodes.map(n => n.id),
    ["a", "b"],
  );
  const resolved = resolveGraphLinks(viz, nodes);
  assert.deepStrictEqual(
    resolved.map(l => [l.source?.id, l.target?.id, !!l.datum]),
    [
      ["a", "b", true],
      ["b", undefined, false],
      [undefined, "a", false],
    ],
  );
  assert.deepStrictEqual(Object.keys(viz.ctx.linkLookup).sort(), ["a", "b"]);
});
