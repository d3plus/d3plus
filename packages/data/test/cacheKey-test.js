import {it} from "vitest";
import assert from "assert";
import cacheKey from "../src/cacheKey.ts";

it("cacheKey: the JSON of the URL or request object", () => {
  assert.strictEqual(cacheKey("a.json"), '"a.json"');
  assert.strictEqual(
    cacheKey({url: "a.json", headers: {A: "1"}}),
    '{"url":"a.json","headers":{"A":"1"}}',
  );
});

it("cacheKey: URLs and request options differ", () => {
  const keys = [
    cacheKey("a.json"),
    cacheKey("b.json"),
    cacheKey({url: "a.json"}),
    cacheKey({url: "a.json", headers: {A: "1"}}),
    cacheKey({url: "a.json", headers: {A: "2"}}),
  ];
  assert.strictEqual(new Set(keys).size, keys.length);
  assert.ok(!keys.some(k => k.includes("[object Object]")));
});
