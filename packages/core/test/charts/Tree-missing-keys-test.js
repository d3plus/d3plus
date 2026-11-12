import assert from "node:assert";
import {it} from "vitest";

import {useJsdom} from "~test/jsdom.js";
import {Tree} from "../../index.ts";
import {applyTreeLayout, runStages} from "../../internal.ts";
import {treeEmit} from "../../src/charts/Tree/emit.ts";
import {nameLevel, noKey, nodeId} from "../../src/charts/Tree/keys.ts";
import {nodeLabel} from "../../src/charts/Tree/nodeLabel.ts";

useJsdom();

/**
    A row without a `groupBy` key at some level (`undefined`, `null` or `""`)
    is a leaf of the group above that level, beside the group's other rows
    and sub-groups. It is named by the `label` accessor, or else at the
    deepest level it has a key, and keyed apart from the group it is drawn
    under.
*/

const missing = [undefined, null, ""];

/** Lays a Tree out and returns it with its nodes and scene. */
function layout(rows, config) {
  const chart = new Tree().config({
    data: rows.map(d => ({...d, value: 1})),
    height: 300,
    width: 400,
    ...config,
  });
  chart._preDraw();
  chart._margin = {top: 0, right: 0, bottom: 0, left: 0};
  chart._padding = {top: 0, right: 0, bottom: 0, left: 0};
  const nodes = runStages({viz: chart}, [applyTreeLayout]).shapeData;
  return {chart, nodes, scene: treeEmit({viz: chart})};
}

/**
    Each node as [its depth, its name, its parent's name, whether it is drawn
    as a branch], named as the tooltip titles it.
*/
function outline({chart, nodes}) {
  const {title} = chart.tooltipConfig();
  const name = d => title(d.data, d.i);
  return nodes.map(d => [
    d.depth,
    name(d),
    nodes.includes(d.parent) ? name(d.parent) : null,
    !!d.children && d.depth <= chart._drawDepth,
  ]);
}

/** The scene's [key, accessible name] pairs, and its drawn labels. */
function drawn({scene}) {
  return {
    marks: scene
      .filter(n => n.type === "circle" || n.type === "path")
      .map(n => [n.key, n.aria.label]),
    labels: scene
      .filter(n => n.type === "text")
      .map(n => n.lines.map(l => l.text).join(" ")),
  };
}

it("noKey — undefined, null and the empty string are no key", () => {
  for (const value of missing) assert.strictEqual(noKey(value), true);
  for (const value of [0, false, NaN, "a", "undefined", []])
    assert.strictEqual(noKey(value), false, `${value}`);
});

it("nameLevel — a row with a key at its own level is named there", () => {
  const {chart} = layout([{top: "T", parent: "P", id: "a"}], {
    groupBy: ["top", "parent", "id"],
  });
  const row = {top: "T", parent: "P", id: "a"};
  assert.strictEqual(nameLevel(chart, row, 0, 0), 0);
  assert.strictEqual(nameLevel(chart, row, 0, 1), 1);
  assert.strictEqual(nameLevel(chart, row, 0, 2), 2);
});

for (const key of missing) {
  const name = JSON.stringify(key) ?? "undefined";

  it(`nameLevel — a row whose key is ${name} at its level is named at its deepest key`, () => {
    const {chart} = layout([{top: "T", parent: "P", id: "a"}], {
      groupBy: ["top", "parent", "id"],
    });
    assert.strictEqual(
      nameLevel(chart, {top: "T", parent: key, id: "a"}, 0, 1),
      2,
    );
    assert.strictEqual(nameLevel(chart, {top: "T", parent: key}, 0, 1), 0);
    assert.strictEqual(
      nameLevel(chart, {top: key, parent: key}, 0, 0),
      undefined,
    );
  });

  it(`nameLevel — reads only the drawn levels (key ${name})`, () => {
    const {chart} = layout([{top: "T", parent: "P", id: "a"}], {
      groupBy: ["top", "parent", "id"],
      depth: 1,
    });
    assert.strictEqual(
      nameLevel(chart, {top: "T", parent: key, id: "a"}, 0, 1),
      0,
    );
  });

  it(`nodeId — a row whose key is ${name} at its level is keyed by all its keys`, () => {
    const {chart} = layout([{top: "T", parent: "P", id: "a"}], {
      groupBy: ["top", "parent", "id"],
    });
    const row = {top: "T", parent: key, id: "a"};
    assert.strictEqual(nodeId(chart, {data: row, depth: 2}, 0), `T/${key}/a`);
    assert.strictEqual(
      nodeId(chart, {data: {top: "T", parent: "P", id: "a"}, depth: 2}, 0),
      "P",
    );
  });

  it(`nodeLabel — a row whose key is ${name} at its level is named at its deepest key`, () => {
    const {chart} = layout([{parent: "P", id: "a"}], {
      groupBy: ["parent", "id"],
    });
    const row = {parent: "P", id: key, __d3plusDepth: 2};
    assert.strictEqual(nodeLabel(chart, row, 0), "P");
  });

  it(`Tree draws a row whose middle key is ${name} as a leaf of its group`, () => {
    const tree = layout(
      [
        {top: "T", parent: "P1", id: "a"},
        {top: "T", parent: "P1", id: "b"},
        {top: "T", parent: key, id: "c"},
      ],
      {groupBy: ["top", "parent", "id"]},
    );
    assert.deepStrictEqual(outline(tree), [
      [1, "T", null, true],
      [2, "P1", "T", true],
      [2, "c", "T", false],
      [3, "a", "P1", false],
      [3, "b", "P1", false],
    ]);
    assert.deepStrictEqual(drawn(tree), {
      marks: [
        ["tree-link-P1", "P1."],
        [`tree-link-T/${key}/c`, "c."],
        ["tree-link-a", "a."],
        ["tree-link-b", "b."],
        ["tree-Circle-T", "T."],
        ["tree-Circle-P1", "P1."],
        [`tree-Circle-T/${key}/c`, "c."],
        ["tree-Circle-a", "a."],
        ["tree-Circle-b", "b."],
      ],
      labels: ["T", "P1", "c", "a", "b"],
    });
  });

  it(`Tree draws a row whose deepest key is ${name} as a leaf of its group, beside its other rows`, () => {
    const tree = layout(
      [
        {parent: "P1", id: "a"},
        {parent: "P1", id: key},
        {parent: "P2", id: "c"},
      ],
      {groupBy: ["parent", "id"]},
    );
    assert.deepStrictEqual(outline(tree), [
      [1, "P1", null, true],
      [1, "P2", null, true],
      [2, "a", "P1", false],
      [2, "P1", "P1", false],
      [2, "c", "P2", false],
    ]);
    const {marks} = drawn(tree);
    assert.deepStrictEqual(
      marks.filter(([k]) => k.startsWith("tree-Circle")),
      [
        ["tree-Circle-P1", "P1."],
        ["tree-Circle-P2", "P2."],
        ["tree-Circle-a", "a."],
        [`tree-Circle-P1/${key}`, "P1."],
        ["tree-Circle-c", "c."],
      ],
    );
    assert.strictEqual(new Set(marks.map(d => d[0])).size, marks.length);
  });
}

it("Tree names a row without a key at its level by its label accessor", () => {
  const tree = layout(
    [
      {parent: "P1", id: "a", name: "Alpha"},
      {parent: "P1", name: "Other"},
    ],
    {groupBy: ["parent", "id"], label: d => d.name},
  );
  const {title} = tree.chart.tooltipConfig();
  assert.deepStrictEqual(
    tree.nodes.map(d => title(d.data, d.i)),
    ["P1", "Alpha", "Other"],
  );
  assert.strictEqual(drawn(tree).labels.at(-1), "Other");
  assert.deepStrictEqual(
    drawn(tree).marks.filter(([k]) => k.startsWith("tree-Circle")),
    [
      ["tree-Circle-P1", "P1."],
      ["tree-Circle-a", "Alpha."],
      ["tree-Circle-P1/undefined", "Other."],
    ],
  );
});
