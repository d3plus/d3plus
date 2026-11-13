import assert from "node:assert";
import {it} from "vitest";

import {useJsdom} from "~test/jsdom.js";
import {Tree} from "../../index.ts";
import {applyTreeLayout, runStages} from "../../internal.ts";
import {isBranch} from "../../src/charts/Tree/applyLayout.ts";
import {isInternalKey} from "../../src/charts/features/shareKey.ts";

useJsdom();

/**
    A `groupBy` key of `0` or `false` names a group like any other: Tree draws
    it as a branch over its children. `undefined`, `null` and `""` are no key:
    a row with `null` or `""` is laid out as one without the key.
*/

const falsyKeys = [0, false];

/** Lays a Tree out over `rows` and returns its nodes. */
function layout(rows, groupBy) {
  const chart = new Tree().data(rows).groupBy(groupBy).width(400).height(300);
  chart._preDraw();
  chart._margin = {top: 0, right: 0, bottom: 0, left: 0};
  chart._padding = {top: 0, right: 0, bottom: 0, left: 0};
  return runStages({viz: chart}, [applyTreeLayout]).shapeData;
}

/** A row without the keys d3plus writes, nor the `depth` it mirrors. */
function fields(row) {
  return Object.fromEntries(
    Object.entries(row).filter(
      ([key]) => !isInternalKey(key) && key !== "depth",
    ),
  );
}

/** Each node as [its depth, its row, the row of its parent node]. */
function outline(nodes) {
  return nodes.map(d => [
    d.depth,
    fields(d.data),
    nodes.includes(d.parent) ? fields(d.parent.data) : null,
  ]);
}

it("isBranch — a nest entry with a key and a list of values", () => {
  assert.strictEqual(isBranch({key: "P1", values: [{id: "a"}]}), true);
  assert.strictEqual(isBranch({key: 7, values: []}), true);
});

it("isBranch — a falsy key is a key", () => {
  for (const key of [0, false, NaN])
    assert.strictEqual(isBranch({key, values: [{id: "a"}]}), true, `${key}`);
});

it("isBranch — an entry without a key is not a branch", () => {
  assert.strictEqual(isBranch({key: undefined, values: [{id: "a"}]}), false);
  assert.strictEqual(isBranch({key: null, values: [{id: "a"}]}), false);
  assert.strictEqual(isBranch({key: "", values: [{id: "a"}]}), false);
  assert.strictEqual(isBranch({values: [{id: "a"}]}), false);
});

it("isBranch — a data row is not a branch", () => {
  assert.strictEqual(isBranch({parent: 0, id: "a", value: 1}), false);
  assert.strictEqual(isBranch({key: 0, value: 1}), false);
  assert.strictEqual(isBranch({key: 0, values: 3}), false);
});

for (const key of falsyKeys) {
  const name = JSON.stringify(key);

  it(`Tree layout draws a top-level group keyed ${name} as a branch`, () => {
    const nodes = layout(
      [
        {parent: key, id: "a", value: 1},
        {parent: key, id: "b", value: 2},
        {parent: "P2", id: "c", value: 3},
      ],
      ["parent", "id"],
    );
    const group = {parent: key, id: ["a", "b"], value: 3};
    const other = {parent: "P2", id: "c", value: 3};
    assert.deepStrictEqual(outline(nodes), [
      [1, group, null],
      [1, other, null],
      [2, {parent: key, id: "a", value: 1}, group],
      [2, {parent: key, id: "b", value: 2}, group],
      [2, other, other],
    ]);
  });

  it(`Tree layout draws a leaf keyed ${name} under its group`, () => {
    const nodes = layout(
      [
        {parent: "P1", id: key, value: 1},
        {parent: "P1", id: "b", value: 2},
        {parent: "P2", id: "c", value: 3},
      ],
      ["parent", "id"],
    );
    const group = {parent: "P1", id: [key, "b"], value: 3};
    const other = {parent: "P2", id: "c", value: 3};
    assert.deepStrictEqual(outline(nodes), [
      [1, group, null],
      [1, other, null],
      [2, {parent: "P1", id: key, value: 1}, group],
      [2, {parent: "P1", id: "b", value: 2}, group],
      [2, other, other],
    ]);
  });

  it(`Tree layout draws a middle group keyed ${name} as a branch`, () => {
    const nodes = layout(
      [
        {top: "T", parent: key, id: "a", value: 1},
        {top: "T", parent: key, id: "b", value: 2},
      ],
      ["top", "parent", "id"],
    );
    const group = {top: "T", parent: key, id: ["a", "b"], value: 3};
    assert.deepStrictEqual(outline(nodes), [
      [1, group, null],
      [2, group, group],
      [3, {top: "T", parent: key, id: "a", value: 1}, group],
      [3, {top: "T", parent: key, id: "b", value: 2}, group],
    ]);
  });

  it(`Tree layout ends a row without its deepest key at a group keyed ${name}`, () => {
    const nodes = layout(
      [
        {parent: key, value: 1},
        {parent: "P2", id: "c", value: 3},
      ],
      ["parent", "id"],
    );
    const other = {parent: "P2", id: "c", value: 3};
    assert.deepStrictEqual(outline(nodes), [
      [1, {parent: key, value: 1}, null],
      [1, other, null],
      [2, other, other],
    ]);
  });
}

it("Tree layout ends a row without its deepest key at its group", () => {
  const nodes = layout(
    [
      {parent: "P1", value: 1},
      {parent: "P2", id: "c", value: 3},
    ],
    ["parent", "id"],
  );
  const other = {parent: "P2", id: "c", value: 3};
  assert.deepStrictEqual(outline(nodes), [
    [1, {parent: "P1", value: 1}, null],
    [1, other, null],
    [2, other, other],
  ]);
});

/**
    `value` with every field whose value is `""`, `null` or `undefined` left
    out, at any depth, so a row compares equal to one that lacks those keys.
*/
const withoutEmpty = value =>
  Array.isArray(value)
    ? value.map(withoutEmpty)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.entries(value)
            .filter(([, v]) => v !== "" && v !== null && v !== undefined)
            .map(([k, v]) => [k, withoutEmpty(v)]),
        )
      : value;

for (const key of [null, ""]) {
  const name = JSON.stringify(key);

  for (const [level, groupBy, rows] of [
    [
      "first",
      ["parent", "id"],
      [
        {parent: key, id: "a", value: 1},
        {parent: "P2", id: "c", value: 3},
        {parent: "P2", id: "d", value: 4},
      ],
    ],
    [
      "last",
      ["parent", "id"],
      [
        {parent: "P1", id: key, value: 1},
        {parent: "P2", id: "c", value: 3},
        {parent: "P2", id: "d", value: 4},
      ],
    ],
    [
      "middle",
      ["top", "parent", "id"],
      [
        {top: "T1", parent: key, id: "a", value: 1},
        {top: "T2", parent: "P2", id: "c", value: 3},
        {top: "T2", parent: "P2", id: "d", value: 4},
      ],
    ],
  ]) {
    it(`Tree layout lays out a row whose ${level} key is ${name} as one without it`, () => {
      const outlined = data => withoutEmpty(outline(layout(data, groupBy)));
      assert.deepStrictEqual(outlined(rows), outlined(withoutEmpty(rows)));
    });
  }

  it(`Tree layout ends a row whose deepest key is ${name} at its group`, () => {
    const nodes = layout(
      [
        {parent: "P1", id: key, value: 1},
        {parent: "P2", id: "c", value: 3},
      ],
      ["parent", "id"],
    );
    const other = {parent: "P2", id: "c", value: 3};
    assert.deepStrictEqual(outline(nodes), [
      [1, {parent: "P1", id: key, value: 1}, null],
      [1, other, null],
      [2, other, other],
    ]);
  });
}
