import assert from "assert";
import {default as nest, nestGroups} from "../es/src/nest.js";

it("nest wraps a single key accessor and groups rows under it", () => {
  const data = [
    {group: "a", v: 1},
    {group: "a", v: 2},
    {group: "b", v: 3},
  ];
  assert.deepStrictEqual(nest(data, d => d.group), [
    {key: "a", values: [{group: "a", v: 1}, {group: "a", v: 2}]},
    {key: "b", values: [{group: "b", v: 3}]},
  ]);
});

it("nest preserves first-seen key order, not sorted order", () => {
  const data = [{g: "z"}, {g: "a"}, {g: "z"}, {g: "m"}];
  assert.deepStrictEqual(
    nest(data, d => d.g).map(d => d.key),
    ["z", "a", "m"],
  );
});

it("nest builds a nested hierarchy for multiple key levels", () => {
  const data = [
    {g1: "A", g2: "x", v: 1},
    {g1: "A", g2: "y", v: 2},
    {g1: "B", g2: "x", v: 3},
  ];
  assert.deepStrictEqual(nest(data, [d => d.g1, d => d.g2]), [
    {
      key: "A",
      values: [
        {key: "x", values: [{g1: "A", g2: "x", v: 1}]},
        {key: "y", values: [{g1: "A", g2: "y", v: 2}]},
      ],
    },
    {
      key: "B",
      values: [{key: "x", values: [{g1: "B", g2: "x", v: 3}]}],
    },
  ]);
});

it("nest collapses a level whose only child key is the string \"undefined\"", () => {
  // A deeper groupBy level that resolves to "undefined" (e.g. a missing
  // field) bubbles the leaf row up, dropping the empty level.
  const data = [{id: "a"}];
  assert.deepStrictEqual(
    nest(data, [d => d.id, d => String(d.missing)]),
    [{id: "a"}],
  );
});

it("nestGroups returns the raw data when given no key accessors", () => {
  const data = [{v: 1}, {v: 2}];
  assert.strictEqual(nestGroups(data, []), data);
});
