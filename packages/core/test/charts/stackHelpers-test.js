import assert from "assert";
import {
  stackOffsetDiverging,
  stackOrderAscending,
  stackOrderDescending,
  stackSum,
} from "../../es/src/charts/Plot/stackHelpers.js";

// A d3-stack "series" is an array of [y0, y1] points carrying a `.key`.
const mkSeries = (key, points) => Object.assign(points.slice(), {key});

it("charts/stackHelpers stackSum totals the upper bounds, ignoring non-numbers", () => {
  assert.strictEqual(stackSum([[0, 2], [1, 4], [4, 0]]), 6, "0 contributes nothing");
  assert.strictEqual(stackSum([[0, 2], [2, "x"]]), 2, "non-numeric segments are skipped");
});

it("charts/stackHelpers stackOrderAscending orders series by key, descending alphabetically", () => {
  const series = [
    mkSeries("a", [[0, 1]]),
    mkSeries("b", [[0, 5]]),
    mkSeries("c", [[0, 3]]),
  ];
  // Distinct keys → no sum tie-break; result is the indices in descending key order.
  assert.deepStrictEqual(stackOrderAscending(series), [2, 1, 0]);
});

it("charts/stackHelpers stackOrderAscending breaks key ties by ascending sum", () => {
  // Both keys share the prefix "g", so the localeCompare is 0 and the
  // smaller-sum series sorts first.
  const series = [
    mkSeries("g_1", [[0, 10]]),
    mkSeries("g_2", [[0, 3]]),
  ];
  assert.deepStrictEqual(stackOrderAscending(series), [1, 0]);
});

it("charts/stackHelpers stackOrderDescending is the reverse of ascending", () => {
  const series = [
    mkSeries("a", [[0, 1]]),
    mkSeries("b", [[0, 5]]),
    mkSeries("c", [[0, 3]]),
  ];
  assert.deepStrictEqual(stackOrderDescending(series), [0, 1, 2]);
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
