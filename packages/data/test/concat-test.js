import assert from "assert";
import {default as concat} from "../src/concat.js";

it("data/concat", () => {

  const array1 = ["a", "b", "c"];
  const array2 = ["d", "e", "f"];


  // Concat array of arrays
  const concat1 = concat([
    array1,
    array2
  ]);
  assert.strictEqual(true, concat1 instanceof Array, "Concat returns Array 1");
  assert.strictEqual(6, concat1.length, "Correct Array length 1");

  // Concat array of objects with `data` key
  const concat2 = concat([
    {page: 1, data: array1},
    {page: 1, data: array2}
  ]);
  assert.strictEqual(true, concat2 instanceof Array, "Concat Returns Array 2");
  assert.strictEqual(6, concat2.length, "Correct Array length 2");

  // Concat array of objects with no data key
  const concat3 = concat([
    {page: 1, results: array1},
    {page: 1, results: array2}
  ]);
  assert.strictEqual(true, concat3 instanceof Array, "Concat Returns Array 3");
  assert.strictEqual(0, concat3.length, "Correct Array length 3");

  // Concat array of objects with no data key
  const concat4 = concat([
    {page: 1, results: array1},
    {page: 1, results: array2}
  ], "results");
  assert.strictEqual(true, concat4 instanceof Array, "Concat Returns Array 4");
  assert.strictEqual(6, concat4.length, "Correct Array length 4");

});
