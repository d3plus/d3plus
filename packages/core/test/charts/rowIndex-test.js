import {it} from "vitest";
import assert from "assert";
import {AGGREGATE_INDEX, rowIndex} from "../../src/charts/features/rowIndex.ts";

/**
    A data-driven chart's mark reports the position of the row it draws in
    the chart's drawn data, or `AGGREGATE_INDEX` when it draws no single row.
*/

it("rowIndex: the position of a row in the drawn data", () => {
  const data = [{id: "a"}, {id: "b"}, {id: "c"}];
  assert.strictEqual(rowIndex(data, data[0]), 0);
  assert.strictEqual(rowIndex(data, data[2]), 2);
});

it("rowIndex: AGGREGATE_INDEX (-1) for a row not in the data, or nothing to look in", () => {
  const data = [{id: "a"}];
  assert.strictEqual(AGGREGATE_INDEX, -1);
  assert.strictEqual(rowIndex(data, {id: "a"}), AGGREGATE_INDEX, "a copy");
  assert.strictEqual(rowIndex(undefined, data[0]), AGGREGATE_INDEX);
  assert.strictEqual(rowIndex(data, undefined), AGGREGATE_INDEX);
});

it("rowIndex: a row listed twice reports its first position", () => {
  const row = {id: "a"};
  assert.strictEqual(rowIndex([{id: "z"}, row, row], row), 1);
});

it("rowIndex: sees rows appended to the same array", () => {
  const data = [{id: "a"}];
  assert.strictEqual(rowIndex(data, data[0]), 0);
  const added = {id: "b"};
  data.push(added);
  assert.strictEqual(rowIndex(data, added), 1);
});
