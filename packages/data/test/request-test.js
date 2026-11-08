import {afterEach, it, vi} from "vitest";
import assert from "assert";
import request, {parsePayload} from "../src/request.ts";
import cacheKey from "../src/cacheKey.ts";

const files = {
  "graph.json": JSON.stringify({
    edges: [{source: "a", target: "b"}],
    vertices: [
      {id: "a", x: "0"},
      {id: "b", x: "1"},
    ],
  }),
  "rows.csv": "id,value,flag\na,1,TRUE\nb,2,no",
};

/** Stubs `fetch` to serve `files` by name, counting requests per URL. */
function stubFetch() {
  const requests = {};
  vi.stubGlobal("fetch", async url => {
    requests[url] = (requests[url] || 0) + 1;
    const body = files[url];
    if (body === undefined) return new Response("missing", {status: 404});
    return new Response(body, {status: 200});
  });
  return requests;
}

/** A Map-backed cache. */
function memoryCache() {
  const map = new Map();
  return {map, get: k => map.get(k), set: (k, v) => map.set(k, v)};
}

/** Requests `item`, resolving with the receiver's `[error, payload]`. */
const get = (item, cache) =>
  new Promise(resolve => request(item, cache, (e, p) => resolve([e, p])));

afterEach(() => {
  vi.unstubAllGlobals();
});

it("parsePayload: parses by extension, folds, and coerces", () => {
  const csv = parsePayload("a.csv", "id,value\na,1");
  assert.deepStrictEqual([...csv], [{id: "a", value: 1}]);
  assert.deepStrictEqual(csv.columns, ["id", "value"]);
  const tsv = parsePayload("a.tsv", "id\tvalue\na\ttrue");
  assert.deepStrictEqual([...tsv], [{id: "a", value: true}]);
  assert.strictEqual(parsePayload("a.txt", "1"), "1");
  assert.deepStrictEqual(parsePayload("a.json", '[{"v":"2"}]'), [{v: 2}]);
  assert.deepStrictEqual(
    parsePayload("a", '{"headers":["id"],"data":[["x"],["1"]]}'),
    [{id: "x"}, {id: 1}],
  );
  assert.throws(() => parsePayload("a.json", "{"));
});

it("request: concurrent requests for a key share one fetch, each with its own copy", async () => {
  const requests = stubFetch();
  const cache = memoryCache();
  const [[, edges], [, vertices], [, again]] = await Promise.all([
    get("graph.json", cache),
    get("graph.json", cache),
    get("graph.json", cache),
  ]);
  assert.deepStrictEqual(requests, {"graph.json": 1});
  assert.deepStrictEqual(edges, vertices);
  assert.deepStrictEqual(edges, again);
  assert.notStrictEqual(edges, vertices);
  assert.notStrictEqual(edges.vertices[0], vertices.vertices[0]);
  assert.strictEqual(vertices.vertices[0].x, "0", "nested JSON is not coerced");
  assert.strictEqual(
    cache.map.get(cacheKey("graph.json")),
    files["graph.json"],
  );
});

it("request: a receiver changing its payload leaves the others' copies intact", async () => {
  stubFetch();
  const cache = memoryCache();
  const seen = [];
  await Promise.all(
    [0, 1].map(
      i =>
        new Promise(resolve =>
          request("rows.csv", cache, (e, rows) => {
            seen[i] = rows.map(d => ({...d}));
            rows.forEach(d => (d.value *= 10));
            rows.push({id: "z"});
            resolve();
          }),
        ),
    ),
  );
  assert.deepStrictEqual(seen[0], seen[1]);
  assert.deepStrictEqual(seen[1], [
    {id: "a", value: 1, flag: true},
    {id: "b", value: 2, flag: "no"},
  ]);
  let cached;
  request("rows.csv", cache, (e, rows) => (cached = rows));
  assert.deepStrictEqual([...cached], seen[0], "the cache is intact too");
});

it("request: a cached response is parsed at once, a fresh copy each time", async () => {
  const requests = stubFetch();
  const cache = memoryCache();
  await get("rows.csv", cache);
  let first;
  request("rows.csv", cache, (e, rows) => (first = rows));
  assert.ok(first, "calls back synchronously");
  first[0].value = 99;
  let second;
  request("rows.csv", cache, (e, rows) => (second = rows));
  assert.strictEqual(second[0].value, 1);
  assert.deepStrictEqual(requests, {"rows.csv": 1});
});

it("request: without a cache every request fetches", async () => {
  const requests = stubFetch();
  await Promise.all([get("rows.csv"), get("rows.csv")]);
  await get("rows.csv");
  assert.deepStrictEqual(requests, {"rows.csv": 3});
});

it("request: a failure reaches every waiting receiver and is not cached", async () => {
  const requests = stubFetch();
  const cache = memoryCache();
  const results = await Promise.all([
    get("missing.json", cache),
    get("missing.json", cache),
  ]);
  assert.deepStrictEqual(requests, {"missing.json": 1});
  for (const [error, payload] of results) {
    assert.ok(error instanceof Error);
    assert.strictEqual(error.message, "404 ");
    assert.strictEqual(payload, undefined);
  }
  assert.strictEqual(cache.map.size, 0);
  await get("missing.json", cache);
  assert.deepStrictEqual(requests, {"missing.json": 2}, "retries");
});

it("request: a receiver that throws gets the error; the others are unaffected", async () => {
  stubFetch();
  const cache = memoryCache();
  const calls = [];
  const thrower = new Promise(resolve =>
    request("rows.csv", cache, error => {
      calls.push(error ? "error" : "data");
      if (!error) throw new Error("formatter failed");
      resolve(error);
    }),
  );
  const [error, rows] = await get("rows.csv", cache);
  const thrown = await thrower;
  assert.strictEqual(thrown.message, "formatter failed");
  assert.deepStrictEqual(calls, ["data", "error"]);
  assert.strictEqual(error, undefined);
  assert.strictEqual(rows.length, 2);
});
