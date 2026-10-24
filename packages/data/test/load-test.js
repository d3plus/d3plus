import {afterEach, it, vi} from "vitest";
import assert from "assert";
import {default as load} from "../src/load.ts";

const files = {
  "rows.json": JSON.stringify([
    {id: "a", value: "5", flag: "true", off: "FALSE", name: "alpha"},
  ]),
  "more.json": JSON.stringify([{id: "b", value: 7}]),
  "folded.json": JSON.stringify({
    headers: ["id", "value"],
    data: [
      ["a", 1],
      ["b", 2],
    ],
  }),
  "rows.csv": "id,value\na,1\nb,2",
  "rows.tsv": "id\tvalue\na\t3",
  "note.txt": "plain text",
};

/** Stubs `fetch` to serve `files` by name, recording each request. */
function stubFetch() {
  const requests = [];
  vi.stubGlobal("fetch", async (url, init) => {
    requests.push({url, init});
    const body = files[url];
    if (body === undefined) return new Response("missing", {status: 404});
    return new Response(body, {status: 200});
  });
  return requests;
}

/** A minimal viz context, recording `config()` calls and cache writes. */
function context(extra = {}) {
  const ctx = {
    _cache: false,
    _lrucache: {entries: [], set: (k, v) => ctx._lrucache.entries.push([k, v])},
    configs: [],
    config: obj => ctx.configs.push(obj),
    ...extra,
  };
  return ctx;
}

/** Runs `load` and resolves with the callback's `[error, data]`. */
function run(ctx, path, formatter, key) {
  return new Promise(resolve =>
    load.call(ctx, path, formatter, key, (error, data) =>
      resolve([error, data]),
    ),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("load: an array of rows returns at once and stores it on the context", async () => {
  const rows = [{id: "a", value: 1}];
  const ctx = context({_data: []});
  const [error, data] = await run(ctx, rows, undefined, "data");
  assert.strictEqual(error, null);
  assert.deepStrictEqual(data, rows);
  assert.deepStrictEqual(ctx._data, rows);
});

it("load: a JSON URL is fetched and its strings coerced to numbers and booleans", async () => {
  const requests = stubFetch();
  const ctx = context({_data: []});
  const [error, data] = await run(ctx, "rows.json", undefined, "data");
  assert.strictEqual(error, undefined);
  assert.deepStrictEqual(data, [
    {id: "a", value: 5, flag: true, off: false, name: "alpha"},
  ]);
  assert.deepStrictEqual(ctx._data, data);
  assert.deepStrictEqual(
    requests.map(r => r.url),
    ["rows.json"],
  );
});

it("load: CSV, TSV, and TXT files parse by extension", async () => {
  stubFetch();
  const [, csv] = await run(context(), "rows.csv");
  assert.deepStrictEqual(
    csv.map(d => ({...d})),
    [
      {id: "a", value: 1},
      {id: "b", value: 2},
    ],
  );
  const [, tsv] = await run(context(), "rows.tsv");
  assert.deepStrictEqual(
    tsv.map(d => ({...d})),
    [{id: "a", value: 3}],
  );
  const [, txt] = await run(context(), "note.txt");
  assert.strictEqual(txt, "plain text");
});

it("load: a request object passes its fetch options through", async () => {
  const requests = stubFetch();
  const request = {url: "rows.json", headers: {Authorization: "token"}};
  const [, data] = await run(context(), request);
  assert.strictEqual(data.length, 1);
  assert.strictEqual(requests[0].url, "rows.json");
  assert.deepStrictEqual(requests[0].init.headers, {Authorization: "token"});
});

it("load: a {headers, data} response is folded into rows", async () => {
  stubFetch();
  const [, data] = await run(context(), "folded.json");
  assert.deepStrictEqual(data, [
    {id: "a", value: 1},
    {id: "b", value: 2},
  ]);
});

it("load: URLs mixed with arrays concatenate for the data key", async () => {
  stubFetch();
  const ctx = context({_data: []});
  const [, data] = await run(
    ctx,
    ["rows.json", [{id: "c", value: 9}], "more.json"],
    undefined,
    "data",
  );
  assert.deepStrictEqual(data.map(d => d.id).sort(), ["a", "b", "c"]);
  assert.deepStrictEqual(ctx._data, data);
});

it("load: several URLs for another key stay nested, one array each", async () => {
  stubFetch();
  const ctx = context({schema: {}});
  const [, data] = await run(
    ctx,
    ["rows.json", "more.json"],
    undefined,
    "links",
  );
  assert.strictEqual(data.length, 2);
  assert.deepStrictEqual(data.map(rows => rows[0].id).sort(), ["a", "b"]);
  assert.deepStrictEqual(ctx.schema.links, data, "stored on the schema");
});

it("load: a formatter's array result becomes the data", async () => {
  stubFetch();
  const [, data] = await run(
    context({_data: []}),
    "rows.json",
    rows => rows.map(d => ({...d, value: d.value * 2})),
    "data",
  );
  assert.strictEqual(data[0].value, 10);
});

it("load: a formatter's object result supplies data and configures the viz", async () => {
  stubFetch();
  const ctx = context({_data: []});
  const [, data] = await run(
    ctx,
    "rows.json",
    rows => ({data: rows, title: "Loaded"}),
    "data",
  );
  assert.strictEqual(data.length, 1);
  assert.deepStrictEqual(ctx.configs, [{title: "Loaded"}]);
});

it("load: formatters also run on arrays that need no fetch", async () => {
  const ctx = context({_data: []});
  const [, data] = await run(
    ctx,
    [{id: "a"}],
    () => ({data: [{id: "z"}], legend: false}),
    "data",
  );
  assert.deepStrictEqual(data, [{id: "z"}]);
  assert.deepStrictEqual(ctx.configs, [{legend: false}]);
});

it("load: with caching on, the loaded result is cached by key and URL", async () => {
  stubFetch();
  const ctx = context({_cache: true, _data: []});
  await run(ctx, "rows.json", undefined, "data");
  assert.deepStrictEqual(
    ctx._lrucache.entries.map(([k]) => k),
    ["data_rows.json"],
  );
});

it("load: a failed fetch logs the error and hands it to the callback", async () => {
  stubFetch();
  const logged = vi.spyOn(console, "error").mockImplementation(() => {});
  const [error, data] = await run(context(), "missing.json");
  assert.ok(error instanceof Error);
  assert.strictEqual(data, undefined);
  assert.strictEqual(logged.mock.calls.length, 1);
});
