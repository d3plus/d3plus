import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    d3plus computes a `share` (fraction of total) for stacked Plot charts, Pie,
    and Treemap. A data field that is itself named `share` must survive: the
    chart plots and labels the user's values, while d3plus's own Share tooltip
    row and share labels keep reading d3plus's fraction.
*/
after(async () => {
  await closeBrowser();
});

/** In-page helpers, passed as source since `render` serializes its page function. */
const helpers = `
  window.renderViz = viz => new Promise(resolve => viz.render(resolve));
  window.hoverRows = (viz, row) => {
    viz.schema.on["mousemove.shape"](row, 0, row, new MouseEvent("mousemove", {clientX: 100, clientY: 100}));
    return [...document.querySelectorAll(".d3plus-tooltip-tbody tr")].map(tr =>
      [...tr.querySelectorAll("td")].map(td => td.textContent));
  };
  window.hoverLegend = (viz, d) => {
    viz.schema.on["mousemove.legend"](d, 0, d, new MouseEvent("mousemove", {clientX: 100, clientY: 100}));
    return [...document.querySelectorAll(".d3plus-tooltip-tbody tr")].map(tr =>
      [...tr.querySelectorAll("td")].map(td => td.textContent));
  };
  window.sceneDatum = (viz, id) => {
    const found = [];
    const walk = n => {
      if (!n) return;
      if (Array.isArray(n)) return n.forEach(walk);
      if (n.type !== "text" && n.datum) {
        let row = n.datum;
        while (row && row.__d3plus__ && row.data) row = row.data;
        if (row && row.id === id) found.push(n.datum);
      }
      (n.children || []).forEach(walk);
    };
    walk(viz._chartScene);
    return found[0];
  };
  window.tableHeaders = () =>
    [...document.querySelectorAll(".d3plus-table-view-table thead th")].map(th => th.textContent.trim());
  window.texts = sel => [...document.querySelectorAll(sel + " svg text")].map(t => t.textContent);
`;

const page = '<div id="s" style="width:600px;height:400px;"></div>';

it("stacked BarChart plots a data field named share as-is, with d3plus's Share row beside it", async function () {
  this.timeout(120000);

  const out = await render(page, async ({h}) => {
    new Function(h)();
    const data = [
      {id: "a", x: "A", share: 10},
      {id: "b", x: "A", share: 30},
      {id: "a", x: "B", share: 20},
      {id: "b", x: "B", share: 60},
    ];
    const viz = new window.d3plus.BarChart()
      .select("#s").duration(0).tooltipShared(false)
      .data(data).groupBy("id").x("x").y("share").stacked(true);
    await window.renderViz(viz);

    const bars = {};
    const walk = n => {
      if (!n) return;
      if (Array.isArray(n)) return n.forEach(walk);
      if (n.type === "rect" && n.shapeType === "Bar") bars[n.key] = n.height;
      (n.children || []).forEach(walk);
    };
    walk(viz._chartScene);
    const domain = viz._yAxis.domain();
    const aA = viz._filteredData.find(d => d.id === "a" && d.x === "A");
    const tip = window.hoverRows(viz, aA);
    const filteredShares = viz._filteredData.map(d => d.share).sort((x, y) => x - y);
    const afterRender = data.map(d => d.share);

    // Redraw with new values: d3plus's share follows, the user's never moves.
    data[0].share = 30;
    viz.data(data);
    await window.renderViz(viz);
    const aA2 = viz._filteredData.find(d => d.id === "a" && d.x === "A");
    const tip2 = window.hoverRows(viz, aA2);
    return {bars, domain, tip, filteredShares, afterRender, afterRedraw: data.map(d => d.share), tip2};
  }, {h: helpers});

  assert.ok(Math.max(...out.domain) >= 80, `y domain reaches the tallest stack (${out.domain})`);
  assert.ok(Math.abs(out.bars.b_B / out.bars.a_A - 6) < 0.1, "bar heights follow the user's share values");
  assert.deepStrictEqual(out.filteredShares, [10, 20, 30, 60], "charted rows keep the user's share values");
  assert.ok(out.tip.some(r => r[0] === "Share" && r[1] === "25%"), `Share row is d3plus's fraction: ${JSON.stringify(out.tip)}`);
  assert.deepStrictEqual(out.afterRender, [10, 30, 20, 60], "the caller's objects are untouched");
  assert.deepStrictEqual(out.afterRedraw, [30, 30, 20, 60], "and stay untouched after a redraw");
  assert.ok(out.tip2.some(r => r[0] === "Share" && r[1] === "50%"), "the Share row follows the redraw");
});

it("Pie and Donut keep a data field named share while labeling d3plus's share", async function () {
  this.timeout(120000);

  const out = await render(page, async ({h, list: charts}) => {
    new Function(h)();
    const results = {};
    for (const name of charts) {
      document.querySelector("#s").innerHTML = "";
      const data = [
        {id: "alpha", value: 50, share: 7},
        {id: "beta", value: 30, share: 8},
        {id: "gamma", value: 20, share: 9},
      ];
      const viz = new window.d3plus[name]().select("#s").duration(0).data(data);
      await window.renderViz(viz);
      results[name] = {
        texts: window.texts("#s"),
        tip: window.hoverRows(viz, window.sceneDatum(viz, "alpha")),
        filtered: viz._filteredData.map(d => d.share),
        caller: data.map(d => d.share),
      };
    }
    return results;
  }, {h: helpers, list: ["Pie", "Donut"]});

  for (const [name, r] of Object.entries(out)) {
    for (const pct of ["50%", "30%", "20%"]) assert.ok(r.texts.includes(pct), `${name}: labels ${pct}`);
    assert.ok(r.tip.some(row => row[0] === "Share" && row[1] === "50%"), `${name}: Share row ${JSON.stringify(r.tip)}`);
    assert.deepStrictEqual(r.filtered.slice().sort(), [7, 8, 9], `${name}: charted rows keep the user's share`);
    assert.deepStrictEqual(r.caller, [7, 8, 9], `${name}: the caller's objects are untouched`);
  }
});

it("Treemap keeps a data field named share while labeling d3plus's share", async function () {
  this.timeout(120000);

  const out = await render(page, async ({h}) => {
    new Function(h)();
    const data = [
      {id: "alpha", value: 50, share: 7},
      {id: "beta", value: 30, share: 8},
      {id: "gamma", value: 20, share: 9},
    ];
    const viz = new window.d3plus.Treemap().select("#s").duration(0).data(data).sum("value");
    await window.renderViz(viz);
    const shapes = ["alpha", "beta", "gamma"].map(id => window.sceneDatum(viz, id));
    const aria = [...document.querySelectorAll("#s svg [aria-label]")].map(n => n.getAttribute("aria-label"));
    return {
      texts: window.texts("#s"),
      aria,
      tip: window.hoverRows(viz, shapes[0]),
      rows: shapes.map(d => (d.__d3plus__ && d.data ? d.data : d).share),
      filtered: viz._filteredData.map(d => d.share),
      caller: data.map(d => d.share),
    };
  }, {h: helpers});

  for (const pct of ["50%", "30%", "20%"]) assert.ok(out.texts.includes(pct), `labels ${pct}`);
  assert.ok(out.aria.some(a => a.includes("alpha") && a.includes("50%")), "aria-label carries d3plus's share");
  assert.ok(out.tip.some(row => row[0] === "Share" && row[1] === "50%"), `Share row ${JSON.stringify(out.tip)}`);
  assert.deepStrictEqual(out.rows, [7, 8, 9], "each cell's row keeps the user's share");
  assert.deepStrictEqual(out.filtered.slice().sort(), [7, 8, 9], "charted rows keep the user's share");
  assert.deepStrictEqual(out.caller, [7, 8, 9], "the caller's objects are untouched");
});

it("without a share field, custom tooltips still read x.share and legend buckets sum their members", async function () {
  this.timeout(120000);

  const out = await render(page, async ({h, list: charts}) => {
    new Function(h)();
    const results = {};
    for (const name of charts) {
      document.querySelector("#s").innerHTML = "";
      const data = [
        {group: "g1", id: "a", value: 10},
        {group: "g1", id: "b", value: 30},
        {group: "g2", id: "c", value: 60},
      ];
      const viz = new window.d3plus[name]().select("#s").duration(0).data(data)
        .groupBy(["group", "id"]).color("group");
      if (name === "Treemap") viz.sum("value");
      else viz.value("value");
      await window.renderViz(viz);
      const legend = viz._legendClass.data().find(d => d.group === "g1");
      const legendTip = name === "Pie" ? window.hoverLegend(viz, legend) : undefined;

      viz.tooltipConfig({tbody: [["Mine", (d, i, x) => `${Math.round(x.share * 100)}`]]});
      await window.renderViz(viz);
      results[name] = {legendTip, custom: window.hoverRows(viz, window.sceneDatum(viz, "a"))};
    }
    return results;
  }, {h: helpers, list: ["Pie", "Treemap"]});

  assert.ok(out.Pie.legendTip.some(row => row[0] === "Share" && row[1] === "40%"),
    `a legend bucket sums its members' shares ${JSON.stringify(out.Pie.legendTip)}`);
  for (const [name, r] of Object.entries(out))
    assert.deepStrictEqual(r.custom, [["Mine", "10"]], `${name}: x.share is d3plus's share`);
});

it("a redraw with new data updates d3plus's share", async function () {
  this.timeout(120000);

  const out = await render(page, async ({h}) => {
    new Function(h)();
    const viz = new window.d3plus.Pie().select("#s").duration(0)
      .data([{id: "a", value: 50}, {id: "b", value: 50}]);
    await window.renderViz(viz);
    const before = window.hoverRows(viz, viz._filteredData.find(d => d.id === "a"));
    viz.data([{id: "a", value: 25}, {id: "b", value: 75}]);
    await window.renderViz(viz);
    const row = viz._filteredData.find(d => d.id === "a");
    return {before, after: window.hoverRows(viz, row), share: row.share};
  }, {h: helpers});

  assert.ok(out.before.some(r => r[0] === "Share" && r[1] === "50%"));
  assert.ok(out.after.some(r => r[0] === "Share" && r[1] === "25%"));
  assert.strictEqual(out.share, 0.25, "the share d3plus wrote follows too");
});

it("table view shows no internal share column, raw or aggregate", async function () {
  this.timeout(120000);

  const out = await render(page, async ({h, list: withShare}) => {
    new Function(h)();
    const results = {};
    for (const own of withShare) {
      document.querySelector("#s").innerHTML = "";
      const data = [
        {category: "A", id: "r1", value: 10},
        {category: "A", id: "r2", value: 30},
        {category: "B", id: "r3", value: 60},
      ].map(d => (own ? {...d, share: 1} : d));
      const viz = new window.d3plus.Pie().select("#s").duration(0)
        .groupBy("category").value("value").data(data);
      await window.renderViz(viz);
      document.querySelector(".table-view-toggle").click();
      const aggregate = window.tableHeaders();
      const shareCol = aggregate.indexOf("share");
      const aggregateShares = [...document.querySelectorAll(".d3plus-table-view-table tbody tr")]
        .map(tr => tr.children[shareCol] && tr.children[shareCol].textContent);
      document.querySelector(".tableview-source-toggle").click();
      results[own ? "own" : "none"] = {aggregate, aggregateShares, raw: window.tableHeaders()};
    }
    return results;
  }, {h: helpers, list: [false, true]});

  for (const r of Object.values(out)) {
    assert.ok(!r.aggregate.some(c => c.startsWith("__d3plus")), `aggregate: ${r.aggregate}`);
    assert.ok(!r.raw.some(c => c.startsWith("__d3plus")), `raw: ${r.raw}`);
  }
  assert.ok(out.none.aggregate.includes("share"), "aggregate still shows d3plus's share when the data has none");
  assert.ok(!out.none.raw.includes("share"), "raw shows only the input's own fields");
  assert.deepStrictEqual(out.own.aggregate.filter(c => c === "share"), ["share"], "the user's share column, once");
  assert.ok(out.own.aggregateShares.every(v => v === "1" || v === "2"), `holding the user's (summed) values: ${out.own.aggregateShares}`);
  assert.ok(out.own.raw.includes("share"));
});
