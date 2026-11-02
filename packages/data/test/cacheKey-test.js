import {it} from "vitest";
import assert from "assert";
import cacheKey from "../src/cacheKey.ts";

it("cacheKey: the loader key plus the JSON of the paths", () => {
  assert.strictEqual(cacheKey("data", "a.json"), 'data_["a.json"]');
  assert.strictEqual(
    cacheKey("data", "a.json"),
    cacheKey("data", ["a.json"]),
    "a path and a one-item Array of it match",
  );
});

it("cacheKey: loaders, request options and each URL of a list differ", () => {
  const keys = [
    cacheKey("data", "a.json"),
    cacheKey("links", "a.json"),
    cacheKey("data", {url: "a.json", headers: {A: "1"}}),
    cacheKey("data", {url: "a.json", headers: {A: "2"}}),
    cacheKey("data", ["a.json", "b.json"]),
    cacheKey("data", ["b.json", "a.json"]),
  ];
  assert.strictEqual(new Set(keys).size, keys.length);
  assert.ok(!keys.some(k => k.includes("[object Object]")));
});
