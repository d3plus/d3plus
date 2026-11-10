import {afterEach, it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

const BODY = '<div id="c" style="width:400px;height:300px"></div>';

let cleanup = [];
afterEach(() => {
  cleanup.forEach(f => f());
  cleanup = [];
});

/**
 * Serves each path in `routes` from a stubbed `fetch`, as JSON. A path listed
 * in `server.failing` answers 500. `server.requests[path]` counts the calls
 * and `server.headers` records each request's headers.
 */
function serve(routes) {
  const original = window.fetch;
  const server = {routes, failing: new Set(), requests: {}, headers: []};
  window.fetch = async (url, init = {}) => {
    const path = Object.keys(server.routes).find(p => String(url).endsWith(p));
    if (!path) return original(url, init);
    server.requests[path] = (server.requests[path] || 0) + 1;
    server.headers.push(init.headers);
    if (server.failing.has(path)) return new Response("down", {status: 500});
    return new Response(JSON.stringify(server.routes[path]), {status: 200});
  };
  cleanup.push(() => (window.fetch = original));
  return server;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

/** Waits until `test()` is truthy (or fails after `timeout` ms). */
async function until(test, timeout = 4000) {
  const end = Date.now() + timeout;
  while (!test()) {
    if (Date.now() > end) throw new Error("timed out waiting");
    await sleep(20);
  }
}

/** Renders `viz`, resolving once it has drawn. */
const draw = viz => new Promise(resolve => viz.render(resolve));

/** The drawn value of each bar. */
const values = viz =>
  Object.fromEntries(viz._filteredData.map(d => [d.id, d.value]));

/** A BarChart of `id` against `value`. */
const bar = () => {
  const viz = new window.d3plus.BarChart()
    .select("#c")
    .renderer(window.__renderer)
    .groupBy("id")
    .x("id")
    .y("value")
    .duration(0);
  cleanup.push(() => viz.destroy());
  return viz;
};

const rows = (a, b) => [
  {id: "a", value: a},
  {id: "b", value: b},
];

for (const renderer of ["svg", "canvas"]) {
  it(`data cache (${renderer}): a re-render or the same URL again makes no request`, async () => {
    window.__renderer = renderer;
    const out = await render(BODY, async () => {
      const server = serve({"/__cache/a.json": rows(1, 2)});
      const viz = bar().data("/__cache/a.json");
      await draw(viz);
      await draw(viz);
      viz.data("/__cache/a.json");
      await draw(viz);
      viz.config({data: "/__cache/a.json", title: "Again"});
      await draw(viz);
      return {
        requests: server.requests["/__cache/a.json"],
        values: values(viz),
      };
    });
    assert.deepStrictEqual(out, {requests: 1, values: {a: 1, b: 2}});
  });
}

it("data cache: a new dataFormat re-formats the cached response", async () => {
  window.__renderer = "svg";
  const out = await render(BODY, async () => {
    const server = serve({
      "/__cache/b.json": {north: rows(1, 2), south: rows(3, 4)},
    });
    const viz = bar().data("/__cache/b.json", json => json.north);
    await draw(viz);
    const first = values(viz);
    viz.dataFormat(json => json.south);
    await draw(viz);
    const second = values(viz);
    viz.dataFormat(json => json.north);
    await draw(viz);
    return {
      first,
      second,
      third: values(viz),
      requests: server.requests["/__cache/b.json"],
    };
  });
  assert.deepStrictEqual(out, {
    first: {a: 1, b: 2},
    second: {a: 3, b: 4},
    third: {a: 1, b: 2},
    requests: 1,
  });
});

it("data cache: a formatter that changes its rows leaves the cache intact", async () => {
  window.__renderer = "svg";
  const out = await render(BODY, async () => {
    serve({"/__cache/m.json": rows(1, 2)});
    const viz = bar().config({
      data: "/__cache/m.json",
      dataFormat: data => (data.forEach(d => (d.value *= 10)), data),
    });
    await draw(viz);
    const first = values(viz);
    viz.data("/__cache/m.json");
    await draw(viz);
    return {first, second: values(viz)};
  });
  assert.deepStrictEqual(out, {
    first: {a: 10, b: 20},
    second: {a: 10, b: 20},
  });
});

it("data cache: cache(false) fetches on every load", async () => {
  window.__renderer = "svg";
  const out = await render(BODY, async () => {
    const server = serve({"/__cache/c.json": {north: rows(1, 2)}});
    const viz = bar()
      .cache(false)
      .data("/__cache/c.json", json => json.north);
    await draw(viz);
    viz.data("/__cache/c.json");
    await draw(viz);
    viz.dataFormat(json => json.north.slice(0, 1));
    await draw(viz);
    return {requests: server.requests["/__cache/c.json"], values: values(viz)};
  });
  assert.deepStrictEqual(out, {requests: 3, values: {a: 1}});
});

it("data cache: a request object is keyed by its fetch options", async () => {
  window.__renderer = "svg";
  const out = await render(BODY, async () => {
    const server = serve({"/__cache/h.json": rows(1, 2)});
    const one = {url: "/__cache/h.json", headers: {Token: "one"}};
    const viz = bar().data(one);
    await draw(viz);
    viz.data({url: "/__cache/h.json", headers: {Token: "one"}});
    await draw(viz);
    viz.data({url: "/__cache/h.json", headers: {Token: "two"}});
    await draw(viz);
    return {
      requests: server.requests["/__cache/h.json"],
      tokens: server.headers.map(h => h.Token),
    };
  });
  assert.deepStrictEqual(out, {requests: 2, tokens: ["one", "two"]});
});

it("data cache: several URLs cache each response, in any order", async () => {
  window.__renderer = "svg";
  const out = await render(BODY, async () => {
    const server = serve({
      "/__cache/x.json": [{id: "a", value: 1}],
      "/__cache/y.json": [{id: "b", value: 2}],
    });
    const viz = bar().data(["/__cache/x.json", "/__cache/y.json"]);
    await draw(viz);
    const first = values(viz);
    viz.data(["/__cache/x.json", "/__cache/y.json"]);
    await draw(viz);
    const second = values(viz);
    viz.data(["/__cache/y.json", "/__cache/x.json"]);
    await draw(viz);
    return {first, second, third: values(viz), requests: server.requests};
  });
  assert.deepStrictEqual(out, {
    first: {a: 1, b: 2},
    second: {a: 1, b: 2},
    third: {a: 1, b: 2},
    requests: {"/__cache/x.json": 1, "/__cache/y.json": 1},
  });
});

it("data cache: polls always fetch, with the cache on", async () => {
  window.__renderer = "svg";
  const out = await render(BODY, async () => {
    const server = serve({"/__cache/p.json": rows(1, 2)});
    const viz = bar().data("/__cache/p.json").dataPollingInterval(100);
    await draw(viz);
    server.routes["/__cache/p.json"] = rows(5, 6);
    await until(() => values(viz).a === 5);
    return {polled: server.requests["/__cache/p.json"] > 1};
  });
  assert.deepStrictEqual(out, {polled: true});
});

it("data cache: a failed request is not cached, so loading it again retries", async () => {
  window.__renderer = "svg";
  const out = await render(BODY, async () => {
    const errors = [];
    const original = console.error;
    console.error = e => errors.push(String(e));
    cleanup.push(() => (console.error = original));
    const server = serve({"/__cache/f.json": rows(1, 2)});
    server.failing.add("/__cache/f.json");
    const viz = bar().data("/__cache/f.json");
    await draw(viz);
    server.failing.clear();
    viz.data("/__cache/f.json");
    await draw(viz);
    return {
      failed: errors.length > 0,
      requests: server.requests["/__cache/f.json"],
      values: values(viz),
    };
  });
  assert.deepStrictEqual(out, {
    failed: true,
    requests: 2,
    values: {a: 1, b: 2},
  });
});

for (const renderer of ["svg", "canvas"]) {
  it(`data cache (${renderer}): charts loading one URL at once share one request, each with its own rows`, async () => {
    window.__renderer = renderer;
    const out = await render(
      '<div id="c" style="width:400px;height:300px"></div><div id="d" style="width:400px;height:300px"></div>',
      async () => {
        const server = serve({"/__cache/shared.json": rows(1, 2)});
        const charts = [0, 1, 2, 3].map(i => {
          const viz = bar().select(i % 2 ? "#d" : "#c");
          // The first chart's formatter changes its rows in place.
          return i === 0
            ? viz.data("/__cache/shared.json", data => {
                data.forEach(d => (d.value *= 10));
                return data;
              })
            : viz.data("/__cache/shared.json");
        });
        await Promise.all(charts.map(draw));
        const requests = server.requests["/__cache/shared.json"];
        const later = bar().data("/__cache/shared.json");
        await draw(later);
        return {
          requests,
          laterRequests: server.requests["/__cache/shared.json"] - requests,
          values: charts.map(values),
          later: values(later),
        };
      },
    );
    assert.deepStrictEqual(out, {
      requests: 1,
      laterRequests: 0,
      values: [
        {a: 10, b: 20},
        {a: 1, b: 2},
        {a: 1, b: 2},
        {a: 1, b: 2},
      ],
      later: {a: 1, b: 2},
    });
  });
}

it("data cache: cache(false) on one chart leaves the others sharing", async () => {
  window.__renderer = "svg";
  const out = await render(BODY, async () => {
    const server = serve({"/__cache/mixed.json": rows(1, 2)});
    await Promise.all([
      draw(bar().data("/__cache/mixed.json")),
      draw(bar().data("/__cache/mixed.json")),
      draw(bar().cache(false).data("/__cache/mixed.json")),
    ]);
    const first = server.requests["/__cache/mixed.json"];
    await draw(bar().cache(false).data("/__cache/mixed.json"));
    await draw(bar().data("/__cache/mixed.json"));
    return {first, total: server.requests["/__cache/mixed.json"]};
  });
  assert.deepStrictEqual(out, {first: 2, total: 3});
});

it("data cache: clearDataCache makes the next chart fetch again", async () => {
  window.__renderer = "svg";
  const out = await render(BODY, async () => {
    const server = serve({"/__cache/clear.json": rows(1, 2)});
    await draw(bar().data("/__cache/clear.json"));
    await draw(bar().data("/__cache/clear.json"));
    const cached = server.requests["/__cache/clear.json"];
    window.d3plus.clearDataCache();
    server.routes["/__cache/clear.json"] = rows(3, 4);
    const viz = bar().data("/__cache/clear.json");
    await draw(viz);
    return {
      cached,
      total: server.requests["/__cache/clear.json"],
      values: values(viz),
    };
  });
  assert.deepStrictEqual(out, {cached: 1, total: 2, values: {a: 3, b: 4}});
});

it("data cache: links, nodes, topojson and fitObject naming one URL share its request", async () => {
  window.__renderer = "svg";
  const out = await render(BODY, async () => {
    const topology = {
      type: "Topology",
      objects: {
        shapes: {
          type: "GeometryCollection",
          geometries: [{type: "Polygon", id: "a", arcs: [[0]]}],
        },
      },
      arcs: [
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 10],
          [0, 0],
        ],
      ],
    };
    const server = serve({
      "/__cache/graph.json": {
        edges: [{source: "a", target: "b"}],
        vertices: [
          {id: "a", x: 0, y: 0},
          {id: "b", x: 1, y: 1},
        ],
      },
      "/__cache/topo.json": topology,
    });
    const network = new window.d3plus.Network()
      .select("#c")
      .duration(0)
      .links("/__cache/graph.json", json => json.edges)
      .nodes("/__cache/graph.json", json => json.vertices);
    cleanup.push(() => network.destroy());
    await draw(network);
    network.links("/__cache/graph.json").nodes("/__cache/graph.json");
    network.nodesFormat(json => json.vertices.slice(0, 2));
    await draw(network);
    const graphRequests = server.requests["/__cache/graph.json"];
    const nodes = network.nodes().map(d => d.id);

    const geomap = new window.d3plus.Geomap()
      .select("#c")
      .duration(0)
      .tiles(false)
      .topojson("/__cache/topo.json")
      .fitObject("/__cache/topo.json");
    cleanup.push(() => geomap.destroy());
    await draw(geomap);
    geomap.topojson("/__cache/topo.json").fitObject("/__cache/topo.json");
    await draw(geomap);
    return {
      graphRequests,
      nodes,
      topoRequests: server.requests["/__cache/topo.json"],
      topojson: geomap.topojson().type,
      fitObject: geomap.fitObject().type,
    };
  });
  assert.deepStrictEqual(out, {
    graphRequests: 1,
    nodes: ["a", "b"],
    topoRequests: 1,
    topojson: "Topology",
    fitObject: "Topology",
  });
});
