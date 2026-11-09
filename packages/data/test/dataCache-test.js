import {afterEach, it, vi} from "vitest";
import assert from "assert";
import load from "../src/load.ts";
import cacheKey from "../src/cacheKey.ts";
import clearDataCache, {
  DATA_CACHE_LIMIT,
  SizedCache,
  inFlightFor,
  isCurrent,
  sharedCache,
} from "../src/dataCache.ts";
import {clearDataCache as exported} from "../index.ts";

const files = {
  "rows.json": JSON.stringify([
    {id: "a", value: 1},
    {id: "b", value: 2},
  ]),
};

/**
 * Stubs `fetch` to serve `files` by name, counting requests per URL. While
 * `server.hold` is set, each response waits for `server.release()`, which
 * lets the oldest held one through.
 */
function serve() {
  const held = [];
  const server = {requests: {}, hold: false, failing: new Set()};
  server.release = () => held.shift()?.();
  vi.stubGlobal("fetch", async url => {
    server.requests[url] = (server.requests[url] || 0) + 1;
    if (server.hold) await new Promise(r => held.push(r));
    if (server.failing.has(url) || files[url] === undefined)
      return new Response("down", {status: 500});
    return new Response(files[url], {status: 200});
  });
  return server;
}

/** A chart-like context that caches through the shared cache. */
const chart = (cache = true) => ({
  _data: [],
  schema: {cache},
  config() {},
});

/** Loads `path` into `ctx`, resolving with the callback's `[error, data]`. */
const run = (ctx, path, formatter) =>
  new Promise(resolve =>
    load.call(ctx, path, formatter, "data", (error, data) =>
      resolve([error, data]),
    ),
  );

const tick = () => new Promise(r => setTimeout(r, 0));

afterEach(() => {
  clearDataCache();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("clearDataCache is exported from the package", () => {
  assert.strictEqual(exported, clearDataCache);
});

it("SizedCache: evicts the least recently used text past its limit", () => {
  const cache = new SizedCache(10);
  cache.set("a", "1234");
  cache.set("b", "1234");
  assert.strictEqual(cache.size, 8);
  assert.strictEqual(cache.get("a"), "1234", "reading marks a as recent");
  cache.set("c", "1234");
  assert.deepStrictEqual(cache.keys(), ["a", "c"]);
  assert.strictEqual(cache.size, 8);
  assert.strictEqual(cache.get("b"), undefined);
  cache.set("d", "123456789");
  assert.deepStrictEqual(cache.keys(), ["d"], "drops as many as it needs");
  assert.strictEqual(cache.size, 9);
});

it("SizedCache: replacing an entry counts only its new text", () => {
  const cache = new SizedCache(10);
  cache.set("a", "123456");
  cache.set("a", "12");
  assert.strictEqual(cache.size, 2);
  cache.set("b", "12345678");
  assert.deepStrictEqual(cache.keys(), ["a", "b"]);
});

it("SizedCache: text longer than the limit is not kept, and clear empties it", () => {
  const cache = new SizedCache(4);
  cache.set("a", "12");
  cache.set("big", "12345");
  assert.deepStrictEqual(cache.keys(), ["a"]);
  cache.set("a", "12345");
  assert.deepStrictEqual(cache.keys(), [], "an oversized update drops it");
  cache.set("b", "1");
  cache.delete("missing");
  cache.clear();
  assert.deepStrictEqual(cache.keys(), []);
  assert.strictEqual(cache.size, 0);
});

it("the shared cache holds 25M characters, about 50 MB of memory", () => {
  assert.strictEqual(sharedCache.limit, DATA_CACHE_LIMIT);
  assert.strictEqual(DATA_CACHE_LIMIT, 25 * 1024 * 1024);
});

it("inFlightFor: one set of in-flight requests per cache until cleared", () => {
  const pending = inFlightFor(sharedCache);
  assert.strictEqual(inFlightFor(sharedCache), pending);
  assert.ok(isCurrent(sharedCache, pending));
  clearDataCache();
  assert.ok(!isCurrent(sharedCache, pending));
  assert.notStrictEqual(inFlightFor(sharedCache), pending);
});

it("load: four charts loading one URL at once share one fetch, each with its own rows", async () => {
  const server = serve();
  const charts = [chart(), chart(), chart(), chart()];
  const results = await Promise.all(
    charts.map((ctx, i) =>
      run(ctx, "rows.json", rows => {
        // The first chart's formatter changes its rows in place.
        if (i === 0) rows.forEach(d => (d.value *= 100));
        return rows;
      }),
    ),
  );
  assert.deepStrictEqual(server.requests, {"rows.json": 1});
  assert.deepStrictEqual(
    results.map(([, rows]) => rows.map(d => d.value)),
    [
      [100, 200],
      [1, 2],
      [1, 2],
      [1, 2],
    ],
  );
  const rows = results.map(([, r]) => r);
  for (let i = 1; i < rows.length; i++) {
    assert.notStrictEqual(rows[i], rows[0]);
    assert.notStrictEqual(rows[i][0], rows[0][0]);
  }
  assert.strictEqual(
    sharedCache.get(cacheKey("rows.json")),
    files["rows.json"],
  );
});

it("load: a later load from another chart is served from the cache synchronously", async () => {
  const server = serve();
  await run(chart(), "rows.json");
  let rows;
  const later = chart();
  load.call(later, "rows.json", undefined, "data", (e, data) => (rows = data));
  assert.deepStrictEqual(rows, [
    {id: "a", value: 1},
    {id: "b", value: 2},
  ]);
  assert.strictEqual(later._data, rows);
  assert.deepStrictEqual(server.requests, {"rows.json": 1});
});

it("load: cache false bypasses the shared cache and its in-flight requests", async () => {
  const server = serve();
  await Promise.all([
    run(chart(), "rows.json"),
    run(chart(false), "rows.json"),
    run(chart(false), "rows.json"),
  ]);
  assert.deepStrictEqual(server.requests, {"rows.json": 3});
  await run(chart(false), "rows.json");
  assert.deepStrictEqual(server.requests, {"rows.json": 4}, "skips the cache");
  clearDataCache();
  await run(chart(false), "rows.json");
  assert.deepStrictEqual(sharedCache.keys(), [], "and never writes it");
});

it("load: a poll (_cache false) always fetches, even with the response cached", async () => {
  const server = serve();
  await run(chart(), "rows.json");
  const poll = {...chart(), _cache: false};
  await run(poll, "rows.json");
  await run(poll, "rows.json");
  assert.deepStrictEqual(server.requests, {"rows.json": 3});
});

it("load: a context's own _lrucache replaces the shared cache", async () => {
  const server = serve();
  const own = new Map();
  await run({...chart(), _lrucache: own}, "rows.json");
  assert.deepStrictEqual([...own.keys()], [cacheKey("rows.json")]);
  assert.deepStrictEqual(sharedCache.keys(), []);
  await run(chart(), "rows.json");
  assert.deepStrictEqual(server.requests, {"rows.json": 2});
});

it("clearDataCache: empties the cache, so the next load fetches again", async () => {
  const server = serve();
  await run(chart(), "rows.json");
  assert.deepStrictEqual(sharedCache.keys(), [cacheKey("rows.json")]);
  clearDataCache();
  assert.deepStrictEqual(sharedCache.keys(), []);
  assert.strictEqual(sharedCache.size, 0);
  await run(chart(), "rows.json");
  assert.deepStrictEqual(server.requests, {"rows.json": 2});
});

it("clearDataCache: requests in flight still deliver, and later loads don't join them", async () => {
  const server = serve();
  server.hold = true;
  const before = [run(chart(), "rows.json"), run(chart(), "rows.json")];
  await tick();
  clearDataCache();
  const after = run(chart(), "rows.json");
  await tick();
  assert.deepStrictEqual(server.requests, {"rows.json": 2}, "fetches anew");
  server.release();
  const delivered = await Promise.all(before);
  assert.deepStrictEqual(
    delivered.map(([error, rows]) => [error, rows.length]),
    [
      [undefined, 2],
      [undefined, 2],
    ],
  );
  // The earlier request settling leaves the later one joinable.
  const joined = run(chart(), "rows.json");
  await tick();
  assert.deepStrictEqual(server.requests, {"rows.json": 2});
  server.release();
  const [[error, rows], [joinedError, joinedRows]] = await Promise.all([
    after,
    joined,
  ]);
  assert.strictEqual(error, undefined);
  assert.strictEqual(joinedError, undefined);
  assert.notStrictEqual(rows, joinedRows);
  assert.deepStrictEqual(rows, joinedRows);
  assert.deepStrictEqual(sharedCache.keys(), [cacheKey("rows.json")]);
});

it("clearDataCache: a request from before the clear is not cached when it lands", async () => {
  const server = serve();
  server.hold = true;
  const before = run(chart(), "rows.json");
  await tick();
  clearDataCache();
  server.release();
  const [error, rows] = await before;
  assert.strictEqual(error, undefined);
  assert.deepStrictEqual(
    rows.map(d => d.id),
    ["a", "b"],
  );
  assert.deepStrictEqual(sharedCache.keys(), []);
});

it("load: a failed request reaches every waiting chart, is not cached, and is retried", async () => {
  const server = serve();
  server.failing.add("rows.json");
  const results = await Promise.all([
    run(chart(), "rows.json"),
    run(chart(), "rows.json"),
    run(chart(), "rows.json"),
  ]);
  assert.deepStrictEqual(server.requests, {"rows.json": 1});
  for (const [error, data] of results) {
    assert.ok(error instanceof Error);
    assert.strictEqual(data, undefined);
  }
  assert.deepStrictEqual(sharedCache.keys(), []);
  server.failing.clear();
  const [error, rows] = await run(chart(), "rows.json");
  assert.strictEqual(error, undefined);
  assert.strictEqual(rows.length, 2);
  assert.deepStrictEqual(server.requests, {"rows.json": 2});
});
