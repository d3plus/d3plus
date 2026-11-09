import {afterEach, it, vi} from "vitest";
import assert from "assert";
import {BarChart} from "@d3plus/core";
import {renderToStaticPNG, renderToStaticSVG} from "../index.ts";

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Stubs `fetch` to answer every request with `rows`, counting the calls. */
function serve(rows) {
  const server = {requests: 0, rows};
  vi.stubGlobal("fetch", async () => {
    server.requests++;
    return new Response(JSON.stringify(server.rows), {status: 200});
  });
  return server;
}

const bar = () =>
  new BarChart()
    .data("https://example.com/sales.json")
    .groupBy("id")
    .x("id")
    .y("value");

it("renderToStaticSVG: each render fetches its own data, never another render's", async () => {
  const server = serve([
    {id: "a", value: 1},
    {id: "b", value: 2},
  ]);
  const first = await renderToStaticSVG(bar(), {width: 400, height: 300});
  server.rows = [
    {id: "c", value: 3},
    {id: "d", value: 4},
  ];
  const second = await renderToStaticSVG(bar(), {width: 400, height: 300});
  assert.strictEqual(server.requests, 2);
  assert.ok(first.includes(">a<"), "draws a");
  assert.ok(second.includes(">c<"), "draws c");
  assert.ok(!second.includes(">a<"), "not the first render's data");
});

it("renderToStaticPNG: each render fetches its own data", async () => {
  const server = serve([{id: "a", value: 1}]);
  await renderToStaticPNG(bar(), {width: 200, height: 150});
  await renderToStaticPNG(bar(), {width: 200, height: 150});
  assert.strictEqual(server.requests, 2);
});
