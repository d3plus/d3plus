import {afterEach, it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

const URL = "/__d3plus-poll/data.json";
const BODY = '<div id="c" style="width:400px;height:300px"></div>';

/**
 * Serves `URL` from a stubbed `fetch`: `server.rows` is the response body,
 * `server.fail` answers 500, and `server.requests` counts the calls.
 */
function serve(rows) {
  const original = window.fetch;
  const server = {rows, fail: false, requests: 0, inits: []};
  window.fetch = async (url, init) => {
    if (!String(url).endsWith(URL)) return original(url, init);
    server.requests++;
    server.inits.push(init);
    if (server.fail) return new Response("down", {status: 500});
    return new Response(JSON.stringify(server.rows), {status: 200});
  };
  server.restore = () => (window.fetch = original);
  return server;
}

let cleanup = [];
afterEach(() => {
  cleanup.forEach(f => f());
  cleanup = [];
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

/** Waits until `test()` is truthy (or fails after `timeout` ms). */
async function until(test, timeout = 4000) {
  const end = Date.now() + timeout;
  while (!test()) {
    if (Date.now() > end) throw new Error("timed out waiting");
    await sleep(20);
  }
}

const rows = (a, b) => [
  {id: "a", value: a},
  {id: "b", value: b},
];

/**
 * Draws a BarChart polling `URL` every 120ms, counting its renders, and
 * resolves once the first load has drawn.
 */
async function draw(server, configure = v => v) {
  const viz = configure(
    new window.d3plus.BarChart()
      .select("#c")
      .renderer(window.__renderer)
      .data(URL)
      .groupBy("id")
      .x("id")
      .y("value")
      .duration(0)
      .dataPollingInterval(120),
  );
  cleanup.push(() => viz.destroy(), server.restore);
  await new Promise(resolve => viz.render(resolve));
  viz.renders = 0;
  const original = viz.render.bind(viz);
  viz.render = cb => (viz.renders++, original(cb));
  return viz;
}

/** The drawn value of each bar. */
const values = viz =>
  Object.fromEntries(viz._filteredData.map(d => [d.id, d.value]));

for (const renderer of ["svg", "canvas"]) {
  window.__renderer = renderer;

  it(`data polling (${renderer}): re-fetches and redraws when the data changes`, async () => {
    window.__renderer = renderer;
    const out = await render(BODY, async () => {
      const server = serve(rows(1, 2));
      const viz = await draw(server);
      const first = values(viz);
      const barB = () => document.querySelector('#c rect[data-key="b_b"]');
      const nodeBefore = barB();
      server.rows = rows(1, 9);
      await until(() => values(viz).b === 9);
      return {
        first,
        next: values(viz),
        renders: viz.renders,
        cache: server.inits.slice(1).map(i => i.cache),
        sameNode:
          renderer === "svg" ? !!nodeBefore && barB() === nodeBefore : true,
      };
    });
    assert.deepStrictEqual(out.first, {a: 1, b: 2});
    assert.deepStrictEqual(out.next, {a: 1, b: 9});
    assert.ok(out.renders >= 1, "redrew with the new values");
    assert.ok(
      out.cache.length && out.cache.every(c => c === "no-cache"),
      "polls revalidate with the server",
    );
    assert.ok(out.sameNode, "the bar updates in place rather than re-entering");
  });

  it(`data polling (${renderer}): an identical response skips the redraw`, async () => {
    window.__renderer = renderer;
    const out = await render(BODY, async () => {
      const server = serve(rows(1, 2));
      const viz = await draw(server);
      const before = server.requests;
      await until(() => server.requests >= before + 3);
      return {renders: viz.renders};
    });
    assert.strictEqual(out.renders, 0);
  });

  it(`data polling (${renderer}): a failed fetch keeps the data, warns once, and recovers`, async () => {
    window.__renderer = renderer;
    const out = await render(BODY, async () => {
      const server = serve(rows(1, 2));
      const warn = console.warn;
      const warnings = [];
      console.warn = (...args) => warnings.push(String(args[0]));
      cleanup.push(() => (console.warn = warn));
      const viz = await draw(server);
      server.fail = true;
      const before = server.requests;
      await until(() => server.requests >= before + 3);
      const during = {values: values(viz), renders: viz.renders};
      server.fail = false;
      server.rows = rows(5, 6);
      await until(() => values(viz).a === 5);
      return {during, warnings};
    });
    assert.deepStrictEqual(out.during, {values: {a: 1, b: 2}, renders: 0});
    assert.strictEqual(
      out.warnings.filter(w => /dataPollingInterval/.test(w)).length,
      1,
    );
  });

  it(`data polling (${renderer}): pauses while the tab is hidden and catches up on return`, async () => {
    window.__renderer = renderer;
    const out = await render(BODY, async () => {
      let state = "visible";
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => state,
      });
      cleanup.push(() => delete document.visibilityState);
      const server = serve(rows(1, 2));
      const viz = await draw(server);
      state = "hidden";
      document.dispatchEvent(new Event("visibilitychange"));
      await sleep(150);
      const hiddenAt = server.requests;
      server.rows = rows(3, 4);
      await sleep(600);
      const whileHidden = server.requests - hiddenAt;
      const hiddenValues = values(viz);
      state = "visible";
      document.dispatchEvent(new Event("visibilitychange"));
      await sleep(0);
      const onReturn = server.requests - hiddenAt;
      await until(() => values(viz).a === 3);
      return {whileHidden, hiddenValues, onReturn};
    });
    assert.ok(
      out.whileHidden <= 1,
      `no polls while hidden (${out.whileHidden})`,
    );
    assert.deepStrictEqual(out.hiddenValues, {a: 1, b: 2});
    assert.strictEqual(
      out.onReturn,
      out.whileHidden + 1,
      "fetches at once when the tab returns",
    );
  });

  it(`data polling (${renderer}): pauses while detectVisible sees the chart off-screen`, async () => {
    window.__renderer = renderer;
    const out = await render(
      `<div id="spacer"></div>${BODY}<div style="height:3000px"></div>`,
      async () => {
        const server = serve(rows(1, 2));
        const viz = await draw(server);
        document.getElementById("spacer").style.height = "4000px";
        await sleep(250);
        const offAt = server.requests;
        server.rows = rows(7, 8);
        await sleep(600);
        const whileOff = server.requests - offAt;
        const offValues = values(viz);
        document.getElementById("spacer").style.height = "0px";
        await until(() => values(viz).a === 7);
        return {whileOff, offValues};
      },
    );
    assert.ok(out.whileOff <= 1, `no polls while off-screen (${out.whileOff})`);
    assert.deepStrictEqual(out.offValues, {a: 1, b: 2});
  });

  it(`data polling (${renderer}): destroy(), dataPollingInterval(false) and row data stop it`, async () => {
    window.__renderer = renderer;
    const out = await render(BODY, async () => {
      const stopped = async (server, viz) => {
        await sleep(150);
        const at = server.requests;
        await sleep(400);
        return server.requests === at && !viz._dataPollStop;
      };
      const result = {};

      let server = serve(rows(1, 2));
      let viz = await draw(server);
      viz.destroy();
      result.destroy = await stopped(server, viz);
      server.restore();

      server = serve(rows(1, 2));
      viz = await draw(server);
      viz.dataPollingInterval(false);
      result.off = await stopped(server, viz);
      viz.dataPollingInterval(120);
      const at = server.requests;
      await until(() => server.requests > at);
      result.restarted = !!viz._dataPollStop;
      viz.destroy();
      server.restore();

      server = serve(rows(1, 2));
      viz = await draw(server);
      viz.data(rows(4, 4));
      result.rowsBeforeRender = await stopped(server, viz);
      await new Promise(r => viz.render(r));
      result.rows = await stopped(server, viz);
      result.rowValues = values(viz);
      return result;
    });
    assert.deepStrictEqual(out, {
      destroy: true,
      off: true,
      restarted: true,
      rowsBeforeRender: true,
      rows: true,
      rowValues: {a: 4, b: 4},
    });
  });

  it(`data polling (${renderer}): keeps legend toggles, the timeline selection and zoom`, async () => {
    window.__renderer = renderer;
    const out = await render(BODY, async () => {
      const series = (shift = 0) =>
        ["x", "y", "z"].flatMap(g =>
          [2020, 2021, 2022].map(year => ({
            g,
            year,
            value: year - 2015 + shift + g.charCodeAt(0),
          })),
        );
      const server = serve(series());
      const viz = await draw(server, v =>
        v
          .groupBy("g")
          .x("year")
          .time("year")
          .zoom(true)
          .stacked(true)
          .legend(true),
      );
      // A legend click hides "y"; the timeline brush picks 2020–2021.
      viz._hidden = ["y"];
      viz.timeFilter(d => d.year <= 2021).render();
      viz._timelineSelection = [new Date(2020, 0, 1), new Date(2021, 0, 1)];
      await sleep(100);
      document.querySelector("#c .zoom-in")?.click();
      await sleep(400);
      const zoomNode = () => (viz._zoomEventTarget || viz._container).node();
      const k = zoomNode().__zoom.k;
      viz.renders = 0;
      server.rows = series(100);
      await until(() => viz.renders > 0);
      await sleep(100);
      return {
        k,
        kAfter: zoomNode().__zoom.k,
        hidden: viz._hidden,
        groups: [...new Set(viz._filteredData.map(d => d.g))].sort(),
        years: [...new Set(viz._filteredData.map(d => d.year))].sort(),
        selection: viz._timelineSelection.map(d => new Date(d).getFullYear()),
        shifted: viz._filteredData.every(d => d.value > 100),
      };
    });
    assert.ok(out.k > 1, `zoomed in before the poll (${out.k})`);
    assert.strictEqual(out.kAfter, out.k, "the zoom survives the poll");
    assert.deepStrictEqual(out.hidden, ["y"]);
    assert.deepStrictEqual(out.groups, ["x", "z"]);
    assert.deepStrictEqual(out.years, [2020, 2021]);
    assert.deepStrictEqual(out.selection, [2020, 2021]);
    assert.ok(out.shifted, "the new values are drawn");
  });
}

it("data polling: an untouched timeline follows a new latest period", async () => {
  window.__renderer = "svg";
  const out = await render(BODY, async () => {
    const yearRows = years =>
      years.map(year => ({id: "a", year, value: year - 2000}));
    const server = serve(yearRows([2020, 2021]));
    const viz = await draw(server, v => v.time("year"));
    const before = viz._timelineSelection.map(d => new Date(d).getFullYear());
    server.rows = yearRows([2020, 2021, 2022]);
    await until(() => viz._filteredData.some(d => d.year === 2022));
    return {
      before,
      after: viz._timelineSelection.map(d => new Date(d).getFullYear()),
    };
  });
  assert.deepStrictEqual(out.before, [2021, 2021]);
  assert.deepStrictEqual(out.after, [2022, 2022]);
});

it("data polling: a formatter runs on every poll and may return config", async () => {
  window.__renderer = "svg";
  const out = await render(BODY, async () => {
    const server = serve({results: rows(1, 2), title: "First"});
    const viz = await draw(server, v =>
      v.data(URL, json => ({data: json.results, title: json.title})),
    );
    const first = viz.title()();
    server.rows = {results: rows(3, 4), title: "Second"};
    await until(() => values(viz).a === 3);
    return {first, second: viz.title()(), values: values(viz)};
  });
  assert.deepStrictEqual(out, {
    first: "First",
    second: "Second",
    values: {a: 3, b: 4},
  });
});

it("data polling: re-applying the same config does not stack pollers", async () => {
  window.__renderer = "svg";
  const out = await render(BODY, async () => {
    const server = serve(rows(1, 2));
    const viz = await draw(server);
    for (let i = 0; i < 3; i++) {
      viz.config({data: URL, title: `Render ${i}`});
      await new Promise(r => viz.render(r));
    }
    await sleep(150);
    const at = server.requests;
    await sleep(600);
    return {polls: server.requests - at};
  });
  // One poller at a 120ms cadence makes about five requests in 600ms.
  assert.ok(out.polls >= 3 && out.polls <= 6, `${out.polls} polls`);
});

for (const renderer of ["svg", "canvas"]) {
  it(`data polling (${renderer}): keeps hover, active, search, the table view and an open download menu`, async () => {
    window.__renderer = renderer;
    const out = await render(BODY, async () => {
      const server = serve(rows(1, 2));
      const viz = await draw(server, v =>
        v
          .search(true)
          .saveControl(true)
          .saveControlConfig({formats: ["png", "svg"]}),
      );
      const q = s =>
        document.querySelector(`#c ${s}`) || document.querySelector(s);
      q(".search-toggle").click();
      const input = q(".search-input");
      input.value = "b";
      input.dispatchEvent(new Event("input", {bubbles: true}));
      await sleep(100);
      q(".save-toggle").click();
      viz.hover(d => d.id === "a");
      viz.active(d => d.id === "b");
      await sleep(50);
      const state = () => ({
        hover: viz._filteredData.map((d, i) => viz._hover(d, i)),
        active: viz._filteredData.map((d, i) => viz._active(d, i)),
        searchOpen: !!viz._searchOpen,
        searchTerm: viz._searchTerm,
        searchInput: q(".search-input")?.value,
        menu: q(".save-toggle")?.getAttribute("aria-expanded"),
      });
      const before = state();
      viz.renders = 0;
      server.rows = rows(3, 4);
      await until(() => values(viz).a === 3);
      await sleep(100);
      const after = state();

      // The table view replaces the chart, so it is checked on its own.
      q(".table-view-toggle").click();
      await sleep(100);
      const tableBefore = !!q(".d3plus-table-view-table");
      server.rows = rows(5, 6);
      await until(() => values(viz).a === 5);
      await sleep(100);
      const tableAfter = !!q(".d3plus-table-view-table");
      const cells = [
        ...document.querySelectorAll(".d3plus-table-view-cell"),
      ].map(c => c.textContent);
      return {before, after, tableBefore, tableAfter, cells};
    });
    assert.deepStrictEqual(out.after, out.before);
    assert.deepStrictEqual(out.before, {
      hover: [true, false],
      active: [false, true],
      searchOpen: true,
      searchTerm: "b",
      searchInput: "b",
      menu: "true",
    });
    assert.ok(out.tableBefore && out.tableAfter, "the table view stays open");
    assert.ok(
      out.cells.includes("6"),
      `the table shows the new rows (${out.cells})`,
    );
  });

  it(`data polling (${renderer}): keeps a drilled-down depth and its Back history`, async () => {
    window.__renderer = renderer;
    const out = await render(BODY, async () => {
      const nested = shift => [
        {parent: "p", id: "a", value: 1 + shift},
        {parent: "p", id: "b", value: 2 + shift},
        {parent: "q", id: "c", value: 3 + shift},
      ];
      const server = serve(nested(0));
      const viz = new window.d3plus.Treemap()
        .select("#c")
        .renderer(renderer)
        .data(URL)
        .groupBy(["parent", "id"])
        .sum("value")
        .duration(0)
        .dataPollingInterval(120);
      cleanup.push(() => viz.destroy(), server.restore);
      await new Promise(r => viz.render(r));
      // What a click on group "p" does.
      viz._history.push({depth: 0, filter: viz.schema.filter});
      viz
        .depth(1)
        .filter(d => d.parent === "p")
        .render();
      await sleep(100);
      const state = () => ({
        depth: viz.depth(),
        history: viz._history.length,
        ids: viz._filteredData.map(d => d.id).sort(),
      });
      const before = state();
      server.rows = nested(10);
      await until(() => viz._filteredData.some(d => d.value > 10));
      return {before, after: state()};
    });
    assert.deepStrictEqual(out.before, {depth: 1, history: 1, ids: ["a", "b"]});
    assert.deepStrictEqual(out.after, out.before);
  });
}
