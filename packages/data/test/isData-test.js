import {it} from "vitest";
import assert from "assert";
import {default as isData} from "../src/isData.ts";
import {default as addToQueue} from "../src/addToQueue.ts";

it("isData", () => {
  assert.strictEqual(isData("data.json"), true, "URL string");
  assert.strictEqual(isData({url: "data.json"}), true, "url only");
  assert.strictEqual(
    isData({url: "data.json", headers: {Authorization: "token"}}),
    true,
    "url and headers",
  );
  assert.strictEqual(
    isData({url: "data.json", method: "POST", body: "{}", mode: "cors"}),
    true,
    "url and fetch options",
  );

  assert.strictEqual(
    isData({id: "alpha", url: "https://example.com"}),
    false,
    "data row with a url field",
  );
  assert.strictEqual(
    isData({url: "https://example.com", value: 10}),
    false,
    "url and a data key",
  );
  assert.strictEqual(isData({url: 12}), false, "non-string url");
  assert.strictEqual(isData({headers: {}}), false, "no url");
  assert.strictEqual(isData([{url: "data.json"}]), false, "array");
  assert.strictEqual(isData(null), false, "null");
  assert.strictEqual(isData(undefined), false, "undefined");
  assert.strictEqual(isData(42), false, "number");
});

it("addToQueue keeps data rows with a url field as data", () => {
  const rows = [
    {id: "alpha", value: 29, url: "https://example.com/alpha"},
    {id: "beta", value: 10, url: "https://example.com/beta"},
  ];
  const ctx = {_queue: [], _data: []};
  addToQueue.call(ctx, rows, undefined, "data");
  assert.strictEqual(ctx._queue.length, 0, "nothing queued");
  assert.strictEqual(ctx._data, rows, "rows stored as data");

  const request = {url: "data.json", headers: {Authorization: "token"}};
  addToQueue.call(ctx, request, undefined, "data");
  assert.strictEqual(ctx._queue.length, 1, "request queued");
  assert.deepStrictEqual(ctx._queue[0][1], [request], "queued paths");
});
