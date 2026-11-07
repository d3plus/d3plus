import {it} from "vitest";
import assert from "assert";

import {unique} from "@d3plus/data";
import {
  sortedAxisValues,
  uniqueSortedNumbers,
} from "../../src/charts/Plot/axisValues.ts";

/** `sortedAxisValues` gives the list Plot's axis values took: sort the rows, then drop repeats by string form. */

const reference = (rows, axis, sort) =>
  unique(
    [...rows]
      .sort((a, b) => (sort ? sort(a, b) : a[axis] - b[axis]))
      .map(d => d[axis]),
    d => `${d}`,
  );

const seeded = seed => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const same = (values, label, sort) => {
  const rows = values.map((x, i) => ({x, data: {i, x}}));
  const actual = sortedAxisValues(
    rows.map(d => ({...d})),
    "x",
    sort,
  );
  const expected = reference(rows, "x", sort);
  assert.strictEqual(actual.length, expected.length, label);
  actual.forEach((v, i) =>
    assert.ok(
      Object.is(v, expected[i]),
      `${label} [${i}]: ${v} vs ${expected[i]}`,
    ),
  );
};

it("sortedAxisValues: numbers", () => {
  const random = seeded(13);
  for (let trial = 0; trial < 40; trial++) {
    const n = Math.floor(random() * 2000);
    const values = Array.from({length: n}, () =>
      trial % 2 ? Math.round(random() * 50) : random() * 1e4 - 5e3,
    );
    same(values, `trial ${trial}`);
  }
  same([], "empty");
  same([3], "one");
  same([0, -0, 1, -0, 0], "signed zeros");
  same([-0, 0], "negative zero first");
  same([Infinity, -Infinity, 1, Infinity], "infinities");
  same([1e21, 1e-7, 0.1 + 0.2, 0.3], "string forms");
});

it("sortedAxisValues: strings, dates, and mixed values", () => {
  same(["b", "a", "c", "a"], "strings");
  same([1, "1", 2, "2", "1"], "numbers and numeric strings");
  same([2, "10", 1, "x", 1], "mixed");
  const d = t => new Date(Date.UTC(2020, 0, t));
  same([d(3), d(1), d(2), d(1)], "dates");
  same([true, 1, false, 0], "booleans");
});

it("sortedAxisValues: a custom sort", () => {
  const byDesc = (a, b) => b.data.x - a.data.x;
  same([3, 1, 2, 3, 5], "descending", byDesc);
  same(["b", "a", "b"], "strings by data", (a, b) =>
    a.data.x.localeCompare(b.data.x),
  );
});

it("uniqueSortedNumbers: equals sorting with a comparator, then dropping repeats", () => {
  const random = seeded(17);
  const check = (numbers, label) => {
    const expected = unique([...numbers].sort((a, b) => a - b));
    const actual = uniqueSortedNumbers([...numbers]);
    assert.strictEqual(actual.length, expected.length, label);
    actual.forEach((v, i) =>
      assert.ok(
        Object.is(v, expected[i]),
        `${label} [${i}]: ${v} vs ${expected[i]}`,
      ),
    );
  };
  for (let trial = 0; trial < 40; trial++)
    check(
      Array.from({length: Math.floor(random() * 3000)}, () =>
        trial % 2 ? Math.round(random() * 40) - 20 : random() * 1e6 - 5e5,
      ),
      `trial ${trial}`,
    );
  check([], "empty");
  check([-0], "negative zero");
  check([-0, 3, -0], "negative zeros");
  check([0, -0, 2], "zero first");
  check([-0, 0, 2], "negative zero first");
  check([3, NaN, 1, NaN, 2], "NaN");
  check([Infinity, -Infinity, 0, Infinity, -1e308], "infinities");
});
