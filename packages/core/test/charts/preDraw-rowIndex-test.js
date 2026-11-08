import {it} from "vitest";
import assert from "assert";

import {rowIndex} from "../../src/charts/pipeline/preDrawData.ts";

/** `rowIndex` answers as `indexOf` does, before and after it builds its index. */

const seeded = seed => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

it("rowIndex: equals indexOf, repeats and missing rows included", () => {
  const random = seeded(5);
  for (let trial = 0; trial < 50; trial++) {
    const pool = Array.from({length: 1 + trial * 3}, (_, id) => ({id}));
    // Rows may repeat; some of the pool is missing from them.
    const rows = Array.from(
      {length: Math.floor(random() * pool.length * 1.5)},
      () => pool[Math.floor(random() * pool.length)],
    );
    const indexOf = rowIndex(rows);
    for (let k = 0; k < pool.length * 3; k++) {
      const row = pool[Math.floor(random() * pool.length)];
      assert.strictEqual(indexOf(row), rows.indexOf(row), `trial ${trial}`);
    }
    assert.strictEqual(indexOf({}), -1);
  }
});

it("rowIndex: in order, as a rollup asks for each group's first row", () => {
  const rows = Array.from({length: 1000}, (_, id) => ({id}));
  const indexOf = rowIndex(rows);
  rows.forEach((row, i) => assert.strictEqual(indexOf(row), i));
  assert.strictEqual(rowIndex([])({}), -1);
});
