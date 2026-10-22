import {it} from "vitest";
import assert from "assert";
import {uniqueIds} from "../../src/shapes/uniqueIds.ts";

it("uniqueIds leaves unique ids alone", () => {
  assert.deepStrictEqual(uniqueIds(["a", "b", "c"]), ["a", "b", "c"]);
  assert.deepStrictEqual(uniqueIds([]), []);
});

it("uniqueIds suffixes each repeat in order", () => {
  assert.deepStrictEqual(uniqueIds(["a", "b", "a", "a", "b"]), ["a", "b", "a~1", "a~2", "b~1"]);
});

it("uniqueIds skips suffixes another id already uses", () => {
  assert.deepStrictEqual(uniqueIds(["a", "a", "a~1"]), ["a", "a~2", "a~1"]);
  assert.deepStrictEqual(uniqueIds(["a~1", "a", "a"]), ["a~1", "a", "a~2"]);
});
