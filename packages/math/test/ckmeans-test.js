import assert from "assert";
import {default as ckmeans} from "../es/src/ckmeans.js";

it("math/ckmeans clusters well-separated data into the optimal grouping", () => {
  assert.deepStrictEqual(
    ckmeans([1, 2, 3, 10, 11, 12], 2),
    [[1, 2, 3], [10, 11, 12]],
    "two obvious groups",
  );

  // Canonical simple-statistics example — unique optimum, so the exact
  // partition is safe to assert (no tie-breaking ambiguity).
  assert.deepStrictEqual(
    ckmeans([-1, 2, -1, 2, 4, 5, 6, -1, 2, -1], 3),
    [[-1, -1, -1, -1], [2, 2, 2], [4, 5, 6]],
    "three groups, minimizing within-cluster sum of squares",
  );
});

it("math/ckmeans sorts unsorted input without mutating the caller's array", () => {
  const input = [12, 1, 11, 3, 10, 2];
  const result = ckmeans(input, 2);
  assert.deepStrictEqual(
    result,
    [[1, 2, 3], [10, 11, 12]],
    "result is grouped from a sorted view of the data",
  );
  assert.deepStrictEqual(
    input,
    [12, 1, 11, 3, 10, 2],
    "the original array is left untouched",
  );
});

it("math/ckmeans preserves the data as a sorted partition", () => {
  const data = [9, 2, 7, 4, 1, 8, 3, 6, 5, 0];
  for (const k of [1, 2, 3, 4, 5]) {
    const clusters = ckmeans(data, k);
    assert.strictEqual(clusters.length, k, `produces ${k} clusters`);
    // Concatenating the clusters reproduces the sorted input exactly —
    // every value appears once, in order, with no gaps or overlaps.
    const flat = clusters.flat();
    assert.deepStrictEqual(
      flat,
      data.slice().sort((a, b) => a - b),
      `k=${k}: clusters concatenate back to the sorted data`,
    );
    // Clusters are contiguous and ascending: each cluster's max <= next min.
    for (let i = 1; i < clusters.length; i++) {
      assert.ok(
        clusters[i - 1][clusters[i - 1].length - 1] <= clusters[i][0],
        `k=${k}: cluster ${i - 1} ends at or below cluster ${i}`,
      );
    }
  }
});

it("math/ckmeans handles single-cluster and one-value-per-cluster extremes", () => {
  assert.deepStrictEqual(
    ckmeans([4, 1, 3, 2], 1),
    [[1, 2, 3, 4]],
    "k=1 returns the whole sorted array as one cluster",
  );
  assert.deepStrictEqual(
    ckmeans([4, 1, 3, 2], 4),
    [[1], [2], [3], [4]],
    "k=length puts each value in its own cluster",
  );
});

it("math/ckmeans collapses identical values into a single cluster", () => {
  // When every value is the same there is only one distinct value, so the
  // algorithm short-circuits to one cluster regardless of the requested k.
  assert.deepStrictEqual(
    ckmeans([5, 5, 5, 5], 3),
    [[5, 5, 5, 5]],
    "all-identical input yields one cluster",
  );
});

it("math/ckmeans throws when asked for more clusters than values", () => {
  assert.throws(
    () => ckmeans([1, 2, 3], 4),
    /Cannot generate more classes than there are data values/,
  );
});
