/* global console */
import assert from "assert";
import {
  resolveStackOffset,
  resolveStackOrder,
  stackOffsetDiverging,
  stackOrderField,
  stackOrderKey,
  stackOrderKeyReverse,
  stackOrderTotalAscending,
  stackOrderTotalDescending,
  stackSum,
} from "../../es/src/charts/Plot/stackHelpers.js";

// A d3-stack "series" is an array of [y0, y1] points carrying a `.key`.
const mkSeries = (key, points) => Object.assign(points.slice(), {key});

it("charts/stackHelpers stackSum totals the upper bounds, ignoring non-numbers", () => {
  assert.strictEqual(stackSum([[0, 2], [1, 4], [4, 0]]), 6, "0 contributes nothing");
  assert.strictEqual(stackSum([[0, 2], [2, "x"]]), 2, "non-numeric segments are skipped");
});

it("charts/stackHelpers stackOrderTotal* orders by summed value", () => {
  const series = [
    mkSeries("a", [[0, 1]]),  // sum 1
    mkSeries("b", [[0, 5]]),  // sum 5
    mkSeries("c", [[0, 3]]),  // sum 3
  ];
  // Ascending: smallest total (a) first → on the bottom of the stack.
  assert.deepStrictEqual(stackOrderTotalAscending(series), [0, 2, 1], "ascending by sum");
  // Descending: largest total (b) first.
  assert.deepStrictEqual(stackOrderTotalDescending(series), [1, 2, 0], "descending by sum");
});

it("charts/stackHelpers stackOrderKey* orders alphabetically by series key", () => {
  const series = [
    mkSeries("b", [[0, 5]]),
    mkSeries("a", [[0, 1]]),
    mkSeries("c", [[0, 3]]),
  ];
  // key: A→Z from the bottom → a (index 1), b (0), c (2).
  assert.deepStrictEqual(stackOrderKey(series), [1, 0, 2], "A→Z");
  assert.deepStrictEqual(stackOrderKeyReverse(series), [2, 0, 1], "Z→A");
});

it("charts/stackHelpers stackOrderKey breaks key ties by ascending sum", () => {
  // Both keys share the prefix "g" (split on \"_\"), so the sum tie-break wins.
  const series = [
    mkSeries("g_1", [[0, 10]]),
    mkSeries("g_2", [[0, 3]]),
  ];
  assert.deepStrictEqual(stackOrderKey(series), [1, 0], "smaller sum first on a key tie");
});

it("charts/stackHelpers stackOrderField ranks series by an aggregate of a data field", () => {
  // Each stacked point carries `.data` = the discrete group's rows; each row
  // has an `id` (the series key) and its original `data`.
  const g0 = [{id: "a", data: {v: 10}}, {id: "b", data: {v: 1}}];
  const g1 = [{id: "a", data: {v: 20}}, {id: "b", data: {v: 2}}];
  const withData = (point, group) => Object.assign(point.slice(), {data: group});
  const series = [
    mkSeries("a", [withData([0, 10], g0), withData([0, 20], g1)]), // field total 30
    mkSeries("b", [withData([0, 1], g0), withData([0, 2], g1)]),   // field total 3
  ];
  const value = d => d.v;
  // Default descending: largest field total (a) first.
  assert.deepStrictEqual(stackOrderField(value)(series), [0, 1], "descending field total");
  assert.deepStrictEqual(
    stackOrderField(value, "ascending")(series),
    [1, 0],
    "ascending field total",
  );
});

it("charts/stackHelpers resolveStackOrder maps every input shape", () => {
  // Named orders resolve to the corresponding tagged comparator.
  assert.strictEqual(resolveStackOrder("descending"), stackOrderTotalDescending);
  assert.strictEqual(resolveStackOrder("ascending"), stackOrderTotalAscending);
  assert.strictEqual(resolveStackOrder("key"), stackOrderKey);
  assert.strictEqual(resolveStackOrder("keyReverse"), stackOrderKeyReverse);

  // An explicit key array is returned untouched.
  const keys = ["b", "a"];
  assert.strictEqual(resolveStackOrder(keys), keys);

  // Accessor + {value, order} config both resolve to tagged field comparators.
  const fromAccessor = resolveStackOrder(d => d.v);
  assert.strictEqual(typeof fromAccessor, "function");
  assert.strictEqual(fromAccessor.__d3plusStackOrder, true);
  const fromConfig = resolveStackOrder({value: "v", order: "ascending"});
  assert.strictEqual(fromConfig.__d3plusStackOrder, true);

  // An already-resolved comparator passes through (config() reset round-trip).
  assert.strictEqual(resolveStackOrder(stackOrderTotalAscending), stackOrderTotalAscending);
});

it("charts/stackHelpers resolveStackOrder warns and falls back on an unknown name", () => {
  const original = console.warn;
  let warned = "";
  console.warn = msg => { warned = msg; };
  try {
    assert.strictEqual(resolveStackOrder("acsending"), stackOrderTotalDescending);
  } finally {
    console.warn = original;
  }
  assert.ok(/Unknown stackOrder "acsending"/.test(warned), "warns with the bad value");
});

it("charts/stackHelpers resolveStackOffset maps names, passes functions, warns on unknown", () => {
  assert.strictEqual(resolveStackOffset("diverging"), stackOffsetDiverging);
  const custom = () => {};
  assert.strictEqual(resolveStackOffset(custom), custom, "functions pass through");
  assert.strictEqual(typeof resolveStackOffset("expand"), "function", "d3 offset by name");

  const original = console.warn;
  let warned = "";
  console.warn = msg => { warned = msg; };
  try {
    assert.strictEqual(resolveStackOffset("expnd"), stackOffsetDiverging);
  } finally {
    console.warn = original;
  }
  assert.ok(/Unknown stackOffset "expnd"/.test(warned), "warns with the bad value");
});

it("charts/stackHelpers stackOffsetDiverging stacks positives up and negatives down from zero", () => {
  const series = [
    [[0, 3]],   // +3
    [[0, 2]],   // +2
    [[0, -1]],  // -1
  ];
  stackOffsetDiverging(series, [0, 1, 2]);
  assert.deepStrictEqual(series, [
    [[0, 3]],   // first positive: 0 → 3
    [[3, 5]],   // second positive: stacks on top, 3 → 5
    [[-1, 0]],  // negative: stacks below zero, -1 → 0
  ]);
});
