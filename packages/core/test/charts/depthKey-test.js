import {it} from "vitest";
import assert from "assert";
import {
  DEPTH_KEY,
  depthOf,
  stampDepth,
} from "../../src/charts/features/depthKey.ts";
import {isInternalKey} from "../../src/charts/features/shareKey.ts";

it("depthKey — DEPTH_KEY is an internal key", () => {
  assert.strictEqual(DEPTH_KEY, "__d3plusDepth");
  assert.ok(isInternalKey(DEPTH_KEY));
});

it("stampDepth — a row without a depth field gets both keys", () => {
  const row = {id: "a"};
  stampDepth(row, 2);
  assert.deepStrictEqual(row, {id: "a", __d3plusDepth: 2, depth: 2});
});

it("stampDepth — a row with its own depth field keeps it", () => {
  const row = {id: "a", depth: "shallow"};
  stampDepth(row, 2);
  assert.deepStrictEqual(row, {id: "a", depth: "shallow", __d3plusDepth: 2});
  stampDepth(row, 1);
  assert.strictEqual(row.depth, "shallow", "a restamp still leaves it alone");
  assert.strictEqual(row.__d3plusDepth, 1);
});

it("stampDepth — a restamp updates the depth d3plus wrote", () => {
  const row = {id: "a"};
  stampDepth(row, 2);
  stampDepth(row, 1);
  assert.deepStrictEqual(row, {id: "a", __d3plusDepth: 1, depth: 1});
});

it("stampDepth — a falsy depth field (0, null) is still the user's", () => {
  const zero = {depth: 0};
  const empty = {depth: null};
  stampDepth(zero, 2);
  stampDepth(empty, 2);
  assert.strictEqual(zero.depth, 0);
  assert.strictEqual(empty.depth, null);
  assert.strictEqual(depthOf(zero), 2);
  assert.strictEqual(depthOf(empty), 2);
});

it("depthOf — reads d3plus's depth, never a depth field", () => {
  assert.strictEqual(depthOf({__d3plusDepth: 2, depth: 100}), 2);
  assert.strictEqual(depthOf({depth: 2}), undefined);
  assert.strictEqual(depthOf({id: "a"}), undefined);
  assert.strictEqual(depthOf(undefined), undefined);
  assert.strictEqual(depthOf(null), undefined);
});

it("depthOf — reads the row under shape and legend wrappers", () => {
  const row = {id: "a", __d3plusDepth: 2};
  const node = {__d3plus__: true, data: row, depth: 5};
  assert.strictEqual(depthOf(node), 2);
  assert.strictEqual(depthOf({__d3plus__: true, data: node}), 2);
  assert.strictEqual(
    depthOf({__d3plus__: true, data: {id: "a"}, __d3plusDepth: 3}),
    undefined,
    "a wrapper's own keys are not the row's",
  );
});

it("depthOf — ignores a value that is not a number", () => {
  assert.strictEqual(depthOf({__d3plusDepth: "2"}), undefined);
  assert.strictEqual(depthOf({__d3plusDepth: [1, 2]}), undefined);
});
