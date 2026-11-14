import {describe, it} from "vitest";
import assert from "assert";

import {labelsWithShapes, namesMark} from "../../internal.ts";

/**
    Labels paint together with their own shapes (bug #30): each label moves
    to just after its shape and takes its `z`.
*/

const rowA = {id: "a"},
  rowB = {id: "b"};
const circle = (key, datum, extra = {}) => ({
  type: "circle",
  key,
  datum,
  ...extra,
});
const text = (key, datum, extra = {}) => ({type: "text", key, datum, ...extra});
const keys = nodes => nodes.map(n => n.key);

describe("charts/labelLayering labelsWithShapes", () => {
  it("moves each label to just after its shape", () => {
    const nodes = [
      circle("a", rowA),
      circle("b", rowB),
      text("a_0", rowA),
      text("b_0", rowB),
    ];
    assert.deepStrictEqual(keys(labelsWithShapes(nodes)), [
      "a",
      "a_0",
      "b",
      "b_0",
    ]);
  });

  it("follows the shape's last node, such as an image after its circle", () => {
    const nodes = [
      circle("a", rowA),
      circle("b", rowB),
      {type: "group", key: "a-image", datum: rowA},
      text("a_0", rowA),
    ];
    assert.deepStrictEqual(keys(labelsWithShapes(nodes)), [
      "a",
      "b",
      "a-image",
      "a_0",
    ]);
  });

  it("matches a label whose datum wraps its shape's row", () => {
    const nodes = [
      circle("a", rowA),
      circle("b", rowB),
      text("a_0", {id: "node-a", data: rowA}),
    ];
    assert.deepStrictEqual(keys(labelsWithShapes(nodes)), ["a", "a_0", "b"]);
  });

  it("takes its shape's z, so the z sort keeps them together", () => {
    const nodes = [
      circle("a", rowA, {z: 1}),
      circle("b", rowB, {z: 0}),
      text("a_0", rowA),
      text("b_0", rowB),
    ];
    const out = labelsWithShapes(nodes);
    assert.deepStrictEqual(
      out.map(n => [n.key, n.z]),
      [
        ["a", 1],
        ["a_0", 1],
        ["b", 0],
        ["b_0", 0],
      ],
    );
    const painted = [...out].sort((x, y) => x.z - y.z).map(n => n.key);
    assert.deepStrictEqual(painted, ["b", "b_0", "a", "a_0"]);
  });

  it("carries a label's hitbox with it", () => {
    const nodes = [
      circle("a", rowA),
      circle("b", rowB),
      {type: "rect", key: "a_0::hit", datum: rowA},
      text("a_0", rowA),
    ];
    assert.deepStrictEqual(keys(labelsWithShapes(nodes)), [
      "a",
      "a_0::hit",
      "a_0",
      "b",
    ]);
  });

  it("keeps a shape's hit area in place, before its shape", () => {
    const nodes = [
      {type: "circle", key: "a::hit", datum: rowA},
      circle("a", rowA),
      circle("b", rowB),
      text("a_0", rowA),
    ];
    assert.deepStrictEqual(keys(labelsWithShapes(nodes)), [
      "a::hit",
      "a",
      "a_0",
      "b",
    ]);
  });

  it("leaves a label with no shape in place, over every z-layered shape", () => {
    const nodes = [
      circle("a", rowA, {z: 3}),
      text("other", {id: "x"}),
      circle("b", rowB, {z: 0}),
    ];
    const out = labelsWithShapes(nodes);
    assert.deepStrictEqual(keys(out), ["a", "other", "b"]);
    assert.strictEqual(out[1].z, 4);
    const plain = [circle("a", rowA), text("other", {id: "x"})];
    assert.strictEqual(labelsWithShapes(plain)[1], plain[1]);
  });

  it("returns the nodes as they are when there are no labels", () => {
    const nodes = [circle("a", rowA)];
    assert.strictEqual(labelsWithShapes(nodes), nodes);
  });

  it("does not mutate its input", () => {
    const nodes = [
      circle("a", rowA, {z: 2}),
      circle("b", rowB),
      text("a_0", rowA),
    ];
    labelsWithShapes(nodes);
    assert.strictEqual(nodes[2].z, undefined);
    assert.deepStrictEqual(keys(nodes), ["a", "b", "a_0"]);
  });
});

describe("charts/labelLayering namesMark", () => {
  it("matches a text node whose datum is, or wraps, the mark's", () => {
    const mark = circle("a", rowA);
    assert.ok(namesMark(text("a_0", rowA), mark));
    assert.ok(namesMark(text("a_0", {data: rowA}), mark));
    assert.ok(!namesMark(text("b_0", rowB), mark));
    assert.ok(!namesMark(circle("a2", rowA), mark), "only text");
    assert.ok(
      !namesMark(text("a_0", rowA), circle("x")),
      "a mark with no datum",
    );
  });
});
