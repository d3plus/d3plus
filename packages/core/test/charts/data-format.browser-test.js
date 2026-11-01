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
 * Serves each path in `routes` from a stubbed `fetch`, as JSON: `routes` maps
 * a path to its response body, and `server.requests[path]` counts its calls.
 */
function serve(routes) {
  const original = window.fetch;
  const server = {routes, requests: {}};
  window.fetch = async (url, init) => {
    const path = Object.keys(server.routes).find(p => String(url).endsWith(p));
    if (!path) return original(url, init);
    server.requests[path] = (server.requests[path] || 0) + 1;
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

/** A BarChart of `id` against `value`, on the test's renderer. */
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

/** Runs `fn` with the helpers on a fresh page. */
function inPage(fn, renderer = "svg") {
  window.__renderer = renderer;
  return render(BODY, () => fn({serve, until, draw, values, bar}));
}

for (const renderer of ["svg", "canvas"]) {
  it(`dataFormat (${renderer}): config({data, dataFormat}) formats a loaded URL`, async () => {
    const out = await inPage(async ({serve, draw, values, bar}) => {
      serve({"/__fmt/a.json": {results: [{id: "a", value: 1}]}});
      const viz = bar().config({
        data: "/__fmt/a.json",
        dataFormat: json => json.results,
      });
      await draw(viz);
      return values(viz);
    }, renderer);
    assert.deepStrictEqual(out, {a: 1});
  });
}

it("dataFormat: applies whichever order it and data are set in", async () => {
  const out = await inPage(async ({serve, draw, values, bar}) => {
    serve({"/__fmt/rows.json": {results: [{id: "a", value: 1}]}});
    const fmt = json => json.results;
    const before = bar().dataFormat(fmt).data("/__fmt/rows.json");
    await draw(before);
    const after = bar().data("/__fmt/rows.json").dataFormat(fmt);
    await draw(after);
    const reversed = bar().config({dataFormat: fmt, data: "/__fmt/rows.json"});
    await draw(reversed);
    return {
      before: values(before),
      after: values(after),
      reversed: values(reversed),
      getter: after.dataFormat() === fmt,
    };
  });
  assert.deepStrictEqual(out, {
    before: {a: 1},
    after: {a: 1},
    reversed: {a: 1},
    getter: true,
  });
});

it("dataFormat: data(url, format) sets it, and data(url) alone keeps it", async () => {
  const out = await inPage(async ({serve, draw, values, bar}) => {
    serve({
      "/__fmt/one.json": {results: [{id: "a", value: 1}]},
      "/__fmt/two.json": {results: [{id: "b", value: 2}]},
    });
    const fmt = json => json.results;
    const viz = bar().data("/__fmt/one.json", fmt);
    const set = viz.dataFormat() === fmt;
    await draw(viz);
    const first = values(viz);
    viz.data("/__fmt/two.json");
    await draw(viz);
    return {set, first, second: values(viz), kept: viz.dataFormat() === fmt};
  });
  assert.deepStrictEqual(out, {
    set: true,
    first: {a: 1},
    second: {b: 2},
    kept: true,
  });
});

it("dataFormat: formats inline rows once per data(), from the rows given", async () => {
  const out = await inPage(async ({draw, values, bar}) => {
    const rows = [
      {id: "a", value: 1},
      {id: "b", value: 2},
    ];
    const double = data => data.map(d => ({...d, value: d.value * 2}));
    const viz = bar().config({data: rows, dataFormat: double});
    await draw(viz);
    const first = values(viz);
    await draw(viz);
    const redrawn = values(viz);
    // What a framework wrapper does on every prop change.
    viz.config({data: rows, dataFormat: double});
    await draw(viz);
    const reapplied = values(viz);
    viz.dataFormat(undefined);
    await draw(viz);
    return {first, redrawn, reapplied, cleared: values(viz)};
  });
  assert.deepStrictEqual(out, {
    first: {a: 2, b: 4},
    redrawn: {a: 2, b: 4},
    reapplied: {a: 2, b: 4},
    cleared: {a: 1, b: 2},
  });
});

it("dataFormat: a new formatter re-runs on the next render, re-fetching the URL", async () => {
  const out = await inPage(async ({serve, draw, values, bar}) => {
    const server = serve({
      "/__fmt/both.json": {
        north: [{id: "a", value: 1}],
        south: [{id: "b", value: 2}],
      },
    });
    const viz = bar().config({
      data: "/__fmt/both.json",
      dataFormat: json => json.north,
    });
    await draw(viz);
    const first = values(viz);
    await draw(viz);
    const unchanged = server.requests["/__fmt/both.json"];
    viz.dataFormat(json => json.south);
    await draw(viz);
    return {
      first,
      unchanged,
      second: values(viz),
      requests: server.requests["/__fmt/both.json"],
    };
  });
  assert.deepStrictEqual(out, {
    first: {a: 1},
    unchanged: 1,
    second: {b: 2},
    requests: 2,
  });
});

it("dataFormat: may return {data, ...config}, whose config is applied", async () => {
  const out = await inPage(async ({serve, draw, values, bar}) => {
    serve({
      "/__fmt/titled.json": {name: "Loaded", results: [{id: "a", value: 3}]},
    });
    const viz = bar().config({
      data: "/__fmt/titled.json",
      dataFormat: json => ({data: json.results, title: json.name}),
    });
    await draw(viz);
    return {values: values(viz), title: viz.title()()};
  });
  assert.deepStrictEqual(out, {values: {a: 3}, title: "Loaded"});
});

it("dataFormat: every poll runs it, and a new one applies to the polls", async () => {
  const out = await inPage(async ({serve, draw, values, bar, until}) => {
    const server = serve({
      "/__fmt/poll.json": {results: [{id: "a", value: 1}]},
    });
    const viz = bar().config({
      data: "/__fmt/poll.json",
      dataFormat: json => json.results,
      dataPollingInterval: 100,
    });
    await draw(viz);
    const first = values(viz);
    server.routes["/__fmt/poll.json"] = {results: [{id: "a", value: 5}]};
    await until(() => values(viz).a === 5);
    viz.dataFormat(json =>
      json.results.map(d => ({...d, value: d.value * 10})),
    );
    await draw(viz);
    server.routes["/__fmt/poll.json"] = {results: [{id: "a", value: 7}]};
    await until(() => values(viz).a === 70);
    return {first, last: values(viz)};
  });
  assert.deepStrictEqual(out, {first: {a: 1}, last: {a: 70}});
});

it("linksFormat / nodesFormat: format Network links and nodes set through config", async () => {
  const out = await inPage(async ({serve, draw}) => {
    serve({
      "/__fmt/graph.json": {
        edges: [{source: "a", target: "b"}],
        vertices: [
          {id: "a", x: 0, y: 0},
          {id: "b", x: 1, y: 1},
        ],
      },
    });
    const fmtLinks = json => json.edges;
    const fmtNodes = json => json.vertices;
    const viz = new window.d3plus.Network()
      .select("#c")
      .duration(0)
      .linksFormat(fmtLinks)
      .config({
        links: "/__fmt/graph.json",
        nodes: "/__fmt/graph.json",
        nodesFormat: fmtNodes,
      });
    await draw(viz);
    const two = new window.d3plus.Network()
      .select("#c")
      .duration(0)
      .links("/__fmt/graph.json", fmtLinks)
      .nodes("/__fmt/graph.json")
      .nodesFormat(fmtNodes);
    await draw(two);
    const summary = v => ({
      links: v
        .links()
        .map(d => `${d.source.id ?? d.source}-${d.target.id ?? d.target}`),
      nodes: v.nodes().map(d => d.id),
      getters: v.linksFormat() === fmtLinks && v.nodesFormat() === fmtNodes,
    });
    return {config: summary(viz), fluent: summary(two)};
  });
  const expected = {links: ["a-b"], nodes: ["a", "b"], getters: true};
  assert.deepStrictEqual(out, {config: expected, fluent: expected});
});

it("linksFormat / nodesFormat: format inline Sankey links and nodes", async () => {
  const out = await inPage(async ({draw}) => {
    const viz = new window.d3plus.Sankey()
      .select("#c")
      .duration(0)
      .config({
        links: {flows: [{source: "a", target: "b", value: 1}]},
        linksFormat: d => d.flows,
        nodes: {list: [{id: "a"}, {id: "b"}]},
        nodesFormat: d => d.list,
      });
    await draw(viz);
    return {links: viz.links().length, nodes: viz.nodes().map(d => d.id)};
  });
  assert.deepStrictEqual(out, {links: 1, nodes: ["a", "b"]});
});

it("topojsonFormat: formats Geomap topojson set through config", async () => {
  const out = await inPage(async ({serve, draw}) => {
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
    serve({"/__fmt/topo.json": {wrapped: topology}});
    const fmt = json => json.wrapped;
    const viz = new window.d3plus.Geomap()
      .select("#c")
      .duration(0)
      .tiles(false)
      .config({topojson: "/__fmt/topo.json", topojsonFormat: fmt});
    await draw(viz);
    return {
      type: viz.topojson().type,
      getter: viz.topojsonFormat() === fmt,
    };
  });
  assert.deepStrictEqual(out, {type: "Topology", getter: true});
});
